import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { discoverCodeMonsterUiWorkspaces, selectWorkspaceChecks } from './code-monster-ui-workspaces.mjs';

const root = resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const [base, ...extra] = args.filter((argument) => argument !== '--smoke');
if (extra.length || (base && !/^[0-9a-f]{40}$/u.test(base))) {
  throw new Error('Usage: npm run check -- [base commit SHA] [--smoke]');
}

function readWorkspace(path) {
  const manifest = JSON.parse(readFileSync(resolve(root, path, 'package.json'), 'utf8'));
  return {
    name: manifest.name,
    path,
    private: Boolean(manifest.private),
    scripts: manifest.scripts,
    dependencies: Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.devDependencies }),
  };
}

const packages = discoverCodeMonsterUiWorkspaces(resolve(root, 'packages')).map(({ directory }) =>
  readWorkspace(`packages/${directory}`),
);
const vanilla = {
  name: 'vanilla',
  path: 'examples/vanilla',
  private: true,
  scripts: {},
  dependencies: ['css', 'icons', 'runtime', 'tokens'].map((name) => `@codemonster-ru/ui-${name}`),
};
const examples = [readWorkspace('examples/ui-showcase'), vanilla];
function gitPaths(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
}

let diff;
if (base && !/^0+$/u.test(base)) {
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { cwd: root, stdio: 'ignore' });
    diff = [
      ...gitPaths('diff', '--name-only', '--no-renames', '-z', base, '--'),
      ...gitPaths('ls-files', '--others', '--exclude-standard', '-z'),
    ];
  } catch {
    console.log('The change range is unavailable. Checking the full workspace graph.');
  }
}
const { builds, tests, full, browser } = selectWorkspaceChecks(packages, examples, diff, smoke);

function npm(...arguments_) {
  execFileSync('npm', arguments_, { cwd: root, stdio: 'inherit' });
}

for (const workspace of builds) {
  if (workspace === vanilla) npm('run', 'build:vanilla:prepared');
  else npm('run', 'build', '-w', workspace.name);
}

if (full) {
  for (const script of ['lint:all', 'format:check', 'typecheck', 'check:docs:examples', 'test:release-prep']) {
    npm('run', script);
  }
} else {
  for (const script of ['lint', 'typecheck', 'format:check']) {
    const workspaces = tests.filter(({ scripts }) => scripts[script]);
    if (workspaces.length) npm('run', script, ...workspaces.flatMap(({ name }) => ['-w', name]));
  }
  const files = [...new Set(diff)].filter((path) => existsSync(resolve(root, path)));
  const styles = files.filter(
    (path) => /\.(?:css|scss|sass|vue)$/u.test(path) && !/^packages\/(?:css|utilities)\/src\//u.test(path),
  );
  const markup = files.filter((path) => path.endsWith('.html'));
  const markdown = files.filter((path) => path.endsWith('.md'));
  if (styles.length) npm('exec', '--offline', '--', 'stylelint', ...styles);
  if (markup.length) npm('exec', '--offline', '--', 'htmlhint', ...markup);
  if (markdown.length) npm('exec', '--offline', '--', 'markdownlint-cli2', ...markdown);
}

const testWorkspaces = tests.filter(({ scripts }) => scripts['test:built']);
if (testWorkspaces.length) {
  npm('run', 'test:built', ...testWorkspaces.flatMap(({ name }) => ['-w', name]));
}
if (tests.length) npm('run', 'test:ui');
npm('run', 'check:docs');

if (smoke && browser)
  execFileSync('bash', ['scripts/visual/run-browser-checks.sh', 'smoke'], {
    cwd: root,
    stdio: 'inherit',
  });
