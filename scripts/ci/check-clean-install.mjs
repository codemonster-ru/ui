import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';

const repositoryRoot = process.cwd();
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vueforge-clean-install-'));
const temporaryRepository = join(temporaryDirectory, 'repository');
const ignoredDirectoryNames = new Set(['.git', '.npm-cache', 'coverage', 'dist', 'node_modules']);

function shouldCopy(source) {
  const sourceRelativePath = relative(repositoryRoot, source);

  return !sourceRelativePath.split(sep).some((pathSegment) => ignoredDirectoryNames.has(pathSegment));
}

try {
  cpSync(repositoryRoot, temporaryRepository, { filter: shouldCopy, recursive: true });
  execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: temporaryRepository,
    stdio: 'inherit',
  });
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
