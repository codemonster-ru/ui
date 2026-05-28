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
  playground: 'src/PlaygroundShowcase.vue'
};

const forbiddenSrcMatchers = [/node_modules\/shiki\//, /node_modules\/@shikijs\//, /packages\/playground-core\/src\//];

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

function containsForbiddenRuntime(keys) {
  for (const key of keys) {
    if (key === 'index.html') {
      continue;
    }

    const src = manifest[key]?.src ?? key;
    if (forbiddenSrcMatchers.some((rx) => rx.test(src))) {
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
  console.error(`[deferred-check] Entry gzip budget exceeded: ${formatKiB(entryGzip)} > ${formatKiB(ENTRY_GZIP_BUDGET)}`);
  process.exit(1);
}

for (const routeName of ['core', 'layouts', 'icons']) {
  const routeKey = routeKeys[routeName];
  const routeChunk = getByKey(routeKey);
  if (!routeChunk) {
    console.error(`[deferred-check] Route chunk not found in manifest: ${routeKey}`);
    process.exit(1);
  }

  const graph = collectStaticImportGraph(['index.html', routeKey]);
  const forbidden = containsForbiddenRuntime(graph);
  if (forbidden) {
    console.error(`[deferred-check] Route "${routeName}" statically includes forbidden runtime: ${forbidden}`);
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
    gzip: gzipSizeOfFile(fullPath)
  };
}

console.log('[deferred-check] OK');
console.log(`[deferred-check] Entry gzip: ${formatKiB(entryGzip)}`);
for (const [name, value] of Object.entries(routeReport)) {
  console.log(`[deferred-check] Route ${name}: ${value.file} (${formatKiB(value.gzip)})`);
}
