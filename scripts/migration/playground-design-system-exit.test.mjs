import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const playgroundRoot = join(repositoryRoot, 'examples/vue');
const sourceRoot = join(playgroundRoot, 'src');
const legacyPackages = ['@codemonster-ru/vueforge-core', '@codemonster-ru/vueforge-layouts'];
const migratedApis = [
  'VfAppShell',
  'VfMenuBar',
  'VfSkeletonGate',
  'VfThemeProvider',
  'VfThemeSwitch',
  'useTheme',
  'vfSemanticColorTokenNames',
];
const retainedLegacyCustomProperties = new Set([
  '--vf-codeblock-margin-block-end',
  '--vf-codeblock-margin-block-start',
]);
const retainedLegacyClassPrefixes = ['vf-codeblock', 'vf-icon', 'vf-playground'];
const retainedThemeBoundaryPaths = new Set([
  'examples/vue/src/app-shell.ts',
  'examples/vue/src/components/ViteLikeDemoPreview.vue',
  'examples/vue/src/sections/codeblock/CodeBlockShowcase.vue',
  'examples/vue/src/sections/colors/ColorSystemShowcase.vue',
  'examples/vue/src/sections/icons/IconSaasContexts.vue',
]);

function sourceFiles() {
  return readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:css|ts|vue)$/u.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

function legacyPackageSource(contents, path) {
  return /\.(?:test|spec)\.[^.]+$/u.test(path) ? stripCommentsAndStrings(contents) : contents;
}

function stripCommentsAndStrings(source) {
  let output = '';
  let index = 0;
  let state = 'code';

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (state === 'code') {
      if (character === '/' && nextCharacter === '/') {
        output += '  ';
        index += 2;
        state = 'line-comment';
        continue;
      }
      if (character === '/' && nextCharacter === '*') {
        output += '  ';
        index += 2;
        state = 'block-comment';
        continue;
      }
      if (character === "'" || character === '"' || character === '`') {
        output += ' ';
        index += 1;
        state = character === "'" ? 'single-quote' : character === '"' ? 'double-quote' : 'template';
        continue;
      }

      output += character;
      index += 1;
      continue;
    }

    if (character === '\n') {
      output += '\n';
      index += 1;
      if (state === 'line-comment') state = 'code';
      continue;
    }

    if (state === 'block-comment' && character === '*' && nextCharacter === '/') {
      output += '  ';
      index += 2;
      state = 'code';
      continue;
    }

    const closingQuote = state === 'single-quote' ? "'" : state === 'double-quote' ? '"' : '`';
    if (state !== 'line-comment' && state !== 'block-comment' && character === '\\') {
      output += '  ';
      index += 2;
      continue;
    }
    if (state !== 'line-comment' && state !== 'block-comment' && character === closingQuote) {
      output += ' ';
      index += 1;
      state = 'code';
      continue;
    }

    output += ' ';
    index += 1;
  }

  return output;
}

function vueBlocks(contents, tagName) {
  return [...contents.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gu'))].map(
    (match) => match[1],
  );
}

function semanticApiSource(contents, extension) {
  if (extension !== '.vue') return stripCommentsAndStrings(contents);

  const scripts = vueBlocks(contents, 'script').map(stripCommentsAndStrings).join('\n');
  const markup = contents
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gu, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gu, '');
  const componentTags = [...markup.matchAll(/<\/?([A-Z][\w]*)\b/gu)].map((match) => match[1]).join('\n');

  return `${scripts}\n${componentTags}`;
}

function legacyRuntimeClasses(contents, extension) {
  const classNames = new Set();
  const collect = (source, pattern) => {
    for (const match of source.matchAll(pattern)) {
      const value = match.slice(1).find((capture) => capture !== undefined) ?? '';
      for (const className of value.match(/\bvf-[a-z0-9_-]+\b/gu) ?? []) classNames.add(className);
    }
  };

  if (extension === '.css') {
    collect(contents, /\.((?:vf-)[a-z0-9_-]+)/gu);
    return [...classNames];
  }

  if (extension === '.vue') {
    const markup = contents
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gu, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gu, '');
    collect(markup, /(?:^|\s)(?:class|:class)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu);
    for (const style of vueBlocks(contents, 'style')) collect(style, /\.((?:vf-)[a-z0-9_-]+)/gu);
    for (const script of vueBlocks(contents, 'script')) {
      collect(script, /\b(?:class|className)\s*:\s*(?:"([^"]*)"|'([^']*)')/gu);
    }
  } else {
    collect(contents, /\b(?:class|className)\s*:\s*(?:"([^"]*)"|'([^']*)')/gu);
  }

  return [...classNames];
}

