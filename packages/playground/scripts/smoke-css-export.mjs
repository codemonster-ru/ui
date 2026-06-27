import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packageDir = process.cwd();
const packageJsonPath = join(packageDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const cssExportTargets = [
  ['./style.css', packageJson?.exports?.['./style.css']],
  ['./tokens.css', packageJson?.exports?.['./tokens.css']],
  ['./playground.css', packageJson?.exports?.['./playground.css']],
  ['./critical.css', packageJson?.exports?.['./critical.css']]
];

for (const [exportKey, exportTarget] of cssExportTargets) {
  if (typeof exportTarget !== 'string' || exportTarget.length === 0) {
    throw new Error(`Expected exports["${exportKey}"] to be a non-empty string.`);
  }
}
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

  for (const [exportKey, exportTarget] of cssExportTargets) {
    const normalizedTarget = exportTarget.replace(/^\.\//, '');
    const expectedTarPath = `package/${normalizedTarget}`;
    if (!tarEntries.includes(expectedTarPath)) {
      throw new Error(
        `Broken CSS export: exports["${exportKey}"] points to "${exportTarget}", but "${expectedTarPath}" is missing in npm pack archive.`
      );
    }
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

  const consumerStyleImport = `${packageJson.name}/style.css`;
  const consumerTokensImport = `${packageJson.name}/tokens.css`;
  const consumerComponentImport = `${packageJson.name}/playground.css`;
  const consumerCriticalImport = `${packageJson.name}/critical.css`;
  console.log(
    `Smoke check passed: "${consumerStyleImport}", "${consumerTokensImport}", "${consumerComponentImport}", and "${consumerCriticalImport}" exports resolve in npm pack tarball, and dist CSS has no raw deep selectors.`
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  const tarballName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`;
  rmSync(join(packageDir, tarballName), { force: true });
}
