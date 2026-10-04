// The negative fixtures for the VfFieldset parity gate.
//
// The M34 set. The reference fieldset owns no control and no state, so its
// defects are all about what the DOM *is* and what it *says*, and the ones that
// carry this milestone keep the page looking like a fieldset while changing
// one of those:
//
//   - native identity: the fieldset as a div with role=group, the legend as a
//     div, and the whole fieldset replaced by the markup VfGroupBox renders
//     for the same label and content - the other migrated fieldset, and the
//     one a port is most likely to copy;
//   - the relationship graph: aria-describedby removed, reversed, the two
//     paragraph ids crossed, and two instances cross-wired - each a difference
//     in document-order tokens, never in generated literals;
//   - the invalid contract: the modifier dropped, an error that no longer
//     makes the fieldset invalid, and the two things the reference never
//     writes - aria-invalid on the fieldset, a role on the error;
//   - attributes: consumer attributes moved onto the control wrapper, the
//     native disabled dropped (the nested controls stop being disabled in the
//     accessibility tree), and the native form association dropped - which no
//     comparison saw before M34 added `form` to the compared vocabulary;
//   - the three directions: a defect only current Vue has, a defect only Razor
//     has, and the same defect in both - the last caught by the reference
//     direction alone.
//
// Each mutation names the dimension that must catch it and fails the harness
// rather than counting as a detection if it cannot find what it is supposed to
// break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const DESCRIBED = 'fieldset/description-and-error';
const LABEL = 'fieldset/label';
const ERROR = 'fieldset/error';
const INVALID = 'fieldset/invalid';
const ERROR_NOT_INVALID = 'fieldset/invalid-false-with-error';
const DISABLED = 'fieldset/disabled';
const NATIVE = 'fieldset/native-attrs';
const ATTRS = 'fieldset/consumer-attrs';
const TWO = 'fieldset/two-instances';
const GROUP_BOX_SHAPE = 'fieldset/group-box-shape';
const FALLBACK = 'fieldset/label-slot-empty-fallback';
const FULL = 'fieldset/full';

const root = (node) => node.tag === 'fieldset' && node.classes.includes('vf-fieldset');
const legend = (node) => node.classes.includes('vf-fieldset__legend');
const control = (node) => node.classes.includes('vf-fieldset__control');
const error = (node) => node.classes.includes('vf-fieldset__error');

/** Every node of a case matching a predicate, in document order. */
function findNodes(capture, caseId, predicate, what) {
  const entry = capture.extracted[caseId];
  if (!entry) fail(`case ${caseId} is missing from the capture`);
  const found = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (predicate(node)) found.push(node);
      walk(node.children);
    }
  };
  walk(entry.dom);
  if (found.length === 0) fail(`${what} not found in ${caseId}`);
  return found;
}

/** Rewrites one attribute of one node in a capture; `null` removes it. */
function setAttribute(node, name, value, caseId) {
  if ((node.attributes[name] ?? null) === value) fail(`${caseId} already carried ${name}=${value}`);
  const attributes = { ...node.attributes };
  if (value === null) delete attributes[name];
  else attributes[name] = value;
  node.attributes = attributes;
}

function attributeMutation({ id, description, caseId, find, name, value, dimension, target = 'razor' }) {
  return {
    id,
    klass: 'attributes',
    description,
    expect: { dimensions: [dimension], details: { [dimension]: [name] }, caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, target, (capture) => setAttribute(find(capture), name, value, caseId));
    },
  };
}

function tagMutation({ id, description, caseId, find, tag }) {
  return {
    id,
    klass: 'structure',
    description,
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = find(capture);
        if (node.tag === tag) fail(`${caseId} node was already a ${tag}`);
        node.tag = tag;
      });
    },
  };
}

function classMutation({ id, description, caseId, find, remove }) {
  return {
    id,
    klass: 'classes',
    description,
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = find(capture);
        if (!node.classes.includes(remove)) fail(`${caseId} carried no ${remove}`);
        node.classes = node.classes.filter((name) => name !== remove);
      });
    },
  };
}

function accessibilityMutation({ id, description, caseId, role, edit, dimension }) {
  return {
    id,
    klass: 'accessibility',
    description,
    expect: { dimensions: [dimension], caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility[caseId]?.[role];
        if (!exposed) fail(`${caseId} exposes no ${role}`);
        edit(exposed);
      });
    },
  };
}

const rootOf = (caseId) => (capture) => findNode(capture, caseId, root, 'fieldset');

