import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  packageRootFromManifest,
  portableRelativeSpecifier,
  selectCssConsumerPackages,
  verifyInstalledCssConsumer,
} from './code-monster-ui-css-consumer.mjs';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const supportedManagers = new Set(['npm', 'pnpm', 'yarn']);
const repositoryRoot = resolve(import.meta.dirname, '../..');
const managerArgument = process.argv.find((argument) => argument.startsWith('--manager='));
const manager = managerArgument?.slice('--manager='.length) ?? 'npm';
const keepTemporaryDirectory = process.argv.includes('--keep-temp');

if (!supportedManagers.has(manager)) {
  throw new Error(`Unsupported package manager "${manager}". Use npm, pnpm, or yarn.`);
}
for (const argument of process.argv.slice(2)) {
  if (argument !== '--keep-temp' && !argument.startsWith('--manager=')) {
    throw new Error(`Unknown argument: ${argument}`);
  }
}

const workspaces = discoverCodeMonsterUiWorkspaces(join(repositoryRoot, 'packages'));
const manifests = new Map(
  workspaces.map((workspace) => [workspace.name, JSON.parse(readFileSync(workspace.manifestPath, 'utf8'))]),
);
const packages = selectCssConsumerPackages(workspaces, manifests);

if (packages.length === 0) {
  console.log('[ui-css-packed-consumer] No framework-independent CodeMonster UI CSS exports to verify yet.');
  process.exit(0);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-css-packed-consumer-'));
const tarballDirectory = join(temporaryDirectory, 'tarballs');
const consumerDirectory = join(temporaryDirectory, 'consumer');
const npmCacheDirectory = join(temporaryDirectory, 'npm-cache');
const yarnCacheDirectory = join(temporaryDirectory, 'yarn-cache');

function run(command, arguments_, options = {}) {
  return execFileSync(command, arguments_, {
    cwd: options.cwd ?? consumerDirectory,
    encoding: options.encoding,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      npm_config_cache: npmCacheDirectory,
      npm_config_color: 'false',
      npm_config_fund: 'false',
    },
    stdio: options.stdio ?? 'inherit',
  });
}

try {
  mkdirSync(tarballDirectory, { recursive: true });
  mkdirSync(consumerDirectory);
  const dependencies = {};
  const resolutions = {};

  for (const packageContract of packages) {
    const manifest = manifests.get(packageContract.name);
    const packageDirectory = packageRootFromManifest(packageContract.manifestPath);
    const output = run(
      'npm',
      ['pack', '--json', '--silent', '--ignore-scripts', '--pack-destination', tarballDirectory],
      { cwd: packageDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const [metadata] = JSON.parse(output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/)?.[0] ?? '[]');
    if (metadata?.name !== packageContract.name || metadata.version !== manifest.version) {
      throw new Error(`npm pack returned invalid metadata for ${packageContract.name}.`);
    }
    const specifier = portableRelativeSpecifier(consumerDirectory, join(tarballDirectory, metadata.filename));
    dependencies[packageContract.name] = specifier;
    resolutions[packageContract.name] = specifier;
  }

  const consumerManifest = {
    name: 'codemonster-ui-css-packed-consumer',
    private: true,
    version: '0.0.0',
    dependencies,
  };
  if (manager === 'pnpm') {
    consumerManifest.pnpm = { overrides: resolutions };
  } else if (manager === 'yarn') {
    consumerManifest.resolutions = resolutions;
  }
  writeFileSync(join(consumerDirectory, 'package.json'), `${JSON.stringify(consumerManifest, null, 2)}\n`);

  if (manager === 'npm') {
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  } else if (manager === 'pnpm') {
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile', '--strict-peer-dependencies']);
  } else {
    const yarnMajor = Number.parseInt(run('yarn', ['--version'], { encoding: 'utf8', stdio: 'pipe' }), 10);
    if (yarnMajor <= 1) {
      run('yarn', [
        'install',
        '--ignore-scripts',
        '--non-interactive',
        '--no-progress',
        '--cache-folder',
        yarnCacheDirectory,
      ]);
    } else {
      writeFileSync(join(consumerDirectory, '.yarnrc.yml'), 'enableScripts: false\n');
      run('yarn', ['install']);
    }
  }

  const cssExportCount = verifyInstalledCssConsumer({ consumerDirectory, packages, repositoryRoot });
  console.log(
    `[ui-css-packed-consumer] OK: ${packages.length} package(s), ${cssExportCount} direct CSS export(s), no framework install.`,
  );
} finally {
  if (keepTemporaryDirectory) {
    console.log(`[ui-css-packed-consumer] Kept temporary directory: ${temporaryDirectory}`);
  } else {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
