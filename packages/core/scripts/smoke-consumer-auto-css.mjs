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

  writeFileSync(
    join(consumerDir, 'main.js'),
    [
      "import { VfButton } from '@codemonster-ru/vueforge-core/button';",
      "import { VfStepper } from '@codemonster-ru/vueforge-core/stepper';",
      "import '@codemonster-ru/vueforge-core/styles.css';",
      'console.log(Boolean(VfButton), Boolean(VfStepper));',
      '',
    ].join('\n'),
  );

  await build({
    entryPoints: [join(consumerDir, 'main.js')],
    bundle: true,
    format: 'esm',
    outdir: join(consumerDir, 'dist'),
    write: true,
    external: ['vue'],
    logLevel: 'silent',
  });

  const distDir = join(consumerDir, 'dist');
  const cssFiles = execFileSync('find', [distDir, '-type', 'f', '-name', '*.css'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

  if (!cssFiles.length) {
    throw new Error(
      'Consumer smoke failed: no CSS assets were emitted for @codemonster-ru/vueforge-core/button import.',
    );
  }

  const cssContent = readFileSync(cssFiles[0], 'utf8');
  if (!cssContent.includes('.vf-button')) {
    throw new Error('Consumer smoke failed: emitted CSS does not contain .vf-button styles.');
  }

  if (!cssContent.includes('.vf-stepper')) {
    throw new Error('Consumer smoke failed: emitted CSS does not contain .vf-stepper styles.');
  }

  if (!cssContent.includes('.vf-prose')) {
    throw new Error('Consumer smoke failed: styles.css does not contain the global prose baseline.');
  }

  console.log(
    `Consumer smoke passed: component subpaths and ${packageJson.name}/styles.css emitted their expected CSS.`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
