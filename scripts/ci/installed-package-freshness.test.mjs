// Reproduction and closure of the stale showcase vendor (M30 step zero).
//
// Runs real Composer over a real path repository shaped like the staged Razor
// package, so what is proven is Composer's behaviour, not a model of it: an
// edit to a component file leaves the installed copy stale while the provider
// file - all the gate compared before M30 - is still identical.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { packageTree, packageTreeDifferences } from './installed-package-freshness.mjs';

function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function composer(cwd, ...args) {
  execFileSync('composer', [...args, '--no-interaction', '--quiet'], { cwd, stdio: ['ignore', 'ignore', 'pipe'] });
}

function stagePackage() {
  const workspace = mkdtempSync(join(tmpdir(), 'vueforge-freshness-'));
  const staged = join(workspace, 'package');
  write(staged, 'composer.json', JSON.stringify({ name: 'demo/vueforge-razor', type: 'library' }));
  write(staged, 'src/VueForgeRazorProvider.php', '<?php // registers vf-dropdown\n');
  write(staged, 'src/Components/DropdownComponent.php', '<?php // dropdown v1\n');
  write(staged, 'dist/vueforge-razor.js', '/* runtime v1 */\n');
  write(staged, 'dist/vueforge-razor.css', '/* styles v1 */\n');
  write(staged, 'dist/assets-manifest.json', '{"version":1}\n');
  write(staged, 'dist/package-provenance.json', '{"commit":"aaaa"}\n');
  const app = join(workspace, 'app');
  write(
    app,
    'composer.json',
    JSON.stringify({
      name: 'demo/showcase',
      version: '1.0.0',
      repositories: [{ 'packagist.org': false }, { type: 'path', url: '../package', options: { symlink: false } }],
      require: { 'demo/vueforge-razor': '*' },
      'minimum-stability': 'dev',
    }),
  );
  composer(app, 'install');
  return { workspace, staged, installed: join(app, 'vendor/demo/vueforge-razor'), app };
}

test('a fresh installation is identical to the staged artifact', () => {
  const { workspace, staged, installed } = stagePackage();
  try {
    assert.deepEqual(packageTreeDifferences(staged, installed), []);
    assert.equal(packageTree(installed).size, 7);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('composer install keeps a stale copy when only a component changes, and the tree comparison rejects it', () => {
  const { workspace, staged, installed, app } = stagePackage();
  try {
    write(staged, 'src/Components/DropdownComponent.php', '<?php // dropdown v2\n');
    composer(app, 'install');

    // The reproduction: Composer did not copy the change, and the provider -
    // the only file the gate compared before M30 - still matches.
    assert.equal(
      readFileSync(join(installed, 'src/Components/DropdownComponent.php'), 'utf8'),
      '<?php // dropdown v1\n',
    );
    assert.equal(
      readFileSync(join(installed, 'src/VueForgeRazorProvider.php'), 'utf8'),
      readFileSync(join(staged, 'src/VueForgeRazorProvider.php'), 'utf8'),
    );
    assert.deepEqual(packageTreeDifferences(staged, installed), ['stale src/Components/DropdownComponent.php']);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('the runtime, the stylesheet, the manifest and the provenance are each compared', () => {
  const { workspace, staged, installed, app } = stagePackage();
  try {
    write(staged, 'dist/vueforge-razor.js', '/* runtime v2 */\n');
    write(staged, 'dist/vueforge-razor.css', '/* styles v2 */\n');
    write(staged, 'dist/assets-manifest.json', '{"version":2}\n');
    write(staged, 'dist/package-provenance.json', '{"commit":"bbbb"}\n');
    write(staged, 'src/Components/PopoverComponent.php', '<?php // new\n');
    composer(app, 'install');
    assert.deepEqual(packageTreeDifferences(staged, installed), [
      'stale dist/assets-manifest.json',
      'stale dist/package-provenance.json',
      'stale dist/vueforge-razor.css',
      'stale dist/vueforge-razor.js',
      'missing src/Components/PopoverComponent.php',
    ]);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('a file left behind in the installed copy is reported', () => {
  const { workspace, staged, installed } = stagePackage();
  try {
    write(installed, 'src/Components/RemovedComponent.php', '<?php // gone from the artifact\n');
    assert.deepEqual(packageTreeDifferences(staged, installed), ['extra src/Components/RemovedComponent.php']);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('composer reinstall refreshes the stale copy and the comparison then passes', () => {
  const { workspace, staged, installed, app } = stagePackage();
  try {
    write(staged, 'src/Components/DropdownComponent.php', '<?php // dropdown v2\n');
    composer(app, 'install');
    assert.notDeepEqual(packageTreeDifferences(staged, installed), []);
    composer(app, 'reinstall', 'demo/vueforge-razor');
    assert.deepEqual(packageTreeDifferences(staged, installed), []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