export const fieldsetParityMutations = [
  // --------------------------------------------------------- native identity
  tagMutation({
    id: 'fieldset-root-becomes-a-div',
    description: 'the fieldset is described as a div with the same classes and references',
    caseId: DESCRIBED,
    find: rootOf(DESCRIBED),
    tag: 'div',
  }),
  tagMutation({
    id: 'fieldset-legend-becomes-a-div',
    description: 'the legend is described as a div',
    caseId: LABEL,
    find: (capture) => findNode(capture, LABEL, legend, 'legend'),
    tag: 'div',
  }),

  // --------------------------------------------------------- relationships
  attributeMutation({
    id: 'fieldset-describedby-removed',
    description: 'the fieldset no longer names its description and error',
    caseId: DESCRIBED,
    find: rootOf(DESCRIBED),
    name: 'aria-describedby',
    value: null,
    dimension: 'dom.relationships',
  }),
  attributeMutation({
    id: 'fieldset-describedby-reversed',
    description: 'the fieldset names the error before the description',
    caseId: DESCRIBED,
    find: rootOf(DESCRIBED),
    name: 'aria-describedby',
    value: '#id1 #id0',
    dimension: 'dom.relationships',
  }),
  attributeMutation({
    id: 'fieldset-instances-cross-wired',
    description: "the second of two fieldsets names the first one's paragraphs",
    caseId: TWO,
    find: (capture) => findNodes(capture, TWO, root, 'fieldsets')[1],
    name: 'aria-describedby',
    value: '#id0 #id1',
    dimension: 'dom.relationships',
  }),

  // --------------------------------------------------------- invalid
  classMutation({
    id: 'fieldset-invalid-modifier-dropped',
    description: 'invalid no longer adds the modifier',
    caseId: INVALID,
    find: rootOf(INVALID),
    remove: 'vf-fieldset--invalid',
  }),
  classMutation({
    id: 'fieldset-error-no-longer-invalid',
    description: 'an error with invalid=false no longer makes the fieldset invalid',
    caseId: ERROR_NOT_INVALID,
    find: rootOf(ERROR_NOT_INVALID),
    remove: 'vf-fieldset--invalid',
  }),
  attributeMutation({
    id: 'fieldset-aria-invalid-added',
    description: 'the invalid fieldset announces aria-invalid, which the reference never writes',
    caseId: INVALID,
    find: rootOf(INVALID),
    name: 'aria-invalid',
    value: 'true',
    dimension: 'dom.aria',
  }),
  attributeMutation({
    id: 'fieldset-error-role-alert',
    description: 'the error paragraph becomes an alert',
    caseId: ERROR,
    find: (capture) => findNode(capture, ERROR, error, 'error'),
    name: 'role',
    value: 'alert',
    dimension: 'dom.aria',
  }),

  // --------------------------------------------------------- attributes
  attributeMutation({
    id: 'fieldset-disabled-dropped',
    description: 'the native disabled attribute is consumed, as VfGroupBox consumes it',
    caseId: DISABLED,
    find: rootOf(DISABLED),
    name: 'disabled',
    value: null,
    dimension: 'dom.nativeAttributes',
  }),
  attributeMutation({
    id: 'fieldset-form-dropped',
    description: 'the native form association is dropped',
    caseId: NATIVE,
    find: rootOf(NATIVE),
    name: 'form',
    value: null,
    dimension: 'dom.nativeAttributes',
  }),
  {
    id: 'fieldset-attrs-moved-to-control',
    klass: 'attributes',
    description: 'the consumer style and data attribute land on the control wrapper instead of the fieldset',
    expect: {
      dimensions: ['dom.nativeAttributes', 'dom.productData'],
      details: { 'dom.nativeAttributes': ['style'], 'dom.productData': ['data-testid'] },
      caseIds: [ATTRS],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const fieldset = rootOf(ATTRS)(capture);
        const wrapper = findNode(capture, ATTRS, control, 'control wrapper');
        const { style, 'data-testid': testId, ...rest } = fieldset.attributes;
        if (style === undefined || testId === undefined) fail(`${ATTRS} carried no consumer style or data attribute`);
        fieldset.attributes = rest;
        wrapper.attributes = { ...wrapper.attributes, style, 'data-testid': testId };
      });
    },
  },

  // --------------------------------------------------------- accessibility
  accessibilityMutation({
    id: 'fieldset-group-loses-its-legend-name',
    description: 'the group is no longer named by its legend',
    caseId: LABEL,
    role: 'root',
    dimension: 'a11y.name',
    edit: (node) => {
      node.name = '';
    },
  }),
  accessibilityMutation({
    id: 'fieldset-group-loses-its-role',
    description: 'the fieldset is exposed as generic rather than a group',
    caseId: LABEL,
    role: 'root',
    dimension: 'a11y.role',
    edit: (node) => {
      node.role = 'generic';
    },
  }),
  accessibilityMutation({
    id: 'fieldset-nested-control-not-disabled',
    description: 'a control inside the disabled fieldset is no longer exposed as disabled',
    caseId: DISABLED,
    role: 'nestedControl',
    dimension: 'a11y.states',
    edit: (node) => {
      node.states = { ...node.states, disabled: 'false' };
    },
  }),

  // --------------------------------------------------------- static ownership
  {
    id: 'fieldset-grows-a-control-of-its-own',
    klass: 'static',
    description: 'the fieldset grows a focusable element beside the two consumer controls',
    expect: { dimensions: ['static.noInteraction'], caseIds: [FULL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[FULL];
        if (snapshot?.focusableCount !== 2) fail(`${FULL} did not record its two consumer controls`);
        snapshot.focusableCount = 3;
      });
    },
  },

  // --------------------------------------------------------- directions
  {
    id: 'fieldset-current-only-error-role-alert',
    klass: 'directional',
    description:
      'only current Vue gives the error a role; both directions from current see it, reference-vs-razor does not',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['role'] },
      caseIds: [ERROR],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) =>
        setAttribute(findNode(capture, ERROR, error, 'error'), 'role', 'alert', ERROR),
      );
    },
  },
  {
    id: 'fieldset-current-and-razor-identically-aria-invalid',
    klass: 'directional',
    description:
      'current Vue and Razor both announce aria-invalid on the invalid fieldset; they agree with each other and only the reference direction can see it',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-invalid'] },
      caseIds: [INVALID],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) =>
          setAttribute(rootOf(INVALID)(capture), 'aria-invalid', 'true', INVALID),
        );
      }
    },
  },
  {
    id: 'fieldset-current-and-razor-identically-a-div',
    klass: 'directional',
    description: 'current Vue and Razor both render the fieldset as a div; only the reference direction can see it',
    expect: {
      dimensions: ['dom.structure'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [DESCRIBED],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          rootOf(DESCRIBED)(capture).tag = 'div';
        });
      }
    },
  },
];

