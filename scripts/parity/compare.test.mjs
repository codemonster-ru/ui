// Negative fixture for the parity comparator and its divergence registry.
//
// These run without a browser, so the rules the M07.1 hardening depends on are
// checked on every `npm run check` rather than only during an eight-minute
// parity run.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  classify,
  compareDom,
  compareInteraction,
  compareStyles,
  pathTarget,
  summariseApprovals,
  validatePolicy,
} from './compare.mjs';

const caseIds = ['input/plain-empty', 'input/clearable-empty', 'input/leading-icon'];
const direction = { id: 'reference-vs-razor', from: 'reference', to: 'razor' };

function node(tag, classes = [], overrides = {}) {
  return { tag, classes: [...classes].sort(), consumerClasses: [], attributes: {}, children: [], ...overrides };
}

function policyWith(approvals, extraDimensions = {}) {
  return {
    dimensions: {
      'dom.structure': { classification: 'exact' },
      'dom.wrapperPresence': { classification: 'framework-specific' },
      'dom.inertAction': { classification: 'framework-specific' },
      'dom.nativeAttributes': { classification: 'exact' },
      'dom.canonicalClasses': { classification: 'exact' },
      'dom.productData': { classification: 'exact' },
      'dom.aria': { classification: 'exact' },
      'dom.relationships': { classification: 'semantic' },
      'dom.text': { classification: 'exact' },
      'dom.actionPresence': { classification: 'exact' },
      'interaction.state': { classification: 'exact' },
      'interaction.wrapperPresence': { classification: 'framework-specific' },
      'interaction.value': { classification: 'exact' },
      'interaction.focus': { classification: 'exact' },
      'interaction.selection': { classification: 'exact' },
      ...extraDimensions,
    },
    approvedDivergences: approvals,
  };
}

const iconStyleApproval = {
  id: 'razor-icon-wrapper-inline-layout',
  dimension: 'dom.nativeAttributes',
  target: 'razor',
  directions: ['reference-vs-razor', 'current-vs-razor'],
  detail: 'style',
  pathSelector: 'span.vf-icon-wrapper',
  caseIds: ['input/leading-icon'],
  reason: 'The Vue icon takes its layout from a scoped style block the Razor markup cannot carry.',
  classification: 'framework-specific',
  expectedOccurrences: 1,
  left: 'a',
  right: 'b',
};

// ----------------------------------------------------------- path anchoring

test('pathTarget names the element a difference belongs to, without its child index', () => {
  assert.equal(pathTarget('[0]/div.vf-input-wrap[0]/span.vf-icon-wrapper'), 'span.vf-icon-wrapper');
  assert.equal(pathTarget('[0]/div.vf-input-wrap[1]'), 'div.vf-input-wrap');
  assert.equal(pathTarget('style:wrapper'), 'style:wrapper');
});

test('a path selector matches the element it names and nothing nested inside it', () => {
  const policy = policyWith([iconStyleApproval]);
  const approvedPath = '[0]/div.vf-input-wrap[0]/span.vf-input-wrap__icon[0]/span.vf-icon-wrapper';

  const approvedFor = (path) =>
    classify(policy, 'input/leading-icon', direction, [
      { dimension: 'dom.nativeAttributes', detail: 'style', path, left: 'a', right: 'b' },
    ]).approved.length === 1;

  assert.equal(approvedFor(approvedPath), true, 'the icon wrapper itself must stay approved');

  // The descendants the pre-M07.1 substring match also covered.
  assert.equal(approvedFor(`${approvedPath}[0]/svg.vf-icon.vf-icon--classic`), false);
  assert.equal(approvedFor(`${approvedPath}[0]/svg.vf-icon[0]/path`), false);
  assert.equal(approvedFor(`${approvedPath}[0]/svg.vf-icon[1]/line`), false);

  // A different element that merely shares a class prefix: the bug M07 already
  // found once, where `vf-icon` also matched `vf-icon-button`.
  assert.equal(approvedFor('[0]/div.vf-input-wrap[1]/button.vf-icon-button.vf-input-wrap__clear'), false);

  // A sibling with a different class list.
  assert.equal(approvedFor('[0]/div.vf-input-wrap[0]/span.vf-icon-wrapper--decorative'), false);
});

