// The negative fixture for the VfGroupBox parity gate.
//
// What this set has to prove, beyond what the accordion's already proved for a
// component that owns a control:
//
//   - the element identities are evidence of their own. A fieldset that is a
//     div with role=group, a legend that is a div, a region that is a section,
//     a trigger without type="button" - each is identical, or nearly, in the
//     accessibility tree, and each fails in the DOM;
//   - the JavaScript title test is evidence. A Razor page that dropped the
//     legend for the title "0" - PHP truthiness - fails;
//   - the closed dangling aria-controls is evidence. "Fixing" it by removing
//     the attribute fails, and so does resolving it to something;
//   - native activation is evidence. A port that handled Enter and Space on
//     keydown - the accordion's contract - toggles the same way and fails on
//     the prevented keydown; a pointer toggle that stopped working fails;
//   - v-if is evidence. Content hidden instead of removed, or a nested group
//     box that survived its parent's collapse, fails on convergence;
//   - the controller's ownership is evidence: a second bootstrap that binds a
//     trigger twice, and a click that also toggles a sibling, fail;
//   - the controlled-mode divergence is real: a Razor controller that waited
//     for a parent, as a Vue controlled group box does, would never toggle on
//     the round-trip scenario, and fails.
//
// Capture mutations perturb the stored evidence and prove the comparator
// reports each dimension; browser mutations rewrite real elements on the real
// pages, before extraction or around a gesture, and prove the extractor, the
// driver and the screenshots see the defect.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (node) => node.tag === 'fieldset' && node.classes.includes('vf-group-box');
const legend = (node) => node.classes.includes('vf-group-box__legend');
const trigger = (node) => node.tag === 'button' && node.classes.includes('vf-group-box__trigger');
const content = (node) => node.classes.includes('vf-group-box__content');
const title = (node) => node.classes.includes('vf-group-box__title');

const STATIC = 'group-box/static-untitled';
const TITLED = 'group-box/titled';
const EMPTY_TITLE = 'group-box/empty-title';
const ZERO = 'group-box/title-zero';
const ZERO_COLLAPSIBLE = 'group-box/title-zero-collapsible';
const OPEN = 'group-box/collapsible-open';
const CLOSED = 'group-box/collapsible-default-collapsed';
const DISABLED_OPEN = 'group-box/disabled-open';
const DISABLED_STATIC = 'group-box/disabled-static';
const ICON = 'group-box/custom-toggle-icon';
const LONG = 'group-box/long-title-collapsible';
const CONSUMER_OPEN = 'group-box/consumer-control-open';
const CONSUMER_IN_TITLE = 'group-box/consumer-control-in-title';
const CONSUMER_CLASS = 'group-box/consumer-class';
const CONSUMER_ATTRS = 'group-box/consumer-attributes';
const CONSUMER_EXPANDED = 'group-box/consumer-aria-expanded-on-root';
const NESTED = 'group-box/nested';
const SIBLINGS = 'group-box/siblings';
const CLICK_COLLAPSES = 'group-box/interaction-click-collapses';
const CLICK_EXPANDS = 'group-box/interaction-click-expands';
const ENTER_COLLAPSES = 'group-box/interaction-enter-collapses';
const SPACE_EXPANDS = 'group-box/interaction-space-expands';
const DISABLED_ENTER = 'group-box/interaction-disabled-enter';
const CONTROLLED = 'group-box/interaction-controlled-model';
const SIBLING_ISOLATION = 'group-box/interaction-sibling-isolation';
const NESTED_RERENDER = 'group-box/interaction-nested-rerender';

