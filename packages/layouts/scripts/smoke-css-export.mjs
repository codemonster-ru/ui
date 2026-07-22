/* global process, console */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const nodeRequire = createRequire(import.meta.url);
const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const cssExportTargets = Object.entries(packageJson?.exports ?? {})
  .filter(([exportKey, exportTarget]) => exportKey.endsWith('.css') && typeof exportTarget === 'string')
  .map(([exportKey, exportTarget]) => [exportKey, exportTarget]);
const componentJsExportTargets = Object.entries(packageJson?.exports ?? {})
  .filter(([exportKey]) => !exportKey.endsWith('.css') && exportKey !== '.')
  .map(([exportKey, exportTarget]) => {
    const importTarget =
      typeof exportTarget === 'string'
        ? exportTarget
        : typeof exportTarget?.import === 'string'
          ? exportTarget.import
          : typeof exportTarget?.import?.default === 'string'
            ? exportTarget.import.default
            : null;
    return [exportKey, importTarget];
  })
  .filter(([, importTarget]) => typeof importTarget === 'string');
const componentTypeExportTargets = Object.entries(packageJson?.exports ?? {})
  .filter(([exportKey]) => !exportKey.endsWith('.css') && exportKey !== '.')
  .map(([exportKey, exportTarget]) => {
    const typesTarget =
      typeof exportTarget === 'object' && exportTarget !== null && typeof exportTarget.types === 'string'
        ? exportTarget.types
        : typeof exportTarget?.import?.types === 'string'
          ? exportTarget.import.types
          : null;
    return [exportKey, typesTarget];
  })
  .filter(([, typesTarget]) => typeof typesTarget === 'string');
const componentExportNames = {
  './container': 'VfContainer',
  './stack': 'VfStack',
  './inline': 'VfInline',
  './section': 'VfSection',
  './grid': 'VfGrid',
  './app-shell': 'VfAppShell',
  './admin-layout': 'VfAdminLayout',
  './admin-shell': 'VfAdminShell',
  './document-layout': 'VfDocumentLayout',
  './auth-layout': 'VfAuthLayout',
  './error-layout': 'VfErrorLayout',
  './setup-layout': 'VfSetupLayout',
  './header-area': 'VfHeaderArea',
  './sidebar-area': 'VfSidebarArea',
  './content-area': 'VfContentArea',
  './aside-area': 'VfAsideArea',
  './footer-area': 'VfFooterArea',
};
const requiredComponentCssImports = {
  './auth-layout': ['../container.css', '../auth-layout.css'],
  './document-layout': ['../container.css', '../document-layout.css'],
  './setup-layout': ['../container.css', '../setup-layout.css'],
};
const themeUtilsTypesTarPath = 'package/dist/layouts/src/theme/utils.d.ts';

if (!cssExportTargets.length) {
  throw new Error('Expected at least one CSS export in package.json exports.');
}
if (componentJsExportTargets.length !== Object.keys(componentExportNames).length) {
  throw new Error('Every documented component subpath must provide an import target.');
}
if (componentTypeExportTargets.length !== Object.keys(componentExportNames).length) {
  throw new Error('Every documented component subpath must provide a dedicated types target.');
}

for (const [exportKey, exportTarget] of cssExportTargets) {
  if (typeof exportTarget !== 'string' || exportTarget.length === 0) {
    throw new Error(`Expected exports["${exportKey}"] to be a non-empty string.`);
  }
}

