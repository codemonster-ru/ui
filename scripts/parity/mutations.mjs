// The negative fixture for the three-way parity gate.
//
// A parity harness proves nothing on its own: it has to fail when an adapter
// regresses. The independent review of M07 showed exactly how that can stop
// being true - a wildcard approval plus a comparator that gave up on a subtree
// meant four wrong native attributes on six cases produced a clean PASS. Every
// mutation below reproduces a defect class that must never pass again.
//
// Mutations perturb the captured description of a target, not a file on disk,
// so nothing can leak into the source tree. The substrate is a real capture of
// the three real targets, so a mutation that cannot find what it is supposed to
// break fails the harness instead of quietly passing.
//
// Policy mutations are separate: they perturb the divergence registry and must
// be rejected by its validator.

/** The cases where the Vue adapter renders a bare input and Razor renders a wrapper. */
export const wrapperPresenceCases = [
  'input/disabled',
  'input/readonly',
  'input/clearable-empty',
  'input/interaction-disabled',
  'input/interaction-readonly',
  'input/interaction-wrapper-transition',
];

class MutationNotApplied extends Error {}

export function fail(message) {
  throw new MutationNotApplied(message);
}

export { MutationNotApplied };

// Detection must cover every requested case, dimension, attribute and direction.
// One incidental failure cannot stand in for the other previously blind cases.
export function assessMutation(expect, failures) {
  const missing = [];
  for (const caseId of expect.caseIds) {
    for (const direction of expect.directions ?? ['reference-vs-razor', 'current-vs-razor']) {
      for (const theme of expect.themes ?? ['light', 'dark']) {
        for (const dimension of expect.dimensions) {
          for (const detail of expect.details?.[dimension] ?? [undefined]) {
            if (
              !failures.some(
                (entry) =>
                  entry.caseId === caseId &&
                  entry.direction === direction &&
                  entry.theme === theme &&
                  entry.dimension === dimension &&
                  (detail === undefined || entry.detail === detail),
              )
            ) {
              missing.push({ caseId, direction, theme, dimension, ...(detail === undefined ? {} : { detail }) });
            }
          }
        }
      }
    }
  }
  return missing;
}

export function eachTheme(captures, target, visit) {
  const themes = Object.keys(captures[target]);
  if (themes.length === 0) fail(`no themes captured for ${target}`);
  for (const theme of themes) visit(captures[target][theme], theme);
}

function walk(nodes, visit) {
  for (const node of nodes) {
    visit(node);
    walk(node.children, visit);
  }
}

export function findNode(capture, caseId, predicate, what) {
  const entry = capture.extracted[caseId];
  if (!entry) fail(`case ${caseId} is missing from the capture`);

  let found = null;
  walk(entry.dom, (node) => {
    if (found === null && predicate(node)) found = node;
  });

  if (found === null) fail(`${what} not found in ${caseId}`);
  return found;
}

const isControl = (node) => node.tag === 'input' && node.classes.includes('vf-input');
const isWrapper = (node) => node.tag === 'div' && node.classes.includes('vf-input-wrap');
const hasClass = (name) => (node) => node.classes.includes(name);

/**
 * Every mutation names the dimension that must catch it.
 *
 * `caseIds` lists the cases the failure must be reported on. `requireAll` makes
 * the harness insist on every one of them, which is how the C1 regression test
 * proves that all six formerly blind cases are compared again.
 */
