// The negative fixtures for the VfPanel parity gate.
//
// The M18 set, and the first written against a *neighbour* rather than against
// the component alone. VfCard is the nearest structural neighbour VfPanel has,
// so the mutations that matter here are the ones that turn a panel into a card
// while leaving it looking like a panel:
//
//   - a body wrapper added around the default slot renders a panel that is
//     visually near-identical and selects entirely differently;
//   - a footer rendered for the footer slot the panel is meant to drop looks
//     like a panel with more content in it;
//   - the subtle modifier replaced by a compact one paints nothing at all in a
//     stylesheet that has no such rule, so the panel simply loses its tone.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (node) => node.classes.includes('vf-panel');
const tagged = (tag) => (node) => node.tag === tag;

/** A capture mutation that flips one field of a case's static snapshot. */
function staticSnapshotMutation({ id, description, caseId, field, from, to }) {
  return {
    id,
    klass: 'static snapshot',
    description,
    expect: { dimensions: ['static.noInteraction'], caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[caseId];
        if (snapshot === undefined) {
          fail(`${caseId} has no static snapshot; the stage did not run at all`);
        }
        if (snapshot[field] !== from) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(snapshot[field])}, not ${JSON.stringify(from)}`);
        }
        snapshot[field] = to;
      });
    },
  };
}

/** Rewrites one attribute of a node in a capture. */
function setAttribute(caseId, predicate, what, name, value) {
  return (captures) => {
    eachTheme(captures, 'razor', (capture) => {
      const node = findNode(capture, caseId, predicate, what);
      if (node.attributes[name] === value) fail(`${caseId} already carried ${name}=${value}`);
      node.attributes = { ...node.attributes, [name]: value };
    });
  };
}

export const panelParityMutations = [
  // ------------------------------------------------- the Card substitutions

  {
    // Aimed at the multi-node case rather than at a text-only one. The extracted
    // description carries element children in `children` and text in `text`, so
    // a text-only default slot has nothing in `children` to move: the mutation
    // would fail to apply and would prove nothing. The browser mutation below
    // covers the text case, where real child *nodes* are moved.
    id: 'panel-wraps-its-content-in-a-card-body',
    klass: 'structure',
    description:
      "VfCard's classed body wrapper appears around the panel's default slot - the substitution a shared " +
      'renderer would make, and one that looks almost identical on screen',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/multiple-root-nodes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/multiple-root-nodes', root, 'panel root');
        const content = node.children.filter((child) => child.tag !== 'header');
        if (content.length === 0) fail('the case rendered no default-slot element to wrap');
        node.children = [
          ...node.children.filter((child) => child.tag === 'header'),
          {
            tag: 'div',
            classes: ['vf-panel__body'],
            consumerClasses: [],
            attributes: {},
            children: content,
          },
        ];
      });
    },
  },
  {
    id: 'panel-emits-an-empty-body-wrapper',
    klass: 'structure',
    description:
      'an empty default slot starts emitting the empty classed wrapper a card emits, which takes a row and a ' +
      'column gap in the flex layout that the reference never had',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/content-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/content-empty', root, 'panel root');
        if (node.children.some((child) => child.classes.includes('vf-panel__body'))) {
          fail('the case already rendered a body wrapper');
        }
        node.children = [
          ...node.children,
          { tag: 'div', classes: ['vf-panel__body'], consumerClasses: [], attributes: {}, children: [] },
        ];
      });
    },
  },
  {
    id: 'panel-grows-a-footer',
    klass: 'structure',
    description:
      'the footer slot a panel is meant to drop starts rendering a footer element, which is what a Card-shaped ' +
      'implementation does with it',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/ignored-footer-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/ignored-footer-slot', root, 'panel root');
        if (node.children.some((child) => child.tag === 'footer')) fail('the case already rendered a footer');
        node.children = [
          ...node.children,
          { tag: 'footer', classes: [], consumerClasses: [], attributes: {}, children: [], text: 'Updated 3 minutes ago' },
        ];
      });
    },
  },
  {
    id: 'panel-becomes-a-card',
    klass: 'canonical classes',
    description: "VfCard's block name is reused for VfPanel - the substitution the adjacent component makes possible",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/subtle'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/subtle', root, 'panel root');
        node.classes = node.classes.map((name) => name.replace('vf-panel', 'vf-card'));
      });
    },
  },
  {
    id: 'panel-modifier-becomes-compact',
    klass: 'canonical classes',
    description:
      "the subtle modifier is spelled as VfCard's compact, which no panel stylesheet defines, so the panel " +
      'silently loses its tone',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/subtle'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/subtle', root, 'panel root');
        if (!node.classes.includes('vf-panel--subtle')) fail('the case did not carry the subtle modifier');
        node.classes = node.classes.map((name) => (name === 'vf-panel--subtle' ? 'vf-panel--compact' : name));
      });
    },
  },

  // ------------------------------------------------------ the panel's own rules

  {
    id: 'panel-header-gains-a-class',
    klass: 'canonical classes',
    description: 'the unclassed header wrapper gains vf-panel__header, which looks identical and selects differently',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-and-content', tagged('header'), 'panel header');
        if (node.classes.length > 0) fail('the header already carried a class');
        node.classes = ['vf-panel__header'];
      });
    },
  },
  {
    id: 'panel-header-becomes-a-div',
    klass: 'structure',
    description: 'the native header element becomes a generic div, losing its implicit semantics',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-and-content', tagged('header'), 'panel header');
        node.tag = 'div';
      });
    },
  },
  {
    id: 'panel-root-becomes-a-div',
    klass: 'structure',
    description: 'the section root becomes a div, which looks identical and exposes a different element',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-and-content', root, 'panel root');
        node.tag = 'div';
      });
    },
  },
  {
    id: 'panel-drops-the-title-class',
    klass: 'canonical classes',
    description: 'the fallback heading loses vf-panel__title, so it inherits the page heading style instead',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/title-only'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-only', tagged('h3'), 'panel title');
        if (!node.classes.includes('vf-panel__title')) fail('the heading did not carry its class');
        node.classes = node.classes.filter((name) => name !== 'vf-panel__title');
      });
    },
  },
  {
    id: 'panel-title-becomes-a-card-title',
    klass: 'canonical classes',
    description: 'the fallback heading is classed vf-card__title, which is the block name of the neighbour',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/title-only'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-only', tagged('h3'), 'panel title');
        node.classes = node.classes.map((name) => (name === 'vf-panel__title' ? 'vf-card__title' : name));
      });
    },
  },
  {
    id: 'panel-loses-the-fallback-heading',
    klass: 'structure',
    description: 'an empty header slot stops bringing the fallback heading back, which is the subtlest header rule',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/header-slot-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/header-slot-empty', tagged('header'), 'panel header');
        if (node.children.length === 0) fail('the header had no fallback heading to lose');
        node.children = [];
        node.text = '';
      });
    },
  },
  {
    id: 'panel-opens-a-header-for-an-empty-title',
    klass: 'structure',
    description: 'an empty-string title starts rendering an empty header instead of none',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/title-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/title-empty', root, 'panel root');
        if (node.children.length !== 0) fail('the empty-title case already rendered something');
        node.children = [
          {
            tag: 'header',
            classes: [],
            consumerClasses: [],
            attributes: {},
            children: [
              { tag: 'h3', classes: ['vf-panel__title'], consumerClasses: [], attributes: {}, children: [] },
            ],
          },
        ];
      });
    },
  },
  {
    id: 'panel-reorders-the-header-and-the-content',
    klass: 'structure',
    description: 'the default slot is rendered before the header',
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/multiple-root-nodes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/multiple-root-nodes', root, 'panel root');
        if (node.children.length < 2) fail('the case did not render a header and content');
        node.children = [...node.children.slice(1), node.children[0]];
      });
    },
  },
  {
    id: 'panel-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'panel/consumer-class', root, 'panel root');
        if (!node.consumerClasses.includes('consumer-panel')) fail('the consumer class was not there');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-panel');
      });
    },
  },
  {
    id: 'panel-names-itself-as-a-landmark',
    klass: 'aria',
    description:
      'the panel starts labelling itself, which turns every section into a landmark in every existing application',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-label'] },
      caseIds: ['panel/title-and-content'],
    },
    apply: setAttribute('panel/title-and-content', root, 'panel root', 'aria-label', 'Workspace'),
  },
  {
    id: 'panel-leaks-a-product-data-attribute-onto-the-header',
    klass: 'product data',
    description: 'a consumer data attribute reaches the header wrapper as well as the root',
    expect: { dimensions: ['dom.productData'], caseIds: ['panel/title-and-content'] },
    apply: setAttribute('panel/title-and-content', tagged('header'), 'panel header', 'data-testid', 'panel'),
  },
  staticSnapshotMutation({
    id: 'panel-static-snapshot-loses-the-consumer-control',
    description:
      'the consumer control the case declared stops being measured, so a target that dropped it would go unnoticed',
    caseId: 'panel/interactive-slot-content',
    field: 'focusableCount',
    from: 1,
    to: 0,
  }),
  staticSnapshotMutation({
    id: 'panel-static-snapshot-gains-a-control-the-consumer-did-not-provide',
    description: 'the panel reports two focusable elements where the consumer provided one',
    caseId: 'panel/interactive-slot-content',
    field: 'focusableCount',
    from: 1,
    to: 2,
  }),
];

// ------------------------------------------------------------ browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const panelBrowserMutations = [
  {
    id: 'browser-panel-gains-a-card-body-wrapper',
    target: 'razor',
    caseIds: ['panel/title-and-content'],
    description: "the real panel's default-slot content is moved into a card-style body wrapper",
    expect: { dimensions: ['dom.structure'], caseIds: ['panel/title-and-content'] },
    beforeExtract: mutateElements(
      ['panel/title-and-content'],
      '.vf-panel',
      `
      const content = [...element.childNodes].filter((node) => node.nodeName !== 'HEADER');
      if (content.length === 0) throw new Error('MUTATION_NOT_APPLIED: nothing to wrap');
      const wrapper = document.createElement('div');
      wrapper.className = 'vf-panel__body';
      for (const node of content) wrapper.appendChild(node);
      element.appendChild(wrapper);
    `,
    ),
  },
  {
    id: 'browser-panel-header-gains-a-class',
    target: 'razor',
    caseIds: ['panel/title-and-content'],
    description: 'the real unclassed header gains vf-panel__header',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['panel/title-and-content'] },
    beforeExtract: mutateElements(
      ['panel/title-and-content'],
      '.vf-panel > header',
      `
      if (element.classList.length > 0) throw new Error('MUTATION_NOT_APPLIED: header already classed');
      element.classList.add('vf-panel__header');
    `,
    ),
  },
  {
    id: 'browser-panel-subtle-background',
    target: 'razor',
    caseIds: ['panel/subtle-empty'],
    description:
      'the real subtle background is repainted, which is the whole of what the modifier does and which no DOM ' +
      'comparison would report',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['panel/subtle-empty'] },
    beforeExtract: mutateElements(
      ['panel/subtle-empty'],
      '.vf-panel',
      `
      element.style.backgroundColor = 'rgb(214, 51, 132)';
    `,
    ),
  },
];

// ---------------------------------------------------------- policy mutations

/**
 * The approvals validation must refuse.
 *
 * The last one is the Card/Panel approval: a single rule naming cases from both
 * components, so a difference in either would be excused by a rule reviewed for
 * the other. That is the shape a reviewer would reach for precisely because the
 * two components look alike, and it has to be rejected as firmly as a wildcard.
 */
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
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

export const panelPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    ['panel/empty'],
    'an approval for dom.structure, which must never be waivable - and which in M18 is the dimension that ' +
      'separates a panel from a card',
  ),
  smuggled('smuggled-visual-approval', 'visual', ['panel/empty'], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.canonicalClasses',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-static-snapshot-approval',
    'static.noInteraction',
    ['panel/empty'],
    'an approval for static.noInteraction - the very evidence that the interaction stage ran at all, and what ' +
      'tells a consumer control from a component-owned one',
  ),
  smuggled(
    'broad-card-panel-approval',
    'dom.canonicalClasses',
    ['panel/empty', 'card/empty'],
    'one approval naming cases from both VfPanel and VfCard, so a difference in either would be excused by a ' +
      'rule reviewed for the other - the approval a reviewer reaches for exactly because the two look alike',
  ),
];
