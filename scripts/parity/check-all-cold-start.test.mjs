// parity:check on a clean clone (M35.5a).
//
// check-all.mjs made its run directory with mkdtempSync under
// .baseline-artifacts and never made .baseline-artifacts itself: on a clean
// clone it failed with ENOENT before building anything. CI hid it, because
// baseline:ci runs first and creates the directory; so did every working tree
// that had run anything before.
//
// The orchestrator is run here as it is - the file itself, copied byte for
// byte into a temporary tree - with only what it drives replaced: the
// reference module names a temporary .baseline-artifacts, prepareSharedReference
// records its call instead of building fd793696, and `npm` on PATH records the
// profile step instead of running 34 profiles. A file system that refuses is
// made two ways: a regular file where a directory must be, which no privilege
// gets past, and fs functions replaced through syncBuiltinESMExports, which
// check-all.mjs's own named imports then see. No test relies on chmod.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, resolve } from 'node:path';
import { test } from 'node:test';

import { repositoryRoot } from '../baseline/reference.mjs';

const unixOnly = { skip: process.platform === 'win32' && 'the stub npm is a shell script' };

const referenceStub = `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

export const artifactsDirectory = process.env.STUB_ARTIFACTS_DIRECTORY;

// STUB_FS_FAULT=mkdir refuses to create .baseline-artifacts; STUB_FS_FAULT=rm
// refuses to remove the run's directory. Everything else goes through.
const fault = process.env.STUB_FS_FAULT;
if (fault) {
  const name = fault + 'Sync';
  const original = fs[name];
  const refused = (path) =>
    fault === 'mkdir' ? path === artifactsDirectory : String(path).startsWith(artifactsDirectory + '/parity-shared-reference-');
  fs[name] = (path, ...rest) => {
    if (!refused(path)) return original(path, ...rest);
    throw Object.assign(new Error("EACCES: permission denied (injected), " + fault + " '" + path + "'"), {
      code: 'EACCES',
      syscall: fault,
      path,
    });
  };
  syncBuiltinESMExports();
}
`;

const targetsStub = `import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function prepareSharedReference(checkout, run) {
  appendFileSync(process.env.STUB_LOG, JSON.stringify({ step: 'prepare', checkout, run }) + '\\n');
  if (process.env.STUB_PREPARE_FAILS) throw new Error('stub reference build failed');
  mkdirSync(checkout, { recursive: true });
  writeFileSync(resolve(checkout, 'built'), 'reference');
}
`;

const npmStub = `#!/bin/sh
if [ -d "$PARITY_SHARED_REFERENCE" ]; then present=true; else present=false; fi
printf '{"step":"npm","args":"%s","checkout":"%s","run":"%s","present":%s}\\n' "$*" "$PARITY_SHARED_REFERENCE" "$PARITY_SHARED_REFERENCE_RUN" "$present" >> "$STUB_LOG"
exit "\${STUB_NPM_STATUS:-0}"
`;

/** A tree holding the real check-all.mjs beside stubs of what it drives. */
function harness(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'vueforge-check-all-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(resolve(root, 'scripts/parity'), { recursive: true });
  mkdirSync(resolve(root, 'scripts/baseline'));
  mkdirSync(resolve(root, 'bin'));
  copyFileSync(resolve(repositoryRoot, 'scripts/parity/check-all.mjs'), resolve(root, 'scripts/parity/check-all.mjs'));
  writeFileSync(resolve(root, 'scripts/baseline/reference.mjs'), referenceStub);
  writeFileSync(resolve(root, 'scripts/parity/targets.mjs'), targetsStub);
  writeFileSync(resolve(root, 'bin/npm'), npmStub);
  chmodSync(resolve(root, 'bin/npm'), 0o755);

  const artifacts = resolve(root, 'repo/.baseline-artifacts');
  const log = resolve(root, 'calls.jsonl');
  return {
    root,
    artifacts,
    run(env = {}) {
      const result = spawnSync(process.execPath, [resolve(root, 'scripts/parity/check-all.mjs')], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: resolve(root, 'bin') + delimiter + process.env.PATH,
          STUB_ARTIFACTS_DIRECTORY: artifacts,
          STUB_LOG: log,
          ...env,
        },
      });
      const calls = existsSync(log)
        ? readFileSync(log, 'utf8')
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line))
        : [];
      return { ...result, calls };
    },
  };
}

/** Every file under a directory, with its bytes. */
function snapshot(directory, prefix = '') {
  const files = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files, snapshot(resolve(directory, entry.name), path + '/'));
    else files[path] = readFileSync(resolve(directory, entry.name)).toString('base64');
  }
  return files;
}