export const parityMutations = [
  // ------------------------------------------------------- native attributes
  {
    id: 'blind-six-native-attributes',
    klass: 'native attributes',
    description:
      'the exact audit false pass: wrong name, autocomplete and maxlength on the control of the six cases where ' +
      'Razor wraps and Vue does not',
    expect: {
      dimensions: ['dom.nativeAttributes', 'dom.productData'],
      details: { 'dom.nativeAttributes': ['name', 'autocomplete', 'maxlength'], 'dom.productData': ['data-vf-audit'] },
      caseIds: wrapperPresenceCases,
      requireAll: true,
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const caseId of wrapperPresenceCases) {
          const control = findNode(capture, caseId, isControl, 'control input');
          control.attributes.name = 'CORRUPTED-NAME';
          control.attributes.autocomplete = 'cc-number';
          control.attributes.maxlength = '3';
          control.attributes['data-vf-audit'] = 'wrong';
        }
      });
    },
  },
  {
    id: 'blind-six-product-data',
    klass: 'product data',
    description: 'a bogus data-vf-* attribute on the control of the six formerly blind cases',
    expect: { dimensions: ['dom.productData'], caseIds: wrapperPresenceCases, requireAll: true },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const caseId of wrapperPresenceCases) {
          findNode(capture, caseId, isControl, 'control input').attributes['data-vf-audit'] = 'wrong';
        }
      });
    },
  },
  {
    id: 'adorned-native-name',
    klass: 'native attributes',
    description: 'a wrong name on a case where both adapters render a wrapper',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['input/clearable-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'input/clearable-filled', isControl, 'control input').attributes.name = 'CORRUPTED-NAME';
      });
    },
  },

  // --------------------------------------------------------------- structure
  {
    id: 'nested-control-in-blind-wrapper',
    klass: 'structure',
    description: 'an extra container separates the wrapper from its native control',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/clearable-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'input/clearable-empty', isWrapper, 'wrapper');
        const index = wrapper.children.findIndex(isControl);
        if (index < 0) fail('direct control not found in input/clearable-empty');
        wrapper.children[index] = {
          tag: 'section',
          classes: [],
          consumerClasses: [],
          attributes: {},
          children: [wrapper.children[index]],
        };
      });
    },
  },
  {
    id: 'missing-leading-adornment',
    klass: 'structure',
    description: 'the leading adornment element is not rendered at all',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/leading-icon'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'input/leading-icon', isWrapper, 'wrapper');
        const before = wrapper.children.length;
        wrapper.children = wrapper.children.filter((child) => !hasClass('vf-input-wrap__icon--leading')(child));
        if (wrapper.children.length === before) fail('leading adornment not found in input/leading-icon');
      });
    },
  },
  {
    id: 'wrong-action-tag',
    klass: 'structure',
    description: 'the clear action is rendered as an anchor instead of a button',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/clearable-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'input/clearable-filled', hasClass('vf-input-wrap__clear'), 'clear action').tag = 'a';
      });
    },
  },
  {
    id: 'unexpected-wrapper-child',
    klass: 'structure',
    description:
      'an unexpected element inside the wrapper of a formerly blind case, proving the inert-action approval covers ' +
      'that one button and nothing else',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/clearable-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'input/clearable-empty', isWrapper, 'wrapper');
        wrapper.children.push({
          tag: 'div',
          classes: ['vf-input-wrap__smuggled'],
          consumerClasses: [],
          attributes: {},
          children: [],
        });
      });
    },
  },

  // -------------------------------------------------------- canonical classes
  {
    id: 'dropped-modifier-class',
    klass: 'canonical classes',
    description: 'the control loses its trailing-adornment modifier class',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['input/clearable-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'input/clearable-filled', isControl, 'control input');
        const before = control.classes.length;
        control.classes = control.classes.filter((name) => name !== 'vf-input--with-trailing');
        if (control.classes.length === before) fail('vf-input--with-trailing not present on input/clearable-filled');
      });
    },
  },
  {
    id: 'blind-six-bogus-class',
    klass: 'canonical classes',
    description: 'a bogus canonical class on the control of the six formerly blind cases',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: wrapperPresenceCases, requireAll: true },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const caseId of wrapperPresenceCases) {
          const control = findNode(capture, caseId, isControl, 'control input');
          control.classes = [...control.classes, 'vf-input--audit-bogus'].sort();
        }
      });
    },
  },

  // -------------------------------------------------------------------- a11y
  {
    id: 'wrong-action-aria-label',
    klass: 'accessibility',
    description: 'the clear button aria-label is corrupted in DOM',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-label'] }, caseIds: ['input/clearable-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'input/clearable-filled', hasClass('vf-input-wrap__clear'), 'clear action').attributes[
          'aria-label'
        ] = 'CORRUPTED-LABEL';
      });
    },
  },
  {
    id: 'unregistered-svg-child-style',
    klass: 'approval boundaries',
    description: 'a style change on an SVG path must not inherit the icon wrapper or svg approval',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['input/leading-icon'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'input/leading-icon', (node) => node.tag === 'path', 'glyph path').attributes.style =
          'opacity:0.25';
      });
    },
  },
  {
    id: 'wrong-action-accessible-name',
    klass: 'accessibility',
    description: 'the clear action exposes a different accessible name',
    expect: { dimensions: ['a11y.name'], caseIds: ['input/clearable-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['input/clearable-filled'];
        if (!exposed?.clear) fail('the clear action is not exposed on input/clearable-filled');
        exposed.clear.name = 'Wipe';
      });
    },
  },
  {
    id: 'broken-label-relationship',
    klass: 'relationships',
    description: 'aria-describedby points at a different element than the label relationship it should resolve to',
    expect: { dimensions: ['dom.relationships'], caseIds: ['input/aria-described'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'input/aria-described', isControl, 'control input');
        if (control.attributes['aria-describedby'] === undefined) {
          fail('input/aria-described has no aria-describedby to break');
        }
        control.attributes['aria-describedby'] = '#unresolved:elsewhere';
      });
    },
  },

  // ------------------------------------------------------------- interaction
  {
    id: 'clear-does-not-reset-value',
    klass: 'interaction',
    description: 'clicking clear leaves the value in place',
    expect: { dimensions: ['interaction.value'], caseIds: ['input/interaction-clear'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['input/interaction-clear'];
        if (!result) fail('input/interaction-clear was not run');
        if (result.value !== '') fail('input/interaction-clear did not end empty, so this mutation is meaningless');
        result.value = 'billing';
      });
    },
  },
  {
    id: 'reveal-does-not-change-type',
    klass: 'interaction',
    description: 'revealing a password leaves the rendered type as password',
    expect: { dimensions: ['interaction.state'], caseIds: ['input/interaction-reveal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['input/interaction-reveal'];
        if (!result) fail('input/interaction-reveal was not run');
        if (result.type !== 'text') fail('input/interaction-reveal did not reveal, so this mutation is meaningless');
        result.type = 'password';
      });
    },
  },
];

