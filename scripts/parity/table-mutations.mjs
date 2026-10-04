// The negative fixtures for the VfTable parity gate.
//
// The M34 set. The reference table owns no control, no state and no id, so a
// wrong port is wrong about *where* things are. The mutations that carry this
// milestone keep the page looking like a table:
//
//   - the wrappers: div.vf-table-wrap removed, rendered as a section, and the
//     scroll container dropped;
//   - attribute ownership: the consumer class, style, id and data attribute
//     moved from the wrapper onto the table, and a consumer role, name and
//     tabindex moved the same way - the obvious "fix" that makes the table
//     itself the named region;
//   - the caption: the prop winning over the slot, and the caption moved out
//     of the table where it no longer names it;
//   - row-group presence: an empty tbody added to a table with no default slot
//     - exactly what a Razor template invocation produces (plan section У.8)
//     - and the empty tbody of a present-but-empty slot dropped;
//   - count-preserving substitutions: tfoot rendered as a second tbody with
//     the foot class, and header cells rendered as data cells - the same
//     number of nodes, a different table;
//   - the modifiers: striped dropped, sticky-header renamed, a modifier moved
//     to the wrapper, and a class leaking between two instances;
//   - the three directions.
//
// Each mutation names the dimension that must catch it and fails the harness
// rather than counting as a detection if it cannot find what it is supposed to
// break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const FULL = 'table/full';
const ATTRS = 'table/consumer-attrs';
const ARIA = 'table/consumer-aria';
const HEAD_FOOT = 'table/head-foot';
const HEAD_BODY = 'table/head-body';
const BODY_FOOT = 'table/body-foot';
const EMPTY = 'table/empty-sections';
const CAPTION = 'table/caption';
const SLOT_OVER_PROP = 'table/caption-slot-over-prop';
const STRIPED = 'table/striped';
const STICKY = 'table/sticky-header';
const ALL = 'table/all-modifiers';
const TWO = 'table/two-instances';

const wrap = (node) => node.tag === 'div' && node.classes.includes('vf-table-wrap');
const table = (node) => node.tag === 'table' && node.classes.includes('vf-table');
const has = (name) => (node) => node.classes.includes(name);

const wrapOf = (caseId) => (capture) => findNode(capture, caseId, wrap, 'wrapper');
const tableOf = (caseId) => (capture) => findNode(capture, caseId, table, 'table');

