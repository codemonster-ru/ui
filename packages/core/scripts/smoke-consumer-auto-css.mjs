/* global process, console */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const themePackageDir = join(packageDir, '../theme');
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-core-consumer-smoke-'));
const { build } = await import('esbuild');
const colorArchitectureSnippets = [
  '--vf-palette-neutral-50:',
  '--vf-palette-help-600:',
  '--vf-color-background-canvas:',
  '--vf-color-interactive-primary-background:',
  '--vf-color-status-help-active-background:',
];

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

  const packedPackageDir = join(tempDir, 'package');
  const themePackOutput = execFileSync('npm', ['pack', '--json', '--silent'], {
    cwd: themePackageDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_color: 'false',
      FORCE_COLOR: '0',
    },
  });
  const themeJsonTail = themePackOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!themeJsonTail) {
    throw new Error('Unable to parse theme npm pack JSON output.');
  }
  const [themePackMeta] = JSON.parse(themeJsonTail[0]);
  if (!themePackMeta?.filename) {
    throw new Error('Unable to resolve theme npm pack filename.');
  }

  const packedThemeRoot = join(tempDir, 'theme');
  mkdirSync(packedThemeRoot, { recursive: true });
  execFileSync('tar', ['-xzf', join(themePackageDir, themePackMeta.filename), '-C', packedThemeRoot], {
    cwd: themePackageDir,
    stdio: 'pipe',
  });

  const consumerDir = join(tempDir, 'consumer');
  const consumerNodeModules = join(consumerDir, 'node_modules', '@codemonster-ru');

  mkdirSync(consumerNodeModules, { recursive: true });
  symlinkSync(packedPackageDir, join(consumerNodeModules, 'vueforge-core'), 'dir');
  symlinkSync(join(packedThemeRoot, 'package'), join(consumerNodeModules, 'vueforge-theme'), 'dir');

  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'vueforge-core-consumer-smoke',
        private: true,
        type: 'module',
      },
      null,
      2,
    ) + '\n',
  );

  const buildEntry = async (entryName, source) => {
    const entryPath = join(consumerDir, `${entryName}.js`);
    const outdir = join(consumerDir, `${entryName}-dist`);
    writeFileSync(entryPath, `${source.join('\n')}\n`);

    await build({
      entryPoints: [entryPath],
      bundle: true,
      format: 'esm',
      outdir,
      write: true,
      external: ['vue'],
      logLevel: 'silent',
    });

    const cssFiles = execFileSync('find', [outdir, '-type', 'f', '-name', '*.css'], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);

    if (cssFiles.length !== 1) {
      throw new Error(`Consumer smoke failed: expected one CSS asset for ${entryName}, received ${cssFiles.length}.`);
    }

    return readFileSync(cssFiles[0], 'utf8');
  };

  const componentCss = await buildEntry('components', [
    "import { VfButton } from '@codemonster-ru/vueforge-core/button';",
    "import { VfStepper } from '@codemonster-ru/vueforge-core/stepper';",
    'console.log(Boolean(VfButton), Boolean(VfStepper));',
  ]);

  if (!componentCss.includes('.vf-button') || !componentCss.includes('.vf-stepper')) {
    throw new Error('Consumer smoke failed: component subpaths did not emit Button and Stepper CSS.');
  }
  if (componentCss.includes('.vf-prose') || componentCss.includes('.vf-nav-menu')) {
    throw new Error('Consumer smoke failed: component-only CSS contains full/global or unrelated navigation rules.');
  }
  for (const snippet of colorArchitectureSnippets) {
    if (componentCss.includes(snippet)) {
      throw new Error(`Consumer smoke failed: isolated component CSS redeclares shared token ${snippet}`);
    }
  }

  const fallbackComponentCss = await buildEntry('fallback-components', [
    "import '@codemonster-ru/vueforge-core/foundation.css';",
    "import { VfButton } from '@codemonster-ru/vueforge-core/button';",
    "import { VfStepper } from '@codemonster-ru/vueforge-core/stepper';",
    'console.log(Boolean(VfButton), Boolean(VfStepper));',
  ]);
  if (!fallbackComponentCss.includes('.vf-button') || !fallbackComponentCss.includes('.vf-stepper')) {
    throw new Error('Consumer smoke failed: fallback component bundle is missing Button or Stepper CSS.');
  }
  if (fallbackComponentCss.includes('.vf-prose') || fallbackComponentCss.includes('.vf-nav-menu')) {
    throw new Error('Consumer smoke failed: fallback component bundle contains unrelated full component rules.');
  }
  for (const snippet of colorArchitectureSnippets) {
    if (!fallbackComponentCss.includes(snippet)) {
      throw new Error(`Consumer smoke failed: foundation plus component entries is missing ${snippet}`);
    }
  }

  const fullCss = await buildEntry('full', ["import '@codemonster-ru/vueforge-core/styles.css';"]);
  if (!fullCss.includes('.vf-prose') || !fullCss.includes('.vf-button') || !fullCss.includes('.vf-stepper')) {
    throw new Error('Consumer smoke failed: styles.css is missing global, Button, or Stepper CSS.');
  }
  for (const snippet of colorArchitectureSnippets) {
    if (!fullCss.includes(snippet)) {
      throw new Error(`Consumer smoke failed: styles.css is missing ${snippet}`);
    }
  }

  writeFileSync(
    join(consumerDir, 'theme-contract.ts'),
    `
import {
  defaultThemePreset,
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
  type VfPrimitiveColorTokenName,
  type VfPrimitiveColorTokens,
  type VfSemanticColorTokenName,
  type VfSemanticColorTokens,
  type VfThemeTokens,
} from '@codemonster-ru/vueforge-core';
import {
  vfPrimitiveColorTokenNames as primitiveNamesFromThemeEntry,
  type VfSemanticColorTokens as SemanticTokensFromThemeEntry,
} from '@codemonster-ru/vueforge-core/theme';

type PrimitiveTokensStayOptional = {} extends Pick<VfThemeTokens, 'paletteNeutral50'> ? true : false;
type SemanticTokensStayOptional = {} extends Pick<VfThemeTokens, 'colorBackgroundCanvas'> ? true : false;

const primitiveTokens: VfPrimitiveColorTokens = { paletteNeutral50: '#f6f8fb' };
const semanticTokens: VfSemanticColorTokens = { colorBackgroundCanvas: 'var(--vf-color-bg)' };
const semanticTokensFromThemeEntry: SemanticTokensFromThemeEntry = semanticTokens;
const primitiveName: VfPrimitiveColorTokenName = 'paletteNeutral50';
const semanticName: VfSemanticColorTokenName = 'colorBackgroundCanvas';
const primitiveTokensAreOptional: PrimitiveTokensStayOptional = true;
const semanticTokensAreOptional: SemanticTokensStayOptional = true;
const overrides: Partial<VfThemeTokens> = { ...primitiveTokens, ...semanticTokens };
const presetName = defaultThemePreset.name;

const invalidOverrides: Partial<VfThemeTokens> = {
  // @ts-expect-error unknown token names must remain rejected
  paletteNeutral51: '#fff',
};

console.log(
  primitiveNamesFromThemeEntry.length,
  vfPrimitiveColorTokenNames.length,
  vfSemanticColorTokenNames.length,
  primitiveName,
  semanticName,
  primitiveTokensAreOptional,
  semanticTokensAreOptional,
  semanticTokensFromThemeEntry,
  overrides,
  invalidOverrides,
  presetName,
);
`.trimStart(),
  );
  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          preserveSymlinks: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2020',
        },
        include: ['theme-contract.ts'],
      },
      null,
      2,
    )}\n`,
  );
  execFileSync(process.execPath, [join(packageDir, '../../node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'], {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  console.log(
    `Consumer smoke passed: isolated, fallback, full CSS, and packed theme type contracts for ${packageJson.name}.`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
  const themePackageJson = JSON.parse(readFileSync(join(themePackageDir, 'package.json'), 'utf8'));
  const themeTarballName = `${themePackageJson.name.replace('@', '').replace('/', '-')}-${themePackageJson.version}.tgz`;
  rmSync(join(themePackageDir, themeTarballName), { force: true });
}
