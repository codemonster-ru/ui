import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const root = resolve(import.meta.dirname, '../..');
const showcase = resolve(root, 'examples/ui-showcase');
const vanilla = resolve(root, 'examples/vanilla/dist');
const entryBudget = 95 * 1024;
const chunkBudget = 500_000;
const standaloneToolDependencies =
  /\/node_modules\/(?:typescript|shiki|@shikijs|@codemonster-ru\/vueforge-(?:playground(?:-core)?|codeblock))\//u;
const compilerWorker = /(?:^|\/)typescriptWorker-[\w-]+\.js$/u;

function checkEntry(name, source) {
  const bytes = gzipSync(source).length;
  const size = (bytes / 1024).toFixed(2);
  assert(bytes <= entryBudget, `${name}: ${size} KiB exceeds the 95 KiB gzip entry budget`);
  console.log(`[showcase-budget] ${name}: ${size} KiB gzip`);
}

function checkAsset(name, source) {
  assert(!compilerWorker.test(name), `Unexpected compiler worker in the component showcase: ${name}`);
  const bytes = Buffer.byteLength(source);
  assert(bytes <= chunkBudget, `${name}: ${bytes} bytes exceeds the 500,000-byte JavaScript budget`);
}

const { output } = await build({ root: showcase, build: { write: false }, logLevel: 'warn' });
const chunks = output.filter(({ type }) => type === 'chunk');

for (const entry of ['index.html', 'layout-example.html']) {
  const chunk = chunks.find(({ facadeModuleId }) => facadeModuleId === resolve(showcase, entry));
  assert(chunk, `Missing Vue showcase entry: ${entry}`);
  checkEntry(`Vue ${entry}`, chunk.code);
}

for (const asset of output) {
  if (asset.type === 'chunk') {
    const forbidden = Object.keys(asset.modules).find((id) => standaloneToolDependencies.test(id));
    assert(!forbidden, `${asset.fileName} bundles a standalone tool dependency: ${forbidden}`);
  }
  if (/\.m?js$/u.test(asset.fileName)) {
    checkAsset(asset.fileName, asset.type === 'chunk' ? asset.code : asset.source);
  }
}

// Vanilla ships separate ES modules and keeps its standalone code examples as static HTML.
for (const entry of [
  'runtime.js',
  'showcase.js',
  'showcase-inline.mjs',
  'layout-example.js',
  'playground-example.mjs',
]) {
  checkEntry(`Vanilla ${entry}`, readFileSync(resolve(vanilla, entry)));
}
for (const file of readdirSync(vanilla, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !/\.m?js$/u.test(file.name)) continue;
  const absolute = resolve(file.parentPath, file.name);
  checkAsset(relative(vanilla, absolute), readFileSync(absolute));
}

console.log('[showcase-budget] Vue and Vanilla JavaScript budgets passed');
