#!/usr/bin/env node
// The strongest packaging proof: build and consume the artifact from a clean
// exported tree.
//
// Everything the working tree accumulates is excluded by construction, because
// the tree this runs in was produced by `git archive` and never contained any
// of it: no packages/razor/dist, no packages/theme/.generated, no vendor, no
// node_modules symlink state, no .claude, no untracked file at all.
//
// It answers the question the other gates cannot: does the package still build
// and work for someone who only has what the repository actually contains?
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];
const passed = [];

function check(name, condition, detail = '') {
  if (condition) passed.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

const workspace = mkdtempSync(resolve(tmpdir(), 'vueforge-clean-export-'));
const tree = resolve(workspace, 'tree');

try {
  mkdirSync(tree, { recursive: true });

  process.stdout.write('Exporting the repository from git\n');
  const archive = execFileSync('git', ['-C', repositoryRoot, 'archive', '--format=tar', 'HEAD'], {
    maxBuffer: 512 * 1024 * 1024,
  });
  execFileSync('tar', ['-x', '-C', tree], { input: archive, maxBuffer: 512 * 1024 * 1024 });

  // What a clean export must not already contain. If any of these are present,
  // the proof would be measuring the working tree rather than the repository.
  for (const [label, path] of [
    ['a prebuilt Razor dist', 'packages/razor/dist'],
    ['generated theme CSS', 'packages/theme/.generated'],
    ['a Composer vendor tree', 'packages/razor/vendor'],
    ['a release staging directory', '.release'],
    ['baseline artifacts', '.baseline-artifacts'],
    ['local editor state', '.claude'],
    ['installed npm dependencies', 'node_modules'],
  ]) {
    check(`the export contains no ${label}`, !existsSync(resolve(tree, path)), path);
  }

  // The export needs its build dependencies; that is a repository build step,
  // not something the Composer consumer will ever do.
  process.stdout.write('Installing build dependencies in the exported tree\n');
  cpSync(resolve(repositoryRoot, 'node_modules'), resolve(tree, 'node_modules'), {
    recursive: true,
    verbatimSymlinks: true,
  });

  process.stdout.write('Building the Composer artifact from the exported tree\n');
  execFileSync(process.execPath, [resolve(tree, 'scripts/release/build-razor-package.mjs')], {
    cwd: tree,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  const staged = resolve(tree, '.release/razor-package');
  check('the exported tree produced a package', existsSync(resolve(staged, 'composer.json')));
  for (const asset of ['dist/vueforge-razor.css', 'dist/vueforge-razor.js', 'dist/assets-manifest.json']) {
    const path = resolve(staged, asset);
    check(`the exported tree produced ${asset}`, existsSync(path) && readFileSync(path).length > 0);
  }

  const css = existsSync(resolve(staged, 'dist/vueforge-razor.css'))
    ? readFileSync(resolve(staged, 'dist/vueforge-razor.css'), 'utf8')
    : '';
  check('the exported stylesheet carries the Input rules', css.includes('.vf-input-wrap__clear'));
  check('the exported stylesheet carries the tokens', css.includes('--vf-input-'));

  // The same artifact validation and the same consumer proof, run against the
  // export rather than against the working tree.
  process.stdout.write('Validating the package and running the isolated consumer inside the export\n');
  for (const [label, script] of [
    ['package content', 'scripts/ci/check-razor-package.mjs'],
    ['isolated Composer consumer', 'scripts/ci/check-razor-packaged-consumer.mjs'],
    ['neutral asset boundary', 'scripts/ci/check-asset-boundary.mjs'],
  ]) {
    try {
      execFileSync(process.execPath, [resolve(tree, script)], { cwd: tree, stdio: ['ignore', 'ignore', 'pipe'] });
      check(`the ${label} gate passes in a clean export`, true);
    } catch (error) {
      check(`the ${label} gate passes in a clean export`, false, (error.stderr?.toString() ?? error.message).slice(0, 300));
    }
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

process.stdout.write(`\n${passed.length} clean-export assertion(s) passed.\n`);

if (failures.length > 0) {
  process.stderr.write(`\n[razor-clean-export] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  `[razor-clean-export] OK: the package builds, validates and works from what ${relative(repositoryRoot, repositoryRoot) || 'the repository'} actually tracks.\n`,
);
