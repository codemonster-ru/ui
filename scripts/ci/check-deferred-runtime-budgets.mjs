import assert from 'node:assert/strict';
import { basename, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const showcase = resolve(import.meta.dirname, '../../examples/ui-showcase');
const entryBudget = 95 * 1024;
const workerBudget = { raw: 3_700_000, gzip: 1_100 * 1024 };
const chunkBudget = 500_000;

const { output } = await build({ root: showcase, build: { write: false }, logLevel: 'warn' });
const chunks = new Map(output.filter(({ type }) => type === 'chunk').map((chunk) => [chunk.fileName, chunk]));
const workers = output.filter(({ fileName }) => /^assets\/typescriptWorker-[\w-]+\.js$/u.test(fileName));
assert.equal(workers.length, 1, 'Expected one bundled TypeScript compiler worker');
const [worker] = workers;
const workerCode = worker.type === 'asset' ? worker.source : worker.code;

function entry(source) {
  const file = resolve(showcase, source);
  const chunk = [...chunks.values()].find(({ facadeModuleId }) => facadeModuleId === file);
  assert(chunk, `Missing showcase entry: ${source}`);
  return chunk;
}

function graph(start, includeDynamic = false) {
  const visited = new Set();
  const queue = [start];
  while (queue.length > 0) {
    const chunk = queue.pop();
    if (visited.has(chunk)) continue;
    visited.add(chunk);
    for (const file of includeDynamic ? [...chunk.imports, ...chunk.dynamicImports] : chunk.imports) {
      const imported = chunks.get(file);
      if (imported) queue.push(imported);
    }
  }
  return [...visited];
}

const compilerModules = /\/node_modules\/(?:typescript|@codemonster-ru\/vueforge-playground-core)\//u;
const highlighterModules =
  /\/node_modules\/(?:shiki\/|@shikijs\/|@codemonster-ru\/vueforge-codeblock\/dist\/highlight\.js$)/u;
const playgroundModules = /\/node_modules\/@codemonster-ru\/vueforge-playground\//u;
const workerFile = basename(worker.fileName);

function assertDeferred(start, matchers) {
  for (const chunk of graph(start)) {
    const forbidden = Object.keys(chunk.modules).find((id) => matchers.some((matcher) => matcher.test(id)));
    assert(!forbidden, `${start.fileName} eagerly loads ${forbidden}`);
    assert(!chunk.code.includes(workerFile), `${start.fileName} eagerly references the TypeScript worker`);
  }
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

const index = entry('index.html');
for (const chunk of [index, entry('case.html')]) {
  assertDeferred(chunk, [compilerModules, highlighterModules, playgroundModules]);
  const size = gzipSync(chunk.code).length;
  assert(size <= entryBudget, `${chunk.fileName}: ${formatSize(size)} exceeds the 95 KiB gzip entry budget`);
  console.log(`[deferred-check] ${basename(chunk.facadeModuleId)}: ${formatSize(size)} gzip`);
}

const playground = entry('src/PlaygroundShowcase.vue');
assert(
  !graph(index).includes(playground) && graph(index, true).includes(playground),
  'The main showcase must reach the Playground route through a dynamic import',
);
assertDeferred(playground, [compilerModules, highlighterModules]);
const dynamicRoutes = new Set(graph(index).flatMap((chunk) => chunk.dynamicImports));
for (const file of dynamicRoutes) {
  const route = chunks.get(file);
  assert(route, `Missing dynamic showcase chunk: ${file}`);
  if (route !== playground) assertDeferred(route, [compilerModules, highlighterModules, playgroundModules]);
}

const runtime = graph(playground, true).find((chunk) => chunk.code.includes(workerFile));
assert(runtime, 'The Playground route must reach the compiler worker through a dynamic import');
assert(
  Object.keys(runtime.modules).some((id) => compilerModules.test(id)),
  'The deferred Playground compiler runtime must own the worker reference',
);

const workerRaw = Buffer.byteLength(workerCode);
const workerGzip = gzipSync(workerCode).length;
assert(workerRaw <= workerBudget.raw, `Compiler worker: ${workerRaw} bytes exceeds the 3,700,000-byte budget`);
assert(workerGzip <= workerBudget.gzip, `Compiler worker: ${formatSize(workerGzip)} exceeds the 1,100 KiB gzip budget`);
console.log(`[deferred-check] Compiler worker: ${workerRaw} bytes raw, ${formatSize(workerGzip)} gzip`);

for (const { fileName, type, ...file } of output) {
  if (fileName === worker.fileName || !fileName.endsWith('.js')) continue;
  const bytes = Buffer.byteLength(type === 'chunk' ? file.code : file.source);
  assert(bytes <= chunkBudget, `${fileName}: ${bytes} bytes exceeds the 500,000-byte budget`);
}

console.log('[deferred-check] Startup graphs and JavaScript budgets passed');
