import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-playground-consumer-smoke-'));

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

  const uiTarget = packageJson.exports['./ui']?.import;
  const runtimeTarget = packageJson.exports['./runtime']?.import;
  if (typeof uiTarget !== 'string' || typeof runtimeTarget !== 'string') {
    throw new Error('Consumer smoke failed: invalid ./ui or ./runtime export target.');
  }
  const uiJs = readFileSync(join(tempDir, 'package', uiTarget.replace(/^\.\//, '')), 'utf8');
  const runtimeJs = readFileSync(join(tempDir, 'package', runtimeTarget.replace(/^\.\//, '')), 'utf8');

  if (!uiJs.includes('.css')) {
    throw new Error('Consumer smoke failed: ./ui export target does not reference CSS import.');
  }

  if (runtimeJs.includes('.css')) {
    throw new Error('Consumer smoke failed: ./runtime export target unexpectedly references CSS import.');
  }

  console.log('Consumer smoke passed: /ui references CSS, while /runtime is CSS-free.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
