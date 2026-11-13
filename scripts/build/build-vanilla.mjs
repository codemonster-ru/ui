import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'examples/vanilla');
const output = resolve(source, 'dist');

await mkdir(output, { recursive: true });
await build({
  entryPoints: [resolve(source, 'runtime.mjs')],
  outfile: resolve(output, 'runtime.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'linked',
});
await Promise.all([
  cp(resolve(root, 'packages/tokens/dist'), resolve(output, 'tokens'), { recursive: true }),
  cp(resolve(root, 'packages/css/dist'), resolve(output, 'css'), { recursive: true }),
  cp(resolve(source, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(source, 'start.js'), resolve(output, 'start.js')),
]);
console.log(`Vanilla assets written to ${output}.`);
