/* global process, console */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const corePackageDir = process.cwd();
const workspaceDir = resolve(corePackageDir, '../..');
const themePackageDir = resolve(corePackageDir, '../theme');
const workspaceNodeModules = join(workspaceDir, 'node_modules');
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-theme-types-smoke-'));
const createdTarballs = [];

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
}

function packPackage(packageDir, extractionName) {
  const packedOutput = execFileSync('npm', ['pack', '--json', '--silent'], {
    cwd: packageDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_color: 'false',
      npm_config_offline: 'true',
      FORCE_COLOR: '0',
    },
  });
  const jsonTail = packedOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);

  if (!jsonTail) {
    throw new Error(`Unable to parse npm pack JSON output for ${packageDir}.`);
  }

  const [packMeta] = JSON.parse(jsonTail[0]);
  if (!packMeta?.filename) {
    throw new Error(`Unable to resolve npm pack filename for ${packageDir}.`);
  }

  const tarballPath = join(packageDir, packMeta.filename);
  createdTarballs.push(tarballPath);
  const extractionDir = join(tempDir, extractionName);
  mkdirSync(extractionDir, { recursive: true });
  execFileSync('tar', ['-xzf', tarballPath, '-C', extractionDir], {
    cwd: packageDir,
    stdio: 'pipe',
  });

  return join(extractionDir, 'package');
}

function linkPackage(consumerNodeModules, packageName, sourceDir) {
  const targetDir = join(consumerNodeModules, ...packageName.split('/'));
  mkdirSync(dirname(targetDir), { recursive: true });
  symlinkSync(sourceDir, targetDir, 'dir');
}

try {
  const corePackageJson = readPackageJson(corePackageDir);
  const packedCoreDir = packPackage(corePackageDir, 'core');
  const packedThemeDir = packPackage(themePackageDir, 'theme');
  const consumerDir = join(tempDir, 'consumer');
  const consumerNodeModules = join(consumerDir, 'node_modules');

  mkdirSync(consumerNodeModules, { recursive: true });
  linkPackage(consumerNodeModules, '@codemonster-ru/vueforge-core', packedCoreDir);
  linkPackage(consumerNodeModules, '@codemonster-ru/vueforge-theme', packedThemeDir);

  const dependencyNames = new Set([
    ...Object.keys(corePackageJson.dependencies ?? {}),
    ...Object.keys(corePackageJson.peerDependencies ?? {}),
  ]);
  dependencyNames.delete('@codemonster-ru/vueforge-theme');

  for (const dependencyName of dependencyNames) {
    const dependencyDir = join(workspaceNodeModules, ...dependencyName.split('/'));
    if (!existsSync(dependencyDir)) {
      throw new Error(`Required local dependency is unavailable for type smoke: ${dependencyName}`);
    }
    linkPackage(consumerNodeModules, dependencyName, dependencyDir);
  }

  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'vueforge-theme-types-smoke', private: true, type: 'module' }, null, 2)}\n`,
  );
  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          preserveSymlinks: true,
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          lib: ['ES2020', 'DOM'],
        },
        include: ['theme-types.ts'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(consumerDir, 'theme-types.ts'),
    `import type {
  VfPrimitiveColorTokens as ThemePrimitiveColorTokens,
  VfSemanticColorTokens as ThemeSemanticColorTokens,
  VfThemePreset,
  VfThemeTokens as ThemeTokens,
} from '@codemonster-ru/vueforge-theme';
import type {
  VfPrimitiveColorTokens as CorePrimitiveColorTokens,
  VfSemanticColorTokens as CoreSemanticColorTokens,
  VfThemeTokens as CoreTokens,
} from '@codemonster-ru/vueforge-core';
import type {
  VfPrimitiveColorTokens as CoreThemePrimitiveColorTokens,
  VfSemanticColorTokens as CoreThemeSemanticColorTokens,
  VfThemeTokens as CoreThemeTokens,
} from '@codemonster-ru/vueforge-core/theme';

const themePrimitive: ThemePrimitiveColorTokens = { paletteNeutral50: '#f6f8fb' };
const themeSemantic: ThemeSemanticColorTokens = { colorBackgroundCanvas: 'var(--vf-color-bg)' };
const themeTokens: Partial<ThemeTokens> = {
  paletteWarning950: '#1f1300',
  colorStatusWarningSolidForeground: 'var(--vf-palette-warning-950)',
};
const corePrimitive: CorePrimitiveColorTokens = { paletteHelp600: '#6e43a2' };
const coreSemantic: CoreSemanticColorTokens = { colorStatusHelpActiveBackground: '#6e43a2' };
const coreTokens: Partial<CoreTokens> = { colorBorderInteractive: '#d9dde3' };
const coreThemePrimitive: CoreThemePrimitiveColorTokens = { palettePrimary600: '#0e639c' };
const coreThemeSemantic: CoreThemeSemanticColorTokens = {
  colorInteractivePrimaryBackground: '#0e639c',
};
const coreThemeTokens: Partial<CoreThemeTokens> = { colorTextPlaceholder: '#616773' };

type AdditiveColorTokenName =
  | keyof ThemePrimitiveColorTokens
  | Exclude<keyof ThemeSemanticColorTokens, 'colorFocusRing'>;
type LegacyOnlyThemeTokens = Omit<ThemeTokens, AdditiveColorTokenName>;
declare const legacyOnlyTokens: LegacyOnlyThemeTokens;
const legacyOnlyPreset: VfThemePreset = { tokens: legacyOnlyTokens };

const invalidSemantic: ThemeSemanticColorTokens = {
  // @ts-expect-error misspelled semantic names must not enter the public contract
  colorStatusSuccesSolidBackground: '#2e7d32',
};

void [
  themePrimitive,
  themeSemantic,
  themeTokens,
  corePrimitive,
  coreSemantic,
  coreTokens,
  coreThemePrimitive,
  coreThemeSemantic,
  coreThemeTokens,
  legacyOnlyPreset,
  invalidSemantic,
];
`,
  );

  const localTsc = join(workspaceNodeModules, 'typescript', 'bin', 'tsc');
  execFileSync(process.execPath, [localTsc, '--project', join(consumerDir, 'tsconfig.json'), '--pretty', 'false'], {
    cwd: consumerDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_offline: 'true',
    },
  });

  console.log('Theme type smoke passed for Theme, Core root, and Core /theme packed exports.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  for (const tarballPath of createdTarballs) {
    rmSync(tarballPath, { force: true });
  }
}
