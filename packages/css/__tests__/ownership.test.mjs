import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname } from 'node:path';
import test from 'node:test';
import { URL } from 'node:url';

async function listFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryUrl)));
    } else {
      files.push(entryUrl);
    }
  }

  return files;
}

test('keeps package source free of framework and VueForge ownership', async () => {
  const packageUrl = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('package.json', packageUrl), 'utf8'));
  const dependencyNames = Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies,
  });

  assert.equal(
    dependencyNames.some((name) => ['@angular/core', 'react', 'react-dom', 'vue'].includes(name)),
    false,
  );

  for (const directoryName of ['src/', 'scripts/']) {
    for (const fileUrl of await listFiles(new URL(directoryName, packageUrl))) {
      const source = await readFile(fileUrl, 'utf8');

      assert.doesNotMatch(
        source,
        /@codemonster-ru\/vueforge-|(?:from|import)\s*\(?\s*['"](?:@angular|react|react-dom|vue)(?:\/|['"])/,
      );
      if (extname(fileUrl.pathname) === '.css') {
        assert.doesNotMatch(source, /(?:\.|--)vf-|data-vf-/i);
      }
    }
  }
});
