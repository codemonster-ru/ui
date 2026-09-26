#!/usr/bin/env node
// Gate: the Composer artifact contains what a consumer needs and nothing else.
//
// Fails closed. A package with no stylesheet, no controller or no provenance is
// not publishable, and the point of H2 was that nothing said so.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { styleSources } from '../../packages/razor/style-sources.mjs';
import { relative, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  developmentOnlyEntries,
  listStagedFiles,
  requiredEntries,
  stageRazorPackage,
} from '../release/build-razor-package.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];
const passed = [];

function check(name, condition, detail = '') {
  if (condition) passed.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

/** Anything that would mean the monorepo travelled with the package. */
const forbiddenPatterns = [
  { pattern: /(^|\/)node_modules(\/|$)/, why: 'npm dependencies' },
  { pattern: /(^|\/)vendor(\/|$)/, why: 'Composer dependencies' },
  { pattern: /(^|\/)examples(\/|$)/, why: 'example applications' },
  { pattern: /(^|\/)tests(\/|$)/, why: 'test fixtures' },
  { pattern: /(^|\/)\.baseline-artifacts(\/|$)/, why: 'baseline artifacts' },
  { pattern: /(^|\/)\.release(\/|$)/, why: 'release staging' },
  { pattern: /(^|\/)\.claude(\/|$)/, why: 'local editor state' },
  { pattern: /(^|\/)\.git(\/|$)/, why: 'repository metadata' },
  { pattern: /(^|\/)\.npm-cache(\/|$)/, why: 'npm cache' },
  { pattern: /phpunit\.xml/, why: 'test runner configuration' },
  { pattern: /(^|\/)build-assets\.mjs$/, why: 'the repository asset build' },
];

process.stdout.write('Staging the Composer artifact from tracked files\n');
const { target, provenance } = stageRazorPackage();
const files = listStagedFiles(target);

process.stdout.write(`  ${files.length} files staged in ${relative(repositoryRoot, target)}\n\n`);

for (const entry of requiredEntries) {
  const path = resolve(target, entry);
  const present = existsSync(path);
  check(`the package contains ${entry}`, present);
  if (present && statSync(path).size === 0) {
    check(`${entry} is not empty`, false, '0 bytes');
  }
}

for (const file of files) {
  for (const { pattern, why } of forbiddenPatterns) {
    if (pattern.test(file)) {
      check(`the package excludes ${why}`, false, file);
    }
  }
}
for (const { why } of forbiddenPatterns) {
  if (!failures.some((failure) => failure.includes(why))) passed.push(`the package excludes ${why}`);
}
for (const entry of developmentOnlyEntries) {
  check(`development-only ${entry} is not shipped`, !existsSync(resolve(target, entry)));
}

// Composer metadata has to describe a package that can stand on its own.
const manifest = JSON.parse(readFileSync(resolve(target, 'composer.json'), 'utf8'));
check('the package declares its name', manifest.name === 'codemonster-ru/vueforge-razor', manifest.name);
check('the package declares PSR-4 autoloading', Boolean(manifest.autoload?.['psr-4']));
check(
  'the package requires no Vue adapter',
  !Object.keys(manifest.require ?? {}).some((name) => /vueforge-(core|layouts)/.test(name)),
);
check(
  'the package declares no path repository',
  !Array.isArray(manifest.repositories) || manifest.repositories.length === 0,
);

// Provenance identifies the artifact, never the machine that built it.
const stagedProvenance = JSON.parse(readFileSync(resolve(target, 'dist/package-provenance.json'), 'utf8'));
check(
  'provenance identifies where the artifact came from',
  stagedProvenance.source === 'git'
    ? /^[0-9a-f]{40}$/.test(stagedProvenance.commit)
    : stagedProvenance.source === 'exported-tree' && stagedProvenance.commit === null,
  `${stagedProvenance.source} ${stagedProvenance.commit}`,
);
// Counting the sources said nothing about which ones they were, so adding a
// canonical stylesheet meant editing a number rather than reviewing a list.
// The builder's own declaration is the expectation now.
check(
  'provenance records exactly the canonical stylesheet sources the builder declares',
  JSON.stringify(stagedProvenance.assets.styles.map((entry) => entry.source)) === JSON.stringify(styleSources),
  stagedProvenance.assets.styles.map((entry) => entry.source).join(', '),
);
check(
  'the shared icon layout is one of them',
  styleSources.includes('packages/styles/src/components/icon.css'),
  styleSources.join(', '),
);
check(
  'provenance names only neutral owners',
  stagedProvenance.assets.styles.every((style) => /^packages\/(theme|styles|shared-core)\//.test(style.source)),
  stagedProvenance.assets.styles.map((style) => style.source).join(', '),
);

const artifactText = files
  .filter((file) => /\.(json|css|js|php|md)$/.test(file))
  .map((file) => readFileSync(resolve(target, file), 'utf8'))
  .join('\n');
check('no absolute machine path travels with the package', !/\/(Users|home)\//.test(artifactText));

// The stylesheet has to be the real one, not an empty placeholder.
const css = readFileSync(resolve(target, 'dist/vueforge-razor.css'), 'utf8');
check('the packaged stylesheet carries the Input rules', css.includes('.vf-input-wrap__clear'));
check('the packaged stylesheet carries the tokens those rules reference', css.includes('--vf-input-'));
check('the packaged stylesheet carries the icon button rules', css.includes('.vf-icon-button'));
// M10 moved the icon layout out of the markup and into this stylesheet. If it
// is missing here, every Razor glyph loses its layout and nothing else fails.
check('the packaged stylesheet carries the shared icon layout', css.includes('.vf-icon-wrapper'));
check('the packaged stylesheet carries the icon spin keyframes', css.includes('@keyframes vf-icon-spin'));
check('the packaged stylesheet carries the neutral foundation', css.includes('color-scheme'));

const js = readFileSync(resolve(target, 'dist/vueforge-razor.js'), 'utf8');
check('the packaged controller claims only Razor roots', js.includes('data-vf-razor'));
check('the packaged controller needs no unpublished import', !js.includes('vueforge-shared-core'));

// M28: the dropdown controller and the one third-party library it runs on.
// floater.js 1.0.11 is bundled into this file - never fetched, never left as
// an import a Composer host would have to resolve - and its MIT notice
// travels with it as the artifact's banner, verbatim from the package.
const floaterLicense = readFileSync(
  resolve(repositoryRoot, 'node_modules/@codemonster-ru/floater.js/LICENSE.md'),
  'utf8',
);
check(
  'the packaged controller carries the dropdown enhancement exactly once',
  js.includes('data-vf-razor-dropdown-enhanced') && js.split('function enhanceVueForgeDropdowns(').length === 2,
);
check(
  'the packaged controller bundles floater.js 1.0.11 and names it in its banner',
  js.startsWith('/*!\n * vueforge-razor.js bundles @codemonster-ru/floater.js 1.0.11 (MIT).') &&
    js.includes('// node_modules/@codemonster-ru/floater.js/dist/index.mjs') &&
    js.includes('[floater.js] flip middleware expects params.placements'),
);
check(
  "the packaged controller carries floater.js's MIT notice verbatim",
  floaterLicense
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .every((line) => js.includes(` * ${line}`)),
);
check(
  'the packaged controller imports nothing and fetches nothing at run time',
  !/^\s*import[\s{*]/m.test(js) &&
    !/\bimport\(/.test(js) &&
    !/from\s*["']/.test(js) &&
    !/https?:\/\/(unpkg|cdn\.jsdelivr|esm\.sh|cdnjs|skypack)/.test(js),
);
const assetManifest = JSON.parse(readFileSync(resolve(target, 'dist/assets-manifest.json'), 'utf8'));
check(
  'the asset manifest records the bundled third-party dependency with its exact version and licence',
  JSON.stringify(assetManifest.browser.thirdParty) ===
    JSON.stringify([{ name: '@codemonster-ru/floater.js', version: '1.0.11', license: 'MIT' }]),
  JSON.stringify(assetManifest.browser.thirdParty),
);
check(
  'the packaged stylesheet carries the dropdown rules exactly once',
  (css.match(/^\.vf-dropdown__menu \{$/gm) ?? []).length === 1 &&
    css.includes('.vf-floating-transition-enter-from.vf-dropdown__menu'),
);

process.stdout.write(`${passed.length} package assertion(s) passed.\n`);

if (failures.length > 0) {
  process.stderr.write(`\n[razor-package] FAILED with ${failures.length} problem(s):\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  `[razor-package] OK: ${files.length} files, staged from ${provenance.commit?.slice(0, 12) ?? provenance.source}, ` +
    'assets present and neutral.\n',
);
