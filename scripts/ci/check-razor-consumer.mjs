#!/usr/bin/env node
// Packaged-consumer proof for the Razor adapter.
//
// Installs the package into a throwaway project the way a host application
// would — a Composer path repository, not the source tree — then renders one
// VfInput through it and checks the packaged assets resolve from the path the
// provider advertises. Nothing is published.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packageRoot = resolve(repositoryRoot, 'packages/razor');
const consumerRoot = mkdtempSync(resolve(tmpdir(), 'vueforge-razor-consumer-'));
const failures = [];

function check(name, condition, detail = '') {
  if (!condition) {
    failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  }
}

try {
  // The assets a host serves are build output, so they must exist first.
  execFileSync(process.execPath, [resolve(packageRoot, 'build-assets.mjs')], { stdio: ['ignore', 'ignore', 'pipe'] });

  writeFileSync(
    resolve(consumerRoot, 'composer.json'),
    `${JSON.stringify(
      {
        name: 'vueforge/razor-consumer-fixture',
        repositories: [{ type: 'path', url: packageRoot, options: { symlink: false } }],
        require: { 'codemonster-ru/vueforge-razor': '*' },
        'minimum-stability': 'dev',
        'prefer-stable': true,
        config: { 'allow-plugins': {} },
      },
      null,
      2,
    )}\n`,
  );

  execFileSync('composer', ['install', '--no-interaction', '--quiet', '--no-progress'], {
    cwd: consumerRoot,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  const installedPackage = resolve(consumerRoot, 'vendor/codemonster-ru/vueforge-razor');
  check('the package installs from a Composer path repository', existsSync(installedPackage));

  writeFileSync(
    resolve(consumerRoot, 'render.php'),
    `<?php
require __DIR__ . '/vendor/autoload.php';

use Codemonster\\Razor\\Components\\ComponentRegistry;
use Codemonster\\Razor\\Components\\ComponentRenderContext;
use Codemonster\\VueForge\\Razor\\VueForgeRazorProvider;

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
$input = $registry->resolve('vf-input');

echo json_encode([
    'markup' => $input->render(new ComponentRenderContext(
        ['name' => 'workspace', 'value' => 'Acme', 'clearable' => true],
        [],
    ))->value(),
    'assetPath' => VueForgeRazorProvider::assetPath(),
]);
`,
  );

  const output = JSON.parse(
    execFileSync('php', [resolve(consumerRoot, 'render.php')], { encoding: 'utf8', cwd: consumerRoot }),
  );

  check('the consumer renders a native input', output.markup.includes('<input'), output.markup.slice(0, 120));
  check('the consumer renders canonical classes', output.markup.includes('class="vf-input'));
  check('the consumer renders the ownership marker', output.markup.includes('data-vf-razor="input"'));
  check('the consumer renders the clear action', output.markup.includes('data-vf-razor-input="clear"'));
  check('the consumer renders the icon data', output.markup.includes('<svg'));

  // The provider advertises where the host must serve assets from; both files
  // have to actually be there in an installed copy.
  const stylesheet = resolve(output.assetPath, 'vueforge-razor.css');
  const script = resolve(output.assetPath, 'vueforge-razor.js');
  check('the installed package exposes its stylesheet', existsSync(stylesheet), stylesheet);
  check('the installed package exposes its browser entry', existsSync(script), script);

  if (existsSync(stylesheet)) {
    const css = readFileSync(stylesheet, 'utf8');
    check('the packaged stylesheet carries the canonical Input rules', css.includes('.vf-input-wrap__clear'));
    check('the packaged stylesheet carries the tokens the rules reference', css.includes('--vf-input-'));
  }

  if (existsSync(script)) {
    const js = readFileSync(script, 'utf8');
    check('the packaged browser entry targets only Razor roots', js.includes('data-vf-razor'));
    check('the packaged browser entry needs no unpublished import', !js.includes('vueforge-shared-core'));
  }
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}

if (failures.length > 0) {
  process.stderr.write(`[razor-consumer] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) {
    process.stderr.write(`  - ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write('[razor-consumer] OK: installed from a path repository, renders VfInput, assets resolve.\n');