export const tableParityMutations = [
  // --------------------------------------------------------- wrappers
  {
    id: 'table-wrapper-becomes-a-section',
    klass: 'structure',
    description: 'the wrapper is described as a section with the same class',
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [FULL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        wrapOf(FULL)(capture).tag = 'section';
      });
    },
  },

  // --------------------------------------------------------- attribute ownership
  {
    id: 'table-attrs-moved-to-table',
    klass: 'attributes',
    description: 'the consumer class, style and data attribute are described on the table instead of the wrapper',
    expect: {
      dimensions: ['dom.canonicalClasses', 'dom.nativeAttributes', 'dom.productData'],
      details: {
        'dom.canonicalClasses': ['consumer classes'],
        'dom.nativeAttributes': ['style'],
        'dom.productData': ['data-testid'],
      },
      caseIds: [ATTRS],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = wrapOf(ATTRS)(capture);
        const inner = tableOf(ATTRS)(capture);
        const { style, 'data-testid': testId, ...rest } = wrapper.attributes;
        if (style === undefined || testId === undefined || wrapper.consumerClasses.length === 0) {
          fail(`${ATTRS} carried no consumer attributes on the wrapper`);
        }
        wrapper.attributes = rest;
        inner.attributes = { ...inner.attributes, style, 'data-testid': testId };
        inner.consumerClasses = wrapper.consumerClasses;
        wrapper.consumerClasses = [];
      });
    },
  },

  // --------------------------------------------------------- modifiers
  {
    id: 'table-modifier-on-wrapper',
    klass: 'classes',
    description: 'the striped modifier is described on the wrapper and the table keeps the bare class',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [STRIPED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const inner = tableOf(STRIPED)(capture);
        if (!inner.classes.includes('vf-table--striped')) fail(`${STRIPED} is not striped`);
        inner.classes = inner.classes.filter((name) => name !== 'vf-table--striped');
        const wrapper = wrapOf(STRIPED)(capture);
        wrapper.classes = [...wrapper.classes, 'vf-table--striped'].sort();
      });
    },
  },
  {
    id: 'table-sticky-modifier-dropped',
    klass: 'classes',
    description: 'one of all four modifiers is lost',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [ALL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const inner = tableOf(ALL)(capture);
        if (!inner.classes.includes('vf-table--sticky-header')) fail(`${ALL} has no sticky header`);
        inner.classes = inner.classes.filter((name) => name !== 'vf-table--sticky-header');
      });
    },
  },

  // --------------------------------------------------------- row groups
  {
    id: 'table-body-added-without-slot',
    klass: 'structure',
    description: 'an empty tbody is described between thead and tfoot of a table with no default slot',
    expect: { dimensions: ['dom.structure'], caseIds: [HEAD_FOOT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const inner = tableOf(HEAD_FOOT)(capture);
        if (inner.children.some(has('vf-table__body'))) fail(`${HEAD_FOOT} already has a body`);
        const at = inner.children.findIndex(has('vf-table__foot'));
        inner.children.splice(at, 0, {
          tag: 'tbody',
          classes: ['vf-table__body'],
          consumerClasses: [],
          attributes: {},
          children: [],
        });
      });
    },
  },
  {
    id: 'table-foot-becomes-a-body',
    klass: 'structure',
    description: 'the foot is described as a second tbody with the foot class - the same count of nodes',
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [FULL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, FULL, has('vf-table__foot'), 'foot').tag = 'tbody';
      });
    },
  },

  // --------------------------------------------------------- accessibility
  {
    id: 'table-loses-its-caption-name',
    klass: 'accessibility',
    description: 'the table is no longer named by its caption',
    expect: { dimensions: ['a11y.name'], caseIds: [CAPTION] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility[CAPTION]?.table;
        if (!exposed?.name) fail(`${CAPTION} exposes no named table`);
        exposed.name = '';
      });
    },
  },

  // --------------------------------------------------------- directions
  {
    id: 'table-current-only-consumer-class-on-table',
    klass: 'directional',
    description: 'only current Vue copies the consumer class onto the table; both directions from current see it',
    expect: {
      dimensions: ['dom.canonicalClasses'],
      details: { 'dom.canonicalClasses': ['consumer classes'] },
      caseIds: [ATTRS],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        tableOf(ATTRS)(capture).consumerClasses = ['consumer-table'];
      });
    },
  },
  {
    id: 'table-current-and-razor-identically-attrs-on-table',
    klass: 'directional',
    description:
      'current Vue and Razor both put the consumer style on the table; they agree with each other and only the reference direction can see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [ATTRS],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const wrapper = wrapOf(ATTRS)(capture);
          const { style, ...rest } = wrapper.attributes;
          if (style === undefined) fail(`${ATTRS} carried no style`);
          wrapper.attributes = rest;
          const inner = tableOf(ATTRS)(capture);
          inner.attributes = { ...inner.attributes, style };
        });
      }
    },
  },
  {
    id: 'table-current-and-razor-identically-body-added',
    klass: 'directional',
    description:
      'current Vue and Razor both open an empty tbody with no default slot; only the reference direction can see it',
    expect: {
      dimensions: ['dom.structure'],
      caseIds: [HEAD_FOOT],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const inner = tableOf(HEAD_FOOT)(capture);
          const at = inner.children.findIndex(has('vf-table__foot'));
          if (at < 0) fail(`${HEAD_FOOT} has no foot`);
          inner.children.splice(at, 0, {
            tag: 'tbody',
            classes: ['vf-table__body'],
            consumerClasses: [],
            attributes: {},
            children: [],
          });
        });
      }
    },
  },
];

// ----------------------------------------------------------- browser mutations

/** A page operation replacing the matched element with another tag, keeping attributes and children. */
function replaceWith(tag) {
  return `
      const replacement = document.createElement(${JSON.stringify(tag)});
      for (const attribute of element.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...element.childNodes);
      element.replaceWith(replacement);
    `;
}

