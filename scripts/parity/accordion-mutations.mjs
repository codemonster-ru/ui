// The negative fixture for the VfAccordion parity gate.
//
// The first mutation set for a component that owns a control and changes its
// own state, so it has to prove four things no earlier set could:
//
//   - ownership is identity, not count. A page with the same number of
//     focusable elements and the wrong owner fails (section 56);
//   - the relationship graph is its own evidence. A page with every class,
//     every aria-expanded and every pixel right and the wrong aria-controls
//     fails, with no screenshot involved (section 57);
//   - state, ARIA, accessibility and DOM after a gesture are separate. A
//     panel that opened while aria-expanded stayed false, and an aria-expanded
//     that flipped while the panel stayed closed, each fail on their own
//     dimension (section 42);
//   - the live stage is necessary. A defect no initial snapshot can see - the
//     trigger announcing the wrong state after a click - fails in exactly the
//     two directions that involve the defective target (sections 54 and 55).
//
// Capture mutations perturb the stored evidence and prove the comparator
// reports each dimension; browser mutations rewrite real elements on the real
// pages, before extraction or between a gesture and its measurement, and
// prove the extractor, the driver and the screenshots see the defect.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const trigger = (node) => node.tag === 'button' && node.classes.includes('vf-accordion__trigger');
const panel = (node) => node.classes.includes('vf-accordion__content');
const icon = (node) => node.classes.includes('vf-accordion__icon');
const root = (node) => node.tag === 'section' && node.classes.includes('vf-accordion');

const OPEN = 'accordion/default-open';
const CLOSED = 'accordion/default';
const CLICK_OPENS = 'accordion/interaction-click-opens';
const CLICK_CLOSES = 'accordion/interaction-click-closes';
const ENTER_OPENS = 'accordion/interaction-enter-opens';
const SPACE_OPENS = 'accordion/interaction-space-opens';
const DISABLED_KEYBOARD = 'accordion/interaction-disabled-keyboard';
const CONSUMER_OPEN = 'accordion/consumer-control-open';
const CONSUMER_APPEARS = 'accordion/interaction-consumer-control-appears';
const SIBLINGS = 'accordion/interaction-sibling-isolation';
const NESTED = 'accordion/nested';

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
        edit(dom, capture);
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

// ------------------------------------------------------------ capture mutations

