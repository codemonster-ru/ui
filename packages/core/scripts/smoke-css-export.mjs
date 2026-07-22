/* global process, console */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const cssExportTargets = Object.entries(packageJson?.exports ?? {})
  .filter(([exportKey, exportTarget]) => exportKey.endsWith('.css') && typeof exportTarget === 'string')
  .map(([exportKey, exportTarget]) => [exportKey, exportTarget]);
const foundationalCssExports = new Set([
  './base.css',
  './tokens.css',
  './theme.css',
  './foundation.css',
  './styles.css',
]);
const overlayDependentCssExports = new Set([
  './command-palette.css',
  './dialog.css',
  './drawer.css',
  './dropdown.css',
  './menu-bar.css',
  './popover.css',
  './tooltip.css',
]);
const transitionGuardExcludedCssExports = new Set(['./tokens.css', './theme.css', './foundation.css']);
const colorArchitectureSnippets = {
  './tokens.css': [
    '--vf-palette-neutral-50: oklch(97.8% 0.005 260);',
    '--vf-color-background-canvas: var(--vf-color-bg);',
    '--vf-color-status-help-active-background:',
  ],
  './theme.css': [
    '--vf-palette-neutral-50: oklch(97.8% 0.005 260);',
    '--vf-color-background-canvas: var(--vf-color-bg);',
    '--vf-color-status-help-active-background:',
  ],
  './foundation.css': [
    '--vf-palette-neutral-50: oklch(97.8% 0.005 260);',
    '--vf-color-background-canvas: var(--vf-color-bg);',
    '--vf-color-status-help-active-background:',
  ],
  './styles.css': [
    '--vf-palette-neutral-50: oklch(97.8% 0.005 260);',
    '--vf-color-background-canvas: var(--vf-color-bg);',
    '--vf-color-status-help-active-background:',
  ],
};
const overlayPrimitiveDeclarations = [
  '--vf-overlay-border-width:',
  '--vf-overlay-enter-shift:',
  '--vf-overlay-float-enter-shift:',
  '--vf-overlay-float-enter-scale:',
  '--vf-overlay-arrow-overlap-offset:',
  '--vf-overlay-arrow-separated-offset:',
  '--vf-overlay-viewport-block-size:',
];

const componentJsExportTargets = Object.entries(packageJson?.exports ?? {})
  .filter(([exportKey, exportTarget]) => {
    if (exportKey === '.' || exportKey === './foundation' || exportKey === './theme' || exportKey.endsWith('.css')) {
      return false;
    }

    return typeof exportTarget === 'object' && exportTarget !== null && typeof exportTarget.import === 'string';
  })
  .map(([exportKey, exportTarget]) => [exportKey, exportTarget.import]);

if (!cssExportTargets.length) {
  throw new Error('Expected at least one CSS export in package.json exports.');
}

for (const [exportKey, exportTarget] of cssExportTargets) {
  if (typeof exportTarget !== 'string' || exportTarget.length === 0) {
    throw new Error(`Expected exports["${exportKey}"] to be a non-empty string.`);
  }
}

const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-core-pack-'));