const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-layouts-pack-'));

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

  if (!tarEntries.includes(themeUtilsTypesTarPath)) {
    throw new Error(`Broken type export: "${themeUtilsTypesTarPath}" is missing in npm pack archive.`);
  }

  const themeUtilsTypes = readFileSync(join(tempDir, themeUtilsTypesTarPath), 'utf8');
  if (!/export declare function layoutsTokensToCssVars\([\s\S]*?\): Record<string, string>;/.test(themeUtilsTypes)) {
    throw new Error('Broken type export: layoutsTokensToCssVars must return Record<string, string>.');
  }
  if (!/export declare function applyLayoutsThemeConfig\([\s\S]*?\): HTMLElement;/.test(themeUtilsTypes)) {
    throw new Error('Broken type export: applyLayoutsThemeConfig must return HTMLElement.');
  }

  for (const [exportKey, typesTarget] of componentTypeExportTargets) {
    const normalizedTarget = typesTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;
    const exportName = componentExportNames[exportKey];

    if (!exportName) {
      throw new Error(`Missing component export name contract for "${exportKey}".`);
    }
    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken type export: exports["${exportKey}"].types points to "${typesTarget}", but "${expectedTarPath}" is missing in npm pack archive.`,
      );
    }

    const declarationWrapper = readFileSync(join(tempDir, expectedTarPath), 'utf8');
    if (!declarationWrapper.includes('export { default }')) {
      throw new Error(`Broken type export: "${typesTarget}" does not provide a default component export.`);
    }
    if (!declarationWrapper.includes(`default as ${exportName}`)) {
      throw new Error(`Broken type export: "${typesTarget}" does not provide the named ${exportName} export.`);
    }
  }

  for (const [exportKey, exportTarget] of cssExportTargets) {
    const normalizedTarget = exportTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;

    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken CSS export: exports["${exportKey}"] points to "${exportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`,
      );
    }

    const css = readFileSync(join(tempDir, expectedTarPath), 'utf8');
    if (/@media\s*\(\s*--vf-bp-/.test(css)) {
      throw new Error(
        `Broken CSS export: exports["${exportKey}"] target "${exportTarget}" contains unresolved custom media aliases.`,
      );
    }
  }

  for (const [exportKey, exportTarget] of componentJsExportTargets) {
    const normalizedTarget = exportTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;

    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken JS export: exports["${exportKey}"].import points to "${exportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`,
      );
    }

    const proxyCode = readFileSync(join(tempDir, expectedTarPath), 'utf8');
    if (!proxyCode.includes('.css')) {
      throw new Error(
        `Broken JS export: exports["${exportKey}"] target "${exportTarget}" does not reference CSS import.`,
      );
    }

    for (const cssImport of requiredComponentCssImports[exportKey] ?? []) {
      if (!proxyCode.includes(`'${cssImport}'`) && !proxyCode.includes(`"${cssImport}"`)) {
        throw new Error(
          `Broken JS export: exports["${exportKey}"] target "${exportTarget}" does not reference required CSS import "${cssImport}".`,
        );
      }
    }
  }

  const consumerDir = join(tempDir, 'consumer');
  const consumerNodeModulesDir = join(consumerDir, 'node_modules');
  const packageLinkPath = join(consumerNodeModulesDir, ...packageJson.name.split('/'));
  const vuePackageDir = dirname(nodeRequire.resolve('vue/package.json'));
  const vueLinkPath = join(tempDir, 'node_modules', 'vue');
  const typescriptCliPath = nodeRequire.resolve('typescript/bin/tsc');
  const componentImports = Object.entries(componentExportNames)
    .map(([exportKey, exportName]) => {
      const subpath = exportKey.replace(/^\.\//, '');
      return `import ${exportName} from '${packageJson.name}/${subpath}';`;
    })
    .join('\n');
  const componentReferences = Object.values(componentExportNames).join(', ');

  mkdirSync(dirname(packageLinkPath), { recursive: true });
  symlinkSync(join(tempDir, 'package'), packageLinkPath, 'dir');
  mkdirSync(dirname(vueLinkPath), { recursive: true });
  symlinkSync(vuePackageDir, vueLinkPath, 'dir');
  writeFileSync(
    join(consumerDir, 'consumer.ts'),
    `${componentImports}

type AppShellProps = InstanceType<typeof VfAppShell>['$props'];
const appShellProps = {
  layout: 'sidebar-content',
  sidebarCollapsed: true,
  defaultSidebarCollapsed: false,
} satisfies AppShellProps;
// @ts-expect-error the public layout prop must retain its declared union
const invalidAppShellProps: AppShellProps = { layout: 'invalid-layout' };

type ContainerProps = InstanceType<typeof VfContainer>['$props'];
const containerProps = { size: '2xl', fluid: true } satisfies ContainerProps;
// @ts-expect-error the public size prop must retain its declared union
const invalidContainerProps: ContainerProps = { size: '3xl' };

type AdminShellProps = InstanceType<typeof VfAdminShell>['$props'];
const adminShellProps = { fillViewport: false } satisfies AdminShellProps;

void [${componentReferences}, appShellProps, invalidAppShellProps, containerProps, invalidContainerProps, adminShellProps];
`,
  );
  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          types: [],
        },
        include: ['./consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );

  try {
    execFileSync(process.execPath, [typescriptCliPath, '--project', join(consumerDir, 'tsconfig.json')], {
      cwd: consumerDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const output = [error?.stdout, error?.stderr].filter(Boolean).join('\n');
    throw new Error(`Packed component type consumer failed to compile.\n${output}`);
  }

  const cssCount = cssExportTargets.length;
  const jsCount = componentJsExportTargets.length;
  const typesCount = componentTypeExportTargets.length;
  console.log(
    `Smoke check passed: validated ${cssCount} CSS exports, ${jsCount} component JS exports, and ${typesCount} component type exports for ${packageJson.name}.`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
