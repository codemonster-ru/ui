// The negative fixtures for the VfLink parity gate.
//
// The M25 set. The reference link is one native anchor, and the mutations that
// carry this milestone are the ones that leave an anchor-shaped thing on the
// page while changing what a link *is*:
//
//   - the semantic ones. An anchor rendered as a button, or as a div with
//     role=link and a tabindex, keeps its text and its classes and - for the
//     div - even its accessibility role. Tag identity has to carry these: the
//     DOM description records the tag and never approves a structure
//     difference, and the ownership rule names the tag the anchor has to be;
//   - the three attribute holes. href, target and rel were not compared
//     attributes before M25. The browser mutations that change them on the
//     real Razor page name dom.nativeAttributes as the dimension that has to
//     fire, so that with the old vocabulary they report MISSED on that
//     dimension - the false PASS reproduced - and with the extended vocabulary
//     they report detected. They also fire on interaction.state and
//     ownership.controls, where the link snapshot records the same three
//     attributes on its own account; the expectation names the DOM dimension
//     because that is the generic one every later component inherits;
//   - the no-destination anchor. A placeholder href, a role or a tabindex on
//     the inert anchor would make it reachable, which is the improvement the
//     reference does not make and the catalog declares by a zero budget;
//   - the three directions: a defect only current Vue has, a defect only
//     Razor has, and the same defect in both - the last caught by the
//     reference direction alone, which is why the reference is immutable.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const HREF = 'link/href';
const BLANK = 'link/blank-derived-rel';
const EXPLICIT = 'link/blank-explicit-rel';
const SELF = 'link/self';
const NONE = 'link/no-destination';
const ALWAYS = 'link/underline-always';
const MUTED = 'link/muted';
const ATTRS = 'link/consumer-attrs';
const ARIA = 'link/consumer-aria';
const CONTROL = 'link/consumer-control';

const anchor = (node) => node.classes.includes('vf-link');

/** Rewrites one attribute of the anchor in a capture; `null` removes it. */
function setAnchorAttribute(caseId, name, value, target = 'razor') {
  return (captures) => {
    eachTheme(captures, target, (capture) => {
      const node = findNode(capture, caseId, anchor, 'anchor');
      if ((node.attributes[name] ?? null) === value) fail(`${caseId} already carried ${name}=${value}`);
      const attributes = { ...node.attributes };
      if (value === null) delete attributes[name];
      else attributes[name] = value;
      node.attributes = attributes;
    });
  };
}

/** A capture mutation that rewrites one field of a case's link snapshot. */
function snapshotMutation({ id, description, caseId, field, edit, dimensions, target = 'razor', directions }) {
  return {
    id,
    klass: 'snapshot',
    description,
    expect: { dimensions, caseIds: [caseId], ...(directions ? { directions } : {}) },
    apply(captures) {
      eachTheme(captures, target, (capture) => {
        const snapshot = capture.interactions[caseId];
        if (snapshot === undefined) fail(`${caseId} has no snapshot; the ownership stage did not run at all`);
        if (!(field in snapshot)) fail(`${caseId} recorded no ${field}`);
        snapshot[field] = edit(snapshot[field], snapshot);
      });
    },
  };
}

/** A capture mutation on the accessibility tree the harness read for a case. */
function accessibilityMutation({ id, description, caseId, role, edit, dimensions }) {
  return {
    id,
    klass: 'accessibility',
    description,
    expect: { dimensions, caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility[caseId];
        if (!exposed) fail(`${caseId} has no accessibility record`);
        edit(exposed, role);
      });
    },
  };
}

