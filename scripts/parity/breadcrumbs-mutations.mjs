// The negative fixtures for the VfBreadcrumbs parity gate.
//
// The M26 set. The reference trail is N native anchors decided per item by a
// rule, inside a landmark and a list, with an aria-hidden glyph between them,
// and the mutations that carry this milestone are the ones that keep the
// page looking like a breadcrumb trail while changing what it *is*:
//
//   - the semantic ones. A nav rendered as a div, an ol as a div or a ul, an
//     li as a div, an anchor as a button or as a div with role=link, the
//     current span as an anchor or an anchor as the current span. Tag identity
//     has to carry these: the DOM description records the tag and never
//     approves a structure difference, the ownership rule names the tag every
//     anchor has to be, and the tree distinguishes all but the div with
//     role=link;
//   - the ordered destinations. Two anchors with each other's href keep every
//     count intact - the same anchors, the same names, the same budget - and
//     differ only at two ordered paths of the DOM description and in the
//     ordered item records of the snapshot. No generic ordered-link rule
//     exists for this; the positional DOM comparison is what catches it;
//   - the current item. aria-current dropped, written as "true", moved to
//     the wrong item, added to a second one or collapsed from a second one:
//     Chrome 153 derives no state from the attribute, so dom.aria and the
//     snapshot's current indices are what carry it;
//   - the separator glyph. `browser-breadcrumbs-separator-glyph-swapped`
//     replaces the chevron-right polyline with chevron-down on a real Razor
//     page, on a case with no screenshot, and names dom.nativeAttributes with
//     `points` as its detail. Run with the pre-M26 compared vocabulary it
//     reports MISSED on every dimension: the extractor never described the
//     geometry, the separator is aria-hidden so the tree ignores it, and the
//     ownership snapshot counts anchors. That is the false PASS the milestone
//     reproduced before adding `points` to COMPARED_ATTRIBUTES. The capture
//     mutation of the same name cannot even apply before the fix - the DOM
//     record carried no `points` to change - and reports that rather than
//     counting as a detection;
//   - the three directions: a defect only current Vue has, a defect only
//     Razor has, and the same defect in both - the last caught by the
//     reference direction alone, which is why the reference is immutable.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const TRAIL = 'breadcrumbs/trail';
const FIVE = 'breadcrumbs/five';
const ONE_WITH_HREF = 'breadcrumbs/one-with-href';
const LAST_DROPPED = 'breadcrumbs/last-href-dropped';
const EXPLICIT = 'breadcrumbs/explicit-current';
const TWO_CURRENTS = 'breadcrumbs/two-currents';
const DISABLED = 'breadcrumbs/disabled';
const NO_DESTINATION = 'breadcrumbs/no-destination-middle';
const HREF_EMPTY = 'breadcrumbs/href-empty';
const BLANK = 'breadcrumbs/blank-derived-rel';
const EXPLICIT_REL = 'breadcrumbs/blank-explicit-rel';
const SELF = 'breadcrumbs/self';
const LABEL_EMPTY = 'breadcrumbs/aria-label-empty';
const ATTRS = 'breadcrumbs/consumer-attrs';
const ARIA = 'breadcrumbs/consumer-aria';

const nav = (node) => node.classes.includes('vf-breadcrumbs');
const list = (node) => node.classes.includes('vf-breadcrumbs__list');
const item = (node) => node.classes.includes('vf-breadcrumbs__item');
const link = (node) => node.classes.includes('vf-breadcrumbs__link');
const current = (node) => node.classes.includes('vf-breadcrumbs__current');
const separator = (node) => node.classes.includes('vf-breadcrumbs__separator');
const polyline = (node) => node.tag === 'polyline';

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

function attributeMutation({
  id,
  description,
  caseId,
  find,
  name,
  value,
  dimension = 'dom.nativeAttributes',
  target = 'razor',
  klass = 'native attributes',
}) {
  return {
    id,
    klass,
    description,
    expect: { dimensions: [dimension], details: { [dimension]: [name] }, caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, target, (capture) => {
        setAttribute(find(capture), name, value, caseId);
      });
    },
  };
}

function tagMutation({
  id,
  description,
  caseId,
  find,
  tag,
  dimensions = ['dom.structure'],
  details = { 'dom.structure': ['tag'] },
}) {
  return {
    id,
    klass: 'structure',
    description,
    expect: { dimensions, details, caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = find(capture);
        if (node.tag === tag) fail(`${caseId} node was already a ${tag}`);
        node.tag = tag;
      });
    },
  };
}

