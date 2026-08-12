import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assetsDirectory = join(root, 'packages/razor/resources/assets');
const manifest = JSON.parse(await readFile(join(assetsDirectory, 'manifest.json'), 'utf8'));

async function files(directory) {
  const found = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    found.push(...(entry.isDirectory() ? await files(path) : [path]));
  }

  return found;
}

test('packages exact declared CSS artifacts with valid integrity', async () => {
  const declared = new Set(['manifest.json']);

  for (const artifact of Object.values(manifest.artifacts)) {
    const packagedPath = join(assetsDirectory, artifact.path);
    const sourceDirectory = artifact.source.package === '@codemonster-ru/ui-tokens' ? 'tokens' : 'css';
    const sourcePath = join(root, 'packages', sourceDirectory, 'dist', artifact.path.replace(`css/${sourceDirectory}/`, ''));
    const [packaged, source] = await Promise.all([readFile(packagedPath), readFile(sourcePath)]);
    const packageManifest = JSON.parse(await readFile(join(root, 'packages', sourceDirectory, 'package.json'), 'utf8'));

    assert.deepEqual(packaged, source);
    assert.equal(createHash('sha256').update(packaged).digest('hex'), artifact.sha256);
    assert.equal(artifact.source.package, packageManifest.name);
    assert.equal(artifact.source.version, packageManifest.version);
    declared.add(artifact.path);
  }

  const packagedFiles = (await files(assetsDirectory)).map((path) => relative(assetsDirectory, path));
  assert.deepEqual(new Set(packagedFiles), declared);
});

test('keeps every packaged CSS import inside the declared asset graph', async () => {
  const declared = new Set(Object.values(manifest.artifacts).map(({ path }) => path));

  for (const artifact of Object.values(manifest.artifacts)) {
    const css = await readFile(join(assetsDirectory, artifact.path), 'utf8');

    for (const match of css.matchAll(/@import\s+['"]([^'"]+)['"]/gu)) {
      assert.match(match[1], /^\.\//u, `${artifact.path} contains a non-relative import`);
      const imported = relative(assetsDirectory, resolve(dirname(join(assetsDirectory, artifact.path)), match[1]));
      assert.equal(declared.has(imported), true, `${artifact.path} imports undeclared ${imported}`);
    }
  }
});