// ----------------------------------------------------------- browser mutations

/** A page operation replacing the matched element with another tag, keeping attributes, children and adding extra attributes. */
function replaceWith(tag, extra = {}) {
  return `
      const replacement = document.createElement(${JSON.stringify(tag)});
      for (const attribute of element.attributes) replacement.setAttribute(attribute.name, attribute.value);
      for (const [name, value] of Object.entries(${JSON.stringify(extra)})) replacement.setAttribute(name, value);
      replacement.append(...element.childNodes);
      element.replaceWith(replacement);
    `;
}

/** Real DOM mutations on the pages the three targets actually served. */
export const fieldsetBrowserMutations = [
  // --------------------------------------------------- native identity
  {
    id: 'browser-fieldset-becomes-a-div-with-role-group',
    target: 'razor',
    caseIds: [DESCRIBED],
    description:
      'the real Razor fieldset is replaced by a div with role=group, the same classes, references and children - a group the legend no longer names',
    expect: {
      dimensions: ['dom.structure', 'dom.aria', 'a11y.name'],
      details: { 'dom.structure': ['tag'], 'dom.aria': ['role'] },
      caseIds: [DESCRIBED],
    },
    beforeExtract: mutateElements([DESCRIBED], 'fieldset.vf-fieldset', replaceWith('div', { role: 'group' })),
  },
  {
    id: 'browser-fieldset-renders-the-group-box',
    target: 'razor',
    caseIds: [GROUP_BOX_SHAPE],
    description:
      'the real Razor fieldset renders exactly the markup VfGroupBox renders for the same label and content - the confusion between the two fieldsets',
    expect: {
      dimensions: ['dom.canonicalClasses', 'dom.structure', 'visual'],
      caseIds: [GROUP_BOX_SHAPE],
    },
    beforeExtract: mutateElements(
      [GROUP_BOX_SHAPE],
      'fieldset.vf-fieldset',
      `
      element.outerHTML = '<fieldset class="vf-group-box vf-group-box--titled"><legend class="vf-group-box__legend"><span class="vf-group-box__title">Details</span></legend><div id="vf-group-box-content-r-99" class="vf-group-box__content">Invoice #1024</div></fieldset>';
    `,
    ),
  },
  {
    id: 'browser-fieldset-description-before-control',
    target: 'razor',
    caseIds: [DESCRIBED],
    description: 'the real description paragraph moves between the legend and the control wrapper',
    expect: { dimensions: ['dom.structure'], caseIds: [DESCRIBED] },
    beforeExtract: mutateElements(
      [DESCRIBED],
      'fieldset.vf-fieldset > .vf-fieldset__description',
      `element.parentElement.querySelector(':scope > .vf-fieldset__control').before(element);`,
    ),
  },

  // --------------------------------------------------- relationships
  {
    id: 'browser-fieldset-describedby-removed',
    target: 'razor',
    caseIds: [DESCRIBED],
    description: 'the real Razor fieldset loses its aria-describedby',
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-describedby'] },
      caseIds: [DESCRIBED],
    },
    beforeExtract: mutateElements([DESCRIBED], 'fieldset.vf-fieldset', `element.removeAttribute('aria-describedby');`),
  },
  {
    id: 'browser-fieldset-ids-crossed',
    target: 'razor',
    caseIds: [DESCRIBED],
    description:
      "the real description and error paragraphs carry each other's ids, so the fieldset names them in the wrong order",
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-describedby'] },
      caseIds: [DESCRIBED],
    },
    beforeExtract: mutateElements(
      [DESCRIBED],
      'fieldset.vf-fieldset',
      `
      const description = element.querySelector('.vf-fieldset__description');
      const error = element.querySelector('.vf-fieldset__error');
      const descriptionId = description.id;
      description.id = error.id;
      error.id = descriptionId;
    `,
    ),
  },
  {
    id: 'browser-fieldset-instances-cross-wired',
    target: 'razor',
    caseIds: [TWO],
    description: "the second real fieldset names the first one's paragraphs by their literal ids",
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-describedby'] },
      caseIds: [TWO],
    },
    beforeExtract: mutateElements(
      [TWO],
      'fieldset.vf-fieldset:last-of-type',
      `
      const first = element.parentElement.querySelector('fieldset.vf-fieldset');
      if (first === element) throw new Error('MUTATION_NOT_APPLIED: one fieldset');
      element.setAttribute('aria-describedby', first.getAttribute('aria-describedby'));
    `,
    ),
  },

  // --------------------------------------------------- invalid
  {
    id: 'browser-fieldset-invalid-modifier-dropped',
    target: 'razor',
    caseIds: [INVALID],
    description: 'the real invalid fieldset loses its modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [INVALID] },
    beforeExtract: mutateElements(
      [INVALID],
      'fieldset.vf-fieldset',
      `element.classList.remove('vf-fieldset--invalid');`,
    ),
  },
  {
    id: 'browser-fieldset-error-no-longer-invalid',
    target: 'razor',
    caseIds: [ERROR_NOT_INVALID],
    description: 'the real fieldset with an error and invalid=false is not invalid',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [ERROR_NOT_INVALID] },
    beforeExtract: mutateElements(
      [ERROR_NOT_INVALID],
      'fieldset.vf-fieldset',
      `element.classList.remove('vf-fieldset--invalid');`,
    ),
  },
  {
    id: 'browser-fieldset-aria-invalid-added',
    target: 'razor',
    caseIds: [INVALID],
    description: 'the real invalid fieldset announces aria-invalid; Chrome exposes the invalid state',
    expect: {
      dimensions: ['dom.aria', 'a11y.states'],
      details: { 'dom.aria': ['aria-invalid'] },
      caseIds: [INVALID],
    },
    beforeExtract: mutateElements([INVALID], 'fieldset.vf-fieldset', `element.setAttribute('aria-invalid', 'true');`),
  },
  {
    id: 'browser-fieldset-error-role-alert',
    target: 'razor',
    caseIds: [ERROR],
    description: 'the real error paragraph becomes an alert',
    expect: {
      dimensions: ['dom.aria', 'a11y.role'],
      details: { 'dom.aria': ['role'] },
      caseIds: [ERROR],
    },
    beforeExtract: mutateElements([ERROR], 'p.vf-fieldset__error', `element.setAttribute('role', 'alert');`),
  },

  // --------------------------------------------------- attributes
  {
    id: 'browser-fieldset-attrs-moved-to-control',
    target: 'razor',
    caseIds: [ATTRS],
    description:
      'the consumer class, style, id and data attribute move from the real fieldset onto its control wrapper',
    expect: {
      dimensions: ['dom.canonicalClasses', 'dom.nativeAttributes', 'dom.productData'],
      details: { 'dom.nativeAttributes': ['style'], 'dom.productData': ['data-testid'] },
      caseIds: [ATTRS],
    },
    beforeExtract: mutateElements(
      [ATTRS],
      'fieldset.vf-fieldset',
      `
      const wrapper = element.querySelector(':scope > .vf-fieldset__control');
      for (const name of ['id', 'style', 'data-testid']) {
        if (!element.hasAttribute(name)) throw new Error('MUTATION_NOT_APPLIED: no ' + name);
        wrapper.setAttribute(name, element.getAttribute(name));
        element.removeAttribute(name);
      }
      element.classList.remove('consumer-fieldset');
      wrapper.classList.add('consumer-fieldset');
    `,
    ),
  },
  {
    id: 'browser-fieldset-disabled-dropped',
    target: 'razor',
    caseIds: [DISABLED],
    description: 'the real fieldset loses its native disabled, so the nested controls are operable again',
    expect: {
      dimensions: ['dom.nativeAttributes', 'a11y.states'],
      details: { 'dom.nativeAttributes': ['disabled'] },
      caseIds: [DISABLED],
    },
    beforeExtract: mutateElements([DISABLED], 'fieldset.vf-fieldset', `element.removeAttribute('disabled');`),
  },
  // The false PASS M34 closed. Before `form` was in the compared vocabulary
  // this changed no DOM record, no style, no pixel and no accessibility node.
  {
    id: 'browser-fieldset-form-dropped',
    target: 'razor',
    caseIds: [NATIVE],
    description: 'the real fieldset loses its native form association',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['form'] },
      caseIds: [NATIVE],
    },
    beforeExtract: mutateElements([NATIVE], 'fieldset.vf-fieldset', `element.removeAttribute('form');`),
  },
  {
    id: 'browser-fieldset-label-fallback-lost',
    target: 'razor',
    caseIds: [FALLBACK],
    description:
      'an empty label slot no longer falls back to the prop text, so the legend and the group name are empty',
    expect: { dimensions: ['dom.text', 'a11y.name'], caseIds: [FALLBACK] },
    beforeExtract: mutateElements([FALLBACK], 'legend.vf-fieldset__legend', `element.textContent = '';`),
  },

  // --------------------------------------------------- current-only
  {
    id: 'browser-fieldset-current-only-error-role-alert',
    target: 'current',
    caseIds: [ERROR],
    verifyIsolation: true,
    description:
      'only the real current Vue error paragraph becomes an alert; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['role'] },
      caseIds: [ERROR],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements([ERROR], 'p.vf-fieldset__error', `element.setAttribute('role', 'alert');`),
  },
];