test('an approval does not leak to another case or another target', () => {
  const policy = policyWith([iconStyleApproval]);
  const difference = {
    dimension: 'dom.nativeAttributes',
    detail: 'style',
    path: '[0]/span.vf-icon-wrapper',
    left: 'a',
    right: 'b',
  };

  assert.equal(classify(policy, 'input/plain-empty', direction, [difference]).failures.length, 1);
  assert.equal(
    classify(policy, 'input/leading-icon', { id: 'reference-vs-current', from: 'reference', to: 'current' }, [
      difference,
    ]).failures.length,
    1,
  );
});

// -------------------------------------------------------- registry validation

test('the validator rejects every shape the review found dangerous', () => {
  const base = () => ({
    id: 'rule',
    dimension: 'dom.wrapperPresence',
    target: 'razor',
    directions: ['reference-vs-razor', 'current-vs-razor'],
    pathSelector: 'div.vf-input-wrap',
    detail: 'wrapper rendered on one side only',
    left: 'input.vf-input',
    right: 'div.vf-input-wrap',
    caseIds: ['input/clearable-empty'],
    reason: 'A wrapper the Razor adapter renders up front for an action that is not available yet.',
    classification: 'framework-specific',
    expectedOccurrences: 4,
  });

  assert.deepEqual(validatePolicy(policyWith([base()]), caseIds), [], 'the well-formed entry must pass');

  const rejects = (mutate, needle) => {
    const entry = base();
    mutate(entry);
    const problems = validatePolicy(policyWith([entry]), caseIds);
    assert.ok(problems.length > 0, `expected a problem for ${needle}`);
    assert.ok(
      problems.some((problem) => problem.includes(needle)),
      `expected a problem mentioning ${needle}, got ${JSON.stringify(problems)}`,
    );
  };

  rejects((entry) => (entry.caseIds = ['*']), '"*"');
  rejects((entry) => (entry.caseIds = []), 'non-empty list');
  rejects((entry) => (entry.caseIds = ['input/nope']), 'not in the case catalog');
  rejects((entry) => (entry.dimension = 'dom.structure'), 'may never be approved');
  rejects((entry) => (entry.dimension = 'dom.invented'), 'unknown dimension');
  rejects((entry) => (entry.target = '*'), 'target must be razor');
  rejects((entry) => delete entry.target, 'target must be razor');
  rejects((entry) => (entry.target = 'current'), 'zero drift');
  rejects((entry) => (entry.directions = ['reference-vs-current']), 'declared target');
  rejects((entry) => delete entry.directions, 'directions must');
  rejects((entry) => delete entry.detail, 'detail must');
  rejects((entry) => delete entry.right, 'exact left and right');
  rejects((entry) => delete entry.pathSelector, 'must name the element');
  rejects((entry) => (entry.pathSelector = 'span.*'), 'wildcards are not supported');
  rejects((entry) => (entry.pathSelector = 'div.vf-input-wrap[0]'), 'drop the trailing');
  rejects((entry) => (entry.expectedOccurrences = 0), 'positive integer');
  rejects((entry) => delete entry.expectedOccurrences, 'positive integer');
  rejects((entry) => (entry.reason = 'because'), 'reason must explain');
  rejects((entry) => (entry.classification = 'whatever'), 'classification must be one of');
  rejects((entry) => (entry.scope = 'wrapper-presence-for-inert-actions'), 'unknown field "scope"');
  rejects((entry) => (entry.pathPattern = 'vf-icon'), 'unknown field "pathPattern"');
  rejects((entry) => (entry.caseId = '*'), 'unknown field "caseId"');
});

