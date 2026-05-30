import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-codeblock-consumer-smoke-'));

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

  const viewTarget = packageJson.exports['./view']?.import?.default;
  const highlightTarget = packageJson.exports['./highlight']?.import?.default;
  if (typeof viewTarget !== 'string' || typeof highlightTarget !== 'string') {
    throw new Error('Consumer smoke failed: invalid ./view or ./highlight export target.');
  }
  const viewJs = readFileSync(join(tempDir, 'package', viewTarget.replace(/^\.\//, '')), 'utf8');
  const highlightJs = readFileSync(join(tempDir, 'package', highlightTarget.replace(/^\.\//, '')), 'utf8');

  if (!viewJs.includes('.css')) {
    throw new Error('Consumer smoke failed: ./view export target does not reference CSS import.');
  }

  if (highlightJs.includes('.css')) {
    throw new Error('Consumer smoke failed: ./highlight export target unexpectedly references CSS import.');
  }

  globalThis.console.log('Consumer smoke passed: /view references CSS, while /highlight is CSS-free.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