function isRetainedLegacyClass(className) {
  return retainedLegacyClassPrefixes.some(
    (prefix) => className === prefix || className.startsWith(`${prefix}__`) || className.startsWith(`${prefix}--`),
  );
}

function legacyCustomProperties(contents) {
  return [...new Set(contents.match(/--vf-[a-z0-9-]+/gu) ?? [])];
}

test('keeps the representative playground off legacy design-system dependencies', () => {
  const manifest = JSON.parse(readFileSync(join(playgroundRoot, 'package.json'), 'utf8'));
  const declaredDependencies = { ...manifest.dependencies, ...manifest.devDependencies };

  for (const packageName of legacyPackages) {
    assert.equal(declaredDependencies[packageName], undefined, `${packageName} must not be a direct dependency.`);
  }

  const files = [...sourceFiles(), join(playgroundRoot, 'vite.config.ts')];
  for (const file of files) {
    const contents = readFileSync(file, 'utf8');
    const path = relative(repositoryRoot, file);
    const extension = file.slice(file.lastIndexOf('.'));
    const packageSource = legacyPackageSource(contents, path);

    for (const packageName of legacyPackages) {
      assert.doesNotMatch(
        packageSource,
        new RegExp(packageName.replaceAll('/', '\\/'), 'u'),
        `${path} imports ${packageName}.`,
      );
    }

    const apiSource = semanticApiSource(contents, extension);
    for (const api of migratedApis) {
      assert.doesNotMatch(apiSource, new RegExp(`\\b${api}\\b`, 'u'), `${path} retains migrated API ${api}.`);
    }

    const forbiddenClasses = legacyRuntimeClasses(contents, extension).filter(
      (className) => !isRetainedLegacyClass(className),
    );
    assert.deepEqual(forbiddenClasses, [], `${path} retains runtime VueForge classes: ${forbiddenClasses.join(', ')}.`);

    const forbiddenCustomProperties = legacyCustomProperties(contents).filter(
      (property) => !retainedLegacyCustomProperties.has(property),
    );
    assert.deepEqual(
      forbiddenCustomProperties,
      [],
      `${path} retains legacy design-system custom properties: ${forbiddenCustomProperties.join(', ')}.`,
    );

    if (!/\.(?:test|spec)\.[^.]+$/u.test(file) && contents.includes('data-vf-theme')) {
      assert.ok(retainedThemeBoundaryPaths.has(path), `${path} retains an unapproved data-vf-theme boundary.`);
    }
  }
});

test('semantic scanners ignore visible fixtures and inspect runtime ownership', () => {
  const fixture = `<template>
  <p>VfThemeProvider and VfMenuBar are migration notes.</p>
  <div class="vf-playground" :class="{ 'vf-runtime-state': true }"><button class="cm-button">Action</button></div>
</template>
<script setup>
const displayedSource = \`<button class="vf-button">Visible source fixture</button>\`;
const runtime = { class: 'vf-button vf-button--secondary' };
</script>`;

  assert.doesNotMatch(semanticApiSource(fixture, '.vue'), /\bVfThemeProvider\b|\bVfMenuBar\b/u);
  assert.deepEqual(legacyRuntimeClasses(fixture, '.vue').sort(), [
    'vf-button',
    'vf-button--secondary',
    'vf-playground',
    'vf-runtime-state',
  ]);
});

test('dependency scanner ignores test-only fixture strings', () => {
  const assertionFixture = "expect(showcase).not.toContain('@codemonster-ru/vueforge-core');";
  const runtimeImport = "import '@codemonster-ru/vueforge-core/styles.css';";

  assert.doesNotMatch(legacyPackageSource(assertionFixture, 'fixture.test.ts'), /@codemonster-ru\/vueforge-core/u);
  assert.match(legacyPackageSource(runtimeImport, 'fixture.ts'), /@codemonster-ru\/vueforge-core/u);
});

test('semantic scanners find component APIs and narrowly allow retained product hooks', () => {
  const fixture = `<template><VfThemeSwitch /></template>
<script setup>const theme = useTheme();</script>
<style>.vf-codeblock { --vf-codeblock-margin-block-start: 0; color: var(--vf-color-text-primary); }</style>`;
  const apiSource = semanticApiSource(fixture, '.vue');

  assert.match(apiSource, /\bVfThemeSwitch\b/u);
  assert.match(apiSource, /\buseTheme\b/u);
  assert.ok(isRetainedLegacyClass('vf-codeblock'));
  assert.deepEqual(legacyCustomProperties(fixture).sort(), [
    '--vf-codeblock-margin-block-start',
    '--vf-color-text-primary',
  ]);
  assert.ok(retainedLegacyCustomProperties.has('--vf-codeblock-margin-block-start'));
  assert.ok(!retainedLegacyCustomProperties.has('--vf-color-text-primary'));
});