/** A capture mutation that rewrites one field of a case's breadcrumbs snapshot. */
function snapshotMutation({ id, description, caseId, field, edit, dimensions, target = 'razor' }) {
  return {
    id,
    klass: 'snapshot',
    description,
    expect: { dimensions, caseIds: [caseId] },
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

const firstLink = (caseId) => (capture) => findNode(capture, caseId, link, 'first link');
const firstCurrent = (caseId) => (capture) => findNode(capture, caseId, current, 'first current span');
const navOf = (caseId) => (capture) => findNode(capture, caseId, nav, 'nav');

export const breadcrumbsParityMutations = [
  // --------------------------------------------------------- semantic identity
  tagMutation({
    id: 'breadcrumbs-nav-becomes-a-div',
    description: 'the landmark is described as a div with the same classes and label',
    caseId: TRAIL,
    find: navOf(TRAIL),
    tag: 'div',
  }),
  tagMutation({
    id: 'breadcrumbs-list-becomes-a-div',
    description: 'the ordered list is described as a div',
    caseId: TRAIL,
    find: (capture) => findNode(capture, TRAIL, list, 'list'),
    tag: 'div',
  }),
  tagMutation({
    id: 'breadcrumbs-list-becomes-unordered',
    description: 'the ordered list is described as a ul',
    caseId: TRAIL,
    find: (capture) => findNode(capture, TRAIL, list, 'list'),
    tag: 'ul',
  }),
  tagMutation({
    id: 'breadcrumbs-item-becomes-a-div',
    description: 'the first list item is described as a div',
    caseId: TRAIL,
    find: (capture) => findNode(capture, TRAIL, item, 'item'),
    tag: 'div',
  }),
  tagMutation({
    id: 'breadcrumbs-anchor-becomes-a-button',
    description: 'the first anchor is described as a button with the same classes, text and href',
    caseId: TRAIL,
    find: firstLink(TRAIL),
    tag: 'button',
  }),
  {
    id: 'breadcrumbs-anchor-becomes-a-div-with-role-link',
    klass: 'structure',
    description:
      'the first anchor is described as a div carrying role=link and tabindex=0 - the same accessibility role, a different element',
    expect: {
      dimensions: ['dom.structure', 'dom.aria'],
      details: { 'dom.structure': ['tag'], 'dom.aria': ['role'] },
      caseIds: [TRAIL],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = firstLink(TRAIL)(capture);
        node.tag = 'div';
        node.attributes = { ...node.attributes, role: 'link', tabindex: '0' };
      });
    },
  },
  {
    id: 'breadcrumbs-current-rendered-as-a-link',
    klass: 'structure',
    description: 'the current span is described as an anchor with its dropped href restored and aria-current kept',
    expect: {
      dimensions: ['dom.structure', 'dom.canonicalClasses', 'dom.nativeAttributes'],
      details: { 'dom.structure': ['tag'], 'dom.nativeAttributes': ['href'] },
      caseIds: [LAST_DROPPED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = firstCurrent(LAST_DROPPED)(capture);
        node.tag = 'a';
        node.classes = ['vf-breadcrumbs__link'];
        node.attributes = { ...node.attributes, href: '/docs' };
      });
    },
  },
  {
    id: 'breadcrumbs-link-rendered-as-the-current-span',
    klass: 'structure',
    description: 'the first anchor is described as a span with the current class and no href',
    expect: {
      dimensions: ['dom.structure', 'dom.canonicalClasses', 'dom.nativeAttributes'],
      details: { 'dom.structure': ['tag'], 'dom.nativeAttributes': ['href'] },
      caseIds: [TRAIL],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = firstLink(TRAIL)(capture);
        node.tag = 'span';
        node.classes = ['vf-breadcrumbs__current'];
        const { href, ...rest } = node.attributes;
        if (href === undefined) fail('the anchor carried no href');
        node.attributes = rest;
      });
    },
  },
  {
    id: 'breadcrumbs-empty-href-kept-as-an-anchor',
    klass: 'structure',
    description: "the href='' item is described as an anchor with an empty href, as VfLink would render it",
    expect: {
      dimensions: ['dom.structure', 'dom.nativeAttributes'],
      details: { 'dom.structure': ['tag'], 'dom.nativeAttributes': ['href'] },
      caseIds: [HREF_EMPTY],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = firstCurrent(HREF_EMPTY)(capture);
        if (node.text !== 'Empty') fail('the first current span is not the empty-href item');
        node.tag = 'a';
        node.classes = ['vf-breadcrumbs__link'];
        node.attributes = { ...node.attributes, href: '' };
      });
    },
  },

  // -------------------------------------------------- ordered destinations
  {
    id: 'breadcrumbs-hrefs-swapped',
    klass: 'native attributes',
    description:
      "the two anchors carry each other's href: the same anchors, names and count, two different destinations at two ordered paths",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [first, second] = findNodes(capture, TRAIL, link, 'anchors');
        if (!second || first.attributes.href === second.attributes.href)
          fail('the trail has no two distinct hrefs to swap');
        [first.attributes, second.attributes] = [
          { ...first.attributes, href: second.attributes.href },
          { ...second.attributes, href: first.attributes.href },
        ];
      });
    },
  },
  attributeMutation({
    id: 'breadcrumbs-href-dropped',
    description: 'the first anchor loses its href while staying an anchor',
    caseId: TRAIL,
    find: firstLink(TRAIL),
    name: 'href',
    value: null,
  }),
  {
    id: 'breadcrumbs-href-moved-to-the-current-span',
    klass: 'native attributes',
    description: "the first anchor's href moves onto the current span: the element count and the text stay",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const anchor = firstLink(TRAIL)(capture);
        const span = firstCurrent(TRAIL)(capture);
        setAttribute(span, 'href', anchor.attributes.href, TRAIL);
        setAttribute(anchor, 'href', null, TRAIL);
      });
    },
  },
  attributeMutation({
    id: 'breadcrumbs-target-dropped',
    description: 'target=_blank disappears, so the link opens in the same tab',
    caseId: BLANK,
    find: firstLink(BLANK),
    name: 'target',
    value: null,
  }),
  attributeMutation({
    id: 'breadcrumbs-rel-dropped',
    description: 'the derived rel disappears, so a _blank link opens without noopener',
    caseId: BLANK,
    find: firstLink(BLANK),
    name: 'rel',
    value: null,
  }),
  attributeMutation({
    id: 'breadcrumbs-rel-derived-for-self',
    description: 'rel is derived for target=_self, which the reference never does',
    caseId: SELF,
    find: firstLink(SELF),
    name: 'rel',
    value: 'noopener noreferrer',
  }),
  attributeMutation({
    id: 'breadcrumbs-rel-merged-into-explicit',
    description: 'the derived rel is appended to the explicit one instead of the explicit one winning',
    caseId: EXPLICIT_REL,
    find: firstLink(EXPLICIT_REL),
    name: 'rel',
    value: 'nofollow noopener noreferrer',
  }),
  {
    id: 'breadcrumbs-labels-swapped',
    klass: 'text',
    description: "the two anchors carry each other's label while every attribute stays",
    expect: { dimensions: ['dom.text'], caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [first, second] = findNodes(capture, TRAIL, link, 'anchors');
        if (!second || first.text === second.text) fail('the trail has no two distinct labels to swap');
        [first.text, second.text] = [second.text, first.text];
      });
    },
  },

  // ---------------------------------------------------------- the current item
  attributeMutation({
    id: 'breadcrumbs-aria-current-dropped',
    description: 'the current span loses aria-current',
    caseId: TRAIL,
    find: firstCurrent(TRAIL),
    name: 'aria-current',
    value: null,
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  attributeMutation({
    id: 'breadcrumbs-aria-current-true',
    description: 'aria-current is written as "true" instead of "page"',
    caseId: TRAIL,
    find: firstCurrent(TRAIL),
    name: 'aria-current',
    value: 'true',
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  {
    id: 'breadcrumbs-aria-current-moved-to-the-wrong-item',
    klass: 'aria',
    description: 'aria-current leaves the explicitly current middle span and lands on the last anchor',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-current'] }, caseIds: [EXPLICIT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const span = firstCurrent(EXPLICIT)(capture);
        const last = findNodes(capture, EXPLICIT, link, 'anchors').at(-1);
        setAttribute(span, 'aria-current', null, EXPLICIT);
        setAttribute(last, 'aria-current', 'page', EXPLICIT);
      });
    },
  },
  attributeMutation({
    id: 'breadcrumbs-extra-aria-current',
    description: 'the destination-less middle span gains aria-current it never had',
    caseId: NO_DESTINATION,
    find: firstCurrent(NO_DESTINATION),
    name: 'aria-current',
    value: 'page',
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  {
    id: 'breadcrumbs-second-current-collapsed',
    klass: 'aria',
    description:
      'the second of two explicitly current spans loses its aria-current, which enforces a uniqueness the reference never did',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-current'] }, caseIds: [TWO_CURRENTS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const spans = findNodes(capture, TWO_CURRENTS, current, 'current spans');
        if (spans.length < 2) fail('fewer than two current spans');
        setAttribute(spans[1], 'aria-current', null, TWO_CURRENTS);
      });
    },
  },
  attributeMutation({
    id: 'breadcrumbs-disabled-gets-aria-disabled',
    description: 'the disabled span is given aria-disabled="true"',
    caseId: DISABLED,
    find: firstCurrent(DISABLED),
    name: 'aria-disabled',
    value: 'true',
    dimension: 'dom.aria',
    klass: 'aria',
  }),

  // ------------------------------------------------------------- the landmark
  attributeMutation({
    id: 'breadcrumbs-nav-label-dropped',
    description: 'the nav loses its aria-label',
    caseId: TRAIL,
    find: navOf(TRAIL),
    name: 'aria-label',
    value: null,
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  attributeMutation({
    id: 'breadcrumbs-nav-label-wrong',
    description: 'the nav is labelled "Breadcrumbs"',
    caseId: TRAIL,
    find: navOf(TRAIL),
    name: 'aria-label',
    value: 'Breadcrumbs',
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  attributeMutation({
    id: 'breadcrumbs-nav-empty-label-restored',
    description: 'the empty aria-label is replaced by the default, which the reference never restores',
    caseId: LABEL_EMPTY,
    find: navOf(LABEL_EMPTY),
    name: 'aria-label',
    value: 'Breadcrumb',
    dimension: 'dom.aria',
    klass: 'aria',
  }),

  // ------------------------------------------------------------ the separator
  attributeMutation({
    id: 'breadcrumbs-separator-not-hidden',
    description: 'the first separator loses aria-hidden',
    caseId: TRAIL,
    find: (capture) => findNode(capture, TRAIL, separator, 'separator'),
    name: 'aria-hidden',
    value: null,
    dimension: 'dom.aria',
    klass: 'aria',
  }),
  {
    id: 'breadcrumbs-separator-after-last',
    klass: 'structure',
    description: 'a separator is described after the last item too',
    expect: { dimensions: ['dom.structure'], caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const items = findNodes(capture, TRAIL, item, 'items');
        const last = items.at(-1);
        if (last.children.some(separator)) fail('the last item already had a separator');
        last.children.push(structuredClone(findNode(capture, TRAIL, separator, 'separator')));
      });
    },
  },
  {
    id: 'breadcrumbs-separator-before-first',
    klass: 'structure',
    description: 'the separators precede every item but the first instead of following every item but the last',
    expect: { dimensions: ['dom.structure'], caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const items = findNodes(capture, TRAIL, item, 'items');
        for (let index = items.length - 1; index > 0; index -= 1) {
          const moved = items[index - 1].children.find(separator);
          if (!moved) fail(`item ${index - 1} had no separator to move`);
          items[index - 1].children = items[index - 1].children.filter((child) => child !== moved);
          items[index].children.unshift(moved);
        }
      });
    },
  },
  {
    id: 'breadcrumbs-separator-missing',
    klass: 'structure',
    description: 'the first separator disappears',
    expect: { dimensions: ['dom.structure'], caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const first = findNode(capture, TRAIL, item, 'item');
        if (!first.children.some(separator)) fail('the first item had no separator');
        first.children = first.children.filter((child) => !separator(child));
      });
    },
  },
  {
    id: 'breadcrumbs-separator-duplicated',
    klass: 'structure',
    description: 'the first item carries two separators',
    expect: { dimensions: ['dom.structure'], caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const first = findNode(capture, TRAIL, item, 'item');
        const existing = first.children.find(separator);
        if (!existing) fail('the first item had no separator');
        first.children.push(structuredClone(existing));
      });
    },
  },
  {
    id: 'breadcrumbs-separator-glyph-swapped-in-dom',
    klass: 'native attributes',
    description: "the DOM record of the separator glyph carries chevron-down's points instead of chevron-right's",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['points'] }, caseIds: [TRAIL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, TRAIL, polyline, 'separator polyline');
        // Before M26 the record carried no points at all - the extractor never
        // described the geometry - and injecting one here would be testing an
        // attribute nothing compares. The mutation refuses to apply instead.
        if (node.attributes.points === undefined)
          fail('the DOM record carries no points; the geometry was never extracted');
        node.attributes = { ...node.attributes, points: '5.75 8.75 12 15 18.25 8.75' };
      });
    },
  },

  // ----------------------------------------------------------- presentation
  {
    id: 'breadcrumbs-disabled-modifier-lost',
    klass: 'classes',
    description: 'the disabled span loses its modifier, so the disabled colour is never applied',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [DISABLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = firstCurrent(DISABLED)(capture);
        if (!node.classes.includes('vf-breadcrumbs__current--disabled')) fail('the span carried no modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-breadcrumbs__current--disabled');
      });
    },
  },
  {
    id: 'breadcrumbs-consumer-class-lost',
    klass: 'classes',
    description: 'the consumer class disappears from the nav',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [ATTRS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = navOf(ATTRS)(capture);
        if (node.consumerClasses.length === 0) fail('the nav carried no consumer class');
        node.consumerClasses = [];
      });
    },
  },
  attributeMutation({
    id: 'breadcrumbs-product-data-lost',
    description: 'the product data attribute disappears from the nav',
    caseId: ATTRS,
    find: navOf(ATTRS),
    name: 'data-testid',
    value: null,
    dimension: 'dom.productData',
    klass: 'product data',
  }),
  attributeMutation({
    id: 'breadcrumbs-describedby-dangles',
    description: 'aria-describedby names an id nothing carries',
    caseId: ARIA,
    find: navOf(ARIA),
    name: 'aria-describedby',
    value: '#dangling',
    dimension: 'dom.relationships',
    klass: 'relationships',
  }),

  // ------------------------------------------------------------- ownership
  snapshotMutation({
    id: 'breadcrumbs-snapshot-loses-an-anchor',
    description: 'the ownership stage stops finding one of the anchors',
    caseId: FIVE,
    field: 'componentControls',
    edit: (controls) => {
      if (controls.length !== 4) fail(`expected four owned anchors, found ${controls.length}`);
      return controls.slice(1);
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-anchor-is-a-button',
    description: 'one owned control is recorded as a button',
    caseId: TRAIL,
    field: 'componentControls',
    edit: (controls) => controls.map((control, index) => (index === 0 ? { ...control, tag: 'button' } : control)),
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-current-counted-as-a-control',
    description: 'the lone current item is counted as an owned, focusable anchor with its dropped href',
    caseId: ONE_WITH_HREF,
    field: 'componentControls',
    edit: (controls, snapshot) => {
      if (controls.length !== 0) fail('the current item was already counted');
      snapshot.focusableTotal += 1;
      return [
        {
          role: 'link',
          tag: 'a',
          ariaRole: null,
          href: '/only',
          target: null,
          rel: null,
          classes: ['vf-breadcrumbs__link'],
          focusable: true,
          name: 'Only',
        },
      ];
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-controls-reordered',
    description: 'the owned anchors are recorded in reverse order: the same set, a different trail',
    caseId: TRAIL,
    field: 'componentControls',
    edit: (controls) => {
      if (controls.length < 2) fail('fewer than two owned anchors');
      return [...controls].reverse();
    },
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-items-swapped',
    description: "the ordered item records carry each other's href",
    caseId: TRAIL,
    field: 'breadcrumbItems',
    edit: (records) => {
      if (records.length < 2 || records[0].href === records[1].href) fail('no two distinct hrefs');
      return [{ ...records[0], href: records[1].href }, { ...records[1], href: records[0].href }, ...records.slice(2)];
    },
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-current-index-moved',
    description: 'the current index is recorded on the first item instead of the last',
    caseId: TRAIL,
    field: 'currentIndices',
    edit: (indices) => {
      if (JSON.stringify(indices) !== '[2]') fail(`unexpected current indices ${JSON.stringify(indices)}`);
      return [0];
    },
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-second-current-lost',
    description: 'the snapshot records one current index where the trail has two',
    caseId: TWO_CURRENTS,
    field: 'currentIndices',
    edit: (indices) => {
      if (JSON.stringify(indices) !== '[0,1]') fail(`unexpected current indices ${JSON.stringify(indices)}`);
      return [0];
    },
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'breadcrumbs-snapshot-nav-label-changed',
    description: 'the snapshot records a different landmark label',
    caseId: TRAIL,
    field: 'navLabel',
    edit: (label) => {
      if (label !== 'Breadcrumb') fail(`unexpected label ${label}`);
      return 'Breadcrumbs';
    },
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------------ accessibility
  accessibilityMutation({
    id: 'breadcrumbs-a11y-nav-role-lost',
    description: 'the landmark stops exposing navigation',
    caseId: TRAIL,
    role: 'nav',
    edit: (exposed, role) => {
      if (exposed[role]?.role !== 'navigation') fail('the nav did not expose navigation');
      exposed[role].role = 'generic';
    },
    dimensions: ['a11y.role'],
  }),
  accessibilityMutation({
    id: 'breadcrumbs-a11y-nav-name-changed',
    description: "the landmark's accessible name differs from the label",
    caseId: TRAIL,
    role: 'nav',
    edit: (exposed, role) => {
      exposed[role].name = 'Breadcrumbs';
    },
    dimensions: ['a11y.name'],
  }),
  accessibilityMutation({
    id: 'breadcrumbs-a11y-list-role-lost',
    description: 'the list stops being exposed, as a div in its place would be',
    caseId: TRAIL,
    role: 'list',
    edit: (exposed, role) => {
      if (exposed[role]?.role !== 'list') fail('the list did not expose list');
      delete exposed[role];
    },
    dimensions: ['a11y.role'],
  }),
  accessibilityMutation({
    id: 'breadcrumbs-a11y-item-role-lost',
    description: 'the first item exposes generic instead of listitem',
    caseId: TRAIL,
    role: 'item',
    edit: (exposed, role) => {
      if (exposed[role]?.role !== 'listitem') fail('the item did not expose listitem');
      exposed[role].role = 'generic';
    },
    dimensions: ['a11y.role'],
  }),
  accessibilityMutation({
    id: 'breadcrumbs-a11y-link-not-focusable',
    description: 'the tree stops reporting the first anchor as focusable',
    caseId: TRAIL,
    role: 'link',
    edit: (exposed, role) => {
      if (exposed[role]?.states?.focusable !== 'true') fail('the anchor was not focusable in the tree');
      exposed[role].states = {};
    },
    dimensions: ['a11y.states'],
  }),
  accessibilityMutation({
    id: 'breadcrumbs-a11y-glyph-exposed',
    description: 'the separator glyph starts appearing in the tree as an image, as it does when aria-hidden is lost',
    caseId: TRAIL,
    role: 'glyph',
    edit: (exposed, role) => {
      if (exposed[role] !== undefined) fail('the glyph was already exposed');
      exposed[role] = { role: 'image', name: '', states: {} };
    },
    dimensions: ['a11y.role'],
  }),

  // ------------------------------------------------------------ directions
  {
    id: 'breadcrumbs-current-only-hrefs-swapped',
    klass: 'directional',
    description:
      'only current Vue carries the swapped hrefs; the reference and Razor agree with each other and both directions from current see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [TRAIL],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        const [first, second] = findNodes(capture, TRAIL, link, 'anchors');
        [first.attributes, second.attributes] = [
          { ...first.attributes, href: second.attributes.href },
          { ...second.attributes, href: first.attributes.href },
        ];
      });
    },
  },
  {
    id: 'breadcrumbs-current-and-razor-identically-current-as-a-link',
    klass: 'directional',
    description:
      'current Vue and Razor both render the current item as an anchor with its href; the two adapters agree with each other and only the reference direction can see it',
    expect: {
      dimensions: ['dom.structure'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [LAST_DROPPED],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = firstCurrent(LAST_DROPPED)(capture);
          node.tag = 'a';
          node.classes = ['vf-breadcrumbs__link'];
          node.attributes = { ...node.attributes, href: '/docs' };
        });
      }
    },
  },
  {
    id: 'breadcrumbs-current-and-razor-identically-rel-dropped',
    klass: 'directional',
    description: 'current Vue and Razor both drop the derived rel; only the reference direction can see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['rel'] },
      caseIds: [BLANK],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => setAttribute(firstLink(BLANK)(capture), 'rel', null, BLANK));
      }
    },
  },
];