// ---------------------------------------------------------- policy mutations

const push = (policy, entry) => policy.approvedDivergences.push(entry);
const smuggled = (id, dimension, caseIds, description) => ({
  id,
  description,
  rejectedBy: 'validation',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      detail: 'smuggled',
      pathSelector: 'fieldset.vf-fieldset',
      left: 'a',
      right: 'b',
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

export const fieldsetPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [DESCRIBED],
    'an approval for dom.structure - the dimension that tells a fieldset from a div with role=group',
  ),
  smuggled('smuggled-visual-approval', 'visual', [GROUP_BOX_SHAPE], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-static-approval',
    'static.noInteraction',
    [FULL],
    'an approval for the evidence that the fieldset owns no control',
  ),
  smuggled('smuggled-wildcard-case', 'dom.aria', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-scoped-slot-case',
    'dom.relationships',
    ['fieldset/scoped-described-by'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no scoped slot" waiver would take',
  ),
  {
    id: 'smuggled-current-target',
    description: 'an approval targeting current Vue, which would make reference-vs-current drift waivable',
    rejectedBy: 'validation',
    apply(policy) {
      push(policy, {
        id: 'smuggled-current-target',
        dimension: 'dom.aria',
        target: 'current',
        caseIds: [INVALID],
        detail: 'aria-invalid',
        pathSelector: 'fieldset.vf-fieldset',
        left: null,
        right: 'true',
        classification: 'framework-specific',
        expectedOccurrences: 2,
        directions: ['reference-vs-current'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'idle-aria-invalid-approval',
    description:
      'a well-formed aria-invalid approval that tolerates a difference no target produces: the accounting rejects it as unused',
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id: 'idle-aria-invalid-approval',
        dimension: 'dom.aria',
        target: 'razor',
        caseIds: [INVALID],
        detail: 'aria-invalid',
        pathSelector: 'fieldset.vf-fieldset.vf-fieldset--invalid',
        left: null,
        right: 'true',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  },
];