test('duplicate approval ids are rejected', () => {
  const entry = {
    id: 'rule',
    dimension: 'interaction.focus',
    target: 'razor',
    directions: ['reference-vs-razor', 'current-vs-razor'],
    path: 'focusRole',
    detail: 'focusRole',
    left: 'body',
    right: 'control',
    caseIds: ['input/plain-empty'],
    reason: 'A focus difference that belongs to one adapter and is covered by its own test.',
    classification: 'framework-specific',
    expectedOccurrences: 2,
  };
  const problems = validatePolicy(policyWith([entry, { ...entry }]), caseIds);
  assert.ok(problems.some((problem) => problem.includes('duplicate id')));
});

// ------------------------------------------------------- structural compare

test('a wrapper on one side still gets its control compared in full', () => {
  const bare = node('input', ['vf-input'], { attributes: { name: 'clearable-empty' }, liveValue: '', operable: true });
  const wrapped = node('div', ['vf-input-wrap'], {
    children: [
      node('input', ['vf-input'], { attributes: { name: 'CORRUPTED-NAME' }, liveValue: '', operable: true }),
      node('button', ['vf-icon-button', 'vf-input-wrap__clear']),
    ],
  });

  const differences = compareDom([bare], [wrapped]);
  const dimensions = differences.map((difference) => difference.dimension);

  assert.ok(dimensions.includes('dom.wrapperPresence'), 'the wrapper itself is a divergence');
  assert.ok(dimensions.includes('dom.inertAction'), 'the extra action is a divergence of its own');

  const attribute = differences.find((difference) => difference.dimension === 'dom.nativeAttributes');
  assert.ok(attribute, 'the control must still be compared through the wrapper');
  assert.equal(attribute.detail, 'name');
  assert.equal(attribute.left, 'clearable-empty');
  assert.equal(attribute.right, 'CORRUPTED-NAME');
});

test('an unexpected child of the wrapper is dom.structure, not an inert action', () => {
  const bare = node('input', ['vf-input']);
  const wrapped = node('div', ['vf-input-wrap'], {
    children: [node('input', ['vf-input']), node('div', ['vf-input-wrap__smuggled'])],
  });

  const structure = compareDom([bare], [wrapped]).filter(
    (difference) => difference.dimension === 'dom.structure' && difference.path.includes('smuggled'),
  );
  assert.equal(structure.length, 1);
});

test('a tag mismatch the comparator has no shape for stays dom.structure', () => {
  const differences = compareDom([node('input', ['vf-input'])], [node('textarea', ['vf-input'])]);
  assert.equal(differences.length, 1);
  assert.equal(differences[0].dimension, 'dom.structure');
  assert.equal(differences[0].detail, 'tag');
});

test('tag mismatches still compare native attributes and meaningful child content', () => {
  const differences = compareDom(
    [node('div', [], { attributes: { name: 'expected' }, children: [node('span', [], { text: 'expected' })] })],
    [node('section', [], { attributes: { name: 'wrong' }, children: [node('span', [], { text: 'wrong' })] })],
  );
  assert.ok(differences.some((difference) => difference.dimension === 'dom.structure'));
  assert.ok(
    differences.some((difference) => difference.dimension === 'dom.nativeAttributes' && difference.detail === 'name'),
  );
  assert.ok(differences.some((difference) => difference.dimension === 'dom.text'));
});

const actualPolicy = JSON.parse(readFileSync(new URL('../../contracts/input/parity-policy.json', import.meta.url)));
const actualCases = JSON.parse(readFileSync(new URL('../../contracts/input/cases.json', import.meta.url))).cases.map(
  (entry) => entry.id,
);
const inertClear = actualPolicy.approvedDivergences.find((entry) => entry.id === 'razor-inert-clear-action').right;
const blindCases = actualPolicy.approvedDivergences.find(
  (entry) => entry.id === 'razor-wrapper-rendered-for-inert-action',
).caseIds;
const wrapperFixture = () =>
  node('div', ['vf-input-wrap'], {
    children: [node('input', ['vf-input']), structuredClone(inertClear)],
  });