export const linkParityMutations = [
  // --------------------------------------------------------- semantic identity
  {
    id: 'link-anchor-becomes-a-button',
    klass: 'structure',
    description: 'the anchor is described as a button with the same classes, text and href',
    expect: { dimensions: ['dom.structure'], details: { 'dom.structure': ['tag'] }, caseIds: [HREF] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, HREF, anchor, 'anchor').tag = 'button';
      });
    },
  },
  {
    id: 'link-anchor-becomes-a-div-with-role-link',
    klass: 'structure',
    description:
      'the anchor is described as a div carrying role=link and tabindex=0 - the same accessibility role, a different element',
    expect: {
      dimensions: ['dom.structure', 'dom.aria'],
      details: { 'dom.structure': ['tag'], 'dom.aria': ['role'] },
      caseIds: [HREF],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, HREF, anchor, 'anchor');
        node.tag = 'div';
        node.attributes = { ...node.attributes, role: 'link', tabindex: '0' };
      });
    },
  },
  {
    id: 'link-grows-a-second-anchor',
    klass: 'structure',
    description: 'a second anchor with the same classes appears beside the first',
    expect: { dimensions: ['dom.structure'], caseIds: [HREF] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.extracted[HREF].dom;
        dom.push(structuredClone(findNode(capture, HREF, anchor, 'anchor')));
      });
    },
  },
  {
    id: 'link-anchor-wraps-its-content',
    klass: 'structure',
    description: 'the slot text is wrapped in a span the reference never renders',
    expect: { dimensions: ['dom.structure', 'dom.text'], caseIds: [HREF] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, HREF, anchor, 'anchor');
        if (node.children.length !== 0 || !node.text) fail('the anchor holds no bare text to wrap');
        node.children = [
          { tag: 'span', classes: [], consumerClasses: [], attributes: {}, children: [], text: node.text },
        ];
        delete node.text;
      });
    },
  },

  // ----------------------------------------------------- the three attributes
  {
    id: 'link-href-dropped-in-dom',
    klass: 'native attributes',
    description: 'the href disappears from the DOM record while the element stays an anchor',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [HREF] },
    apply: setAnchorAttribute(HREF, 'href', null),
  },
  {
    id: 'link-href-wrong-in-dom',
    klass: 'native attributes',
    description: 'the href points somewhere else',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [HREF] },
    apply: setAnchorAttribute(HREF, 'href', '/elsewhere'),
  },
  {
    id: 'link-target-dropped-in-dom',
    klass: 'native attributes',
    description: 'target=_blank disappears, so the link opens in the same tab',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['target'] }, caseIds: [BLANK] },
    apply: setAnchorAttribute(BLANK, 'target', null),
  },
  {
    id: 'link-rel-dropped-in-dom',
    klass: 'native attributes',
    description: 'the derived rel disappears, so a _blank link opens without noopener',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [BLANK] },
    apply: setAnchorAttribute(BLANK, 'rel', null),
  },
  {
    id: 'link-rel-derived-for-self-in-dom',
    klass: 'native attributes',
    description: 'rel is derived for target=_self, which the reference never does',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [SELF] },
    apply: setAnchorAttribute(SELF, 'rel', 'noopener noreferrer'),
  },
  {
    id: 'link-rel-merged-into-explicit-in-dom',
    klass: 'native attributes',
    description: 'the derived rel is appended to the explicit one instead of the explicit one winning',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [EXPLICIT] },
    apply: setAnchorAttribute(EXPLICIT, 'rel', 'nofollow noopener noreferrer'),
  },
  {
    id: 'link-empty-href-dropped-in-dom',
    klass: 'native attributes',
    description: 'an empty-string href is dropped, which turns a link into the inert anchor',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: ['link/href-empty'],
    },
    apply: setAnchorAttribute('link/href-empty', 'href', null),
  },

  // ------------------------------------------------- the no-destination anchor
  {
    id: 'link-no-destination-gets-a-placeholder-href',
    klass: 'native attributes',
    description: 'the inert anchor is given href="#", which makes it a link the reference does not render',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [NONE] },
    apply: setAnchorAttribute(NONE, 'href', '#'),
  },
  {
    id: 'link-no-destination-gets-role-and-tabindex',
    klass: 'aria',
    description: 'the inert anchor is given role=link and tabindex=0 to make it "accessible"',
    expect: {
      dimensions: ['dom.aria', 'dom.nativeAttributes'],
      details: { 'dom.aria': ['role'], 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [NONE],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, NONE, anchor, 'anchor');
        if (node.attributes.role !== undefined) fail('the inert anchor already carried a role');
        node.attributes = { ...node.attributes, role: 'link', tabindex: '0' };
      });
    },
  },

  // ---------------------------------------------------------- classes and aria
  {
    id: 'link-modifier-typo',
    klass: 'canonical classes',
    description: 'the always modifier is misspelled, which no stylesheet rule matches',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [ALWAYS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, ALWAYS, anchor, 'anchor');
        if (!node.classes.includes('vf-link--underline-always')) fail('no always modifier');
        node.classes = node.classes.map((name) =>
          name === 'vf-link--underline-always' ? 'vf-link--underlined' : name,
        );
      });
    },
  },
  {
    id: 'link-tone-dropped',
    klass: 'canonical classes',
    description: 'the muted tone stops reaching the class list',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [MUTED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, MUTED, anchor, 'anchor');
        node.classes = node.classes.filter((name) => name !== 'vf-link--muted');
      });
    },
  },
  {
    id: 'link-consumer-class-lost',
    klass: 'canonical classes',
    description: 'the consumer class stops reaching the anchor',
    expect: {
      dimensions: ['dom.canonicalClasses'],
      details: { 'dom.canonicalClasses': ['consumer classes'] },
      caseIds: [ATTRS],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, ATTRS, anchor, 'anchor');
        if (node.consumerClasses.length === 0) fail('no consumer class to lose');
        node.consumerClasses = [];
      });
    },
  },
  {
    id: 'link-product-data-lost',
    klass: 'product data',
    description: 'the consumer data attribute stops reaching the anchor',
    expect: { dimensions: ['dom.productData'], details: { 'dom.productData': ['data-testid'] }, caseIds: [ATTRS] },
    apply: setAnchorAttribute(ATTRS, 'data-testid', null),
  },
  {
    id: 'link-aria-current-dropped',
    klass: 'aria',
    description: 'aria-current stops reaching the anchor - which the accessibility tree would never notice',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-current'] }, caseIds: [ARIA] },
    apply: setAnchorAttribute(ARIA, 'aria-current', null),
  },
  {
    id: 'link-writes-aria-current-of-its-own',
    klass: 'aria',
    description: 'the link starts writing aria-current=page on a plain link, as a router would',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-current'] }, caseIds: [HREF] },
    apply: setAnchorAttribute(HREF, 'aria-current', 'page'),
  },
  {
    id: 'link-describedby-dangles',
    klass: 'relationships',
    description: 'aria-describedby names an id nothing carries',
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-describedby'] },
      caseIds: [ARIA],
    },
    apply: setAnchorAttribute(ARIA, 'aria-describedby', '#dangling'),
  },

  // ------------------------------------------------------------- ownership
  snapshotMutation({
    id: 'link-snapshot-loses-the-anchor',
    description: 'the ownership stage stops finding the anchor, so a target that lost it would go unnoticed',
    caseId: HREF,
    field: 'componentControls',
    edit: (controls) => {
      if (controls.length !== 1) fail(`expected one owned anchor, found ${controls.length}`);
      return [];
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'link-snapshot-anchor-is-a-button',
    description: 'the owned control is recorded as a button',
    caseId: HREF,
    field: 'componentControls',
    edit: (controls) => controls.map((control) => ({ ...control, tag: 'button' })),
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'link-snapshot-no-destination-counts-a-control',
    description: 'the inert anchor is counted as an owned, focusable control',
    caseId: NONE,
    field: 'componentControls',
    edit: (controls, snapshot) => {
      if (controls.length !== 0) fail('the inert anchor was already counted');
      snapshot.focusableTotal += 1;
      return [
        {
          role: 'anchor',
          tag: 'a',
          ariaRole: null,
          href: '#',
          target: null,
          rel: null,
          classes: ['vf-link'],
          focusable: true,
          name: 'Nowhere',
        },
      ];
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'link-snapshot-consumer-control-lost',
    description: 'the consumer button inside the anchor stops being counted',
    caseId: CONTROL,
    field: 'consumerControlCount',
    edit: (count, snapshot) => {
      if (count !== 1) fail(`expected one consumer control, found ${count}`);
      snapshot.focusableTotal -= 1;
      return 0;
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'link-snapshot-consumer-counted-as-component',
    description: "the consumer button is recorded as the component's second control",
    caseId: CONTROL,
    field: 'componentControls',
    edit: (controls, snapshot) => {
      snapshot.consumerControlCount -= 1;
      return [
        ...controls,
        {
          role: 'anchor',
          tag: 'button',
          ariaRole: null,
          href: null,
          target: null,
          rel: null,
          classes: [],
          focusable: true,
          name: 'Pin',
        },
      ];
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'link-snapshot-anchor-href-wrong',
    description: "the anchor's own record carries a different href",
    caseId: HREF,
    field: 'anchorHref',
    edit: () => '/elsewhere',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'link-snapshot-anchor-not-focusable',
    description: 'the anchor with an href is recorded as not focusable',
    caseId: HREF,
    field: 'anchorFocusable',
    edit: (value) => {
      if (value !== true) fail('the anchor was not focusable to begin with');
      return false;
    },
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'link-snapshot-inert-anchor-focusable',
    description: 'the inert anchor is recorded as focusable',
    caseId: NONE,
    field: 'anchorFocusable',
    edit: (value) => {
      if (value !== false) fail('the inert anchor was focusable to begin with');
      return true;
    },
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'link-snapshot-anchor-tag-span',
    description: "the anchor's own record says span",
    caseId: NONE,
    field: 'anchorTag',
    edit: () => 'span',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'link-snapshot-focus-inside-case',
    description: 'focus is recorded inside the case although nothing was driven',
    caseId: HREF,
    field: 'focusRole',
    edit: () => 'anchor',
    dimensions: ['interaction.focus'],
  }),

  // ---------------------------------------------------------- accessibility
  accessibilityMutation({
    id: 'link-a11y-role-lost',
    description: 'the anchor stops exposing a link role',
    caseId: HREF,
    role: 'anchor',
    edit: (exposed, role) => {
      if (exposed[role]?.role !== 'link') fail('the anchor did not expose link');
      delete exposed[role];
    },
    dimensions: ['a11y.role'],
  }),
  accessibilityMutation({
    id: 'link-a11y-name-changed',
    description: 'the accessible name differs from the content',
    caseId: HREF,
    role: 'anchor',
    edit: (exposed, role) => {
      exposed[role].name = 'Elsewhere';
    },
    dimensions: ['a11y.name'],
  }),
  accessibilityMutation({
    id: 'link-a11y-not-focusable',
    description: 'the tree stops reporting the anchor as focusable',
    caseId: HREF,
    role: 'anchor',
    edit: (exposed, role) => {
      if (exposed[role].states.focusable !== 'true') fail('the anchor was not focusable in the tree');
      exposed[role].states = {};
    },
    dimensions: ['a11y.states'],
  }),
  accessibilityMutation({
    id: 'link-a11y-inert-anchor-exposed',
    description: 'the inert anchor starts appearing in the tree as a link',
    caseId: NONE,
    role: 'anchor',
    edit: (exposed, role) => {
      if (exposed[role] !== undefined) fail('the inert anchor was already exposed');
      exposed[role] = { role: 'link', name: 'Nowhere', states: { focusable: 'true' } };
    },
    dimensions: ['a11y.role'],
  }),

  // ------------------------------------------------------------ directions
  {
    id: 'link-current-only-href-wrong',
    klass: 'directional',
    description: 'only current Vue points the href somewhere else; reference-vs-razor stays green',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [HREF],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    apply: setAnchorAttribute(HREF, 'href', '/elsewhere', 'current'),
  },
  {
    id: 'link-current-and-razor-identically-wrong',
    klass: 'directional',
    description:
      'current Vue and Razor both drop the derived rel; the two adapters agree with each other and only the reference direction can see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['rel'] },
      caseIds: [BLANK],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      setAnchorAttribute(BLANK, 'rel', null, 'current')(captures);
      setAnchorAttribute(BLANK, 'rel', null, 'razor')(captures);
    },
  },
  {
    id: 'link-current-and-razor-identically-a-button',
    klass: 'directional',
    description: 'current Vue and Razor both render the anchor as a button; only the reference direction can see it',
    expect: {
      dimensions: ['dom.structure'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [HREF],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          findNode(capture, HREF, anchor, 'anchor').tag = 'button';
        });
      }
    },
  },
];

