// What `parity:check` runs (M35 P0-1).
//
// Until M35 every profile was two steps, `parity:<c>` and `parity:<c>:mutations`,
// and the second rebuilt the three targets and recaptured them clean, in the
// same browser state, to compare nothing new (appendix АЛ.3). Now a profile is
// one step: the mutation gate with `--with-gate` runs the three-way gate on the
// clean captures it takes, first, and both reports are written as before.
//
// The rewrite is the kind of change that fails silently. A step without
// `--with-gate` passes while its three-way gate never runs; a dropped step
// passes while a profile is never checked; a leftover `parity:<c>` step passes
// while a profile is captured twice again. So the composition is pinned here
// against the scripts and the profile registry, and the checker is run against
// each of those mistakes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { repositoryRoot } from '../baseline/reference.mjs';
import { profiles } from './profiles.mjs';

const scripts = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')).scripts;
const componentOf = (command) => /--component=(\S+)/.exec(command)?.[1] ?? 'input';

function compositionProblems(scripts) {
  const problems = [];
  const gates = Object.keys(scripts).filter((name) => /^parity:[^:]+$/.test(name) && name !== 'parity:check');
  const steps = scripts['parity:check'].split(' && ');
  const seen = new Set();

  for (const step of steps) {
    const match = /^npm run (parity:[^:\s]+):mutations -- --with-gate$/.exec(step);
    if (!match) {
      problems.push(`not a one-capture profile step: ${step}`);
      continue;
    }
    const gate = match[1];
    if (seen.has(gate)) problems.push(`${gate} runs twice`);
    seen.add(gate);
    if (!scripts[gate]?.includes('scripts/parity/check-input-parity.mjs'))
      problems.push(`${gate} is not a three-way gate`);
    if (!scripts[`${gate}:mutations`]?.includes('scripts/parity/check-input-parity-mutations.mjs')) {
      problems.push(`${gate}:mutations is not the mutation gate`);
    } else if (componentOf(scripts[gate]) !== componentOf(scripts[`${gate}:mutations`])) {
      problems.push(`${gate} and ${gate}:mutations check different components`);
    }
  }
  for (const gate of gates) if (!seen.has(gate)) problems.push(`${gate} is not in parity:check`);
  const checked = new Set([...seen].map((gate) => componentOf(scripts[gate] ?? '')));
  for (const id of Object.keys(profiles)) if (!checked.has(id)) problems.push(`profile ${id} is not in parity:check`);

  return problems;
}

test('parity:check runs every profile once: its mutation gate with the three-way gate on the same capture', () => {
  assert.deepEqual(compositionProblems(scripts), []);
  assert.equal(scripts['parity:check'].split(' && ').length, Object.keys(profiles).length);
});

test('the separate scripts stay: every profile keeps its own gate and mutation gate', () => {
  for (const id of Object.keys(profiles)) {
    const gate = Object.keys(scripts).find(
      (name) => /^parity:[^:]+$/.test(name) && name !== 'parity:check' && componentOf(scripts[name]) === id,
    );
    assert.ok(gate, `no parity script for ${id}`);
    assert.ok(scripts[`${gate}:mutations`], `no mutation script for ${id}`);
  }
});

test('each silent way to get the composition wrong is refused', () => {
  const withCheck = (change) => ({
    ...scripts,
    'parity:check': change(scripts['parity:check'].split(' && ')).join(' && '),
  });
  const expectProblem = (variant, pattern) =>
    assert.ok(
      compositionProblems(variant).some((problem) => pattern.test(problem)),
      `expected ${pattern}, got ${JSON.stringify(compositionProblems(variant))}`,
    );

  // A step that never runs its three-way gate.
  expectProblem(
    withCheck((steps) => steps.map((step, index) => (index === 3 ? step.replace(' -- --with-gate', '') : step))),
    /not a one-capture profile step/,
  );
  // A profile dropped.
  expectProblem(
    withCheck((steps) => steps.filter((step) => !step.includes('parity:tooltip:'))),
    /parity:tooltip is not in parity:check|profile tooltip is not in parity:check/,
  );
  // The old two-step form back for one profile: captured twice again.
  expectProblem(
    withCheck((steps) => [
      ...steps.filter((step) => !step.includes('parity:select:')),
      'npm run parity:select',
      'npm run parity:select:mutations',
    ]),
    /not a one-capture profile step: npm run parity:select$/,
  );
  // One profile run twice.
  expectProblem(
    withCheck((steps) => [...steps, steps[0]]),
    /runs twice/,
  );
  // A mutation script that checks another component than its gate.
  expectProblem(
    {
      ...scripts,
      'parity:table:mutations': scripts['parity:table:mutations'].replace('--component=table', '--component=fieldset'),
    },
    /parity:table and parity:table:mutations check different components/,
  );
});