/** Real DOM mutations on the pages the three targets actually served. */
export const tableBrowserMutations = [
  // --------------------------------------------------- wrappers
  {
    id: 'browser-table-wrapper-removed',
    target: 'razor',
    caseIds: [FULL],
    description: 'the real wrapper is removed and the scroll container sits directly in the case',
    expect: { dimensions: ['dom.structure', 'dom.canonicalClasses'], caseIds: [FULL] },
    beforeExtract: mutateElements([FULL], 'div.vf-table-wrap', `element.replaceWith(...element.childNodes);`),
  },
  {
    id: 'browser-table-wrapper-becomes-a-section',
    target: 'razor',
    caseIds: [FULL],
    description: 'the real wrapper div is replaced by a section with the same class and children',
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [FULL] },
    beforeExtract: mutateElements([FULL], 'div.vf-table-wrap', replaceWith('section')),
  },
  {
    id: 'browser-table-scroll-container-removed',
    target: 'razor',
    caseIds: [FULL],
    description: 'the real scroll container is removed and the table sits directly in the wrapper',
    expect: { dimensions: ['dom.structure'], caseIds: [FULL] },
    beforeExtract: mutateElements([FULL], 'div.vf-table-scroll', `element.replaceWith(...element.childNodes);`),
  },

  // --------------------------------------------------- attribute ownership
  {
    id: 'browser-table-attrs-moved-to-table',
    target: 'razor',
    caseIds: [ATTRS],
    description: 'the consumer class, style, id and data attribute move from the real wrapper onto the table',
    expect: {
      dimensions: ['dom.canonicalClasses', 'dom.nativeAttributes', 'dom.productData'],
      details: {
        'dom.canonicalClasses': ['consumer classes'],
        'dom.nativeAttributes': ['style'],
        'dom.productData': ['data-testid'],
      },
      caseIds: [ATTRS],
    },
    beforeExtract: mutateElements(
      [ATTRS],
      'div.vf-table-wrap',
      `
      const inner = element.querySelector('table.vf-table');
      for (const name of ['id', 'style', 'data-testid']) {
        if (!element.hasAttribute(name)) throw new Error('MUTATION_NOT_APPLIED: no ' + name);
        inner.setAttribute(name, element.getAttribute(name));
        element.removeAttribute(name);
      }
      element.classList.remove('consumer-table');
      inner.classList.add('consumer-table');
    `,
    ),
  },
  {
    id: 'browser-table-aria-moved-to-table',
    target: 'razor',
    caseIds: [ARIA],
    description: 'the consumer role, accessible name and tabindex move from the real wrapper onto the table',
    expect: {
      dimensions: ['dom.aria', 'dom.nativeAttributes', 'a11y.role'],
      details: { 'dom.aria': ['role', 'aria-label'], 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [ARIA],
    },
    beforeExtract: mutateElements(
      [ARIA],
      'div.vf-table-wrap',
      `
      const inner = element.querySelector('table.vf-table');
      for (const name of ['role', 'aria-label', 'tabindex']) {
        if (!element.hasAttribute(name)) throw new Error('MUTATION_NOT_APPLIED: no ' + name);
        inner.setAttribute(name, element.getAttribute(name));
        element.removeAttribute(name);
      }
    `,
    ),
  },

  // --------------------------------------------------- caption
  {
    id: 'browser-table-caption-prop-wins',
    target: 'razor',
    caseIds: [SLOT_OVER_PROP],
    description: 'the real caption shows the prop text instead of the slot, and the table is named by it',
    expect: { dimensions: ['dom.text', 'a11y.name'], caseIds: [SLOT_OVER_PROP] },
    beforeExtract: mutateElements(
      [SLOT_OVER_PROP],
      'caption.vf-table__caption',
      `element.textContent = 'Prop caption';`,
    ),
  },
  {
    id: 'browser-table-caption-moved-out',
    target: 'razor',
    caseIds: [CAPTION],
    description: 'the real caption moves out of the table into a div above it, where it no longer names the table',
    expect: { dimensions: ['dom.structure', 'a11y.name'], caseIds: [CAPTION] },
    beforeExtract: mutateElements(
      [CAPTION],
      'caption.vf-table__caption',
      `
      const replacement = document.createElement('div');
      replacement.className = element.className;
      replacement.append(...element.childNodes);
      element.closest('table').before(replacement);
      element.remove();
    `,
    ),
  },

  // --------------------------------------------------- row groups
  {
    id: 'browser-table-body-added-without-slot',
    target: 'razor',
    caseIds: [HEAD_FOOT],
    description:
      'the real Razor table opens an empty tbody with no default slot - what a template invocation with only named slots renders',
    expect: { dimensions: ['dom.structure'], caseIds: [HEAD_FOOT] },
    beforeExtract: mutateElements(
      [HEAD_FOOT],
      'tfoot.vf-table__foot',
      `
      const body = document.createElement('tbody');
      body.className = 'vf-table__body';
      element.before(body);
    `,
    ),
  },
  {
    id: 'browser-table-empty-body-dropped',
    target: 'razor',
    caseIds: [EMPTY],
    description: 'the real empty tbody of a present-but-empty default slot is dropped',
    expect: { dimensions: ['dom.structure'], caseIds: [EMPTY] },
    beforeExtract: mutateElements([EMPTY], 'tbody.vf-table__body', `element.remove();`),
  },
  {
    id: 'browser-table-foot-becomes-a-body',
    target: 'razor',
    caseIds: [BODY_FOOT],
    description: 'the real tfoot is replaced by a second tbody with the foot class - the same count of nodes',
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [BODY_FOOT] },
    beforeExtract: mutateElements([BODY_FOOT], 'tfoot.vf-table__foot', replaceWith('tbody')),
  },
  {
    id: 'browser-table-header-cells-become-data-cells',
    target: 'razor',
    caseIds: [HEAD_BODY],
    description: 'the real header cells are replaced by data cells - the same count of nodes, no column headers',
    expect: { dimensions: ['dom.structure', 'a11y.role'], details: { 'dom.structure': ['tag'] }, caseIds: [HEAD_BODY] },
    beforeExtract: mutateElements([HEAD_BODY], 'thead.vf-table__head th', replaceWith('td')),
  },

  // --------------------------------------------------- modifiers
  {
    id: 'browser-table-striped-dropped',
    target: 'razor',
    caseIds: [STRIPED],
    description: 'the real table loses its striped modifier, and its even rows lose their paint',
    expect: { dimensions: ['dom.canonicalClasses', 'visual'], caseIds: [STRIPED] },
    beforeExtract: mutateElements([STRIPED], 'table.vf-table', `element.classList.remove('vf-table--striped');`),
  },
  {
    id: 'browser-table-sticky-header-renamed',
    target: 'razor',
    caseIds: [STICKY],
    description: 'the real sticky-header modifier is spelled --sticky, which no stylesheet rule matches',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [STICKY] },
    beforeExtract: mutateElements(
      [STICKY],
      'table.vf-table',
      `element.classList.replace('vf-table--sticky-header', 'vf-table--sticky');`,
    ),
  },
  {
    id: 'browser-table-instances-leak',
    target: 'razor',
    caseIds: [TWO],
    description: "the second real table's wrapper carries the first one's consumer class",
    expect: {
      dimensions: ['dom.canonicalClasses'],
      details: { 'dom.canonicalClasses': ['consumer classes'] },
      caseIds: [TWO],
    },
    beforeExtract: mutateElements(
      [TWO],
      'div.vf-table-wrap:not(.first-table)',
      `element.classList.add('first-table');`,
    ),
  },

  // --------------------------------------------------- current-only
  {
    id: 'browser-table-current-only-consumer-class-on-table',
    target: 'current',
    caseIds: [ATTRS],
    verifyIsolation: true,
    description:
      'only the real current Vue table carries the consumer class as well; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['dom.canonicalClasses'],
      details: { 'dom.canonicalClasses': ['consumer classes'] },
      caseIds: [ATTRS],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements([ATTRS], 'table.vf-table', `element.classList.add('consumer-table');`),
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
      pathSelector: 'div.vf-table-wrap',
      left: 'a',
      right: 'b',
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

export const tablePolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [HEAD_FOOT],
    'an approval for dom.structure - the shape a "Razor templates always declare a body" waiver would take',
  ),
  smuggled('smuggled-visual-approval', 'visual', [STRIPED], 'an approval for rendered pixels'),
  smuggled('smuggled-static-approval', 'static.noInteraction', [ARIA], 'an approval for the static evidence'),
  smuggled('smuggled-wildcard-case', 'dom.canonicalClasses', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-template-case',
    'dom.canonicalClasses',
    ['table/template-head-only'],
    'an approval naming a case the catalog does not have',
  ),
  {
    id: 'idle-consumer-class-approval',
    description:
      'a well-formed consumer-class approval that tolerates a difference no target produces: the accounting rejects it as unused',
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id: 'idle-consumer-class-approval',
        dimension: 'dom.canonicalClasses',
        target: 'razor',
        caseIds: [ATTRS],
        detail: 'consumer classes',
        pathSelector: 'table.vf-table.vf-table--striped',
        left: '',
        right: 'consumer-table',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  },
];
