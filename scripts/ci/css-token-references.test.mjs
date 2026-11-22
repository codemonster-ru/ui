import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// This lives at the repository root, not inside packages/css/__tests__, because it reads
// packages/tokens/dist, a sibling package's build output. A standalone CSS workspace test does not
// require a tokens build. The repository verification and cold workspace run build the shared
// artifacts before checking the cross-package CSS contract.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cssRoot = resolve(root, 'packages/css');
const tokensRoot = resolve(root, 'packages/tokens');

async function listCssFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listCssFiles(path)));
    } else if (entry.name.endsWith('.css')) {
      files.push(path);
    }
  }

  return files;
}

// A handful of custom properties are legitimately published only from JS/PHP (per-element indentation
// and offsets a controller or adapter writes as an inline style), not declared in any stylesheet.
const jsPublishedProperties = new Set([
  '--cm-toc-level',
  '--cm-nav-menu-level',
  '--cm-sticky-header-offset',
  '--cm-sticky-top-offset',
  '--cm-z-index-sticky',
]);

test('CSS references resolve to custom properties published by ui-css or ui-tokens', async () => {
  // This is exactly the check that would have caught --cm-space-3xs, --cm-space-xs, --cm-space-md,
  // --cm-space-lg, --cm-container-2xl, --cm-focus-ring-offset, --cm-motion-easing-standard,
  // --cm-color-text-tertiary, and --cm-color-background-overlay -- nine references to custom
  // properties that don't exist anywhere in this design system, each silently resolving to the
  // property's initial value (usually as good as unset) instead of failing anything. None of them
  // crashed, so nothing short of reading every generated pixel would have noticed on its own.
  const libraryCss = await listCssFiles(resolve(cssRoot, 'src'));
  const showcaseCss = [
    ...(await listCssFiles(resolve(root, 'examples/shared'))),
    resolve(root, 'examples/vanilla/showcase.css'),
  ];
  const definitionSources = [
    resolve(tokensRoot, 'dist/tokens.css'),
    resolve(tokensRoot, 'dist/breakpoints.css'),
    ...libraryCss,
  ];

  const defined = new Set();
  for (const path of definitionSources) {
    const source = await readFile(path, 'utf8');
    for (const match of source.matchAll(/(--cm-[a-zA-Z0-9-]+)\s*:/gu)) {
      defined.add(match[1]);
    }
  }

  const missing = [];
  const showcaseDeclarations = [];
  for (const path of [...libraryCss, ...showcaseCss]) {
    const source = await readFile(path, 'utf8');
    const isShowcase = showcaseCss.includes(path);
    const label = path.replace(`${root}/`, '');

    if (isShowcase) {
      for (const [, name] of source.matchAll(/^\s*(--cm-[a-zA-Z0-9-]+)\s*:/gmu)) {
        showcaseDeclarations.push(`${name} (${label})`);
      }
    }

    for (const match of source.matchAll(/var\((--cm-[a-zA-Z0-9-]+)([^)]*)\)/gu)) {
      const [, name, rest] = match;
      const hasFallback = rest.includes(',');

      if ((!hasFallback || isShowcase) && !defined.has(name) && !jsPublishedProperties.has(name)) {
        missing.push(`${name} (${label})`);
      }
    }
  }

  assert.deepEqual(missing, [], 'Unknown CodeMonster UI custom properties');
  assert.deepEqual(showcaseDeclarations, [], 'Showcase CSS must leave the --cm-* namespace to the library');
});