const classifyWrapper = (wrapper, caseId = 'input/clearable-empty') =>
  classify(actualPolicy, caseId, direction, compareDom([node('input', ['vf-input'])], [wrapper]));

test('the live policy is valid and rejects malformed policy entries', () => {
  assert.deepEqual(validatePolicy(actualPolicy, actualCases), []);
  for (const malformed of [null, [], {}, { dimensions: {}, approvedDivergences: [null] }]) {
    assert.ok(validatePolicy(malformed, actualCases).length > 0);
  }
});

test('the exact audit corruption fails native attributes and product data in all six cases', () => {
  assert.equal(blindCases.length, 6);
  for (const caseId of blindCases) {
    const wrapper = wrapperFixture();
    assert.deepEqual(classifyWrapper(wrapper, caseId).failures, []);
    wrapper.children[0].attributes = {
      name: 'CORRUPTED-NAME',
      autocomplete: 'cc-number',
      maxlength: '3',
      'data-vf-audit': 'wrong',
    };
    const { failures } = classifyWrapper(wrapper, caseId);
    assert.deepEqual(failures.map((difference) => difference.detail).sort(), [
      'autocomplete',
      'data-vf-audit',
      'maxlength',
      'name',
    ]);
    assert.equal(failures.filter((difference) => difference.dimension === 'dom.nativeAttributes').length, 3);
    assert.equal(failures.filter((difference) => difference.dimension === 'dom.productData').length, 1);
  }
});

test('wrapper approval does not hide attributes, classes, text, nesting or extra controls', () => {
  for (const mutate of [
    (wrapper) => {
      wrapper.attributes['data-vf-audit'] = 'wrong';
    },
    (wrapper) => {
      wrapper.attributes['aria-label'] = 'wrong';
    },
    (wrapper) => {
      wrapper.consumerClasses.push('wrong');
    },
    (wrapper) => {
      wrapper.text = 'wrong';
    },
    (wrapper) => {
      wrapper.children[0] = node('section', [], { children: [wrapper.children[0]] });
    },
    (wrapper) => {
      wrapper.children.push(node('input', ['vf-input']));
    },
    (wrapper) => {
      wrapper.children.reverse();
    },
  ]) {
    const wrapper = wrapperFixture();
    mutate(wrapper);
    assert.ok(classifyWrapper(wrapper).failures.length > 0, 'only the exact direct wrapper arrangement is allowed');
  }
});

test('inert action approval checks operability, every attribute and the complete glyph subtree', () => {
  for (const mutate of [
    (action) => {
      action.operable = true;
    },
    (action) => {
      delete action.attributes.disabled;
    },
    (action) => {
      delete action.attributes.hidden;
    },
    (action) => {
      action.attributes.style = 'visibility:hidden';
    },
    (action) => {
      action.attributes['aria-label'] = 'wrong';
    },
    (action) => {
      action.attributes['data-vf-audit'] = 'wrong';
    },
    (action) => {
      action.children[0].children[0].children[0].attributes.x1 = '999';
    },
    (action) => {
      action.children.push(node('input', [], { attributes: { name: 'hidden-submission' } }));
    },
  ]) {
    const wrapper = wrapperFixture();
    mutate(wrapper.children[1]);
    const result = classifyWrapper(wrapper);
    assert.ok(result.failures.some((failure) => failure.dimension === 'dom.inertAction'));
  }
});