export const accordionParityMutations = [
  // ------------------------------------------------------------- ownership
  //
  // Section 56: the same number of focusable elements, the wrong owner. The
  // snapshot's totals are left exactly as recorded, so nothing but the
  // classification moved.
  {
    id: 'accordion-trigger-removed-consumer-remains',
    klass: 'ownership',
    description:
      'the component trigger is gone and a consumer button stands where it was: the focusable total is unchanged ' +
      'and the ownership evidence has to say so',
    expect: { dimensions: ['ownership.controls'], caseIds: [CONSUMER_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[CONSUMER_OPEN];
        if (snapshot.componentControls.length !== 1 || snapshot.consumerControlCount !== 1)
          fail('unexpected ownership');
        snapshot.componentControls = [];
        snapshot.consumerControlCount = 2;
        if (snapshot.focusableTotal !== 2) fail('the total changed');
      });
    },
  },
  {
    id: 'accordion-trigger-becomes-a-div-in-ownership',
    klass: 'ownership',
    description: 'the ownership record says the trigger is a div: identity, with the count untouched',
    expect: { dimensions: ['ownership.controls'], caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [control] = capture.interactions[CLOSED].componentControls;
        if (control.tag !== 'button') fail('trigger is not a button');
        control.tag = 'div';
      });
    },
  },
  {
    id: 'accordion-second-component-trigger',
    klass: 'ownership',
    description: 'a second component-owned trigger is recorded',
    expect: { dimensions: ['ownership.controls'], caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[CLOSED];
        snapshot.componentControls = [...snapshot.componentControls, structuredClone(snapshot.componentControls[0])];
        snapshot.focusableTotal += 1;
      });
    },
  },
  {
    id: 'accordion-consumer-button-classified-as-component',
    klass: 'ownership',
    description: "the consumer's Retry button is recorded as the component's, and the consumer count drops to zero",
    expect: { dimensions: ['ownership.controls'], caseIds: [CONSUMER_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[CONSUMER_OPEN];
        snapshot.componentControls = [
          ...snapshot.componentControls,
          {
            ...snapshot.componentControls[0],
            name: 'Retry',
            controls: 'none',
            path: 'section.vf-accordion>div>div>button',
          },
        ];
        snapshot.consumerControlCount = 0;
      });
    },
  },
  snapshotMutation({
    id: 'accordion-ownership-stops-being-recorded',
    description: 'the snapshot no longer claims the component posture, so the measurement means nothing',
    caseId: CLOSED,
    field: 'ownershipPosture',
    from: 'component',
    to: 'unmeasured',
    dimensions: ['ownership.controls'],
  }),
  snapshotMutation({
    id: 'accordion-consumer-count-after-open-wrong',
    description: 'the consumer button that appeared on open is not counted',
    caseId: CONSUMER_APPEARS,
    field: 'consumerControlCount',
    from: 1,
    to: 0,
    dimensions: ['ownership.controls'],
  }),

  // ---------------------------------------------------------- relationships
  //
  // Section 57: nothing but the edge moves. No class, no state, no pixel.
  {
    id: 'accordion-aria-controls-points-at-the-trigger',
    klass: 'relationship',
    description: 'the open trigger controls itself rather than its panel; every other attribute is as rendered',
    expect: { dimensions: ['dom.relationships'], details: { 'dom.relationships': ['aria-controls'] }, caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, OPEN, trigger, 'trigger');
        if (node.attributes['aria-controls'] !== '#id1') fail(`aria-controls is ${node.attributes['aria-controls']}`);
        node.attributes['aria-controls'] = '#id0';
      });
    },
  },
  {
    id: 'accordion-aria-controls-dangles-while-open',
    klass: 'relationship',
    description: 'the open trigger names an id no element carries',
    expect: { dimensions: ['dom.relationships'], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, OPEN, trigger, 'trigger').attributes['aria-controls'] = '#dangling';
      });
    },
  },
  {
    id: 'accordion-panel-labelled-by-itself',
    klass: 'relationship',
    description: 'the region names itself as its label rather than the trigger',
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-labelledby'] },
      caseIds: [OPEN],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, OPEN, panel, 'panel');
        if (node.attributes['aria-labelledby'] !== '#id0') fail('labelledby');
        node.attributes['aria-labelledby'] = '#id1';
      });
    },
  },
  {
    id: 'accordion-closed-trigger-resolves-to-a-stranger',
    klass: 'relationship',
    description: 'the closed trigger, whose reference dangles on every target, resolves to some element instead',
    expect: { dimensions: ['dom.relationships'], caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, CLOSED, trigger, 'trigger');
        if (node.attributes['aria-controls'] !== '#dangling')
          fail(`closed reference is ${node.attributes['aria-controls']}`);
        node.attributes['aria-controls'] = '#id0';
      });
    },
  },
  snapshotMutation({
    id: 'accordion-live-controls-resolve-elsewhere',
    description:
      'after the click the trigger controls something other than its panel, with aria-expanded and the panel right',
    caseId: CLICK_OPENS,
    field: 'controlsResolved',
    from: 'panel',
    to: 'other',
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'accordion-live-panel-labelled-by-other',
    description: 'after the click the panel is labelled by something other than its trigger',
    caseId: CLICK_OPENS,
    field: 'panelLabelledBy',
    from: 'trigger',
    to: 'other',
    dimensions: ['interaction.relationships'],
  }),
  {
    id: 'accordion-nested-relationship-crosses-instances',
    klass: 'relationship',
    description: 'the inner trigger controls the outer panel',
    expect: { dimensions: ['ownership.controls'], caseIds: [NESTED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const inner = capture.interactions[NESTED].componentControls[1];
        if (!inner || inner.controls !== 'dangling') fail('inner trigger is not the closed nested one');
        inner.controls = 'other';
      });
    },
  },

  // ------------------------------------------------------ state versus ARIA
  //
  // Section 42, each half alone.
  {
    id: 'accordion-aria-expanded-inverted-in-dom',
    klass: 'aria',
    description: 'the open trigger announces false in the initial DOM while the panel is rendered',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-expanded'] }, caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, OPEN, trigger, 'trigger').attributes['aria-expanded'] = 'false';
      });
    },
  },
  {
    id: 'accordion-ax-expanded-wrong-while-dom-right',
    klass: 'aria',
    description: 'the accessibility tree exposes the open trigger as collapsed while every attribute is right',
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
    id: 'accordion-ax-region-lost',
    klass: 'aria',
    description: 'the panel is no longer exposed as a region in the tree',
    expect: { dimensions: ['a11y.role'], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.accessibility[OPEN]?.panel) fail('no panel in the tree');
        delete capture.accessibility[OPEN].panel;
      });
    },
  },
  snapshotMutation({
    id: 'accordion-panel-opens-but-aria-expanded-stays-false',
    description: 'after the click the panel is present and aria-expanded still says false',
    caseId: CLICK_OPENS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-aria-expanded-flips-but-panel-stays-closed',
    description: 'after the click aria-expanded says true and there is no panel',
    caseId: CLICK_OPENS,
    field: 'panelPresent',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-panel-present-but-invisible',
    description: 'after the click the panel is in the DOM and painted nowhere',
    caseId: CLICK_OPENS,
    field: 'panelVisible',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-panel-hidden-instead-of-removed',
    description: 'after closing the panel stays in the DOM',
    caseId: CLICK_CLOSES,
    field: 'panelPresent',
    from: false,
    to: true,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-icon-does-not-rotate-live',
    description: 'after the click the chevron keeps its closed orientation',
    caseId: CLICK_OPENS,
    field: 'iconOpen',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-region-role-lost-live',
    description: 'the panel rendered on open is not a region',
    caseId: CLICK_OPENS,
    field: 'panelRole',
    from: 'region',
    to: 'group',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-snapshot-mid-transition',
    description: 'the snapshot was taken before the transition settled',
    caseId: CLICK_OPENS,
    field: 'settled',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-panel-text-lost-live',
    description: 'the panel rendered on open holds different content',
    caseId: CLICK_OPENS,
    field: 'panelText',
    from: 'Storage, seats and outbound transfer for the current billing period.',
    to: 'Storage, seats and outbound transfer.',
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------- activation & keys
  snapshotMutation({
    id: 'accordion-enter-produces-a-native-click',
    description: 'Enter reached the trigger as a native click: a port relying on native activation',
    caseId: ENTER_OPENS,
    field: 'activations',
    from: 0,
    to: 1,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-space-does-not-open',
    description: 'Space left the accordion closed',
    caseId: SPACE_OPENS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-disabled-trigger-toggles',
    description: 'a disabled trigger opened on Enter',
    caseId: DISABLED_KEYBOARD,
    field: 'expanded',
    from: 'false',
    to: 'true',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'accordion-disabled-trigger-took-focus',
    description: 'a disabled trigger received focus',
    caseId: DISABLED_KEYBOARD,
    field: 'focusRole',
    from: 'body',
    to: 'trigger',
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'accordion-focus-moves-into-the-panel',
    description: 'opening moved focus into the panel - focus management the reference never had',
    caseId: CLICK_OPENS,
    field: 'focusRole',
    from: 'trigger',
    to: 'panel',
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'accordion-sibling-cross-toggles',
    description: 'clicking the first sibling closed the second',
    caseId: SIBLINGS,
    field: 'expandedStates',
    from: ['true', 'true'],
    to: ['true', 'false'],
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------------------ events
  snapshotMutation({
    id: 'accordion-event-missing',
    description: 'the state is right and the host was never told',
    caseId: CLICK_OPENS,
    field: 'events',
    from: [{ open: true }],
    to: [],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'accordion-event-doubled',
    description: 'the host was told twice for one toggle',
    caseId: CLICK_OPENS,
    field: 'events',
    from: [{ open: true }],
    to: [{ open: true }, { open: true }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'accordion-event-wrong-payload',
    description: 'the host was told the state being left rather than the state being entered',
    caseId: CLICK_OPENS,
    field: 'events',
    from: [{ open: true }],
    to: [{ open: false }],
    dimensions: ['interaction.events'],
  }),

  // ------------------------------------------------------ live DOM & tree
  liveDomMutation({
    id: 'accordion-live-dom-aria-expanded-stale',
    description: 'the post-interaction DOM record carries aria-expanded=false on an opened trigger',
    caseId: CLICK_OPENS,
    dimensions: ['dom.aria', 'interaction.convergence'],
    edit(dom) {
      const node = findIn(dom, trigger, 'trigger');
      if (node.attributes['aria-expanded'] !== 'true') fail('not open');
      node.attributes['aria-expanded'] = 'false';
    },
  }),
  liveDomMutation({
    id: 'accordion-live-dom-keeps-inline-height',
    description: 'the opened panel keeps an inline height after the transition: a hybrid, not the open state',
    caseId: CLICK_OPENS,
    dimensions: ['dom.nativeAttributes', 'interaction.convergence'],
    edit(dom) {
      const node = findIn(dom, panel, 'panel');
      if (node.attributes.style !== undefined) fail('panel already styled');
      node.attributes.style = 'height:0px';
    },
  }),
  liveDomMutation({
    id: 'accordion-live-dom-icon-modifier-lost',
    description: 'the post-interaction DOM record has an unrotated icon',
    caseId: CLICK_OPENS,
    dimensions: ['dom.canonicalClasses', 'interaction.convergence'],
    edit(dom) {
      const node = findIn(dom, icon, 'icon');
      node.classes = node.classes.filter((name) => name !== 'vf-accordion__icon--open');
    },
  }),
  {
    id: 'accordion-live-tree-expanded-stale',
    klass: 'live tree',
    description: 'the post-interaction accessibility tree exposes the opened trigger as collapsed',
    expect: { dimensions: ['a11y.states'], caseIds: [CLICK_OPENS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionAccessibility?.[CLICK_OPENS]?.trigger;
        if (node?.states?.expanded !== 'true') fail(`post tree expanded=${node?.states?.expanded}`);
        node.states.expanded = 'false';
      });
    },
  },
  {
    id: 'accordion-live-tree-region-missing',
    klass: 'live tree',
    description: 'the panel rendered on open is not exposed in the tree',
    expect: { dimensions: ['a11y.role'], caseIds: [CLICK_OPENS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.interactionAccessibility?.[CLICK_OPENS]?.panel) fail('no post panel in the tree');
        delete capture.interactionAccessibility[CLICK_OPENS].panel;
      });
    },
  },

  // ------------------------------------------------------- current-only live
  //
  // Section 54: a defect only the current Vue adapter has, after a gesture.
  // Initial snapshots are untouched; the two directions that involve current
  // fail and reference-vs-razor stays green.
  snapshotMutation({
    id: 'accordion-current-only-live-aria-expanded',
    description: 'current Vue opens the panel and never updates aria-expanded',
    caseId: CLICK_OPENS,
    field: 'expanded',
    from: 'true',
    to: 'false',
    dimensions: ['interaction.state'],
    target: 'current',
    directions: ['reference-vs-current', 'current-vs-razor'],
  }),
  liveDomMutation({
    id: 'accordion-current-only-live-dom',
    description: 'the current post-interaction DOM record announces the wrong state',
    caseId: CLICK_OPENS,
    dimensions: ['dom.aria', 'interaction.convergence'],
    target: 'current',
    directions: ['reference-vs-current', 'current-vs-razor'],
    edit(dom) {
      findIn(dom, trigger, 'trigger').attributes['aria-expanded'] = 'false';
    },
  }),

  // -------------------------------------------------------------- initial DOM
  {
    id: 'accordion-trigger-becomes-a-div-in-dom',
    klass: 'structure',
    description: 'the trigger is described as a div',
    expect: { dimensions: ['dom.structure'], caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, CLOSED, trigger, 'trigger').tag = 'div';
      });
    },
  },
  {
    id: 'accordion-title-span-dropped',
    klass: 'structure',
    description: 'the empty title span disappears for a missing title',
    expect: { dimensions: ['dom.structure'], caseIds: ['accordion/no-title'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'accordion/no-title', trigger, 'trigger');
        if (node.children[0]?.tag !== 'span' || node.children[0].classes.length !== 0) fail('no title span');
        node.children.shift();
      });
    },
  },
  {
    id: 'accordion-consumer-class-replaces-canonical',
    klass: 'classes',
    description: 'the consumer class replaces vf-accordion instead of following it',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['accordion/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'accordion/consumer-class', root, 'root');
        node.classes = [];
      });
    },
  },
  {
    id: 'accordion-consumer-data-attribute-lost',
    klass: 'product data',
    description: 'a consumer data attribute never reaches the root',
    expect: { dimensions: ['dom.productData'], caseIds: ['accordion/consumer-attributes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'accordion/consumer-attributes', root, 'root');
        if (node.attributes['data-testid'] === undefined) fail('no data-testid');
        delete node.attributes['data-testid'];
      });
    },
  },
  {
    id: 'accordion-disabled-attribute-lost',
    klass: 'native',
    description: 'the disabled trigger is rendered operable',
    expect: { dimensions: ['dom.nativeAttributes', 'dom.actionPresence'], caseIds: ['accordion/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'accordion/disabled', trigger, 'trigger');
        if (node.attributes.disabled === undefined) fail('not disabled');
        delete node.attributes.disabled;
        node.operable = true;
      });
    },
  },
  {
    id: 'accordion-trigger-submits',
    klass: 'native',
    description: 'the trigger becomes a submit button',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['type'] }, caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, CLOSED, trigger, 'trigger').attributes.type = 'submit';
      });
    },
  },
  {
    id: 'accordion-consumer-aria-expanded-moves-onto-the-trigger',
    klass: 'aria',
    description: "a consumer aria-expanded is forwarded onto the trigger, overriding the component's own",
    expect: { dimensions: ['dom.aria'], caseIds: ['accordion/consumer-aria-expanded-on-root'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const section = findNode(capture, 'accordion/consumer-aria-expanded-on-root', root, 'root');
        const button = findNode(capture, 'accordion/consumer-aria-expanded-on-root', trigger, 'trigger');
        if (section.attributes['aria-expanded'] !== 'true') fail('consumer aria-expanded not on the root');
        delete section.attributes['aria-expanded'];
        button.attributes['aria-expanded'] = 'true';
      });
    },
  },
  {
    id: 'accordion-panel-region-role-lost',
    klass: 'aria',
    description: 'the open panel is rendered without role=region',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        delete findNode(capture, OPEN, panel, 'panel').attributes.role;
      });
    },
  },
  {
    id: 'accordion-trigger-geometry',
    klass: 'geometry',
    description: 'the trigger loses its minimum height',
    expect: { dimensions: ['style.geometry'], caseIds: [CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const styles = capture.extracted[CLOSED].styles.trigger;
        if (!styles) fail('no trigger geometry');
        styles.boxHeight -= 7;
        styles.height = `${Number.parseFloat(styles.height) - 7}px`;
      });
    },
  },
];