// ----------------------------------------------------------- browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const breadcrumbsBrowserMutations = [
  // -------------------------------------------------- the separator glyph
  //
  // The false PASS this milestone reproduced. Run with the pre-M26 compared
  // vocabulary this reports MISSED: the case has no screenshot, the separator
  // is aria-hidden so the tree ignores the glyph, the ownership snapshot
  // counts anchors, and the DOM record never described the polyline's
  // geometry. With `points` in the vocabulary it is detected on the named
  // dimension.
  {
    id: 'browser-breadcrumbs-separator-glyph-swapped',
    target: 'razor',
    caseIds: [LAST_DROPPED],
    description:
      'the real Razor separator renders chevron-down in place of chevron-right - the two glyphs differ in nothing but their points',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['points'] },
      caseIds: [LAST_DROPPED],
    },
    beforeExtract: mutateElements(
      [LAST_DROPPED],
      '.vf-breadcrumbs__separator polyline',
      `
      if (element.getAttribute('points') !== '8.75 5.75 15 12 8.75 18.25') throw new Error('MUTATION_NOT_APPLIED: not the chevron-right polyline');
      element.setAttribute('points', '5.75 8.75 12 15 18.25 8.75');
    `,
    ),
  },

  // --------------------------------------------------- ordered destinations
  {
    id: 'browser-breadcrumbs-hrefs-swapped',
    target: 'razor',
    caseIds: [TRAIL],
    description: "the two real Razor anchors carry each other's href",
    expect: {
      dimensions: ['dom.nativeAttributes', 'ownership.controls', 'interaction.state'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [TRAIL],
    },
    beforeExtract: mutateElements(
      [TRAIL],
      'ol.vf-breadcrumbs__list',
      `
      const anchors = element.querySelectorAll('a.vf-breadcrumbs__link');
      if (anchors.length !== 2) throw new Error('MUTATION_NOT_APPLIED: expected two anchors');
      const first = anchors[0].getAttribute('href');
      anchors[0].setAttribute('href', anchors[1].getAttribute('href'));
      anchors[1].setAttribute('href', first);
    `,
    ),
  },
  {
    id: 'browser-breadcrumbs-rel-removed',
    target: 'razor',
    caseIds: [BLANK],
    description: 'the real Razor anchor loses the derived rel, so it opens without noopener',
    expect: {
      dimensions: ['dom.nativeAttributes', 'ownership.controls'],
      details: { 'dom.nativeAttributes': ['rel'] },
      caseIds: [BLANK],
    },
    beforeExtract: mutateElements(
      [BLANK],
      'a.vf-breadcrumbs__link',
      `
      if (!element.hasAttribute('rel')) throw new Error('MUTATION_NOT_APPLIED: no rel to remove');
      element.removeAttribute('rel');
    `,
    ),
  },

  // ------------------------------------------------------ semantic identity
  {
    id: 'browser-breadcrumbs-nav-becomes-a-div',
    target: 'razor',
    caseIds: [TRAIL],
    description:
      'the real landmark is replaced by a div with the same classes and label, which Chrome exposes as generic',
    expect: { dimensions: ['dom.structure', 'a11y.role'], details: { 'dom.structure': ['tag'] }, caseIds: [TRAIL] },
    beforeExtract: mutateElements([TRAIL], 'nav.vf-breadcrumbs', replaceWith('div')),
  },
  {
    id: 'browser-breadcrumbs-list-becomes-a-div',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'the real ordered list is replaced by a div, which Chrome drops from the tree',
    expect: { dimensions: ['dom.structure', 'a11y.role'], details: { 'dom.structure': ['tag'] }, caseIds: [TRAIL] },
    beforeExtract: mutateElements([TRAIL], 'ol.vf-breadcrumbs__list', replaceWith('div')),
  },
  {
    id: 'browser-breadcrumbs-items-become-divs',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'the real list items are replaced by divs, which Chrome exposes as generic',
    expect: { dimensions: ['dom.structure', 'a11y.role'], details: { 'dom.structure': ['tag'] }, caseIds: [TRAIL] },
    beforeExtract: mutateElements([TRAIL], 'li.vf-breadcrumbs__item', replaceWith('div')),
  },
  {
    id: 'browser-breadcrumbs-anchor-becomes-a-button',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'the first real anchor is replaced by a button with the same classes, text and href attribute',
    expect: {
      dimensions: ['dom.structure', 'a11y.role', 'ownership.controls'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [TRAIL],
    },
    beforeExtract: mutateElements(
      [TRAIL],
      'li:first-child > a.vf-breadcrumbs__link',
      replaceWith('button', { type: 'button' }),
    ),
  },
  {
    id: 'browser-breadcrumbs-anchor-becomes-a-div-with-role-link',
    target: 'razor',
    caseIds: [TRAIL],
    description:
      'the first real anchor is replaced by a div with role=link, tabindex=0, the same classes, text and href attribute - which Chrome exposes exactly as it exposes the anchor',
    expect: {
      dimensions: ['dom.structure', 'ownership.controls'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [TRAIL],
    },
    beforeExtract: mutateElements(
      [TRAIL],
      'li:first-child > a.vf-breadcrumbs__link',
      replaceWith('div', { role: 'link', tabindex: '0' }),
    ),
  },
  {
    id: 'browser-breadcrumbs-current-becomes-a-link',
    target: 'razor',
    caseIds: [LAST_DROPPED],
    description: 'the real current span is replaced by an anchor carrying its dropped href and aria-current',
    expect: {
      dimensions: ['dom.structure', 'ownership.controls', 'interaction.state'],
      details: { 'dom.structure': ['tag'] },
      caseIds: [LAST_DROPPED],
    },
    beforeExtract: mutateElements(
      [LAST_DROPPED],
      'span.vf-breadcrumbs__current',
      replaceWith('a', { href: '/docs', class: 'vf-breadcrumbs__link' }),
    ),
  },

  // ------------------------------------------------------ the current item
  {
    id: 'browser-breadcrumbs-aria-current-dropped',
    target: 'razor',
    caseIds: [TRAIL],
    description:
      'the real current span loses aria-current: the DOM and the snapshot see it, the tree exposes no current state to lose',
    expect: {
      dimensions: ['dom.aria', 'interaction.state'],
      details: { 'dom.aria': ['aria-current'] },
      caseIds: [TRAIL],
    },
    beforeExtract: mutateElements([TRAIL], 'span.vf-breadcrumbs__current', `element.removeAttribute('aria-current');`),
  },
  {
    id: 'browser-breadcrumbs-second-current-collapsed',
    target: 'razor',
    caseIds: [TWO_CURRENTS],
    description: 'the second of two real current spans loses its aria-current',
    expect: {
      dimensions: ['dom.aria', 'interaction.state'],
      details: { 'dom.aria': ['aria-current'] },
      caseIds: [TWO_CURRENTS],
    },
    beforeExtract: mutateElements(
      [TWO_CURRENTS],
      'li:nth-child(2) > span.vf-breadcrumbs__current',
      `element.removeAttribute('aria-current');`,
    ),
  },
  {
    id: 'browser-breadcrumbs-nav-label-changed',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'the real landmark is relabelled',
    expect: {
      dimensions: ['dom.aria', 'a11y.name', 'interaction.state'],
      details: { 'dom.aria': ['aria-label'] },
      caseIds: [TRAIL],
    },
    beforeExtract: mutateElements([TRAIL], 'nav.vf-breadcrumbs', `element.setAttribute('aria-label', 'Breadcrumbs');`),
  },

  // -------------------------------------------------------- the separator
  {
    id: 'browser-breadcrumbs-separator-unhidden',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'aria-hidden leaves the real separators, so the glyph enters the accessibility tree as an image',
    expect: { dimensions: ['dom.aria', 'a11y.role'], details: { 'dom.aria': ['aria-hidden'] }, caseIds: [TRAIL] },
    beforeExtract: mutateElements([TRAIL], 'span.vf-breadcrumbs__separator', `element.removeAttribute('aria-hidden');`),
  },
  {
    id: 'browser-breadcrumbs-separator-after-last',
    target: 'razor',
    caseIds: [TRAIL],
    description: 'the real last item gains a separator',
    expect: { dimensions: ['dom.structure', 'interaction.state'], caseIds: [TRAIL] },
    beforeExtract: mutateElements(
      [TRAIL],
      'li.vf-breadcrumbs__item:last-child',
      `
      const donor = element.parentElement.querySelector('.vf-breadcrumbs__separator');
      if (!donor || element.querySelector('.vf-breadcrumbs__separator')) throw new Error('MUTATION_NOT_APPLIED');
      element.append(donor.cloneNode(true));
    `,
    ),
  },

  // -------------------------------------------------------- presentation
  {
    id: 'browser-breadcrumbs-disabled-colour',
    target: 'razor',
    caseIds: [DISABLED],
    description: 'the real disabled span is repainted, which is the whole of what the modifier does',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: [DISABLED] },
    beforeExtract: mutateElements(
      [DISABLED],
      'span.vf-breadcrumbs__current--disabled',
      `element.style.color = 'rgb(214, 51, 132)';`,
    ),
  },

  // -------------------------------------------------------- current-only
  {
    id: 'browser-breadcrumbs-current-only-hrefs-swapped',
    target: 'current',
    caseIds: [TRAIL],
    verifyIsolation: true,
    description:
      "only the real current Vue anchors carry each other's href; reference and Razor are re-captured untouched",
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [TRAIL],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements(
      [TRAIL],
      'ol.vf-breadcrumbs__list',
      `
      const anchors = element.querySelectorAll('a.vf-breadcrumbs__link');
      const first = anchors[0].getAttribute('href');
      anchors[0].setAttribute('href', anchors[1].getAttribute('href'));
      anchors[1].setAttribute('href', first);
    `,
    ),
  },
];

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
      left: '/',
      right: '/elsewhere',
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'A deliberately idle entry used by the parity mutation harness.',
    });
  },
});

export const breadcrumbsPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [TRAIL],
    'an approval for dom.structure, which must never be waivable - and which in M26 is what tells a nav from a div, an ol from a ul and an anchor from a div with role=link',
  ),
  smuggled('smuggled-visual-approval', 'visual', [TRAIL], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.nativeAttributes',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [TRAIL],
    'an approval for ownership.controls - the evidence that every anchor is the historical native element and that the current item is not a control',
  ),
  smuggled(
    'smuggled-snapshot-approval',
    'interaction.state',
    [TRAIL],
    "an approval for the trail's own record, where the ordered destinations and the current indices are recorded a second time",
  ),
  smuggled(
    'smuggled-router-case',
    'dom.nativeAttributes',
    ['breadcrumbs/routed'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no router" waiver would take',
  ),
  idle(
    'idle-href-approval',
    'dom.nativeAttributes',
    [TRAIL],
    'href',
    'a.vf-breadcrumbs__link',
    'a well-formed href approval that tolerates a difference no target produces: the accounting rejects it as unused',
  ),
];
