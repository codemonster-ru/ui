import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { buildVanillaShowcase } from './build-vanilla-showcase.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'examples/vanilla');
const output = resolve(source, 'dist');

await rm(output, { recursive: true, force: true });
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
  cp(resolve(source, 'index.html'), resolve(output, 'accordion-example.html')),
  cp(resolve(source, 'start.js'), resolve(output, 'start.js')),
  ...['annabel', 'vueforge'].map((name) =>
    cp(resolve(root, `examples/shared/${name}-logo-icon.svg`), resolve(output, `${name}-logo-icon.svg`)),
  ),
  cp(resolve(source, 'avatar.png'), resolve(output, 'avatar.png')),
  cp(resolve(root, 'examples/shared/showcase-icon-catalog.js'), resolve(output, 'showcase-icon-catalog.js')),
  cp(resolve(root, 'examples/shared/showcase-reference.js'), resolve(output, 'showcase-reference.js')),
  cp(resolve(root, 'examples/shared/showcase-layout-recipes.js'), resolve(output, 'showcase-layout-recipes.js')),
  cp(resolve(source, 'showcase-layouts.js'), resolve(output, 'showcase-layouts.js')),
  cp(resolve(root, 'examples/shared/showcase-core-recipes.js'), resolve(output, 'showcase-core-recipes.js')),
  cp(resolve(source, 'showcase.js'), resolve(output, 'showcase.js')),
  cp(resolve(source, 'showcase-demo.js'), resolve(output, 'showcase-demo.js')),
  buildVanillaShowcase(resolve(root, 'contracts'), output),
]);
await build({
  stdin: {
    contents:
      "@import './packages/tokens/dist/tokens.css';\n@import './packages/css/dist/fonts.css';\n@import './packages/css/dist/styles.css';\n@import './examples/shared/showcase-shell.css';\n@import './examples/vanilla/showcase.css';",
    resolveDir: root,
    loader: 'css',
  },
  outfile: resolve(output, 'css/showcase.css'),
  bundle: true,
  minify: true,
  external: ['*.woff2'],
});
console.log(`Vanilla assets written to ${output}.`);
