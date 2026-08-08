import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, 'examples/playground/dist/.vite/manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`[deferred-check] Manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const routeKeys = {
  core: 'src/sections/core/CoreShowcase.vue',
  layouts: 'src/sections/layouts/LayoutsShowcase.vue',
  icons: 'src/sections/icons/IconsShowcase.vue',
  codeblock: 'src/sections/codeblock/CodeBlockShowcase.vue',
  playground: 'src/PlaygroundShowcase.vue',
};

const deferredRuntimeMatchers = [
  /node_modules\/shiki\//,
  /node_modules\/@shikijs\//,
  /packages\/playground(?:-core)?\/src\//,
];
const compilerRuntimeMatchers = [/packages\/playground-core\/src\//];

const getByKey = (key) => manifest[key] ?? null;

function collectStaticImportGraph(startKeys) {
  const visited = new Set();
  const queue = [...startKeys];

  while (queue.length > 0) {
    const key = queue.shift();
    if (!key || visited.has(key)) {
      continue;
    }

    visited.add(key);
    const chunk = getByKey(key);
    if (!chunk?.imports) {
      continue;
    }

    for (const importedKey of chunk.imports) {
      if (!visited.has(importedKey)) {
        queue.push(importedKey);
      }
    }
  }

  return visited;
}

function collectReachableGraph(startKeys) {
  const visited = new Set();
  const queue = [...startKeys];

  while (queue.length > 0) {
    const key = queue.shift();
    if (!key || visited.has(key)) {
      continue;
    }

    visited.add(key);
    const chunk = getByKey(key);
    for (const importedKey of [...(chunk?.imports ?? []), ...(chunk?.dynamicImports ?? [])]) {
      if (!visited.has(importedKey)) {
        queue.push(importedKey);
      }
    }
  }

  return visited;
}

function containsForbiddenRuntime(keys, matchers) {
  for (const key of keys) {
    if (key === 'index.html') {
      continue;
    }

    const src = manifest[key]?.src ?? key;
    if (matchers.some((rx) => rx.test(src))) {
      return src;
    }
  }

  return null;
}

function gzipSizeOfFile(filePath) {
  const input = fs.readFileSync(filePath);
  return zlib.gzipSync(input).length;
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

const indexChunk = getByKey('index.html');
if (!indexChunk?.file) {
  console.error('[deferred-check] index.html entry chunk not found in manifest');
  process.exit(1);
}

const entryJsPath = path.join(rootDir, 'examples/playground/dist', indexChunk.file);
const entryGzip = gzipSizeOfFile(entryJsPath);
const ENTRY_GZIP_BUDGET = 95 * 1024;

if (entryGzip > ENTRY_GZIP_BUDGET) {
  console.error(
    `[deferred-check] Entry gzip budget exceeded: ${formatKiB(entryGzip)} > ${formatKiB(ENTRY_GZIP_BUDGET)}`,
  );
  process.exit(1);
}

const initialGraph = collectStaticImportGraph(['index.html']);
const initialForbidden = containsForbiddenRuntime(initialGraph, deferredRuntimeMatchers);
if (initialForbidden) {
  console.error(`[deferred-check] Initial static graph includes forbidden Playground UI/runtime: ${initialForbidden}`);
  process.exit(1);
}

for (const routeName of ['core', 'layouts', 'icons', 'codeblock']) {
  const routeKey = routeKeys[routeName];
  const routeChunk = getByKey(routeKey);
  if (!routeChunk) {
    console.error(`[deferred-check] Route chunk not found in manifest: ${routeKey}`);
    process.exit(1);
  }

  const graph = collectStaticImportGraph(['index.html', routeKey]);
  const forbidden = containsForbiddenRuntime(graph, deferredRuntimeMatchers);
  if (forbidden) {
    console.error(`[deferred-check] Route "${routeName}" statically includes forbidden runtime: ${forbidden}`);
    process.exit(1);
  }
}

const playgroundRoute = getByKey(routeKeys.playground);
if (!playgroundRoute?.file) {
  console.error(`[deferred-check] Route chunk not found in manifest: ${routeKeys.playground}`);
  process.exit(1);
}

const playgroundGraph = collectStaticImportGraph(['index.html', routeKeys.playground]);
const playgroundForbidden = containsForbiddenRuntime(playgroundGraph, compilerRuntimeMatchers);
if (playgroundForbidden) {
  console.error(`[deferred-check] Playground route statically includes the compiler runtime: ${playgroundForbidden}`);
  process.exit(1);
}

const runtimeManifestEntry = Object.entries(manifest).find(([, entry]) =>
  /packages\/playground-core\/src\/index\.ts$/.test(entry.src ?? ''),
);
const [runtimeKey, runtimeEntry] = runtimeManifestEntry ?? [];
if (!runtimeEntry?.file) {
  console.error('[deferred-check] Deferred Playground runtime chunk not found in manifest');
  process.exit(1);
}

const playgroundReachableGraph = collectReachableGraph([routeKeys.playground]);
if (!playgroundReachableGraph.has(runtimeKey)) {
  console.error('[deferred-check] Playground route does not dynamically reach the browser runtime');
  process.exit(1);
}

const runtimePath = path.join(rootDir, 'examples/playground/dist', runtimeEntry.file);
const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
const compilerWorkerMatch = runtimeSource.match(/["']([^"']*typescriptWorker-[^"']+\.js)["']/);
if (!compilerWorkerMatch) {
  console.error('[deferred-check] Deferred TypeScript compiler worker not found in the browser runtime');
  process.exit(1);
}

const compilerFile = path.join('assets', path.basename(compilerWorkerMatch[1]));
const compilerPath = path.join(rootDir, 'examples/playground/dist', compilerFile);
if (!fs.existsSync(compilerPath)) {
  console.error(`[deferred-check] TypeScript compiler worker file not found: ${compilerPath}`);
  process.exit(1);
}

const compilerRaw = fs.statSync(compilerPath).size;
const compilerGzip = gzipSizeOfFile(compilerPath);
const COMPILER_RAW_BUDGET = 3_700 * 1000;
const COMPILER_GZIP_BUDGET = 1_100 * 1024;
if (compilerRaw > COMPILER_RAW_BUDGET) {
  console.error(
    `[deferred-check] Compiler raw budget exceeded: ${formatKiB(compilerRaw)} > ${formatKiB(COMPILER_RAW_BUDGET)}`,
  );
  process.exit(1);
}
if (compilerGzip > COMPILER_GZIP_BUDGET) {
  console.error(
    `[deferred-check] Compiler gzip budget exceeded: ${formatKiB(compilerGzip)} > ${formatKiB(COMPILER_GZIP_BUDGET)}`,
  );
  process.exit(1);
}

const assetsDirectory = path.join(rootDir, 'examples/playground/dist/assets');
const MAX_NON_COMPILER_JS_BYTES = 500 * 1000;
for (const fileName of fs.readdirSync(assetsDirectory)) {
  if (!fileName.endsWith('.js') || fileName === path.basename(compilerFile)) {
    continue;
  }

  const size = fs.statSync(path.join(assetsDirectory, fileName)).size;
  if (size > MAX_NON_COMPILER_JS_BYTES) {
    console.error(
      `[deferred-check] Non-compiler chunk exceeded 500 kB raw: assets/${fileName} (${formatKiB(size)})`,
    );
    process.exit(1);
  }
}

const routeReport = {};
for (const [routeName, routeKey] of Object.entries(routeKeys)) {
  const routeChunk = getByKey(routeKey);
  if (!routeChunk?.file) {
    continue;
  }
  const fullPath = path.join(rootDir, 'examples/playground/dist', routeChunk.file);
  routeReport[routeName] = {
    file: routeChunk.file,
    gzip: gzipSizeOfFile(fullPath),
  };
}

console.log('[deferred-check] OK');
console.log(`[deferred-check] Entry gzip: ${formatKiB(entryGzip)}`);
console.log(
  `[deferred-check] Deferred compiler worker: ${compilerFile} (${formatKiB(compilerRaw)} raw, ${formatKiB(compilerGzip)} gzip)`,
);
for (const [name, value] of Object.entries(routeReport)) {
  console.log(`[deferred-check] Route ${name}: ${value.file} (${formatKiB(value.gzip)})`);
}