// ----------------------------------------------------------- browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const linkBrowserMutations = [
  // ------------------------------------------- the three attribute holes
  //
  // Each names dom.nativeAttributes with the attribute as its detail. Run with
  // the pre-M25 compared vocabulary, all three report MISSED on that
  // dimension: the extractor never described the attribute, so the DOM
  // comparison had nothing to differ on. That is the false PASS the milestone
  // reproduced before adding href, target and rel to COMPARED_ATTRIBUTES.
  {
    id: 'browser-link-href-wrong',
    target: 'razor',
    caseIds: [HREF],
    description: 'the real Razor anchor points somewhere else',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [HREF] },
    beforeExtract: mutateElements(
      [HREF],
      'a.vf-link',
      `
      if (element.getAttribute('href') === '/elsewhere') throw new Error('MUTATION_NOT_APPLIED: already wrong');
      element.setAttribute('href', '/elsewhere');
    `,
    ),
  },
  {
    id: 'browser-link-target-removed',
    target: 'razor',
    caseIds: [BLANK],
    description: 'the real Razor anchor loses target=_blank',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['target'] }, caseIds: [BLANK] },
    beforeExtract: mutateElements(
      [BLANK],
      'a.vf-link',
      `
      if (!element.hasAttribute('target')) throw new Error('MUTATION_NOT_APPLIED: no target to remove');
      element.removeAttribute('target');
    `,
    ),
  },
  {
    id: 'browser-link-rel-removed',
    target: 'razor',
    caseIds: [BLANK],
    description: 'the real Razor anchor loses the derived rel, so it opens without noopener',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [BLANK] },
    beforeExtract: mutateElements(
      [BLANK],
      'a.vf-link',
      `
      if (!element.hasAttribute('rel')) throw new Error('MUTATION_NOT_APPLIED: no rel to remove');
      element.removeAttribute('rel');
    `,
    ),
  },
  {
    id: 'browser-link-rel-wrong',
    target: 'razor',
    caseIds: [EXPLICIT],
    description: 'the real Razor anchor merges the derived rel into the explicit one',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [EXPLICIT] },
    beforeExtract: mutateElements(
      [EXPLICIT],
      'a.vf-link',
      `
      if (element.getAttribute('rel') !== 'nofollow') throw new Error('MUTATION_NOT_APPLIED: unexpected rel');
      element.setAttribute('rel', 'nofollow noopener noreferrer');
    `,
    ),
  },

  // ------------------------------------------------------ semantic identity
  {
    id: 'browser-link-anchor-becomes-a-button',
    target: 'razor',
    caseIds: [HREF],
    description: 'the real anchor is replaced by a button with the same classes, text and href attribute',
    expect: {
      dimensions: ['dom.structure', 'a11y.role', 'ownership.controls'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [HREF],
    },
    beforeExtract: mutateElements(
      [HREF],
      'a.vf-link',
      `
      const button = document.createElement('button');
      button.type = 'button';
      for (const attribute of element.attributes) button.setAttribute(attribute.name, attribute.value);
      button.append(...element.childNodes);
      element.replaceWith(button);
    `,
    ),
  },
  {
    id: 'browser-link-anchor-becomes-a-div-with-role-link',
    target: 'razor',
    caseIds: [HREF],
    description:
      'the real anchor is replaced by a div with role=link, tabindex=0, the same classes, text and href attribute - which Chrome exposes exactly as it exposes the anchor',
    expect: {
      dimensions: ['dom.structure', 'ownership.controls'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [HREF],
    },
    beforeExtract: mutateElements(
      [HREF],
      'a.vf-link',
      `
      const div = document.createElement('div');
      for (const attribute of element.attributes) div.setAttribute(attribute.name, attribute.value);
      div.setAttribute('role', 'link');
      div.setAttribute('tabindex', '0');
      div.append(...element.childNodes);
      element.replaceWith(div);
    `,
    ),
  },
  {
    id: 'browser-link-no-destination-gets-a-placeholder',
    target: 'razor',
    caseIds: [NONE],
    description: 'the real inert anchor is given href="#", which makes it focusable and exposes it as a link',
    expect: {
      dimensions: ['dom.nativeAttributes', 'a11y.role', 'ownership.controls', 'interaction.state'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [NONE],
    },
    beforeExtract: mutateElements(
      [NONE],
      'a.vf-link',
      `
      if (element.hasAttribute('href')) throw new Error('MUTATION_NOT_APPLIED: the anchor already has an href');
      element.setAttribute('href', '#');
    `,
    ),
  },
  {
    id: 'browser-link-consumer-button-removed',
    target: 'razor',
    caseIds: [CONTROL],
    description: 'the consumer button inside the real anchor disappears',
    expect: { dimensions: ['dom.structure', 'ownership.controls'], caseIds: [CONTROL] },
    beforeExtract: mutateElements([CONTROL], 'a.vf-link > button', `element.remove();`),
  },

  // ------------------------------------------------------------ presentation
  {
    id: 'browser-link-always-underline-lost',
    target: 'razor',
    caseIds: [ALWAYS],
    description: 'the real always-underline modifier is misspelled, so the underline at rest disappears',
    expect: { dimensions: ['dom.canonicalClasses', 'visual'], caseIds: [ALWAYS] },
    beforeExtract: mutateElements(
      [ALWAYS],
      'a.vf-link',
      `
      if (!element.classList.contains('vf-link--underline-always')) throw new Error('MUTATION_NOT_APPLIED: no modifier');
      element.classList.replace('vf-link--underline-always', 'vf-link--underlined');
    `,
    ),
  },
  {
    id: 'browser-link-muted-colour',
    target: 'razor',
    caseIds: [MUTED],
    description: 'the real muted colour is repainted, which is the whole of what the tone does',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: [MUTED] },
    beforeExtract: mutateElements([MUTED], 'a.vf-link', `element.style.color = 'rgb(214, 51, 132)';`),
  },

  // ------------------------------------------------------------ current-only
  {
    id: 'browser-link-current-only-href-wrong',
    target: 'current',
    caseIds: [HREF],
    verifyIsolation: true,
    description:
      'only the real current Vue anchor points somewhere else; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [HREF],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements([HREF], 'a.vf-link', `element.setAttribute('href', '/elsewhere');`),
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
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

/** A well-formed approval on an approvable dimension that tolerates no real difference: rejected by accounting. */
const idle = (id, dimension, caseIds, detail, pathSelector, description) => ({
  id,
  description,
  rejectedBy: 'occurrences',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      detail,
      pathSelector,
      left: '/docs',
      right: '/elsewhere',
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'A deliberately idle entry used by the parity mutation harness.',
    });
  },
});

export const linkPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [HREF],
    'an approval for dom.structure, which must never be waivable - and which in M25 is what tells an anchor from a div with role=link',
  ),
  smuggled('smuggled-visual-approval', 'visual', [HREF], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.nativeAttributes',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [HREF],
    'an approval for ownership.controls - the evidence that the anchor is the historical native element and that the inert anchor is not a control',
  ),
  smuggled(
    'smuggled-snapshot-approval',
    'interaction.state',
    [HREF],
    "an approval for the anchor's own record, where href, target, rel and the tag are recorded a second time",
  ),
  smuggled(
    'smuggled-router-case',
    'dom.nativeAttributes',
    ['link/routed'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no router" waiver would take',
  ),
  idle(
    'idle-href-approval',
    'dom.nativeAttributes',
    [HREF],
    'href',
    'a.vf-link',
    'a well-formed href approval that tolerates a difference no target produces: the accounting rejects it as unused',
  ),
];
