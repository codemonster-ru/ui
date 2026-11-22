import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { buildVanillaShowcase } from './build-vanilla-showcase.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'examples/vanilla');
const output = resolve(source, process.argv.includes('--dev') ? '.generated' : 'dist');

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
  ...[
    'confirm-dialog-example.html',
    'confirm-dialog-example.mjs',
    'code-block-example.html',
    'code-block-example.css',
    'code-block-example.mjs',
    'playground-example.html',
    'playground-example.css',
    'playground-example.mjs',
  ].map((asset) => cp(resolve(source, asset), resolve(output, asset))),
  cp(resolve(source, 'start.js'), resolve(output, 'start.js')),
  ...['annabel', 'vueforge'].map((name) =>
    cp(resolve(root, `examples/shared/${name}-logo-icon.svg`), resolve(output, `${name}-logo-icon.svg`)),
  ),
  cp(resolve(source, 'avatar.png'), resolve(output, 'avatar.png')),
  cp(resolve(root, 'examples/shared/showcase-icon-catalog.js'), resolve(output, 'showcase-icon-catalog.js')),
  cp(resolve(root, 'examples/shared/showcase-reference.js'), resolve(output, 'showcase-reference.js')),
  cp(resolve(root, 'examples/shared/showcase-inline.mjs'), resolve(output, 'showcase-inline.mjs')),
  cp(resolve(root, 'examples/shared/showcase-layout-example.css'), resolve(output, 'showcase-layout-example.css')),
  cp(resolve(root, 'examples/shared/showcase-layout-recipes.js'), resolve(output, 'showcase-layout-recipes.js')),
  cp(resolve(source, 'showcase-layouts.js'), resolve(output, 'showcase-layouts.js')),
  cp(resolve(source, 'layout-example.js'), resolve(output, 'layout-example.js')),
  cp(resolve(source, 'showcase.js'), resolve(output, 'showcase.js')),
  cp(resolve(root, 'examples/shared/showcase-theme.js'), resolve(output, 'showcase-theme.js')),
  cp(resolve(root, 'examples/shared/showcase-navigation.js'), resolve(output, 'showcase-navigation.js')),
  buildVanillaShowcase(resolve(root, 'contracts'), output),
]);
const packageStyles = [
  './packages/tokens/dist/tokens.css',
  './packages/css/dist/fonts.css',
  './packages/css/dist/styles.css',
];
const showcaseStyles = [
  './examples/shared/showcase-shell.css',
  './examples/shared/showcase-typography.css',
  './examples/shared/showcase-colors.css',
  './examples/shared/showcase-icon-gallery.css',
  './examples/vanilla/showcase.css',
];

// The document uses showcase chrome; isolated previews use only the published package styles.
function bundleStylesheet(file, styles) {
  return build({
    stdin: {
      contents: styles.map((style) => `@import "${style}";`).join('\n'),
      resolveDir: root,
      loader: 'css',
    },
    outfile: resolve(output, 'css', file),
    bundle: true,
    minify: true,
    external: ['*.woff2'],
  });
}

await Promise.all([
  bundleStylesheet('showcase.css', [...packageStyles, ...showcaseStyles]),
  bundleStylesheet('preview.css', packageStyles),
]);
console.log(`Vanilla assets written to ${output}.`);