/**
 * Mutations of the divergence registry itself.
 *
 * Each must be rejected, either by the policy validator or by the occurrence
 * accounting. This is what stops the registry from being widened back into the
 * shape that produced the false pass.
 */
export const policyMutations = [
  {
    id: 'wildcard-case-id',
    description: 'a wildcard case list, the shape the pre-M07.1 registry used',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences[0].caseIds = ['*'];
    },
  },
  {
    id: 'no-case-restriction',
    description: 'an approval with its case restriction removed',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences[0].caseIds = [];
    },
  },
  {
    id: 'approve-dom-structure',
    description: 'an approval for dom.structure, which must never be waivable',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-structure-approval',
        dimension: 'dom.structure',
        target: 'razor',
        pathSelector: 'div.vf-input-wrap',
        caseIds: ['input/clearable-empty'],
        reason: 'A deliberately invalid entry used by the parity mutation harness.',
        classification: 'framework-specific',
        expectedOccurrences: 1,
      });
    },
  },
  {
    id: 'decorative-field',
    description: 'a field the code does not read, such as the scope field the review found',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences[0].scope = 'wrapper-presence-for-inert-actions';
    },
  },
  {
    id: 'unknown-case-id',
    description: 'an approval naming a case that is not in the catalog',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences[0].caseIds = [...policy.approvedDivergences[0].caseIds, 'input/does-not-exist'];
    },
  },
  {
    id: 'substring-path-selector',
    description:
      'the pre-M07.1 substring pattern, which used to match any path containing it; under exact matching it now ' +
      'matches nothing, and a rule that matches nothing fails',
    rejectedBy: 'occurrences',
    apply(policy) {
      // Retargeted in M10: this used to widen the razor-icon-* approvals, which
      // that milestone deleted once the icon layout moved into the shared
      // stylesheet. The property under test is unchanged.
      const entry = policy.approvedDivergences.find((approval) => approval.id === 'razor-inert-clear-action');
      if (!entry?.pathSelector) fail('razor-inert-clear-action has no path selector to widen');
      entry.pathSelector = 'vf-icon-button';
    },
  },
  {
    id: 'dead-rule',
    description: 'a well-formed approval that tolerates a difference nobody produces',
    rejectedBy: 'occurrences',
    apply(policy) {
      const template = policy.approvedDivergences.find((entry) => entry.id === 'razor-inert-clear-action');
      if (!template) fail('razor-inert-clear-action not found');
      policy.approvedDivergences.push({
        ...structuredClone(template),
        id: 'never-matches-anything',
        // A case that renders no inert clear action, so the cloned rule cannot
        // match anything however well formed it is.
        caseIds: ['input/plain-empty'],
        reason: 'A deliberately dead entry used by the parity mutation harness.',
        classification: 'framework-specific',
        expectedOccurrences: 1,
      });
    },
  },
  {
    id: 'raised-occurrence-bound',
    description: 'an approval that silently starts covering more differences than it was reviewed for',
    rejectedBy: 'occurrences',
    apply(policy) {
      policy.approvedDivergences[0].expectedOccurrences += 8;
    },
  },
];

/**
 * A browser-side mutation that rewrites real elements on a real page.
 *
 * Shared by every component's browser fixture. It throws rather than returning
 * quietly when a selector matches nothing, so a mutation that stopped applying
 * fails the run instead of being counted as a defect nobody caused.
 */
export function mutateElements(caseIds, selector, operation) {
  return `(() => {
    const evidence = [];
    let applied = 0;
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      const elements = [...(root?.querySelectorAll(${JSON.stringify(selector)}) ?? [])];
      if (elements.length === 0) throw new Error('MUTATION_NOT_APPLIED: ' + caseId + ' ${selector}');
      for (const element of elements) {
        ${operation}
        applied += 1;
      }
      evidence.push({caseId, elements: elements.length});
    }
    return {applied, evidence};
  })()`;
}
