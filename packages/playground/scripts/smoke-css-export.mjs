import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const cssExportTarget = packageJson?.exports?.['./style.css'];

if (typeof cssExportTarget !== 'string' || cssExportTarget.length === 0) {
  throw new Error('Expected exports["./style.css"] to be a non-empty string.');
}

const normalizedTarget = cssExportTarget.replace(/^\.\//, '');
const expectedTarPath = `package/${normalizedTarget}`;
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-playground-pack-'));
const invalidDeepPattern = /(^|[^\w-])(?:::v-deep|:deep)\s*(?:\(|\b)/m;

try {
  const packedOutput = execFileSync('npm', ['pack', '--json', '--silent'], {
    cwd: packageDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_color: 'false',
      FORCE_COLOR: '0'
    }
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
    stdio: 'pipe'
  });
  const tarEntries = execFileSync('tar', ['-tf', tarballPath], {
    cwd: packageDir,
    encoding: 'utf8'
  })
    .split('\n')
    .filter(Boolean);

  if (!tarEntries.includes(expectedTarPath)) {
    throw new Error(
      `Broken CSS export: exports["./style.css"] points to "${cssExportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`
    );
  }

  const cssEntries = tarEntries.filter((entry) => entry.startsWith('package/dist/') && entry.endsWith('.css'));
  for (const cssEntry of cssEntries) {
    const cssContent = readFileSync(join(tempDir, cssEntry), 'utf8');
    if (invalidDeepPattern.test(cssContent)) {
      throw new Error(
        `Invalid CSS selector leaked to publish artifact: found deep selector syntax in "${cssEntry}".`
      );
    }
  }

  const consumerImport = `${packageJson.name}/style.css`;
  console.log(
    `Smoke check passed: "${consumerImport}" maps to "${cssExportTarget}", exists in npm pack tarball, and dist CSS has no raw deep selectors.`
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
