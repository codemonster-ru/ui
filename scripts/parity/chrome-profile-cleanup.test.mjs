// Deleting the temporary Chrome profile after the browser exits (M35.0c).
//
// Chrome 155 can still write into its profile - the network service's
// `Network Persistent State` and `Reporting and NEL-journal` - after the main
// process has exited, and a deletion racing that write failed with ENOTEMPTY
// and aborted the capture. removeProfile retries that deletion, and only that
// deletion, a bounded number of times.
//
// Chrome's race is not reproducible on demand, so the failure is made here
// with the file system itself: a file locked with `chflags uchg` makes every
// deletion of its directory fail with EPERM - one of the codes Node retries -
// until the lock is lifted. Lifted by another process after 100 ms, it is a
// transient failure; never lifted, a permanent one. `chflags` is BSD/macOS;
// Linux has no unprivileged equivalent, so those two tests run where the
// harness's captures run locally.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { removeProfile } from '../baseline/cdp.mjs';
import { repositoryRoot } from '../baseline/reference.mjs';

const darwinOnly = { skip: process.platform !== 'darwin' && 'chflags is BSD/macOS' };

/** A profile-shaped tree whose network-state file is locked against deletion. */
function lockedProfile() {
  const directory = mkdtempSync(resolve(tmpdir(), 'vueforge-cleanup-test-'));
  mkdirSync(resolve(directory, 'Default'));
  const file = resolve(directory, 'Default', 'Reporting and NEL-journal');
  writeFileSync(file, '');
  execFileSync('chflags', ['uchg', file]);
  return { directory, file };
}

const unlock = (file) => execFileSync('chflags', ['nouchg', file]);

test('a normal profile is removed', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'vueforge-cleanup-test-'));
  mkdirSync(resolve(directory, 'Default', 'Cache'), { recursive: true });
  writeFileSync(resolve(directory, 'Default', 'Cache', 'entry'), 'x');
  writeFileSync(resolve(directory, 'Local State'), '{}');

  await removeProfile(directory);
  assert.equal(existsSync(directory), false);
});

test('a deletion that fails until another process lets go is retried and succeeds', darwinOnly, async () => {
  // The control: without retries the same tree cannot be deleted at all.
  const control = lockedProfile();
  await assert.rejects(rm(control.directory, { recursive: true, force: true }), { code: 'EPERM' });
  unlock(control.file);
  await rm(control.directory, { recursive: true, force: true });

  const { directory, file } = lockedProfile();
  spawn('sh', ['-c', `sleep 0.1; chflags nouchg "${file}"`], { stdio: 'ignore' });
  await removeProfile(directory);
  assert.equal(existsSync(directory), false);
});

test('a deletion that never succeeds still fails, loudly and within a bound', darwinOnly, async () => {
  const { directory, file } = lockedProfile();
  const started = performance.now();
  try {
    await assert.rejects(removeProfile(directory), { code: 'EPERM' });
    assert.ok(performance.now() - started < 20_000, 'the retries are bounded');
    assert.equal(existsSync(directory), true, 'nothing pretends the profile is gone');
  } finally {
    unlock(file);
    await rm(directory, { recursive: true, force: true });
  }
});

test('the retry is the profile deletion after Chrome exits, and nothing else in the harness retries', () => {
  const cdp = readFileSync(resolve(repositoryRoot, 'scripts/baseline/cdp.mjs'), 'utf8');
  assert.match(
    cdp,
    /child\.once\('exit', resolvePromise\)\);\n\s+await removeProfile\(profileDirectory\);/,
    'close() deletes the profile only after the main process exited, and waits for the deletion',
  );
  assert.equal(cdp.match(/maxRetries/g).length, 1);
  assert.match(cdp, /maxRetries: 3, retryDelay: 50/);

  const retrying = [];
  for (const directory of ['scripts/baseline', 'scripts/parity', 'scripts/ci']) {
    for (const name of readdirSync(resolve(repositoryRoot, directory))) {
      const path = resolve(repositoryRoot, directory, name);
      if (!name.endsWith('.mjs') || name.endsWith('.test.mjs') || !statSync(path).isFile()) continue;
      if (/maxRetries|retryDelay/.test(readFileSync(path, 'utf8'))) retrying.push(`${directory}/${name}`);
    }
  }
  assert.deepEqual(retrying, ['scripts/baseline/cdp.mjs']);
});
