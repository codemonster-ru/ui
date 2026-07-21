/* global process, console */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-core-consumer-smoke-'));
const { build } = await import('esbuild');

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
  const consumerDir = join(tempDir, 'consumer');
  const consumerNodeModules = join(consumerDir, 'node_modules', '@codemonster-ru');

  mkdirSync(consumerNodeModules, { recursive: true });
  symlinkSync(packedPackageDir, join(consumerNodeModules, 'vueforge-core'), 'dir');

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

  const fullCss = await buildEntry('full', ["import '@codemonster-ru/vueforge-core/styles.css';"]);
  if (!fullCss.includes('.vf-prose') || !fullCss.includes('.vf-button') || !fullCss.includes('.vf-stepper')) {
    throw new Error('Consumer smoke failed: styles.css is missing global, Button, or Stepper CSS.');
  }

  console.log(
    `Consumer smoke passed: isolated component subpaths and ${packageJson.name}/styles.css emitted their expected CSS.`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
