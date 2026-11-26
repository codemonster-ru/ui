import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { URL } from 'node:url';

test('regenerates the committed icon modules from local data alone', async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), 'ui-icons-generation-'));
  t.after(() => rm(scratch, { force: true, recursive: true }));

  for (const file of ['scripts/generate-icons.mjs', 'src/types.ts', 'data/geometry.json']) {
    const destination = join(scratch, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(new URL(`../${file}`, import.meta.url), destination);
  }

  execFileSync(process.execPath, ['scripts/generate-icons.mjs'], { cwd: scratch });

  const regenerated = join(scratch, 'src/generated');
  const committed = new URL('../src/generated/', import.meta.url);
  const files = (await readdir(committed)).sort();
  assert.deepEqual((await readdir(regenerated)).sort(), files);
  for (const file of files) {
    assert.deepEqual(await readFile(join(regenerated, file)), await readFile(new URL(file, committed)), file);
  }
});