// ------------------------------------------------------------ browser mutations

/** Blocks a key on the real trigger before the controller sees it. */
function blockKey(caseId, key) {
  return mutateElements(
    [caseId],
    '.vf-accordion__trigger',
    `
    element.addEventListener('keydown', (event) => {
      if (event.key !== ${JSON.stringify(key)}) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  `,
  );
}

export const accordionBrowserMutations = [
  // --------------------------------------------------------- A. ownership
  //
  // The section 56 defect on a real page: the trigger's canonical class and
  // marker are stripped, so a button still stands where the trigger was and
  // the focusable total is unchanged. Only ownership and classes can see it.
  {
    id: 'browser-accordion-trigger-becomes-a-consumer-button',
    target: 'razor',
    caseIds: [CONSUMER_OPEN],
    description:
      'the real trigger loses its identity and stands as an unclassed button; the focusable total is unchanged',
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [CONSUMER_OPEN] },
    beforeExtract: mutateElements(
      [CONSUMER_OPEN],
      '.vf-accordion__trigger',
      `
      const total = root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length;
      element.classList.remove('vf-accordion__trigger');
      if (root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length !== total) throw new Error('MUTATION_NOT_APPLIED: total moved');
      evidence.push({ caseId, focusableTotal: total });
    `,
    ),
  },
  {
    id: 'browser-accordion-trigger-becomes-a-div',
    target: 'razor',
    caseIds: [CLOSED],
    description: 'the real native button is replaced by a div with role=button and tabindex=0',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [CLOSED] },
    beforeExtract: mutateElements(
      [CLOSED],
      '.vf-accordion__trigger',
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
    id: 'browser-accordion-second-trigger',
    target: 'razor',
    caseIds: [CLOSED],
    description: 'the real accordion grows a second trigger',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [CLOSED] },
    // The clone gets its own id: a duplicated id is refused by the capture
    // itself ("rendered duplicate ids"), before any comparison, and that
    // refusal is asserted in the fail-open review rather than here.
    beforeExtract: mutateElements(
      [CLOSED],
      '.vf-accordion__trigger',
      `
      const clone = element.cloneNode(true);
      clone.id = element.id + '-second';
      element.after(clone);
    `,
    ),
  },
  {
    id: 'browser-accordion-consumer-button-wears-the-trigger-class',
    target: 'razor',
    caseIds: [CONSUMER_OPEN],
    description: "the consumer's Retry button is given the trigger class, so it counts as the component's",
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [CONSUMER_OPEN] },
    beforeExtract: mutateElements(
      [CONSUMER_OPEN],
      '.vf-accordion__content-inner button',
      `element.classList.add('vf-accordion__trigger');`,
    ),
  },

  // ------------------------------------------------------ B. relationships
  {
    id: 'browser-accordion-aria-controls-wrong',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real open trigger controls itself; nothing else on the page changes',
    expect: { dimensions: ['dom.relationships', 'ownership.controls'], caseIds: [OPEN] },
    beforeExtract: mutateElements(
      [OPEN],
      '.vf-accordion__trigger',
      `element.setAttribute('aria-controls', element.id);`,
    ),
  },
  {
    id: 'browser-accordion-labelledby-wrong',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real region is labelled by itself',
    expect: { dimensions: ['dom.relationships', 'ownership.controls'], caseIds: [OPEN] },
    beforeExtract: mutateElements(
      [OPEN],
      '.vf-accordion__content',
      `element.setAttribute('aria-labelledby', element.id);`,
    ),
  },
  {
    id: 'browser-accordion-sibling-controls-cross',
    target: 'razor',
    caseIds: ['accordion/siblings'],
    description: "the second sibling's trigger controls the first sibling's panel",
    expect: { dimensions: ['ownership.controls'], caseIds: ['accordion/siblings'] },
    beforeExtract: mutateElements(
      ['accordion/siblings'],
      '.vf-accordion:last-of-type > .vf-accordion__trigger',
      `
      const other = root.querySelector('.vf-accordion:first-of-type > .vf-accordion__trigger');
      element.setAttribute('aria-controls', other.getAttribute('aria-controls'));
    `,
    ),
  },
  {
    id: 'browser-accordion-nested-controls-outer-panel',
    target: 'razor',
    caseIds: [NESTED],
    description: 'the real inner trigger controls the outer panel',
    expect: { dimensions: ['ownership.controls', 'dom.relationships'], caseIds: [NESTED] },
    beforeExtract: mutateElements(
      [NESTED],
      '.vf-accordion .vf-accordion > .vf-accordion__trigger',
      `
      const outer = root.querySelector(':scope > .vf-accordion > .vf-accordion__content');
      element.setAttribute('aria-controls', outer.id);
    `,
    ),
  },

  // --------------------------------------------------- C. live state / ARIA
  //
  // Sections 41/42/55: the real controller runs, then one half of what it did
  // is undone between the gesture and the measurement.
  {
    id: 'browser-accordion-panel-opens-aria-expanded-stays-false',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'the Razor-only live defect: the click opened the panel and aria-expanded is put back to false',
    expect: {
      dimensions: ['interaction.state', 'dom.aria', 'a11y.states', 'interaction.convergence'],
      caseIds: [CLICK_OPENS],
    },
    afterInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__trigger',
      `
      if (element.getAttribute('aria-expanded') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not open');
      element.setAttribute('aria-expanded', 'false');
    `,
    ),
  },
  {
    id: 'browser-accordion-aria-expanded-flips-panel-stays-closed',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'the click flipped aria-expanded and the panel is torn out again',
    expect: {
      dimensions: ['interaction.state', 'dom.structure', 'interaction.convergence', 'a11y.role'],
      caseIds: [CLICK_OPENS],
    },
    afterInteraction: mutateElements([CLICK_OPENS], '.vf-accordion__content', `element.remove();`),
  },
  {
    id: 'browser-accordion-panel-hidden-not-removed',
    target: 'razor',
    caseIds: [CLICK_CLOSES],
    description: 'closing hides the real panel with display:none instead of removing it',
    expect: { dimensions: ['interaction.state', 'dom.structure', 'interaction.convergence'], caseIds: [CLICK_CLOSES] },
    beforeInteraction: mutateElements(
      [CLICK_CLOSES],
      '.vf-accordion__content',
      `
      // Keep the panel: the controller's remove() becomes a hide.
      element.remove = function () { this.style.display = 'none'; this.style.transition = ''; };
    `,
    ),
  },
  {
    id: 'browser-accordion-controller-bound-to-a-consumer-button',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description:
      'the real trigger is made inert and a consumer button beside the accordion toggles it instead: something ' +
      'interactive exists, and it is not the historical control',
    expect: {
      dimensions: ['interaction.state', 'ownership.controls', 'interaction.convergence'],
      caseIds: [CLICK_OPENS],
    },
    beforeInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__trigger',
      `
      element.addEventListener('click', (event) => event.stopImmediatePropagation(), true);
      element.addEventListener('keydown', (event) => event.stopImmediatePropagation(), true);
      const proxy = document.createElement('button');
      proxy.type = 'button';
      proxy.textContent = 'Toggle';
      proxy.addEventListener('click', () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      root.append(proxy);
    `,
    ),
  },
  {
    id: 'browser-accordion-enter-inert',
    target: 'razor',
    caseIds: [ENTER_OPENS],
    description: 'Enter no longer reaches the controller',
    expect: {
      dimensions: ['interaction.state', 'interaction.convergence', 'interaction.events'],
      caseIds: [ENTER_OPENS],
    },
    beforeInteraction: blockKey(ENTER_OPENS, 'Enter'),
  },
  {
    id: 'browser-accordion-space-inert',
    target: 'razor',
    caseIds: [SPACE_OPENS],
    description: 'Space no longer reaches the controller',
    expect: {
      dimensions: ['interaction.state', 'interaction.convergence', 'interaction.events'],
      caseIds: [SPACE_OPENS],
    },
    beforeInteraction: blockKey(SPACE_OPENS, ' '),
  },
  {
    id: 'browser-accordion-disabled-trigger-activates',
    target: 'razor',
    caseIds: [DISABLED_KEYBOARD],
    description: 'the disabled attribute is dropped from the real trigger, so Enter opens it',
    expect: {
      dimensions: [
        'interaction.state',
        'interaction.focus',
        'ownership.controls',
        'dom.nativeAttributes',
        'a11y.states',
      ],
      caseIds: [DISABLED_KEYBOARD],
    },
    beforeInteraction: mutateElements(
      [DISABLED_KEYBOARD],
      '.vf-accordion__trigger',
      `
      if (!element.disabled) throw new Error('MUTATION_NOT_APPLIED: not disabled');
      element.disabled = false;
    `,
    ),
  },
  {
    id: 'browser-accordion-double-mount',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description:
      'the ownership marker is stripped and the bundle re-evaluated, so two controllers bind the same trigger',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [CLICK_OPENS],
    },
    beforeInteraction: `(async () => {
      const root = document.querySelector('[data-parity-case=${JSON.stringify(CLICK_OPENS)}] [data-vf-razor="accordion"]');
      if (!root?.hasAttribute('data-vf-razor-accordion-enhanced')) throw new Error('MUTATION_NOT_APPLIED: not enhanced');
      root.removeAttribute('data-vf-razor-accordion-enhanced');
      await import('./vueforge-razor.js?double-mount=' + Date.now());
      if (!root.hasAttribute('data-vf-razor-accordion-enhanced')) throw new Error('MUTATION_NOT_APPLIED: second mount did not run');
      return { applied: 1, evidence: [{ caseId: ${JSON.stringify(CLICK_OPENS)}, mounted: 'twice' }] };
    })()`,
  },
  {
    id: 'browser-accordion-sibling-cross-toggle',
    target: 'razor',
    caseIds: [SIBLINGS],
    description: 'clicking the first real sibling also toggles the second',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [SIBLINGS] },
    beforeInteraction: mutateElements(
      [SIBLINGS],
      '.vf-accordion:first-of-type > .vf-accordion__trigger',
      `
      const second = root.querySelector('.vf-accordion:last-of-type > .vf-accordion__trigger');
      element.addEventListener('click', () => second.click());
    `,
    ),
  },
  {
    id: 'browser-accordion-event-swallowed',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'the real controller opens the panel and its event never reaches the host',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_OPENS] },
    beforeInteraction: mutateElements(
      [CLICK_OPENS],
      '[data-vf-razor="accordion"]',
      `element.addEventListener('vf-accordion:open-change', (event) => event.stopPropagation());`,
    ),
  },
  {
    id: 'browser-accordion-event-doubled',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'a second open-change is dispatched for one real click',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_OPENS] },
    beforeInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__trigger',
      `
      element.addEventListener('click', () => {
        element.parentElement.dispatchEvent(new CustomEvent('vf-accordion:open-change', { bubbles: true, detail: { open: true } }));
      });
    `,
    ),
  },
  {
    id: 'browser-accordion-live-tree-loses-expanded',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'aria-expanded is removed after the click: the tree, the DOM and the snapshot all lose the state',
    expect: { dimensions: ['a11y.states', 'dom.aria', 'interaction.state'], caseIds: [CLICK_OPENS] },
    afterInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__trigger',
      `element.removeAttribute('aria-expanded');`,
    ),
  },
  {
    id: 'browser-accordion-focus-moved-to-panel',
    target: 'razor',
    caseIds: [CLICK_OPENS],
    description: 'the panel takes focus after the click',
    expect: { dimensions: ['interaction.focus'], caseIds: [CLICK_OPENS] },
    afterInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__content',
      `element.setAttribute('tabindex', '-1'); element.focus();`,
    ),
  },

  // ------------------------------------------------------- D. current-only
  //
  // Section 54 on the real current target, with the reference and Razor
  // pages re-captured fresh to prove they were not touched.
  {
    id: 'browser-accordion-current-only-live-defect',
    target: 'current',
    caseIds: [CLICK_OPENS],
    verifyIsolation: true,
    description:
      'current Vue opens the panel and aria-expanded is put back to false; reference and Razor stay independent',
    expect: {
      dimensions: ['interaction.state', 'dom.aria', 'a11y.states', 'interaction.convergence'],
      caseIds: [CLICK_OPENS],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    afterInteraction: mutateElements(
      [CLICK_OPENS],
      '.vf-accordion__trigger',
      `
      if (element.getAttribute('aria-expanded') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not open');
      element.setAttribute('aria-expanded', 'false');
    `,
    ),
  },

  // ---------------------------------------------------------- E. visual
  {
    id: 'browser-accordion-panel-invisible',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the real open panel is painted nowhere while staying in the DOM',
    expect: { dimensions: ['visual', 'dom.nativeAttributes'], caseIds: [OPEN] },
    beforeExtract: mutateElements([OPEN], '.vf-accordion__content', `element.style.visibility = 'hidden';`),
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

/** A well-formed approval on an approvable dimension that tolerates no real difference: rejected by accounting. */
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

export const accordionPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [CLOSED],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', [CLOSED], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-post-visual-approval',
    'visual.postInteraction',
    [CLICK_OPENS],
    'an approval for post-interaction pixels',
  ),
  smuggled('smuggled-wildcard-case', 'dom.canonicalClasses', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [CONSUMER_OPEN],
    'an approval for ownership.controls - the accordion would be able to waive the evidence that its trigger is its own',
  ),
  smuggled(
    'smuggled-interaction-state-approval',
    'interaction.state',
    [CLICK_OPENS],
    'an approval for interaction.state - "Razor is different because JS", which the enhancement exists to make unnecessary',
  ),
  smuggled(
    'smuggled-relationship-approval',
    'interaction.relationships',
    [CLICK_OPENS],
    'an approval for interaction.relationships - a trigger controlling the wrong panel would be excused',
  ),
  smuggled(
    'smuggled-events-approval',
    'interaction.events',
    [CLICK_OPENS],
    'an approval for interaction.events - a host never told would be excused',
  ),
  smuggled(
    'smuggled-convergence-approval',
    'interaction.convergence',
    [CLICK_OPENS],
    'an approval for interaction.convergence - a gesture landing on a hybrid would be excused',
  ),
  idle(
    'idle-aria-expanded-approval',
    'dom.aria',
    [CLICK_OPENS, CLICK_CLOSES, ENTER_OPENS, SPACE_OPENS],
    'aria-expanded',
    'button.vf-accordion__trigger',
    'a broad aria-expanded approval across every keyboard and pointer scenario, matching nothing on a clean run',
  ),
  idle(
    'idle-aria-controls-approval',
    'dom.relationships',
    [OPEN, CLOSED],
    'aria-controls',
    'button.vf-accordion__trigger',
    'an aria-controls approval that tolerates no real difference',
  ),
  idle(
    'idle-disabled-approval',
    'dom.nativeAttributes',
    ['accordion/disabled', DISABLED_KEYBOARD],
    'disabled',
    'button.vf-accordion__trigger',
    'a disabled-attribute approval that tolerates no real difference',
  ),
];
