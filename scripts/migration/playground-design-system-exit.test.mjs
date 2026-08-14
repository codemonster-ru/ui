import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const playgroundRoot = join(repositoryRoot, 'examples/playground');
const sourceRoot = join(playgroundRoot, 'src');
const legacyPackages = ['@codemonster-ru/vueforge-core', '@codemonster-ru/vueforge-layouts'];

function sourceFiles() {
  return readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:css|ts|vue)$/u.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
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

    for (const packageName of legacyPackages) {
      assert.doesNotMatch(
        contents,
        new RegExp(packageName.replaceAll('/', '\\/'), 'u'),
        `${path} imports ${packageName}.`,
      );
    }

    assert.doesNotMatch(
      contents,
      /\bVf(?:AppShell|MenuBar|SkeletonGate|ThemeProvider|ThemeSwitch)\b|\buseTheme\b|\bvfSemanticColorTokenNames\b/u,
      `${path} retains a migrated VueForge API.`,
    );
    assert.doesNotMatch(
      contents,
      /var\(--vf-(?:border|breakpoint|color|font|heading|layout|overlay|radius|text)-/u,
      `${path} retains a legacy design-system token.`,
    );
  }
});
