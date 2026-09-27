// The M29 ownership proof: one owning profile whose cases own zero controls as
// often as one. A static group box - untitled, titled and not collapsible, or
// collapsible without a title - renders no trigger, and a collapsible one
// renders exactly one native button per instance. Measured against the real
// function the runner calls:
//
//   A. the shipped numbers pass: a static case with nothing, a collapsible
//      case with one button, a nested case with two;
//   B. a trigger grown on a static case (the "0"-title port that got the
//      title right and the flags wrong)                         -> FAIL;
//   C. no trigger on a collapsible case (the PHP-truthiness port) -> FAIL;
//   D. the trigger rendered as a div with role=button, count equal -> FAIL on
//      identity, not on the count;
//   E. a consumer link in the title slot counted as the trigger    -> FAIL;
//   F. an explicit interactive role anywhere                       -> FAIL.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/group-box/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);
const profile = profiles['group-box'];

function trigger(overrides = {}) {
  return {
    role: 'trigger',
    tag: 'button',
    type: 'button',
    path: 'fieldset.vf-group-box>legend.vf-group-box__legend>button.vf-button.vf-button--ghost.vf-group-box__trigger',
    expanded: 'true',
    disabled: false,
    focusable: true,
    controls: 'panel',
    name: 'Invoice details',
    ...overrides,
  };
}

function snapshot({ controls = [], consumer = 0, roles = 0 } = {}) {
  return {
    ownershipPosture: 'component',
    componentControls: controls,
    consumerControlCount: consumer,
    focusableTotal: controls.length + consumer,
    interactiveRoleTotal: roles,
  };
}

test('A: the shipped numbers pass - none for a static group, one per collapsible instance', () => {
  for (const id of [
    'group-box/static-untitled',
    'group-box/titled',
    'group-box/title-zero',
    'group-box/empty-title-collapsible',
  ]) {
    assert.equal(byId(id).componentInteractive, 0, id);
    assert.deepEqual(controlOwnershipViolations(byId(id), snapshot(), profile), [], id);
  }
  assert.deepEqual(
    controlOwnershipViolations(byId('group-box/title-zero-collapsible'), snapshot({ controls: [trigger()] }), profile),
    [],
  );
  assert.deepEqual(
    controlOwnershipViolations(
      byId('group-box/nested'),
      snapshot({ controls: [trigger(), trigger({ expanded: 'false' })] }),
      profile,
    ),
    [],
  );
});

test('B: a trigger grown on a static group fails', () => {
  const problems = controlOwnershipViolations(
    byId('group-box/title-zero'),
    snapshot({ controls: [trigger()] }),
    profile,
  );
  assert.ok(
    problems.some((problem) => /measured 1 component-owned control\(s\) but the catalog declares 0/.test(problem)),
    problems.join('\n'),
  );
});

test('C: no trigger on a collapsible group fails', () => {
  const problems = controlOwnershipViolations(byId('group-box/title-zero-collapsible'), snapshot(), profile);
  assert.ok(
    problems.some((problem) => /measured 0 component-owned control\(s\) but the catalog declares 1/.test(problem)),
    problems.join('\n'),
  );
});

test("D: a div with role=button in the trigger's place fails on identity, with the count equal", () => {
  const problems = controlOwnershipViolations(
    byId('group-box/collapsible-open'),
    snapshot({ controls: [trigger({ tag: 'div' })], roles: 1 }),
    profile,
  );
  assert.ok(
    problems.some((problem) => /is a <div>, not the declared <button>/.test(problem)),
    problems.join('\n'),
  );
});

test('E: a consumer link in the title slot counted as a component control fails', () => {
  const problems = controlOwnershipViolations(
    byId('group-box/consumer-control-in-title'),
    snapshot({ controls: [trigger(), trigger({ tag: 'a', type: null })] }),
    profile,
  );
  assert.ok(
    problems.some((problem) => /measured 2 component-owned/.test(problem)),
    problems.join('\n'),
  );
});

test('F: an explicit interactive role anywhere in the case fails', () => {
  const problems = controlOwnershipViolations(
    byId('group-box/collapsible-open'),
    snapshot({ controls: [trigger()], roles: 1 }),
    profile,
  );
  assert.ok(
    problems.some((problem) => /explicit interactive role/.test(problem)),
    problems.join('\n'),
  );
});

test('the profile declares the trigger by selector and tag, and no followed reference', () => {
  assert.deepEqual(profile.controlOwnership, { trigger: { selector: '.vf-group-box__trigger', tag: 'button' } });
  assert.equal(profile.followedReferences, undefined);
  assert.equal(profile.snapshot, 'group-box');
});