test('an exact-value approval cannot waive a different value, path or case', () => {
  // The narrowness property this file has always asserted, moved onto a live
  // approval. It used to be checked through razor-icon-wrapper-inline-layout,
  // which M10 deleted: the icon layout moved into the shared stylesheet, so
  // the difference it tolerated no longer exists to be tolerated.
  const entry = actualPolicy.approvedDivergences.find((a) => a.id === 'razor-keeps-focus-through-wrapper-transition');
  const difference = {
    dimension: entry.dimension,
    detail: entry.detail,
    path: entry.path,
    left: entry.left,
    right: entry.right,
  };
  const caseId = 'input/interaction-wrapper-transition';

  assert.equal(classify(actualPolicy, caseId, direction, [difference]).approved.length, 1);
  // A different outcome on the same field is not the approved outcome.
  assert.equal(classify(actualPolicy, caseId, direction, [{ ...difference, right: 'clear' }]).failures.length, 1);
  // The same outcome on another field is not covered either.
  assert.equal(classify(actualPolicy, caseId, direction, [{ ...difference, path: 'controlClasses' }]).failures.length, 1);
  // Nor is it covered in a case the approval does not list.
  assert.equal(classify(actualPolicy, 'input/plain-empty', direction, [difference]).failures.length, 1);
});

test('the icon layout divergences M10 removed cannot quietly return', () => {
  // These two approvals tolerated 84 style differences each, on the icon
  // wrapper and the svg, because the Vue icon carried its layout in a scoped
  // style block that Razor markup could not match. M10 moved that layout to
  // packages/styles/src/components/icon.css, both adapters read it from there,
  // and the difference disappeared rather than being waived.
  for (const id of ['razor-icon-wrapper-inline-layout', 'razor-icon-svg-inline-layout']) {
    assert.equal(
      actualPolicy.approvedDivergences.find((approval) => approval.id === id),
      undefined,
      `${id} is back in the policy; the icon layout is being tolerated again rather than shared.`,
    );
  }

  // Inline layout on the icon wrapper is now an ordinary unapproved failure.
  const relapse = {
    dimension: 'dom.nativeAttributes',
    detail: 'style',
    path: '[0]/span.vf-icon-wrapper',
    left: '--vf-icon-offset-x:0;--vf-icon-offset-y:0;--vf-icon-scale:1',
    right: '--vf-icon-offset-x:0;--vf-icon-offset-y:0;--vf-icon-scale:1;display:inline-grid;place-items:center',
  };
  assert.equal(classify(actualPolicy, 'input/leading-icon', direction, [relapse]).failures.length, 1);
});

test('the live policy never approves pixels, including the wrapper transition', () => {
  const difference = {
    dimension: 'visual.postInteraction',
    detail: 'post-interaction screenshot',
    path: 'theme=light',
    left: 'expected pixels',
    right: 'arbitrary corruption',
  };
  assert.equal(
    classify(actualPolicy, 'input/interaction-wrapper-transition', direction, [difference]).failures.length,
    1,
  );
});

test('a measured role that only one side renders is structural unless it is the wrapper', () => {
  const both = { control: { width: '1px' } };
  const wrapperOnly = compareStyles(both, { ...both, wrapper: { width: '2px' } });
  assert.equal(wrapperOnly[0].dimension, 'dom.wrapperPresence');
  assert.equal(wrapperOnly[0].path, 'style:wrapper');

  const glyphGone = compareStyles({ ...both, leadingGlyph: { width: '16px' } }, both);
  assert.equal(glyphGone[0].dimension, 'dom.structure');
  assert.equal(glyphGone[0].path, 'style:leadingGlyph');
});

// -------------------------------------------------------- interaction compare

test('a wrapper present on one side after a scenario is reported, not skipped', () => {
  const base = {
    value: 'x',
    type: 'text',
    filled: 'true',
    focusRole: 'control',
    selection: null,
    clear: null,
    reveal: null,
    controlClasses: ['vf-input'],
  };

  const differences = compareInteraction(
    { ...base, wrapperClasses: null },
    { ...base, wrapperClasses: ['vf-input-wrap'] },
  );

  assert.equal(differences.length, 1);
  assert.equal(differences[0].dimension, 'interaction.wrapperPresence');
  assert.equal(differences[0].left, 'absent');
  assert.equal(differences[0].right, 'vf-input-wrap');
});

