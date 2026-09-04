import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function listCssFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) {
      files.push(...(await listCssFiles(entryUrl)));
    } else if (entry.name.endsWith('.css')) {
      files.push(entryUrl);
    }
  }

  return files;
}

// A handful of custom properties are legitimately published only from JS/PHP (per-element indentation
// and offsets a controller or adapter writes as an inline style), not declared in any stylesheet. Every
// one of them already carries a CSS fallback at its use site, so this list exists only for readability,
// not because the fallback check below needs it.
const jsPublishedProperties = new Set([
  '--cm-toc-level',
  '--cm-nav-menu-level',
  '--cm-sticky-header-offset',
  '--cm-sticky-top-offset',
  '--cm-z-index-sticky',
]);

test('every var() without a fallback names a custom property this package or ui-tokens actually defines', async () => {
  // This is exactly the check that would have caught --cm-space-3xs, --cm-space-xs, --cm-space-md,
  // --cm-space-lg, --cm-container-2xl, --cm-focus-ring-offset, --cm-motion-easing-standard,
  // --cm-color-text-tertiary, and --cm-color-background-overlay -- nine references to custom
  // properties that don't exist anywhere in this design system, each silently resolving to the
  // property's initial value (usually as good as unset) instead of failing anything. None of them
  // crashed, so nothing short of reading every generated pixel would have noticed on its own.
  const cssPackageRoot = new URL('../', import.meta.url);
  const tokensPackageRoot = new URL('../../tokens/', import.meta.url);

  const definitionSources = [
    new URL('dist/tokens.css', tokensPackageRoot),
    new URL('dist/breakpoints.css', tokensPackageRoot),
    ...(await listCssFiles(new URL('src/', cssPackageRoot))),
  ];

  const defined = new Set();
  for (const fileUrl of definitionSources) {
    const source = await readFile(fileUrl, 'utf8');
    for (const match of source.matchAll(/(--cm-[a-zA-Z0-9-]+)\s*:/gu)) {
      defined.add(match[1]);
    }
  }

  const missing = [];
  for (const fileUrl of await listCssFiles(new URL('src/', cssPackageRoot))) {
    const source = await readFile(fileUrl, 'utf8');

    for (const match of source.matchAll(/var\((--cm-[a-zA-Z0-9-]+)([^)]*)\)/gu)) {
      const [, name, rest] = match;
      const hasFallback = rest.includes(',');

      if (!hasFallback && !defined.has(name) && !jsPublishedProperties.has(name)) {
        missing.push(`${name} (${fileUrl.pathname.replace(cssPackageRoot.pathname, '')})`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
