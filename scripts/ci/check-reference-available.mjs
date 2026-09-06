#!/usr/bin/env node
// Preflight: the reference commit has to exist in this clone.
//
// Every gate that compares against history materialises the reference with
// `git archive`, and a shallow clone - the default for actions/checkout - does
// not contain it. Without this check the failure surfaces eight minutes into a
// parity run as "fatal: not a tree object", which reads like a broken harness
// rather than a broken checkout.
import { execFileSync } from 'node:child_process';
import { referenceCommit, repositoryRoot } from '../baseline/reference.mjs';

function git(args) {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let shallow = false;
try {
  shallow = git(['rev-parse', '--is-shallow-repository']).trim() === 'true';
} catch {
  // Not a git repository at all; the checks below produce the real message.
}

try {
  git(['cat-file', '-e', `${referenceCommit}^{commit}`]);
  // `git archive` is what the harnesses actually call, so prove that too.
  execFileSync('git', ['-C', repositoryRoot, 'archive', '--format=tar', referenceCommit, 'package.json'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  });
} catch (error) {
  process.stderr.write(
    `[reference] FAILED: the reference commit ${referenceCommit} is not available in this clone.\n` +
      (shallow
        ? '  This clone is shallow. CI checkouts need the full history:\n' +
          '      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n'
        : '  Fetch the commit, or check out a repository that contains it.\n') +
      `  Underlying error: ${error.message.split('\n')[0]}\n`,
  );
  process.exit(1);
}

process.stdout.write(`[reference] OK: ${referenceCommit} is present and archivable (shallow clone: ${shallow}).\n`);