test('wrapper class lists are still compared when both sides render one', () => {
  const base = {
    value: 'x',
    type: 'text',
    filled: 'true',
    focusRole: 'control',
    selection: null,
    clear: null,
    reveal: null,
    controlClasses: ['vf-input'],
  };

  const differences = compareInteraction(
    { ...base, wrapperClasses: ['vf-input-wrap'] },
    { ...base, wrapperClasses: ['vf-input-wrap', 'vf-input-wrap--with-trailing'] },
  );

  assert.equal(differences.length, 1);
  assert.equal(differences[0].dimension, 'interaction.state');
  assert.equal(differences[0].path, 'wrapperClasses');
});

// ------------------------------------------------------ occurrence accounting

test('a rule that matches nothing and a rule that matches too much both fail', () => {
  const policy = policyWith([{ ...iconStyleApproval, expectedOccurrences: 1 }]);

  const dead = summariseApprovals(policy, []);
  assert.ok(dead.problems.some((problem) => problem.includes('matched nothing')));

  const approvedEntry = {
    caseId: 'input/leading-icon',
    direction: direction.id,
    approvalId: iconStyleApproval.id,
    path: '[0]/span.vf-icon-wrapper',
  };
  const grown = summariseApprovals(policy, [approvedEntry, { ...approvedEntry }]);
  assert.ok(grown.problems.some((problem) => problem.includes('the registry expects 1')));

  const exact = summariseApprovals(policy, [approvedEntry]);
  assert.deepEqual(exact.problems, []);
  assert.equal(exact.rows[0].occurrences, 1);
  assert.deepEqual(exact.rows[0].caseIds, ['input/leading-icon']);
});

test('every field of an icon button snapshot is compared, not just the ones VfInput had', () => {
  // The defect this guards against: VfIconButton's snapshot added activations,
  // pressed, accessibleName and glyphHidden, and the comparator went on
  // checking VfInput's hardcoded field list. The values reached the report and
  // were never compared, so a Razor button that refused to activate on Enter
  // would have passed the gate with the evidence sitting in the artifact.
  const base = {
    type: 'button',
    focusRole: 'button',
    activations: 1,
    disabled: false,
    operable: true,
    accessibleName: 'Close',
    pressed: null,
    buttonClasses: ['vf-icon-button', 'vf-icon-button--ghost'],
    glyphHidden: 'true',
  };

  for (const [field, changed] of [
    ['activations', 0],
    ['disabled', true],
    ['operable', false],
    ['accessibleName', 'Dismiss'],
    ['pressed', 'true'],
    ['glyphHidden', null],
  ]) {
    const differences = compareInteraction(base, { ...base, [field]: changed });
    assert.equal(differences.length, 1, `${field} produced no difference`);
    assert.equal(differences[0].path, field);
    assert.equal(differences[0].dimension, 'interaction.state');
  }

  const classDifferences = compareInteraction(base, { ...base, buttonClasses: ['vf-icon-button'] });
  assert.equal(classDifferences.length, 1);
  assert.equal(classDifferences[0].right, 'vf-icon-button');
});

test('a snapshot field that is neither compared nor ignored fails the run', () => {
  const base = { type: 'button', focusRole: 'button', activations: 1 };

  assert.throws(
    () => compareInteraction({ ...base, somethingNew: 1 }, { ...base, somethingNew: 1 }),
    /neither compared nor explicitly ignored/,
  );
});

test('snapshots of different shapes are an error rather than a silent partial comparison', () => {
  assert.throws(
    () => compareInteraction({ type: 'button', focusRole: 'button' }, { type: 'button' }),
    /different shapes/,
  );
});