try {
  const packedOutput = execFileSync('npm', ['pack', '--json', '--silent'], {
    cwd: packageDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_color: 'false',
      FORCE_COLOR: '0',
    },
  });

  const jsonTail = packedOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!jsonTail) {
    throw new Error('Unable to parse npm pack JSON output.');
  }

  const [packMeta] = JSON.parse(jsonTail[0]);
  if (!packMeta?.filename) {
    throw new Error('Unable to resolve npm pack filename.');
  }

  const tarballPath = join(packageDir, packMeta.filename);
  execFileSync('tar', ['-xzf', tarballPath, '-C', tempDir], {
    cwd: packageDir,
    stdio: 'pipe',
  });

  const tarEntries = execFileSync('tar', ['-tf', tarballPath], {
    cwd: packageDir,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

  for (const [exportKey, exportTarget] of cssExportTargets) {
    const normalizedTarget = exportTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;

    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken CSS export: exports["${exportKey}"] points to "${exportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`,
      );
    }

    const cssSource = readFileSync(join(tempDir, expectedTarPath), 'utf8');
    if (!foundationalCssExports.has(exportKey) && cssSource.includes("@import '../")) {
      throw new Error(
        `Broken CSS export: exports["${exportKey}"] contains an unresolved parent-relative @import in publish artifact.`,
      );
    }

    if (exportKey !== './tokens.css' && cssSource.includes('@import')) {
      throw new Error(`Broken CSS export: ${exportKey} contains an unresolved @import in the publish artifact.`);
    }

    for (const snippet of colorArchitectureSnippets[exportKey] ?? []) {
      if (!cssSource.includes(snippet)) {
        throw new Error(`Broken color-token contract: ${exportKey} is missing ${snippet}.`);
      }
    }

    if (
      !foundationalCssExports.has(exportKey) &&
      (cssSource.includes('--vf-palette-neutral-50:') || cssSource.includes('--vf-color-background-canvas:'))
    ) {
      throw new Error(`Broken component isolation: ${exportKey} redeclares the shared color architecture.`);
    }

    if (overlayDependentCssExports.has(exportKey)) {
      for (const declaration of overlayPrimitiveDeclarations) {
        if (!cssSource.includes(declaration)) {
          throw new Error(`Broken overlay CSS export: ${exportKey} is missing the shared ${declaration} declaration.`);
        }
      }
    }

    if (!transitionGuardExcludedCssExports.has(exportKey)) {
      const guardOccurrences = cssSource.match(/:root\.vf-theme-transitioning :where\(\[class\^='vf-'\]/g) ?? [];
      if (guardOccurrences.length !== 1) {
        throw new Error(`Broken theme-transition fallback: ${exportKey} must contain the shared guard exactly once.`);
      }
    }

    if (exportKey === './stepper.css') {
      for (const foreignSelector of ['.vf-nav-menu', '.vf-menu-bar', '.vf-tabs', '.vf-accordion']) {
        if (cssSource.includes(foreignSelector)) {
          throw new Error(`Broken Stepper CSS export: standalone artifact contains ${foreignSelector}.`);
        }
      }
      for (const declaration of overlayPrimitiveDeclarations) {
        if (cssSource.includes(declaration)) {
          throw new Error(`Broken Stepper CSS export: standalone artifact contains unused ${declaration}.`);
        }
      }
    }

    const requiredSnippets =
      {
        './input.css': ['display: block;', 'var(--vf-field-floating-input-offset-inline-lg)'],
        './textarea.css': ['display: block;'],
        './select.css': [
          'var(--vf-field-floating-select-padding-adjustment-sm)',
          'var(--vf-field-floating-select-padding-adjustment-lg)',
          '.vf-dropdown__item.vf-select__option',
        ],
        './nav-menu.css': ['var(--vf-nav-menu-group-label-letter-spacing)'],
        './command-palette.css': ['line-clamp: 3;', 'line-clamp: 2;'],
        './dialog.css': ['.vf-dialog__actions .vf-icon-button .vf-icon'],
        './drawer.css': ['.vf-drawer__actions .vf-icon-button .vf-icon'],
        './menu-bar.css': ['.vf-horizontal-scroller {'],
        './tabs.css': ['.vf-horizontal-scroller {'],
      }[exportKey] ?? [];

    for (const snippet of requiredSnippets) {
      if (!cssSource.includes(snippet)) {
        throw new Error(`Broken reconciled CSS export: ${exportKey} is missing ${snippet}.`);
      }
    }

    if (exportKey === './select.css' && cssSource.includes('min-height: var(--vf-select-filter-min-height-sm)')) {
      throw new Error('Broken Select CSS export: floating geometry still uses the legacy filter min-height token.');
    }
  }

  for (const [exportKey, exportTarget] of componentJsExportTargets) {
    const normalizedTarget = exportTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;

    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken JS export: exports["${exportKey}"] points to "${exportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`,
      );
    }

    const entryName = exportKey.replace(/^\.\//, '');
    const proxySource = readFileSync(join(tempDir, expectedTarPath), 'utf8');
    const expectedCssImport = `../${entryName}.css`;
    if (!proxySource.includes(`import '${expectedCssImport}';`)) {
      throw new Error(
        `Broken component CSS auto-link: ${exportKey} does not import ${expectedCssImport} in publish artifact.`,
      );
    }
  }

  const cssCount = cssExportTargets.length;
  const componentJsCount = componentJsExportTargets.length;
  console.log(
    `Smoke check passed: validated ${cssCount} CSS exports and ${componentJsCount} component JS auto-CSS exports for ${packageJson.name}.`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