/** Sentinels as an earlier run, and an interrupted one, would leave them. */
function seed(artifacts) {
  mkdirSync(resolve(artifacts, 'css-artifacts'), { recursive: true });
  mkdirSync(resolve(artifacts, 'parity-shared-reference-interrupted/reference-checkout'), { recursive: true });
  writeFileSync(resolve(artifacts, 'sentinel.txt'), 'kept\n');
  writeFileSync(resolve(artifacts, 'css-artifacts/sentinel.bin'), Buffer.from([0, 1, 2, 254, 255]));
  writeFileSync(resolve(artifacts, 'parity-shared-reference-interrupted/reference-checkout/built'), 'stale');
  return snapshot(artifacts);
}

/** The run's own directory, from where the stubs were pointed. */
function runDirectoryOf(calls) {
  const prepare = calls.find((call) => call.step === 'prepare');
  assert.ok(prepare, 'prepareSharedReference was never called');
  return dirname(prepare.checkout);
}

test('A. cold start: no .baseline-artifacts, the run creates it and gets past initialisation', unixOnly, (t) => {
  const { artifacts, run } = harness(t);
  assert.equal(existsSync(resolve(artifacts, '..')), false);

  const result = run();

  assert.doesNotMatch(result.stderr, /ENOENT/);
  assert.equal(result.status, 0, result.stderr);
  const directory = runDirectoryOf(result.calls);
  assert.equal(dirname(directory), artifacts);
  assert.match(directory, /\/parity-shared-reference-[A-Za-z0-9]{6}$/);
  const [prepare, npm] = result.calls;
  assert.equal(npm.step, 'npm');
  assert.equal(npm.args, 'run parity:check:profiles');
  assert.equal(npm.checkout, prepare.checkout);
  assert.equal(npm.run, prepare.run);
  assert.equal(npm.present, true, 'the profiles ran without the shared reference');
  assert.deepEqual(readdirSync(artifacts), []);
});

test('B. existing artifacts are kept to the byte and the run gets a directory of its own', unixOnly, (t) => {
  const { artifacts, run } = harness(t);
  const before = seed(artifacts);

  const result = run();

  assert.equal(result.status, 0, result.stderr);
  const directory = runDirectoryOf(result.calls);
  assert.equal(dirname(directory), artifacts);
  assert.notEqual(directory, resolve(artifacts, 'parity-shared-reference-interrupted'));
  assert.deepEqual(snapshot(artifacts), before);
});

test('C. .baseline-artifacts that cannot be created fails the run before any profile', unixOnly, async (t) => {
  await t.test('a regular file in its path (ENOTDIR, whatever the privilege)', (t) => {
    const { artifacts, run } = harness(t);
    writeFileSync(dirname(artifacts), 'not a directory');

    const result = run();

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ENOTDIR: not a directory, mkdir '[^']*\/repo\/\.baseline-artifacts'/);
    assert.deepEqual(result.calls, []);
  });

  await t.test('a refused mkdir (EACCES, injected)', (t) => {
    const { artifacts, run } = harness(t);

    const result = run({ STUB_FS_FAULT: 'mkdir' });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /EACCES: permission denied \(injected\), mkdir '[^']*\/\.baseline-artifacts'/);
    assert.deepEqual(result.calls, []);
    assert.equal(existsSync(artifacts), false);
  });
});

test('D. the run removes its own directory, and only it, whichever way it ends', unixOnly, async (t) => {
  await t.test('profiles pass', (t) => {
    const { artifacts, run } = harness(t);
    const before = seed(artifacts);

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(runDirectoryOf(result.calls)), false);
    assert.deepEqual(snapshot(artifacts), before);
  });

  await t.test('profiles fail: their status is the run status', (t) => {
    const { artifacts, run } = harness(t);
    const before = seed(artifacts);

    const result = run({ STUB_NPM_STATUS: '3' });

    assert.equal(result.status, 3);
    assert.equal(existsSync(runDirectoryOf(result.calls)), false);
    assert.deepEqual(snapshot(artifacts), before);
  });

  await t.test('the reference build throws after the directory exists', (t) => {
    const { artifacts, run } = harness(t);
    const before = seed(artifacts);

    const result = run({ STUB_PREPARE_FAILS: '1' });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /stub reference build failed/);
    assert.deepEqual(
      result.calls.map((call) => call.step),
      ['prepare'],
    );
    assert.equal(existsSync(runDirectoryOf(result.calls)), false);
    assert.deepEqual(snapshot(artifacts), before);
  });

  await t.test('a failed removal fails the run, though every profile passed', (t) => {
    const { artifacts, run } = harness(t);
    seed(artifacts);

    const result = run({ STUB_FS_FAULT: 'rm' });

    assert.equal(result.calls.at(-1).step, 'npm');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /EACCES: permission denied \(injected\), rm '[^']*\/parity-shared-reference-/);
    assert.equal(existsSync(runDirectoryOf(result.calls)), true);
  });
});
