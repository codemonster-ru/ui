import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);
const referenceRoot = options.reference ? resolve(options.reference) : null;
const port = Number(options.port ?? 5177);

if (!referenceRoot || !existsSync(referenceRoot)) {
  throw new Error('A checkout of the reference commit is required: --reference=DIR.');
}
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('Reference fixture port must be an integer between 1 and 65535.');
}

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../contracts/visual.config.json'), 'utf8'));
const referenceCore = resolve(referenceRoot, 'packages/core');
const referenceVue = resolve(referenceRoot, 'node_modules/vue');
for (const [label, path] of [
  ['reference component package', referenceCore],
  ['reference Vue runtime', referenceVue],
]) {
  if (!existsSync(path)) throw new Error(`Missing ${label} at ${path}. Install and build the reference checkout first.`);
}

const corePackage = JSON.parse(readFileSync(resolve(referenceCore, 'package.json'), 'utf8'));
if (corePackage.name !== '@codemonster-ru/vueforge-core') {
  throw new Error(`Expected @codemonster-ru/vueforge-core at ${referenceCore}, found ${corePackage.name}.`);
}

// The fixture and the reference components must share one Vue instance, so both resolve through the
// reference checkout rather than this repository's own dependency tree.
const server = await createServer({
  configFile: false,
  root: resolve(import.meta.dirname, 'cross-platform-reference-fixture'),
  resolve: {
    alias: [
      { find: /^@codemonster-ru\/vueforge-core$/u, replacement: referenceCore },
      { find: /^vue$/u, replacement: referenceVue },
    ],
    dedupe: ['vue'],
  },
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    fs: { allow: [resolve(import.meta.dirname, '../..'), referenceRoot] },
  },
});

await server.listen();
console.log(
  `VueForge reference fixtures ready at http://127.0.0.1:${port} from ${referenceRoot} (${config.reference.commit}).`,
);

await new Promise((resolvePromise) => {
  const close = () => resolvePromise();
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
});
await server.close();
