import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { historicalComponentEntries, historicalComponentPattern } from '../build/historical-component-entries.mjs';
import { codeMonsterUiNodeEngine, codeMonsterUiNpmPackages } from './code-monster-ui-package-catalog.mjs';
import { validateCodeMonsterUiNpmPackageContract } from './code-monster-ui-package-contracts.mjs';

const tokensContract = codeMonsterUiNpmPackages.find(({ directory }) => directory === 'tokens');
const layoutsContract = codeMonsterUiNpmPackages.find(({ directory }) => directory === 'layouts');

function createPackage(context, manifestOverrides = {}) {
  const packageDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-package-contract-'));
  context.after(() => rmSync(packageDirectory, { recursive: true }));
  mkdirSync(join(packageDirectory, 'dist'));
  mkdirSync(join(packageDirectory, 'src'));
  for (const fileName of ['CHANGELOG.md', 'LICENSE', 'README.md']) {
    writeFileSync(join(packageDirectory, fileName), `${fileName}\n`);
  }
  writeFileSync(join(packageDirectory, 'dist/index.js'), 'export const token = true;\n');
  writeFileSync(join(packageDirectory, 'dist/index.d.ts'), 'export declare const token: true;\n');
  writeFileSync(join(packageDirectory, 'src/index.ts'), 'export const token = true;\n');

  const manifest = {
    name: tokensContract.name,
    version: '0.1.0',
    description: 'CodeMonster UI tokens.',
    type: 'module',
    license: 'MIT',
    engines: { node: codeMonsterUiNodeEngine },
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    },
    files: ['dist'],
    scripts: {
      build: 'example',
      check: 'example',
      format: 'example',
      lint: 'example',
      prepack: 'example',
      test: 'example',
      typecheck: 'example',
    },
    publishConfig: { access: 'public' },
    ...manifestOverrides,
  };

  return { manifest, packageDirectory };
}

test('accepts a built CodeMonster UI package contract', (context) => {
  const { manifest, packageDirectory } = createPackage(context);

  assert.deepEqual(validateCodeMonsterUiNpmPackageContract(tokensContract, packageDirectory, manifest), []);
});

test('rejects emitted test declarations and maps while allowing workspace tests', (context) => {
  const { manifest, packageDirectory } = createPackage(context);
  writeFileSync(join(packageDirectory, 'src/index.test.ts'), 'export {};\n');
  assert.deepEqual(validateCodeMonsterUiNpmPackageContract(tokensContract, packageDirectory, manifest), []);

  writeFileSync(join(packageDirectory, 'dist/index.test.d.ts'), 'export {};\n');
  writeFileSync(join(packageDirectory, 'dist/index.test.d.ts.map'), '{}\n');
  assert.deepEqual(validateCodeMonsterUiNpmPackageContract(tokensContract, packageDirectory, manifest).sort(), [
    `${tokensContract.name} contains a test artifact in ${join('dist', 'index.test.d.ts')}.`,
    `${tokensContract.name} contains a test artifact in ${join('dist', 'index.test.d.ts.map')}.`,
  ]);
});

test('checks every registered historical wildcard target after build', (context) => {
  const { manifest, packageDirectory } = createPackage(context, {
    name: layoutsContract.name,
    peerDependencies: { vue: '^3.5.0' },
    exports: { '.': './dist/index.js', [historicalComponentPattern]: './dist/components/*.js' },
  });
  mkdirSync(join(packageDirectory, 'dist/components'));
  for (const { slug } of historicalComponentEntries(layoutsContract.name)) {
    writeFileSync(join(packageDirectory, `dist/components/${slug}.js`), 'export {};\n');
  }

  assert.deepEqual(validateCodeMonsterUiNpmPackageContract(layoutsContract, packageDirectory, manifest), []);
  rmSync(join(packageDirectory, 'dist/components/stack.js'));
  const errors = validateCodeMonsterUiNpmPackageContract(layoutsContract, packageDirectory, manifest);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /\(stack\) target is missing after build: .\/dist\/components\/stack\.js/u);
});

test('rejects missing exports, invalid package dependencies, and VueForge imports', (context) => {
  const { manifest, packageDirectory } = createPackage(context, {
    dependencies: {
      '@codemonster-ru/ui-vue': '^0.1.0',
      '@codemonster-ru/vueforge-theme': '^2.0.0',
    },
    exports: { '.': './dist/missing.js' },
  });
  rmSync(join(packageDirectory, 'CHANGELOG.md'));
  writeFileSync(
    join(packageDirectory, 'src/index.ts'),
    "export { defaultThemePreset } from '@codemonster-ru/vueforge-theme';\nexport { legacyTheme } from '../../theme/src/index.ts';\n",
  );

  const errors = validateCodeMonsterUiNpmPackageContract(tokensContract, packageDirectory, manifest);

  assert.ok(errors.some((message) => message.includes('must include CHANGELOG.md')));
  assert.ok(errors.some((message) => message.includes('target is missing after build')));
  assert.ok(errors.some((message) => message.includes('must not depend on VueForge package')));
  assert.ok(errors.some((message) => message.includes('must not depend on same-level or later package')));
  assert.ok(errors.some((message) => message.includes('contains a VueForge import in src/index.ts')));
  assert.ok(errors.some((message) => message.includes('contains a cross-package relative import')));
});