/** A capture mutation that rewrites one field of a case's snapshot on one target. */
function snapshotMutation({ id, description, caseId, field, from, to, dimensions, target = 'razor', directions }) {
  return {
    id,
    klass: 'snapshot',
    description,
    expect: { dimensions, caseIds: [caseId], ...(directions ? { directions } : {}) },
    apply(captures) {
      eachTheme(captures, target, (capture) => {
        const snapshot = capture.interactions[caseId];
        if (snapshot === undefined) fail(`${caseId} has no snapshot; the stage did not run at all`);
        if (JSON.stringify(snapshot[field]) !== JSON.stringify(from)) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(snapshot[field])}, not ${JSON.stringify(from)}`);
        }
        snapshot[field] = to;
      });
    },
  };
}

/** A capture mutation on one node of a case's initial DOM record on one target. */
function domMutation({ id, klass, description, caseId, dimensions, details, target = 'razor', directions, edit }) {
  return {
    id,
    klass,
    description,
    expect: { dimensions, caseIds: [caseId], ...(details ? { details } : {}), ...(directions ? { directions } : {}) },
    apply(captures) {
      eachTheme(captures, target, (capture) => edit(capture));
    },
  };
}

/** A capture mutation on the post-interaction DOM record of one target. */
function liveDomMutation({ id, description, caseId, dimensions, target = 'razor', directions, edit }) {
  return {
    id,
    klass: 'live dom',
    description,
    expect: { dimensions, caseIds: [caseId], ...(directions ? { directions } : {}) },
    apply(captures) {
      eachTheme(captures, target, (capture) => {
        const dom = capture.interactionDom?.[caseId];
        if (!dom) fail(`${caseId} has no post-interaction DOM; the live stage did not run`);
        edit(dom);
      });
    },
  };
}

function walk(nodes, visit) {
  for (const node of nodes) {
    visit(node);
    walk(node.children, visit);
  }
}

function findIn(dom, predicate, what) {
  let found = null;
  walk(dom, (node) => {
    if (found === null && predicate(node)) found = node;
  });
  if (!found) fail(`no ${what} in the post-interaction DOM`);
  return found;
}

/** The parent of the first node the predicate finds, and its index there. */
function parentOf(nodes, predicate) {
  for (const node of nodes) {
    const index = node.children.findIndex(predicate);
    if (index >= 0) return { parent: node, index };
    const deeper = parentOf(node.children, predicate);
    if (deeper) return deeper;
  }
  return null;
}

// ------------------------------------------------------------ capture mutations

export const groupBoxParityMutations = [
  // ---------------------------------------------------------------- ownership
  {
    id: 'group-box-trigger-removed-consumer-remains',
    klass: 'ownership',
    description:
      'the component trigger is gone and the consumer button stands alone: the focusable total is unchanged and the ownership evidence has to say so',
    expect: { dimensions: ['ownership.controls'], caseIds: [CONSUMER_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[CONSUMER_OPEN];
        if (snapshot.componentControls.length !== 1 || snapshot.consumerControlCount !== 1)
          fail('unexpected ownership');
        snapshot.componentControls = [];
        snapshot.consumerControlCount = 2;
      });
    },
  },
  {
    id: 'group-box-trigger-becomes-a-div-in-ownership',
    klass: 'ownership',
    description: 'the ownership record says the trigger is a div: identity, with the count untouched',
    expect: { dimensions: ['ownership.controls'], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [control] = capture.interactions[OPEN].componentControls;
        if (control.tag !== 'button') fail('trigger is not a button');
        control.tag = 'div';
      });
    },
  },
  {
    id: 'group-box-static-grows-a-trigger',
    klass: 'ownership',
    description:
      'a titled static group records a component trigger - the port that ignored "collapsible needs a title"',
    expect: { dimensions: ['ownership.controls'], caseIds: [TITLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[TITLED];
        if (snapshot.componentControls.length !== 0) fail('the static group already owns a control');
        snapshot.componentControls = [
          {
            role: 'trigger',
            tag: 'button',
            type: 'button',
            path: 'x',
            expanded: 'true',
            disabled: false,
            focusable: true,
            controls: 'panel',
            name: 'Shipping address',
          },
        ];
        snapshot.focusableTotal += 1;
      });
    },
  },
  {
    id: 'group-box-consumer-link-classified-as-component',
    klass: 'ownership',
    description: "the consumer's link inside the title slot is recorded as the component's",
    expect: { dimensions: ['ownership.controls'], caseIds: [CONSUMER_IN_TITLE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[CONSUMER_IN_TITLE];
        if (snapshot.consumerControlCount !== 1) fail('no consumer link');
        snapshot.componentControls = [
          ...snapshot.componentControls,
          { ...snapshot.componentControls[0], tag: 'a', name: 'read' },
        ];
        snapshot.consumerControlCount = 0;
      });
    },
  },
  snapshotMutation({
    id: 'group-box-ownership-stops-being-recorded',
    description: 'the snapshot no longer claims the component posture',
    caseId: OPEN,
    field: 'ownershipPosture',
    from: 'component',
    to: 'unmeasured',
    dimensions: ['ownership.controls'],
  }),

  // ------------------------------------------------------------ element identity
  domMutation({
    id: 'group-box-root-becomes-a-div',
    klass: 'structure',
    description: 'the fieldset is described as a div with role=group - the same group in the tree',
    caseId: OPEN,
    dimensions: ['dom.structure'],
    edit(capture) {
      const node = findNode(capture, OPEN, root, 'fieldset');
      node.tag = 'div';
      node.attributes.role = 'group';
    },
  }),
  domMutation({
    id: 'group-box-legend-becomes-a-div',
    klass: 'structure',
    description: 'the legend is described as a div',
    caseId: TITLED,
    dimensions: ['dom.structure'],
    edit(capture) {
      findNode(capture, TITLED, legend, 'legend').tag = 'div';
    },
  }),
  domMutation({
    id: 'group-box-content-becomes-a-section',
    klass: 'structure',
    description: 'the region is a section instead of a div with role=region - identical in the tree',
    caseId: OPEN,
    dimensions: ['dom.structure'],
    edit(capture) {
      const node = findNode(capture, OPEN, content, 'content');
      node.tag = 'section';
      delete node.attributes.role;
    },
  }),
  domMutation({
    id: 'group-box-title-zero-loses-its-legend',
    klass: 'structure',
    description: 'the title "0" renders no legend: PHP truthiness',
    caseId: ZERO,
    dimensions: ['dom.structure'],
    edit(capture) {
      const found = parentOf(capture.extracted[ZERO].dom, legend);
      if (!found) fail('no legend for the title "0"');
      found.parent.children.splice(found.index, 1);
    },
  }),
  domMutation({
    id: 'group-box-empty-title-grows-a-legend',
    klass: 'structure',
    description: 'the empty title renders an empty legend',
    caseId: EMPTY_TITLE,
    dimensions: ['dom.structure'],
    edit(capture) {
      const node = findNode(capture, EMPTY_TITLE, root, 'fieldset');
      node.children.unshift({
        tag: 'legend',
        classes: ['vf-group-box__legend'],
        consumerClasses: [],
        attributes: {},
        children: [],
      });
    },
  }),
  domMutation({
    id: 'group-box-title-span-dropped',
    klass: 'structure',
    description: 'the static legend holds its text without the title span',
    caseId: TITLED,
    dimensions: ['dom.structure'],
    edit(capture) {
      const node = findNode(capture, TITLED, legend, 'legend');
      if (!node.children.some(title)) fail('no title span');
      node.children = [];
    },
  }),
  domMutation({
    id: 'group-box-trigger-type-missing',
    klass: 'native',
    description: 'the trigger has no type - a submit button inside a form, identical in the tree',
    caseId: OPEN,
    dimensions: ['dom.nativeAttributes'],
    details: { 'dom.nativeAttributes': ['type'] },
    edit(capture) {
      const node = findNode(capture, OPEN, trigger, 'trigger');
      if (node.attributes.type !== 'button') fail('trigger is not type=button');
      delete node.attributes.type;
    },
  }),

  // ------------------------------------------------------------ ids and relationships
  domMutation({
    id: 'group-box-aria-controls-points-at-the-trigger',
    klass: 'relationship',
    description: 'the open trigger controls itself; every other attribute is as rendered',
    caseId: OPEN,
    dimensions: ['dom.relationships'],
    details: { 'dom.relationships': ['aria-controls'] },
    edit(capture) {
      const node = findNode(capture, OPEN, trigger, 'trigger');
      if (node.attributes['aria-controls'] !== '#id1') fail(`aria-controls is ${node.attributes['aria-controls']}`);
      node.attributes['aria-controls'] = '#id0';
    },
  }),
  domMutation({
    id: 'group-box-content-labelled-by-itself',
    klass: 'relationship',
    description: 'the region names itself as its label',
    caseId: OPEN,
    dimensions: ['dom.relationships'],
    details: { 'dom.relationships': ['aria-labelledby'] },
    edit(capture) {
      const node = findNode(capture, OPEN, content, 'content');
      if (node.attributes['aria-labelledby'] !== '#id0') fail('labelledby');
      node.attributes['aria-labelledby'] = '#id1';
    },
  }),
  domMutation({
    id: 'group-box-closed-aria-controls-removed',
    klass: 'relationship',
    description:
      'the closed trigger stops naming the absent content - the dangling reference "fixed" - identical in the tree',
    caseId: CLOSED,
    dimensions: ['dom.relationships'],
    details: { 'dom.relationships': ['aria-controls'] },
    edit(capture) {
      const node = findNode(capture, CLOSED, trigger, 'trigger');
      if (node.attributes['aria-controls'] !== '#dangling')
        fail(`closed reference is ${node.attributes['aria-controls']}`);
      delete node.attributes['aria-controls'];
    },
  }),
  domMutation({
    id: 'group-box-closed-aria-controls-resolves',
    klass: 'relationship',
    description: 'the closed trigger resolves to some element instead of dangling',
    caseId: CLOSED,
    dimensions: ['dom.relationships'],
    edit(capture) {
      findNode(capture, CLOSED, trigger, 'trigger').attributes['aria-controls'] = '#id0';
    },
  }),
  domMutation({
    id: 'group-box-static-content-id-dropped',
    klass: 'relationship',
    description: 'the unreferenced static content id is "cleaned up"',
    caseId: STATIC,
    dimensions: ['dom.relationships'],
    details: { 'dom.relationships': ['id'] },
    edit(capture) {
      const node = findNode(capture, STATIC, content, 'content');
      if (node.attributes.id !== '#id0') fail(`static content id is ${node.attributes.id}`);
      delete node.attributes.id;
    },
  }),
  domMutation({
    id: 'group-box-trigger-and-content-ids-swapped',
    klass: 'relationship',
    description: 'the trigger and the content swap id tokens and references: the direction of the pair is wrong',
    caseId: OPEN,
    dimensions: ['dom.relationships'],
    edit(capture) {
      const button = findNode(capture, OPEN, trigger, 'trigger');
      const region = findNode(capture, OPEN, content, 'content');
      button.attributes.id = '#id1';
      region.attributes.id = '#id0';
    },
  }),
  snapshotMutation({
    id: 'group-box-live-controls-resolve-elsewhere',
    description: 'after the click the trigger controls something other than its content',
    caseId: CLICK_EXPANDS,
    field: 'controlsResolved',
    from: 'panel',
    to: 'other',
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'group-box-live-content-labelled-by-other',
    description: 'after the click the content is labelled by something other than its trigger',
    caseId: CLICK_EXPANDS,
    field: 'panelLabelledBy',
    from: 'trigger',
    to: 'other',
    dimensions: ['interaction.relationships'],
  }),
  {
    id: 'group-box-nested-relationship-crosses-instances',
    klass: 'relationship',
    description: 'the inner trigger controls something outside its own instance',
    expect: { dimensions: ['ownership.controls'], caseIds: [NESTED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const inner = capture.interactions[NESTED].componentControls[1];
        if (!inner || inner.controls !== 'dangling') fail('inner trigger is not the closed nested one');
        inner.controls = 'other';
      });
    },
  },

  // ------------------------------------------------------------ ARIA and the tree
  domMutation({
    id: 'group-box-aria-expanded-inverted-in-dom',
    klass: 'aria',
    description: 'the open trigger announces false while the content is rendered',
    caseId: OPEN,
    dimensions: ['dom.aria'],
    details: { 'dom.aria': ['aria-expanded'] },
    edit(capture) {
      findNode(capture, OPEN, trigger, 'trigger').attributes['aria-expanded'] = 'false';
    },
  }),
  domMutation({
    id: 'group-box-region-role-lost',
    klass: 'aria',
    description: 'the collapsible content is rendered without role=region',
    caseId: OPEN,
    dimensions: ['dom.aria'],
    details: { 'dom.aria': ['role'] },
    edit(capture) {
      delete findNode(capture, OPEN, content, 'content').attributes.role;
    },
  }),
  domMutation({
    id: 'group-box-aria-disabled-added',
    klass: 'aria',
    description: 'the disabled trigger also carries aria-disabled - the tree says disabled either way',
    caseId: DISABLED_OPEN,
    dimensions: ['dom.aria'],
    details: { 'dom.aria': ['aria-disabled'] },
    edit(capture) {
      findNode(capture, DISABLED_OPEN, trigger, 'trigger').attributes['aria-disabled'] = 'true';
    },
  }),
  domMutation({
    id: 'group-box-disabled-becomes-aria-disabled',
    klass: 'native',
    description: 'the trigger is aria-disabled instead of natively disabled, so it stays focusable',
    caseId: DISABLED_OPEN,
    dimensions: ['dom.nativeAttributes', 'dom.aria'],
    edit(capture) {
      const node = findNode(capture, DISABLED_OPEN, trigger, 'trigger');
      if (node.attributes.disabled === undefined) fail('not disabled');
      delete node.attributes.disabled;
      node.attributes['aria-disabled'] = 'true';
    },
  }),
  domMutation({
    id: 'group-box-disabled-reaches-the-fieldset',
    klass: 'native',
    description: 'disabled is forwarded onto the fieldset, disabling every descendant control',
    caseId: DISABLED_STATIC,
    dimensions: ['dom.nativeAttributes'],
    details: { 'dom.nativeAttributes': ['disabled'] },
    edit(capture) {
      findNode(capture, DISABLED_STATIC, root, 'fieldset').attributes.disabled = '';
    },
  }),
  domMutation({
    id: 'group-box-consumer-aria-expanded-moves-onto-the-trigger',
    klass: 'aria',
    description: "a consumer aria-expanded lands on the trigger, overriding the component's own",
    caseId: CONSUMER_EXPANDED,
    dimensions: ['dom.aria'],
    edit(capture) {
      const fieldset = findNode(capture, CONSUMER_EXPANDED, root, 'fieldset');
      const button = findNode(capture, CONSUMER_EXPANDED, trigger, 'trigger');
      if (fieldset.attributes['aria-expanded'] !== 'true') fail('consumer aria-expanded not on the root');
      delete fieldset.attributes['aria-expanded'];
      button.attributes['aria-expanded'] = 'true';
    },
  }),
  {
    id: 'group-box-ax-expanded-wrong-while-dom-right',
    klass: 'aria',
    description: 'the tree exposes the open trigger as collapsed while every attribute is right',
    expect: { dimensions: ['a11y.states'], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.accessibility[OPEN]?.trigger;
        if (node?.states?.expanded !== 'true') fail(`tree expanded=${node?.states?.expanded}`);
        node.states.expanded = 'false';
      });
    },
  },
  {
    id: 'group-box-ax-group-loses-its-name',
    klass: 'aria',
    description: 'the fieldset is exposed as an unnamed group - a legend that no longer names it',
    expect: { dimensions: ['a11y.name'], caseIds: [TITLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.accessibility[TITLED]?.root;
        if (!node?.name) fail(`group name ${node?.name}`);
        node.name = '';
      });
    },
  },
  {
    id: 'group-box-ax-legend-becomes-generic',
    klass: 'aria',
    description: 'the legend is exposed as a generic element',
    expect: { dimensions: ['a11y.role'], caseIds: [TITLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.accessibility[TITLED]?.legend;
        if (!node) fail('no legend in the tree');
        node.role = 'generic';
      });
    },
  },
  {
    id: 'group-box-ax-region-lost',
    klass: 'aria',
    description: 'the collapsible content is no longer exposed as a region',
    expect: { dimensions: ['a11y.role'], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.accessibility[OPEN]?.content) fail('no content in the tree');
        delete capture.accessibility[OPEN].content;
      });
    },
  },
  {
    id: 'group-box-ax-custom-icon-name-differs',
    klass: 'aria',
    description: 'the trigger with a custom toggle icon is named without the icon - as if the hidden wrapper stayed',
    expect: { dimensions: ['a11y.name'], caseIds: [ICON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.accessibility[ICON]?.trigger;
        if (node?.name !== '+ Invoice details') fail(`trigger name ${node?.name}`);
        node.name = 'Invoice details';
      });
    },
  },
  {
    id: 'group-box-ax-disabled-trigger-focusable',
    klass: 'aria',
    description: 'the disabled trigger is exposed as focusable - aria-disabled rather than native',
    expect: { dimensions: ['a11y.states'], caseIds: [DISABLED_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.accessibility[DISABLED_OPEN]?.trigger;
        if (!node || node.states.focusable !== undefined) fail('disabled trigger already focusable');
        node.states.focusable = 'true';
      });
    },
  },

  // ------------------------------------------------------------ classes and data
  domMutation({
    id: 'group-box-consumer-class-replaces-canonical',
    klass: 'classes',
    description: 'the consumer class replaces the canonical classes instead of following them',
    caseId: CONSUMER_CLASS,
    dimensions: ['dom.canonicalClasses'],
    edit(capture) {
      findNode(capture, CONSUMER_CLASS, root, 'fieldset').classes = [];
    },
  }),
  domMutation({
    id: 'group-box-collapsed-modifier-missing',
    klass: 'classes',
    description: 'the closed group lacks its collapsed modifier',
    caseId: CLOSED,
    dimensions: ['dom.canonicalClasses'],
    edit(capture) {
      const node = findNode(capture, CLOSED, root, 'fieldset');
      node.classes = node.classes.filter((name) => name !== 'vf-group-box--collapsed');
    },
  }),
  domMutation({
    id: 'group-box-trigger-class-missing',
    klass: 'classes',
    description: 'the trigger lacks the group box class',
    caseId: OPEN,
    dimensions: ['dom.canonicalClasses'],
    edit(capture) {
      const node = findNode(capture, OPEN, trigger, 'trigger');
      node.classes = node.classes.filter((name) => name !== 'vf-group-box__trigger');
    },
  }),
  domMutation({
    id: 'group-box-trigger-not-ghost',
    klass: 'classes',
    description: 'the trigger is a secondary button rather than a ghost one',
    caseId: OPEN,
    dimensions: ['dom.canonicalClasses'],
    edit(capture) {
      const node = findNode(capture, OPEN, trigger, 'trigger');
      node.classes = node.classes.map((name) => (name === 'vf-button--ghost' ? 'vf-button--secondary' : name));
    },
  }),
  domMutation({
    id: 'group-box-consumer-data-attribute-lost',
    klass: 'product data',
    description: 'a consumer data attribute never reaches the fieldset',
    caseId: CONSUMER_ATTRS,
    dimensions: ['dom.productData'],
    edit(capture) {
      const node = findNode(capture, CONSUMER_ATTRS, root, 'fieldset');
      if (node.attributes['data-testid'] === undefined) fail('no data-testid');
      delete node.attributes['data-testid'];
    },
  }),
  domMutation({
    id: 'group-box-consumer-name-lost',
    klass: 'native',
    description: 'the consumer name never reaches the fieldset',
    caseId: CONSUMER_ATTRS,
    dimensions: ['dom.nativeAttributes'],
    details: { 'dom.nativeAttributes': ['name'] },
    edit(capture) {
      const node = findNode(capture, CONSUMER_ATTRS, root, 'fieldset');
      if (node.attributes.name !== 'invoice') fail('no name');
      delete node.attributes.name;
    },
  }),
  {
    id: 'group-box-legend-geometry',
    klass: 'geometry',
    description: 'the legend loses its inline padding',
    expect: { dimensions: ['style.geometry'], caseIds: [TITLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const styles = capture.extracted[TITLED].styles.legend;
        if (!styles) fail('no legend geometry');
        styles.boxWidth -= 9;
        styles.width = `${Number.parseFloat(styles.width) - 9}px`;
      });
    },
  },

  // ------------------------------------------------------------ live state
  snapshotMutation({
    id: 'group-box-content-hidden-instead-of-removed',
    description: 'after collapsing the content stays in the DOM - v-show, not v-if',
    caseId: CLICK_COLLAPSES,
    field: 'panelPresent',
    from: false,
    to: true,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-content-opens-but-aria-expanded-stays-false',
    description: 'after the click the content is present and aria-expanded still says false',
    caseId: CLICK_EXPANDS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-content-present-but-invisible',
    description: 'after the click the content is in the DOM and painted nowhere',
    caseId: CLICK_EXPANDS,
    field: 'panelVisible',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-region-role-lost-live',
    description: 'the content rendered on expand is not a region',
    caseId: CLICK_EXPANDS,
    field: 'panelRole',
    from: 'region',
    to: null,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-content-text-lost-live',
    description: 'the content rendered on expand holds different text',
    caseId: CLICK_EXPANDS,
    field: 'panelText',
    from: 'Invoice #1024 · Design service · $120.00',
    to: 'Invoice #1024',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-collapsed-modifier-stale-live',
    description: 'after collapsing the root still lacks its collapsed modifier',
    caseId: CLICK_COLLAPSES,
    field: 'rootClasses',
    from: ['vf-group-box', 'vf-group-box--titled', 'vf-group-box--collapsible', 'vf-group-box--collapsed'],
    to: ['vf-group-box', 'vf-group-box--titled', 'vf-group-box--collapsible'],
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------------ activation and keys
  snapshotMutation({
    id: 'group-box-enter-handled-on-keydown',
    description: "Enter toggled with no native click - the accordion's keydown handler copied into the group box",
    caseId: ENTER_COLLAPSES,
    field: 'activations',
    from: 1,
    to: 0,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-enter-keydown-prevented',
    description: 'the Enter keydown was prevented by the component',
    caseId: ENTER_COLLAPSES,
    field: 'keydownPrevented',
    from: [false],
    to: [true],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-space-does-not-expand',
    description: 'Space left the group box collapsed',
    caseId: SPACE_EXPANDS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-disabled-trigger-toggles',
    description: 'a disabled trigger collapsed on Enter',
    caseId: DISABLED_ENTER,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-disabled-trigger-took-focus',
    description: 'a disabled trigger received focus',
    caseId: DISABLED_ENTER,
    field: 'focusRole',
    from: 'body',
    to: 'trigger',
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'group-box-focus-moves-into-the-content',
    description: 'expanding moved focus into the content - focus management the reference never had',
    caseId: CLICK_EXPANDS,
    field: 'focusRole',
    from: 'trigger',
    to: 'panel',
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'group-box-sibling-cross-toggles',
    description: 'clicking the first sibling also expanded the second',
    caseId: SIBLING_ISOLATION,
    field: 'expandedStates',
    from: ['false', 'false'],
    to: ['false', 'true'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-nested-survives-its-parent',
    description:
      'the inner group box kept its expanded state through the outer collapse - content preserved, not re-rendered',
    caseId: NESTED_RERENDER,
    field: 'expandedStates',
    from: ['true', 'false'],
    to: ['true', 'true'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'group-box-controlled-razor-waits-for-a-parent',
    description:
      'the Razor controller treats collapsed as controlled and waits for a parent that does not exist: the round trip never toggles',
    caseId: CONTROLLED,
    field: 'expanded',
    from: 'false',
    to: 'true',
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------------ events
  snapshotMutation({
    id: 'group-box-event-missing',
    description: 'the state is right and the host was never told',
    caseId: CLICK_COLLAPSES,
    field: 'events',
    from: [{ collapsed: true }],
    to: [],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'group-box-event-doubled',
    description: 'the host was told twice for one toggle',
    caseId: CLICK_COLLAPSES,
    field: 'events',
    from: [{ collapsed: true }],
    to: [{ collapsed: true }, { collapsed: true }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'group-box-event-wrong-payload',
    description: 'the host was told the open state rather than the collapsed one',
    caseId: CLICK_COLLAPSES,
    field: 'events',
    from: [{ collapsed: true }],
    to: [{ collapsed: false }],
    dimensions: ['interaction.events'],
  }),

  // ------------------------------------------------------------ live DOM and tree
  liveDomMutation({
    id: 'group-box-live-dom-aria-expanded-stale',
    description: 'the post-interaction DOM record carries aria-expanded=false on an expanded trigger',
    caseId: CLICK_EXPANDS,
    dimensions: ['dom.aria', 'interaction.convergence'],
    edit(dom) {
      const node = findIn(dom, trigger, 'trigger');
      if (node.attributes['aria-expanded'] !== 'true') fail('not expanded');
      node.attributes['aria-expanded'] = 'false';
    },
  }),
  liveDomMutation({
    id: 'group-box-live-dom-content-hidden',
    description: 'the collapsed group keeps a hidden content element - a hybrid, not the closed state',
    caseId: CLICK_COLLAPSES,
    dimensions: ['dom.structure', 'interaction.convergence'],
    edit(dom) {
      const fieldset = findIn(dom, root, 'fieldset');
      fieldset.children.push({
        tag: 'div',
        classes: ['vf-group-box__content'],
        consumerClasses: [],
        attributes: { hidden: '', id: '#id1', role: 'region' },
        children: [],
      });
    },
  }),
  liveDomMutation({
    id: 'group-box-live-dom-collapsed-modifier-lost',
    description: 'the post-interaction DOM record of a collapsed group lacks the modifier',
    caseId: CLICK_COLLAPSES,
    dimensions: ['dom.canonicalClasses', 'interaction.convergence'],
    edit(dom) {
      const node = findIn(dom, root, 'fieldset');
      node.classes = node.classes.filter((name) => name !== 'vf-group-box--collapsed');
    },
  }),
  {
    id: 'group-box-live-tree-expanded-stale',
    klass: 'live tree',
    description: 'the post-interaction tree exposes the expanded trigger as collapsed',
    expect: { dimensions: ['a11y.states'], caseIds: [CLICK_EXPANDS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionAccessibility?.[CLICK_EXPANDS]?.trigger;
        if (node?.states?.expanded !== 'true') fail(`post tree expanded=${node?.states?.expanded}`);
        node.states.expanded = 'false';
      });
    },
  },
  {
    id: 'group-box-live-tree-region-missing',
    klass: 'live tree',
    description: 'the content rendered on expand is not exposed in the tree',
    expect: { dimensions: ['a11y.role'], caseIds: [CLICK_EXPANDS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.interactionAccessibility?.[CLICK_EXPANDS]?.content) fail('no post content in the tree');
        delete capture.interactionAccessibility[CLICK_EXPANDS].content;
      });
    },
  },

  // ------------------------------------------------------------ directions
  snapshotMutation({
    id: 'group-box-current-only-live-aria-expanded',
    description: 'current Vue expands the content and never updates aria-expanded',
    caseId: CLICK_EXPANDS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
    target: 'current',
    directions: ['reference-vs-current', 'current-vs-razor'],
  }),
  {
    id: 'group-box-current-and-razor-identically-lose-the-region',
    klass: 'aria',
    description:
      'current and Razor both drop role=region from the open content - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['role'] },
      caseIds: [OPEN],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = findNode(capture, OPEN, content, 'content');
          if (node.attributes.role !== 'region') fail('the content is not a region');
          delete node.attributes.role;
        });
      }
    },
  },
];

// ------------------------------------------------------------ browser mutations

/** Rewrites a key on the real trigger into the accordion's contract: handled and prevented on keydown. */
function handleOnKeydown(caseId, key) {
  return mutateElements(
    [caseId],
    '.vf-group-box__trigger',
    `
    element.addEventListener('keydown', (event) => {
      if (event.key !== ${JSON.stringify(key)}) return;
      event.preventDefault();
      element.click();
    });
  `,
  );
}

export const groupBoxBrowserMutations = [
  // ------------------------------------------------------------ A. ownership
  {
    id: 'browser-group-box-trigger-becomes-a-div',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real native button is replaced by a div with role=button and tabindex=0',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [OPEN] },
    beforeExtract: mutateElements(
      [OPEN],
      '.vf-group-box__trigger',
      `
      const impostor = document.createElement('div');
      for (const attribute of element.attributes) if (attribute.name !== 'type') impostor.setAttribute(attribute.name, attribute.value);
      impostor.setAttribute('role', 'button');
      impostor.setAttribute('tabindex', '0');
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-group-box-consumer-button-wears-the-trigger-class',
    target: 'razor',
    caseIds: [CONSUMER_OPEN],
    description: "the consumer's Retry button is given the trigger class, so it counts as the component's",
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [CONSUMER_OPEN] },
    beforeExtract: mutateElements(
      [CONSUMER_OPEN],
      '.vf-group-box__content button',
      `element.classList.add('vf-group-box__trigger');`,
    ),
  },

  // ------------------------------------------------------------ B. element identity
  {
    id: 'browser-group-box-root-becomes-a-div-role-group',
    target: 'razor',
    caseIds: [TITLED],
    description: 'the real fieldset is replaced by a div with role=group labelled by the legend',
    expect: { dimensions: ['dom.structure'], caseIds: [TITLED] },
    beforeExtract: mutateElements(
      [TITLED],
      'fieldset.vf-group-box',
      `
      const impostor = document.createElement('div');
      for (const attribute of element.attributes) impostor.setAttribute(attribute.name, attribute.value);
      impostor.setAttribute('role', 'group');
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-group-box-legend-becomes-a-div',
    target: 'razor',
    caseIds: [TITLED],
    description: 'the real legend is replaced by a div: the group loses its name',
    expect: { dimensions: ['dom.structure', 'a11y.name', 'a11y.role'], caseIds: [TITLED] },
    beforeExtract: mutateElements(
      [TITLED],
      '.vf-group-box__legend',
      `
      const impostor = document.createElement('div');
      impostor.className = element.className;
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-group-box-content-becomes-a-section',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real region is a section: identical in the tree, different in the DOM',
    expect: { dimensions: ['dom.structure'], caseIds: [OPEN] },
    beforeExtract: mutateElements(
      [OPEN],
      '.vf-group-box__content',
      `
      const impostor = document.createElement('section');
      for (const attribute of element.attributes) if (attribute.name !== 'role') impostor.setAttribute(attribute.name, attribute.value);
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-group-box-trigger-type-removed',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real trigger loses type="button" and would submit a form',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['type'] }, caseIds: [OPEN] },
    beforeExtract: mutateElements([OPEN], '.vf-group-box__trigger', `element.removeAttribute('type');`),
  },
  {
    id: 'browser-group-box-disabled-becomes-aria-disabled',
    target: 'razor',
    caseIds: [DISABLED_OPEN],
    description: 'the real disabled trigger is made aria-disabled instead, so it takes focus',
    expect: { dimensions: ['dom.nativeAttributes', 'dom.aria', 'a11y.states'], caseIds: [DISABLED_OPEN] },
    beforeExtract: mutateElements(
      [DISABLED_OPEN],
      '.vf-group-box__trigger',
      `
      if (!element.disabled) throw new Error('MUTATION_NOT_APPLIED: not disabled');
      element.disabled = false;
      element.setAttribute('aria-disabled', 'true');
    `,
    ),
  },
  {
    id: 'browser-group-box-disabled-on-the-fieldset',
    target: 'razor',
    caseIds: [DISABLED_STATIC],
    description: 'the real fieldset is disabled',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: [DISABLED_STATIC] },
    beforeExtract: mutateElements([DISABLED_STATIC], 'fieldset.vf-group-box', `element.disabled = true;`),
  },
  {
    id: 'browser-group-box-title-zero-legend-dropped',
    target: 'razor',
    caseIds: [ZERO_COLLAPSIBLE],
    description:
      'the Razor page renders the title "0" as no title: legend and trigger gone, content static - PHP truthiness',
    expect: { dimensions: ['dom.structure', 'ownership.controls'], caseIds: [ZERO_COLLAPSIBLE] },
    beforeExtract: mutateElements(
      [ZERO_COLLAPSIBLE],
      'fieldset.vf-group-box',
      `
      element.querySelector(':scope > legend').remove();
      const region = element.querySelector(':scope > .vf-group-box__content');
      region.removeAttribute('role');
      region.removeAttribute('aria-labelledby');
      element.className = 'vf-group-box';
    `,
    ),
  },

  // ------------------------------------------------------------ C. ids
  {
    id: 'browser-group-box-closed-aria-controls-removed',
    target: 'razor',
    caseIds: [CLOSED],
    description: 'the real closed trigger stops naming the absent content',
    expect: { dimensions: ['dom.relationships', 'ownership.controls'], caseIds: [CLOSED] },
    beforeExtract: mutateElements([CLOSED], '.vf-group-box__trigger', `element.removeAttribute('aria-controls');`),
  },
  {
    id: 'browser-group-box-static-content-id-removed',
    target: 'razor',
    caseIds: [STATIC],
    description: 'the real static content loses its unreferenced id',
    expect: { dimensions: ['dom.relationships'], caseIds: [STATIC] },
    beforeExtract: mutateElements([STATIC], '.vf-group-box__content', `element.removeAttribute('id');`),
  },
  {
    id: 'browser-group-box-sibling-ids-collide',
    target: 'razor',
    caseIds: ['group-box/siblings'],
    description: "the second sibling's trigger controls the first sibling's content",
    expect: { dimensions: ['ownership.controls', 'dom.relationships'], caseIds: ['group-box/siblings'] },
    beforeExtract: mutateElements(
      ['group-box/siblings'],
      '.vf-group-box:last-of-type > legend > .vf-group-box__trigger',
      `
      const other = root.querySelector('.vf-group-box:first-of-type > legend > .vf-group-box__trigger');
      element.setAttribute('aria-controls', other.getAttribute('aria-controls'));
    `,
    ),
  },
  {
    id: 'browser-group-box-nested-controls-outer-content',
    target: 'razor',
    caseIds: [NESTED],
    description: 'the real inner trigger controls the outer content',
    expect: { dimensions: ['ownership.controls', 'dom.relationships'], caseIds: [NESTED] },
    beforeExtract: mutateElements(
      [NESTED],
      '.vf-group-box .vf-group-box > legend > .vf-group-box__trigger',
      `
      const outer = root.querySelector(':scope > .vf-group-box > .vf-group-box__content');
      element.setAttribute('aria-controls', outer.id);
    `,
    ),
  },

  // ------------------------------------------------------------ D. live
  {
    id: 'browser-group-box-content-opens-aria-expanded-stays-false',
    target: 'razor',
    caseIds: [CLICK_EXPANDS],
    description: 'the click expanded the content and aria-expanded is put back to false',
    expect: {
      dimensions: ['interaction.state', 'dom.aria', 'a11y.states', 'interaction.convergence'],
      caseIds: [CLICK_EXPANDS],
    },
    afterInteraction: mutateElements(
      [CLICK_EXPANDS],
      '.vf-group-box__trigger',
      `
      if (element.getAttribute('aria-expanded') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not expanded');
      element.setAttribute('aria-expanded', 'false');
    `,
    ),
  },
  {
    id: 'browser-group-box-content-hidden-not-removed',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'collapsing hides the real content instead of removing it - v-show',
    expect: {
      dimensions: ['interaction.state', 'dom.structure', 'interaction.convergence'],
      caseIds: [CLICK_COLLAPSES],
    },
    beforeInteraction: mutateElements(
      [CLICK_COLLAPSES],
      '.vf-group-box__content',
      `element.remove = function () { this.hidden = true; };`,
    ),
  },
  {
    id: 'browser-group-box-pointer-toggle-removed',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'the real click never reaches the controller',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [CLICK_COLLAPSES],
    },
    beforeInteraction: mutateElements(
      [CLICK_COLLAPSES],
      '.vf-group-box__trigger',
      `element.addEventListener('click', (event) => event.stopImmediatePropagation(), true);`,
    ),
  },
  {
    id: 'browser-group-box-enter-handled-on-keydown',
    target: 'razor',
    caseIds: [ENTER_COLLAPSES],
    description:
      "Enter is handled on keydown with preventDefault - the accordion's contract - and toggles all the same",
    expect: { dimensions: ['interaction.state'], caseIds: [ENTER_COLLAPSES] },
    beforeInteraction: handleOnKeydown(ENTER_COLLAPSES, 'Enter'),
  },
  {
    id: 'browser-group-box-space-handled-on-keydown',
    target: 'razor',
    caseIds: [SPACE_EXPANDS],
    description: 'Space is handled on keydown with preventDefault instead of the native keyup activation',
    expect: { dimensions: ['interaction.state'], caseIds: [SPACE_EXPANDS] },
    beforeInteraction: handleOnKeydown(SPACE_EXPANDS, ' '),
  },
  {
    id: 'browser-group-box-enter-prevented',
    target: 'razor',
    caseIds: [ENTER_COLLAPSES],
    description: 'Enter is prevented on keydown and nothing else happens: no native click, no toggle',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [ENTER_COLLAPSES],
    },
    beforeInteraction: mutateElements(
      [ENTER_COLLAPSES],
      '.vf-group-box__trigger',
      `element.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.preventDefault(); });`,
    ),
  },
  {
    id: 'browser-group-box-disabled-trigger-activates',
    target: 'razor',
    caseIds: [DISABLED_ENTER],
    description: 'the disabled attribute is dropped from the real trigger, so it takes focus and Enter collapses it',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'ownership.controls', 'dom.nativeAttributes'],
      caseIds: [DISABLED_ENTER],
    },
    beforeInteraction: mutateElements(
      [DISABLED_ENTER],
      '.vf-group-box__trigger',
      `
      if (!element.disabled) throw new Error('MUTATION_NOT_APPLIED: not disabled');
      element.disabled = false;
    `,
    ),
  },
  {
    id: 'browser-group-box-double-mount',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'the bundle is evaluated a second time as a fresh module, so two controllers bind the same trigger',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [CLICK_COLLAPSES],
    },
    beforeInteraction: `(async () => {
      const root = document.querySelector('[data-parity-case=${JSON.stringify(CLICK_COLLAPSES)}] [data-vf-razor="group-box"]');
      if (!root?.hasAttribute('data-vf-razor-group-box-enhanced')) throw new Error('MUTATION_NOT_APPLIED: not enhanced');
      const module = await import('./vueforge-razor.js?double-mount=' + Date.now());
      module.enhanceVueForgeGroupBoxes(root);
      return { applied: 1, evidence: [{ caseId: ${JSON.stringify(CLICK_COLLAPSES)}, mounted: 'twice' }] };
    })()`,
  },
  {
    id: 'browser-group-box-global-selector-toggles-a-sibling',
    target: 'razor',
    caseIds: [SIBLING_ISOLATION],
    description: 'clicking the first real sibling also toggles the second - a controller finding triggers globally',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [SIBLING_ISOLATION] },
    beforeInteraction: mutateElements(
      [SIBLING_ISOLATION],
      '.vf-group-box:first-of-type > legend > .vf-group-box__trigger',
      `
      const second = root.querySelector('.vf-group-box:last-of-type > legend > .vf-group-box__trigger');
      element.addEventListener('click', () => second.click());
    `,
    ),
  },
  {
    id: 'browser-group-box-closed-content-preserved',
    target: 'razor',
    caseIds: [NESTED_RERENDER],
    description:
      'the outer collapse keeps its content and the re-expand shows it again - the inner group box survives, still expanded',
    expect: {
      dimensions: ['interaction.state', 'interaction.convergence'],
      caseIds: [NESTED_RERENDER],
    },
    beforeInteraction: `(() => {
      const outer = document.querySelector('[data-parity-case=${JSON.stringify(NESTED_RERENDER)}] > [data-vf-razor="group-box"]');
      if (!outer) throw new Error('MUTATION_NOT_APPLIED: no outer group box');
      // The first content element the outer group box removes is kept, and the
      // next one it renders is swapped for it once: a controller that keeps
      // closed content instead of rendering it afresh.
      let kept = null;
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            if (!kept && node instanceof HTMLElement && node.classList.contains('vf-group-box__content')) kept = node;
          }
          for (const node of record.addedNodes) {
            if (kept && node !== kept && node instanceof HTMLElement && node.classList.contains('vf-group-box__content')) {
              observer.disconnect();
              node.replaceWith(kept);
              return;
            }
          }
        }
      });
      observer.observe(outer, { childList: true });
      return { applied: 1, evidence: [{ caseId: ${JSON.stringify(NESTED_RERENDER)}, preserved: true }] };
    })()`,
  },
  {
    id: 'browser-group-box-event-swallowed',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'the real controller collapses the group and its event never reaches the host',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_COLLAPSES] },
    beforeInteraction: mutateElements(
      [CLICK_COLLAPSES],
      '[data-vf-razor="group-box"]',
      `element.addEventListener('vf-group-box:collapsed-change', (event) => event.stopPropagation());`,
    ),
  },
  {
    id: 'browser-group-box-event-renamed',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'the event is dispatched under another name - a convention the host does not listen for',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_COLLAPSES] },
    beforeInteraction: mutateElements(
      [CLICK_COLLAPSES],
      '[data-vf-razor="group-box"]',
      `
      element.addEventListener('vf-group-box:collapsed-change', (event) => {
        event.stopPropagation();
        element.dispatchEvent(new CustomEvent('vf-group-box:toggle', { bubbles: true, detail: event.detail }));
      });
    `,
    ),
  },
  {
    id: 'browser-group-box-event-wrong-payload',
    target: 'razor',
    caseIds: [CLICK_COLLAPSES],
    description: 'the event carries the open state instead of the collapsed one',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_COLLAPSES] },
    beforeInteraction: mutateElements(
      [CLICK_COLLAPSES],
      '[data-vf-razor="group-box"]',
      `
      element.addEventListener('vf-group-box:collapsed-change', (event) => {
        if (event.detail.__rewritten) return;
        event.stopPropagation();
        element.dispatchEvent(new CustomEvent('vf-group-box:collapsed-change', { bubbles: true, detail: { collapsed: !event.detail.collapsed, __rewritten: true } }));
      });
    `,
    ),
  },
  {
    id: 'browser-group-box-controlled-waits-for-a-parent',
    target: 'razor',
    caseIds: [CONTROLLED],
    description:
      'the Razor controller treats a server-given collapsed as controlled and refuses to toggle without a parent: the round trip never lands',
    expect: {
      dimensions: ['interaction.state', 'interaction.convergence', 'interaction.events'],
      caseIds: [CONTROLLED],
    },
    beforeInteraction: mutateElements(
      [CONTROLLED],
      '.vf-group-box__trigger',
      `element.addEventListener('click', (event) => event.stopImmediatePropagation(), true);`,
    ),
  },
  {
    id: 'browser-group-box-focus-moved-into-content',
    target: 'razor',
    caseIds: [CLICK_EXPANDS],
    description: 'the content takes focus after the click',
    expect: { dimensions: ['interaction.focus'], caseIds: [CLICK_EXPANDS] },
    afterInteraction: mutateElements(
      [CLICK_EXPANDS],
      '.vf-group-box__content',
      `element.setAttribute('tabindex', '-1'); element.focus();`,
    ),
  },

  // ------------------------------------------------------------ E. current-only
  {
    id: 'browser-group-box-current-only-live-defect',
    target: 'current',
    caseIds: [CLICK_EXPANDS],
    verifyIsolation: true,
    description:
      'current Vue expands the content and aria-expanded is put back to false; reference and Razor stay independent',
    expect: {
      dimensions: ['interaction.state', 'dom.aria', 'a11y.states', 'interaction.convergence'],
      caseIds: [CLICK_EXPANDS],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    afterInteraction: mutateElements(
      [CLICK_EXPANDS],
      '.vf-group-box__trigger',
      `
      if (element.getAttribute('aria-expanded') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not expanded');
      element.setAttribute('aria-expanded', 'false');
    `,
    ),
  },

  // ------------------------------------------------------------ F. visual
  {
    id: 'browser-group-box-content-invisible',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real open content is painted nowhere while staying in the DOM',
    expect: { dimensions: ['visual', 'dom.nativeAttributes'], caseIds: [OPEN] },
    beforeExtract: mutateElements([OPEN], '.vf-group-box__content', `element.style.visibility = 'hidden';`),
  },
  {
    id: 'browser-group-box-long-title-ellipsis-lost',
    target: 'razor',
    caseIds: [LONG],
    description: 'the long title inside the trigger wraps instead of truncating',
    expect: { dimensions: ['visual', 'dom.nativeAttributes'], caseIds: [LONG] },
    beforeExtract: mutateElements([LONG], '.vf-group-box__title', `element.style.whiteSpace = 'normal';`),
  },
];

// ------------------------------------------------------------ policy mutations

function push(policy, approval) {
  policy.approvedDivergences.push(approval);
}

function smuggled(id, dimension, caseIds, reason) {
  return {
    id,
    klass: 'policy',
    description: reason,
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
  };
}

function idle(id, dimension, caseIds, detail, pathSelector, reason) {
  return {
    id,
    klass: 'policy',
    description: reason,
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id,
        dimension,
        target: 'razor',
        caseIds,
        detail,
        pathSelector,
        left: 'true',
        right: 'false',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  };
}

export const groupBoxPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [OPEN],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', [OPEN], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-post-visual-approval',
    'visual.postInteraction',
    [CLICK_COLLAPSES],
    'an approval for post-interaction pixels',
  ),
  smuggled('smuggled-wildcard-case', 'dom.canonicalClasses', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [CONSUMER_OPEN],
    'an approval for ownership.controls - the group box could waive the evidence that its trigger is its own',
  ),
  smuggled(
    'smuggled-interaction-state-approval',
    'interaction.state',
    [CONTROLLED],
    'an approval for interaction.state on the controlled scenario - the platform divergence would be hidden as a waiver',
  ),
  smuggled(
    'smuggled-relationship-approval',
    'interaction.relationships',
    [CLICK_EXPANDS],
    'an approval for interaction.relationships',
  ),
  smuggled('smuggled-events-approval', 'interaction.events', [CLICK_COLLAPSES], 'an approval for interaction.events'),
  smuggled(
    'smuggled-convergence-approval',
    'interaction.convergence',
    [NESTED_RERENDER],
    'an approval for interaction.convergence - content preserved across a collapse would be excused',
  ),
  idle(
    'idle-aria-expanded-approval',
    'dom.aria',
    [CLICK_COLLAPSES, CLICK_EXPANDS, ENTER_COLLAPSES, SPACE_EXPANDS],
    'aria-expanded',
    'button.vf-group-box__trigger',
    'a broad aria-expanded approval across every keyboard and pointer scenario, matching nothing on a clean run',
  ),
  idle(
    'idle-aria-controls-approval',
    'dom.relationships',
    [OPEN, CLOSED],
    'aria-controls',
    'button.vf-group-box__trigger',
    'an aria-controls approval that tolerates no real difference',
  ),
  idle(
    'idle-disabled-approval',
    'dom.nativeAttributes',
    [DISABLED_OPEN, DISABLED_STATIC],
    'disabled',
    'button.vf-group-box__trigger',
    'a disabled-attribute approval that tolerates no real difference',
  ),
];
