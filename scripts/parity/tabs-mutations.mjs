// The negative fixture for the VfTabs parity gate.
//
// The third mutation set for a component that owns controls and changes its
// own state, and the first for one whose controls carry an explicit
// interactive role, a roving tabindex, aria-selected, an id graph with a
// 0-or-1 panel, a measured indicator and an internal scroller. It has to
// prove:
//
//   - the two attributes the audit found nobody compared, tabindex and
//     aria-selected, are compared now: a stale roving tabindex and a stale
//     aria-selected each fail on the DOM dimension they live in, and the
//     latter independently on the accessibility tree (sections 15-17). Both
//     were run against the comparator before the attributes were added and
//     MISSED; the run is preserved in the milestone's evidence;
//   - multi-kind ownership is identity, not count, and the explicit-role
//     allowance is declaration-exact: a missing tab, a tab that became a div,
//     a tab without its role, a tab with the wrong role, a scroll button with
//     the tab's role, an undeclared role on a static node, a missing or
//     duplicated scroll button, a scroll button that became a div, a tab
//     removed and a scroll button added, a consumer button wearing the tab's
//     class or standing in for a removed tab, a missing, duplicated or moved
//     panel, an adapter template turned into a hidden panel - each fails on
//     ownership (sections 18-19, 30, 49);
//   - the id graph is compared as edges with the consumer's literals beside
//     it: a wrong aria-controls target, a crossed panel label, a dangling
//     edge resolved, the active edge dangled, an edge into another case, an
//     ignored tabId or panelId, a de-duplicated duplicate (section 20);
//   - the live state is halves, not one value: aria-selected, tabindex, the
//     panel, the indicator each stale on its own after a gesture, and each
//     fails on its own field and its own DOM dimension (sections 23, 48);
//   - the keyboard contract is measured key by key, focus apart from
//     selection, native Enter and Space apart from handled keys, the roving
//     tabindex through where native Tab lands (sections 42, 50);
//   - the indicator is unrounded and the scroller state is a set of halves
//     (section 51);
//   - the live stage is directional: a defect only in current Vue, only in
//     Razor, and identically in both - the last caught by the reference
//     direction alone (section 52).
//
// Capture mutations perturb the stored evidence and prove the comparator
// reports each dimension; browser mutations rewrite real elements on the real
// pages, before extraction or between a gesture and its measurement, and
// prove the extractor, the driver and the screenshots see the defect.
import { eachTheme, fail, mutateElements } from './mutations.mjs';

const DEFAULT = 'tabs/default';
const PANEL = 'tabs/panel';
const SETTINGS = 'tabs/default-value-settings';
const DUPLICATES = 'tabs/duplicate-values';
const TAB_ID = 'tabs/tab-id-override';
const PANEL_ID = 'tabs/panel-id-override';
const OVERFLOW = 'tabs/overflow';
const CLIPPED = 'tabs/overflow-active-clipped';
const HIDDEN = 'tabs/overflow-end-hidden';
const BEFORE = 'tabs/before-consumer-button';
const PANEL_CONTROL = 'tabs/panel-consumer-control';
const CLICK = 'tabs/interaction-click-settings';
const CLICK_CURRENT = 'tabs/interaction-click-current';
const TWO_CLICKS = 'tabs/interaction-click-billing-then-overview';
const ENTER = 'tabs/interaction-enter';
const SPACE = 'tabs/interaction-space';
const ARROW_RIGHT = 'tabs/interaction-arrow-right';
const ARROW_DOWN = 'tabs/interaction-arrow-down';
const HOME = 'tabs/interaction-home';
const WRAP = 'tabs/interaction-wrap-forward';
const SKIP = 'tabs/interaction-skip-disabled-forward';
const FROM_FOCUSED = 'tabs/interaction-focused-not-selected-navigates';
const TAB_INTO_LIST = 'tabs/interaction-tab-into-list';
const RTL_LEFT = 'tabs/interaction-rtl-arrow-left';
const SIBLING_CLICK = 'tabs/interaction-sibling-click';
const SIBLING_KEYBOARD = 'tabs/interaction-sibling-keyboard';
const SCROLL_RIGHT = 'tabs/interaction-scroll-right';
const SCROLL_MANY = 'tabs/interaction-scroll-right-many';

const TAB = '.vf-tabs__tab';
const nth = (index) => `[role="tablist"] > .vf-tabs__tab:nth-child(${index})`;
const LIST = '[role="tablist"]';

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

function walk(nodes, visit) {
  for (const node of nodes) {
    visit(node);
    walk(node.children, visit);
  }
}

function findAll(dom, predicate) {
  const found = [];
  walk(dom, (node) => {
    if (predicate(node)) found.push(node);
  });
  return found;
}

const isTab = (node) => node.tag === 'button' && node.classes.includes('vf-tabs__tab');
const isPanel = (node) => node.tag === 'div' && node.classes.includes('vf-tabs__panel');
const isIndicator = (node) => node.tag === 'span' && node.classes.includes('vf-tabs__indicator');

/**
 * A mutation applied once the scroller's 140 ms scrolling state has ended.
 *
 * The controller repaints its scroll state - classes, the four halves of each
 * button, the fades - when that timer fires, exactly as the reference's
 * emitState does, so a mutation applied at the ordinary settle is undone
 * before the snapshot measures. Waiting for the state to end first is what
 * makes the defect stick to the measurement; bounded, like the snapshot's own
 * wait, and a mutation that never gets there is not applied.
 */
function afterScrollSettle(caseIds, selector, operation) {
  return `(async () => {
    const started = performance.now();
    await new Promise((done, refuse) => {
      const check = () => {
        const scrolling = [...document.querySelectorAll('.vf-tabs__list-scroller')].some((viewport) =>
          viewport.style.getPropertyValue('--vf-horizontal-scroller-scrollbar-width').trim() === 'thin');
        if (!scrolling) return done();
        if (performance.now() - started > 1000) return refuse(new Error('MUTATION_NOT_APPLIED: still scrolling'));
        setTimeout(check, 20);
      };
      check();
    });
    return ${mutateElements(caseIds, selector, operation)};
  })()`;
}

/**
 * A keyboard defect on the real page: a capture-phase listener on the
 * tablist stops the controller from seeing the key and does something else
 * instead. The reference's handler is on the tab; a capture listener on the
 * list runs before it on every target, which is what makes the same defect
 * expressible for the Razor controller and for current Vue.
 */
function interceptKey(caseId, key, operation) {
  return mutateElements(
    [caseId],
    LIST,
    `
    element.addEventListener('keydown', (event) => {
      if (event.key !== ${JSON.stringify(key)}) return;
      event.stopImmediatePropagation();
      const tabs = [...element.querySelectorAll('.vf-tabs__tab')];
      const from = event.target.closest('.vf-tabs__tab');
      ${operation}
    }, true);
  `,
  );
}

// ------------------------------------------------------------ capture mutations

export const tabsParityMutations = [
  // ------------------------------------------------------------- ownership
  //
  // Section 19 A-R, on the stored ownership record. The count-preserving
  // ones matter most: the sum equation holds and identity has to say no.
  {
    id: 'tabs-tab-removed-consumer-remains',
    klass: 'ownership',
    description:
      'one tab is gone and the consumer button before the tabs stands where it was: the focusable total is unchanged',
    expect: { dimensions: ['ownership.controls'], caseIds: [BEFORE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[BEFORE];
        const tab = snapshot.componentControls.findIndex((control) => control.role === 'tab');
        if (tab === -1 || snapshot.consumerControlCount !== 1) fail('unexpected ownership');
        snapshot.componentControls.splice(tab, 1);
        snapshot.consumerControlCount = 2;
        snapshot.interactiveRoleTotal -= 1;
        if (snapshot.focusableTotal !== 7) fail('the total changed');
      });
    },
  },
  {
    id: 'tabs-tab-becomes-a-div-in-ownership',
    klass: 'ownership',
    description: 'the ownership record says the second tab is a div: identity, with the count untouched',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = capture.interactions[DEFAULT].componentControls.filter((entry) => entry.role === 'tab')[1];
        if (control.tag !== 'button') fail('tab is not a button');
        control.tag = 'div';
      });
    },
  },
  {
    id: 'tabs-role-missing-in-ownership',
    klass: 'ownership',
    description: 'Q: the second tab carries no role while the count and the tags are untouched',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DEFAULT];
        const control = snapshot.componentControls.filter((entry) => entry.role === 'tab')[1];
        if (control.ariaRole !== 'tab') fail('tab has no role');
        control.ariaRole = null;
        snapshot.interactiveRoleTotal -= 1;
      });
    },
  },
  {
    id: 'tabs-role-substituted-in-ownership',
    klass: 'ownership',
    description: 'P: the second tab carries role=button - the count of explicit roles is unchanged',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = capture.interactions[DEFAULT].componentControls.filter((entry) => entry.role === 'tab')[1];
        control.ariaRole = 'button';
      });
    },
  },
  {
    id: 'tabs-scroll-button-wears-the-tab-role',
    klass: 'ownership',
    description: 'an extra role-bearing owned control: the left scroll button carries role=tab',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DEFAULT];
        const left = snapshot.componentControls.find((entry) => entry.role === 'scrollLeft');
        if (left.ariaRole !== null) fail('left button already has a role');
        left.ariaRole = 'tab';
        snapshot.interactiveRoleTotal += 1;
      });
    },
  },
  {
    id: 'tabs-tab-removed-scroll-button-added',
    klass: 'ownership',
    description:
      'O: one tab is gone and a second left scroll button stands in its place: five controls, five focusable, the explicit-role total consistent',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DEFAULT];
        const tab = snapshot.componentControls.findIndex((entry) => entry.role === 'tab');
        snapshot.componentControls.splice(tab, 1);
        const left = snapshot.componentControls.find((entry) => entry.role === 'scrollLeft');
        snapshot.componentControls.push({ ...left });
        snapshot.interactiveRoleTotal -= 1;
        snapshot.tabCount = 2;
        if (snapshot.componentControls.length !== 5 || snapshot.focusableTotal !== 5) fail('the total changed');
      });
    },
  },
  {
    id: 'tabs-consumer-button-counted-as-the-components',
    klass: 'ownership',
    description: "the consumer's Save button inside the panel is recorded as a fourth tab, role and all",
    expect: { dimensions: ['ownership.controls'], caseIds: [PANEL_CONTROL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[PANEL_CONTROL];
        const tab = snapshot.componentControls.find((entry) => entry.role === 'tab');
        snapshot.componentControls.push({ ...tab, path: 'div.vf-tabs>div.vf-tabs__panel>button', name: 'Save' });
        snapshot.consumerControlCount = 0;
        snapshot.interactiveRoleTotal += 1;
        if (snapshot.focusableTotal !== 7) fail('the total changed');
      });
    },
  },
  {
    id: 'tabs-panel-missing-in-ownership',
    klass: 'ownership',
    description: 'the panel is not among the owned controls while the total stays six',
    expect: { dimensions: ['ownership.controls'], caseIds: [PANEL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[PANEL];
        const panel = snapshot.componentControls.findIndex((entry) => entry.role === 'panel');
        if (panel === -1) fail('no panel recorded');
        snapshot.componentControls.splice(panel, 1);
        snapshot.consumerControlCount += 1;
        if (snapshot.focusableTotal !== 6) fail('the total changed');
      });
    },
  },

  // ------------------------------------------------------- state, split
  //
  // Section 48: each half of the state stale on its own.
  snapshotMutation({
    id: 'tabs-aria-selected-stale-after-click',
    description: 'A: tabindex, the panel and the indicator moved, aria-selected did not',
    caseId: CLICK,
    field: 'ariaSelected',
    from: ['false', 'true', 'false'],
    to: ['true', 'false', 'false'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-tabindex-stale-after-click',
    description: 'B: aria-selected moved, the roving tabindex did not',
    caseId: CLICK,
    field: 'tabindexes',
    from: ['-1', '0', '-1'],
    to: ['0', '-1', '-1'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-two-tabindex-zero-after-click',
    description: 'E: the new tab got tabindex 0 and the old one kept it',
    caseId: CLICK,
    field: 'tabindexes',
    from: ['-1', '0', '-1'],
    to: ['0', '0', '-1'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-panel-missing-after-click',
    description: 'J: the selection moved and the panel is gone',
    caseId: CLICK,
    field: 'panelPresent',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-second-panel-after-click',
    description: 'K: the selection moved and a second panel exists',
    caseId: CLICK,
    field: 'panelCount',
    from: 1,
    to: 2,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-panel-labelled-by-wrong-tab',
    description: 'L: the panel is no longer labelled by the selected tab',
    caseId: CLICK,
    field: 'panelLabelledByActive',
    from: true,
    to: false,
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'tabs-active-controls-dangling',
    description: "M: the selected tab's aria-controls resolves nowhere while the panel exists",
    caseId: CLICK,
    field: 'controlsResolvedPerTab',
    from: ['dangling', 'panel', 'dangling'],
    to: ['dangling', 'dangling', 'dangling'],
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'tabs-indicator-stale-after-click',
    description: 'AE: the selection moved and the indicator stayed on the first tab',
    caseId: CLICK,
    field: 'indicatorTransform',
    from: 'translateX(97.3594px)',
    to: 'translateX(0px)',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-indicator-width-rounded-after-click',
    description: 'AG: the indicator width is written as whole pixels',
    caseId: CLICK,
    field: 'indicatorWidth',
    from: '85.6719px',
    to: '86px',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-indicator-opacity-stale',
    description: 'the selection moved and the indicator stayed hidden',
    caseId: CLICK,
    field: 'indicatorOpacity',
    from: '1',
    to: '0',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-tab-id-override-ignored',
    description: "N: the consumer's tabId is replaced by a generated id",
    caseId: TAB_ID,
    field: 'tabIdLiterals',
    from: ['consumer-overview-tab', 'generated', 'generated'],
    to: ['generated', 'generated', 'generated'],
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'tabs-panel-id-override-ignored',
    description: "O: the consumer's panelId is replaced by a generated id",
    caseId: PANEL_ID,
    field: 'panelIdLiteral',
    from: 'consumer-overview-panel',
    to: 'generated',
    dimensions: ['interaction.relationships'],
  }),
  snapshotMutation({
    id: 'tabs-duplicate-selection-normalised',
    description: 'only the first of two duplicated tabs is recorded selected',
    caseId: DUPLICATES,
    field: 'ariaSelected',
    from: ['true', 'true', 'false'],
    to: ['true', 'false', 'false'],
    dimensions: ['interaction.state'],
  }),

  // --------------------------------------------------------------- events
  snapshotMutation({
    id: 'tabs-current-reclick-silent',
    description: 'Q: a click on the current tab notifies nothing',
    caseId: CLICK_CURRENT,
    field: 'events',
    from: [{ value: 'overview' }],
    to: [],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'tabs-events-reversed',
    description: 'R: two changes notified in the wrong order',
    caseId: TWO_CLICKS,
    field: 'events',
    from: [{ value: 'billing' }, { value: 'overview' }],
    to: [{ value: 'overview' }, { value: 'billing' }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'tabs-event-doubled',
    description: 'one click notifies twice',
    caseId: CLICK,
    field: 'events',
    from: [{ value: 'settings' }],
    to: [{ value: 'settings' }, { value: 'settings' }],
    dimensions: ['interaction.events'],
  }),

  // -------------------------------------------------------------- keyboard
  snapshotMutation({
    id: 'tabs-arrow-not-prevented-in-snapshot',
    description: 'the arrow moved the selection and the keydown was left unprevented',
    caseId: ARROW_RIGHT,
    field: 'keydownPrevented',
    from: [true],
    to: [false],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-enter-without-native-click',
    description: 'Enter moved the selection with no native click counted: a handled key, not native activation',
    caseId: ENTER,
    field: 'activations',
    from: 1,
    to: 0,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-focus-not-moved-in-snapshot',
    description: 'the arrow moved the selection and focus stayed on the origin',
    caseId: ARROW_RIGHT,
    field: 'focusValue',
    from: 'settings',
    to: 'overview',
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'tabs-focus-leaks-to-the-sibling',
    description: 'AA: the key moved the second instance and focus is recorded in the first',
    caseId: SIBLING_KEYBOARD,
    field: 'focusInstance',
    from: 1,
    to: 0,
    dimensions: ['interaction.focus'],
  }),
  snapshotMutation({
    id: 'tabs-native-tab-lands-on-the-first-tab',
    description: 'native Tab from the consumer button landed on the first tab instead of the tabbable middle one',
    caseId: TAB_INTO_LIST,
    field: 'focusValue',
    from: 'settings',
    to: 'overview',
    dimensions: ['interaction.focus'],
  }),

  // -------------------------------------------------------------- scroller
  snapshotMutation({
    id: 'tabs-can-scroll-left-stale',
    description: 'the viewport scrolled and can-scroll-left stayed false',
    caseId: SCROLL_RIGHT,
    field: 'canScrollLeft',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-left-button-hidden-stale',
    description: 'the viewport scrolled and the left button stayed hidden',
    caseId: SCROLL_RIGHT,
    field: 'leftHidden',
    from: false,
    to: true,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-fade-missing-in-snapshot',
    description: 'both directions scroll and only the right fade is recorded',
    caseId: SCROLL_MANY,
    field: 'fades',
    from: ['left', 'right'],
    to: ['right'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-scrollbar-width-stale',
    description: 'the scrolling state never ended on the viewport variable',
    caseId: SCROLL_RIGHT,
    field: 'scrollbarWidth',
    from: 'none',
    to: 'thin',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-settle-not-reached',
    description: 'AQ: the bounded wait for the scrolling state ran out',
    caseId: SCROLL_RIGHT,
    field: 'settled',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'tabs-controls-never-ready',
    description: 'the readiness class never arrived',
    caseId: SCROLL_RIGHT,
    field: 'controlsReady',
    from: true,
    to: false,
    dimensions: ['interaction.state'],
  }),

  // ------------------------------------------------------- live DOM records
  {
    id: 'tabs-live-dom-aria-selected-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record keeps aria-selected on the first tab',
    expect: { dimensions: ['dom.aria', 'interaction.convergence'], caseIds: [CLICK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [first, second] = findAll(dom, isTab);
        if (second.attributes['aria-selected'] !== 'true') fail('second tab is not selected');
        second.attributes['aria-selected'] = 'false';
        first.attributes['aria-selected'] = 'true';
      });
    },
  },
  {
    id: 'tabs-live-dom-tabindex-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record keeps the roving tabindex on the first tab',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.convergence'], caseIds: [CLICK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [first, second] = findAll(dom, isTab);
        if (second.attributes.tabindex !== '0') fail('second tab is not tabbable');
        second.attributes.tabindex = '-1';
        first.attributes.tabindex = '0';
      });
    },
  },
  {
    id: 'tabs-live-dom-panel-label-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record labels the panel by the first tab',
    expect: { dimensions: ['dom.relationships', 'interaction.convergence'], caseIds: [CLICK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [first, second] = findAll(dom, isTab);
        const [panel] = findAll(dom, isPanel);
        if (panel.attributes['aria-labelledby'] !== second.attributes.id)
          fail('panel is not labelled by the second tab');
        panel.attributes['aria-labelledby'] = first.attributes.id;
      });
    },
  },
  {
    id: 'tabs-live-dom-indicator-rounded',
    klass: 'live dom',
    description: 'the post-interaction DOM record writes the indicator offset as a whole pixel',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.convergence'], caseIds: [CLICK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [indicator] = findAll(dom, isIndicator);
        if (!indicator.attributes.style.includes('translateX(97.3594px)'))
          fail(`indicator is ${indicator.attributes.style}`);
        indicator.attributes.style = indicator.attributes.style.replace('translateX(97.3594px)', 'translateX(97px)');
      });
    },
  },
  {
    id: 'tabs-post-dom-copied-from-initial',
    klass: 'live dom',
    description:
      'AP: the post-interaction DOM record is a copy of the initial extraction, so the gesture measured nothing',
    expect: { dimensions: ['interaction.convergence'], caseIds: [CLICK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.interactionDom?.[CLICK]) fail('no post-interaction DOM');
        capture.interactionDom[CLICK] = structuredClone(capture.extracted[CLICK].dom);
      });
    },
  },

  // ---------------------------------------------------- initial DOM records
  {
    id: 'tabs-initial-tabindex-all-zero',
    klass: 'native attributes',
    description: 'C/D: every tab is tabbable in the initial DOM record',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [SETTINGS],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const tab of findAll(capture.extracted[SETTINGS].dom, isTab)) tab.attributes.tabindex = '0';
      });
    },
  },
  {
    id: 'tabs-initial-aria-selected-absent-when-false',
    klass: 'aria',
    description: 'aria-selected is absent from the unselected tabs instead of "false"',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-selected'] }, caseIds: [SETTINGS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const tab of findAll(capture.extracted[SETTINGS].dom, isTab)) {
          if (tab.attributes['aria-selected'] === 'false') delete tab.attributes['aria-selected'];
        }
      });
    },
  },
  {
    id: 'tabs-initial-role-missing',
    klass: 'aria',
    description: 'AK: the second tab carries no role in the initial DOM record',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        delete findAll(capture.extracted[DEFAULT].dom, isTab)[1].attributes.role;
      });
    },
  },
  {
    id: 'tabs-initial-dangling-edge-resolved',
    klass: 'relationships',
    description: "the second tab's aria-controls resolves to the first tab's panel instead of dangling",
    expect: { dimensions: ['dom.relationships'], caseIds: [PANEL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [, second] = findAll(capture.extracted[PANEL].dom, isTab);
        const [panel] = findAll(capture.extracted[PANEL].dom, isPanel);
        if (second.attributes['aria-controls'] !== '#dangling') fail('second edge is not dangling');
        second.attributes['aria-controls'] = panel.attributes.id;
      });
    },
  },
  {
    id: 'tabs-initial-duplicate-ids-deduplicated',
    klass: 'relationships',
    description: 'the second of two duplicated tabs gets an id of its own in the initial DOM record',
    expect: { dimensions: ['dom.relationships'], caseIds: [DUPLICATES] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [first, second] = findAll(capture.extracted[DUPLICATES].dom, isTab);
        if (first.attributes.id !== second.attributes.id) fail('ids are not duplicated');
        second.attributes.id = '#id99';
      });
    },
  },
  {
    id: 'tabs-initial-indicator-rounded',
    klass: 'style',
    description: 'AG: the clipped indicator is recorded with whole-pixel offset and width',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [CLIPPED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [indicator] = findAll(capture.extracted[CLIPPED].dom, isIndicator);
        if (!indicator.attributes.style.includes('259.953px')) fail(`indicator is ${indicator.attributes.style}`);
        indicator.attributes.style = indicator.attributes.style
          .replace('259.953px', '260px')
          .replace('72.0469px', '72px');
      });
    },
  },
  {
    id: 'tabs-initial-panel-missing',
    klass: 'structure',
    description: 'I: the panel is missing from the initial DOM record',
    expect: { dimensions: ['dom.structure'], caseIds: [PANEL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const root = capture.extracted[PANEL].dom[0];
        const index = root.children.findIndex(isPanel);
        if (index === -1) fail('no panel');
        root.children.splice(index, 1);
      });
    },
  },

  // -------------------------------------------------- AM. identically wrong
  {
    id: 'tabs-current-and-razor-identically-wrong',
    klass: 'directional',
    description:
      'AM: current Vue and Razor both invert the roving tabindex in the initial DOM record; only the reference direction can see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [SETTINGS],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          for (const tab of findAll(capture.extracted[SETTINGS].dom, isTab)) {
            tab.attributes.tabindex = tab.attributes.tabindex === '0' ? '-1' : '0';
          }
        });
      }
    },
  },
];

// ----------------------------------------------------------- browser mutations

export const tabsBrowserMutations = [
  // ------------------------------------------- the two attribute holes
  {
    id: 'browser-tabs-tabindex-inverted',
    target: 'razor',
    caseIds: [SETTINGS],
    description:
      'the roving tabindex is inverted on the real page: the selected tab gets -1 and the two others 0, with aria-selected untouched',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [SETTINGS],
    },
    beforeExtract: mutateElements(
      [SETTINGS],
      TAB,
      `element.setAttribute('tabindex', element.getAttribute('aria-selected') === 'true' ? '-1' : '0');`,
    ),
  },
  {
    id: 'browser-tabs-aria-selected-stale',
    target: 'razor',
    caseIds: [SETTINGS],
    description:
      'aria-selected stays on the first tab while tabindex, the panel and the indicator all say the middle one is selected',
    expect: {
      dimensions: ['dom.aria', 'a11y.states'],
      details: { 'dom.aria': ['aria-selected'] },
      caseIds: [SETTINGS],
    },
    beforeExtract: mutateElements(
      [SETTINGS],
      TAB,
      `
      const tabs = [...element.parentElement.children];
      element.setAttribute('aria-selected', tabs.indexOf(element) === 0 ? 'true' : 'false');
    `,
    ),
  },
  {
    id: 'browser-tabs-two-selected-in-a-normal-case',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'D: two tabs selected and tabbable in a case whose reference selects one',
    expect: { dimensions: ['dom.aria', 'dom.nativeAttributes', 'a11y.states'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      nth(2),
      `element.setAttribute('aria-selected', 'true'); element.setAttribute('tabindex', '0');`,
    ),
  },
  {
    id: 'browser-tabs-no-tabbable-tab-in-a-normal-case',
    target: 'razor',
    caseIds: [SETTINGS],
    description: 'E: every tab at tabindex -1 in a case whose reference has one at 0',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [SETTINGS],
    },
    beforeExtract: mutateElements([SETTINGS], `${TAB}[tabindex="0"]`, `element.setAttribute('tabindex', '-1');`),
  },

  // --------------------------------------------------------- A. ownership
  {
    id: 'browser-tabs-tab-removed',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real second tab is removed',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], nth(2), `element.remove();`),
  },
  {
    id: 'browser-tabs-tab-becomes-a-div',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real second native button is replaced by a div with role=tab and tabindex -1',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      nth(2),
      `
      const impostor = document.createElement('div');
      for (const attribute of element.attributes) if (attribute.name !== 'type') impostor.setAttribute(attribute.name, attribute.value);
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-tabs-tab-duplicated',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real third tab is cloned',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], nth(3), `element.after(element.cloneNode(true));`),
  },
  {
    id: 'browser-tabs-role-removed',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'AK: the real second tab loses role=tab',
    expect: { dimensions: ['ownership.controls', 'dom.aria'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], nth(2), `element.removeAttribute('role');`),
  },
  {
    id: 'browser-tabs-role-substituted',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'AL: the real second tab carries role=button - the explicit-role count is unchanged',
    expect: { dimensions: ['ownership.controls', 'dom.aria'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], nth(2), `element.setAttribute('role', 'button');`),
  },
  {
    id: 'browser-tabs-scroll-button-wears-the-tab-role',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real left scroll button carries role=tab: an extra role-bearing owned control',
    expect: { dimensions: ['ownership.controls', 'dom.aria'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], '.vf-tabs__scroll-button--left', `element.setAttribute('role', 'tab');`),
  },
  {
    id: 'browser-tabs-undeclared-interactive-role',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real baseline span carries role=button, a role no rule declares',
    expect: { dimensions: ['ownership.controls', 'dom.aria'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], '.vf-tabs__baseline', `element.setAttribute('role', 'button');`),
  },
  {
    id: 'browser-tabs-scroll-left-missing',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'F: the real left scroll button is removed',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements([DEFAULT], '.vf-tabs__scroll-button--left', `element.remove();`),
  },
  {
    id: 'browser-tabs-scroll-right-missing',
    target: 'razor',
    caseIds: [OVERFLOW],
    description: 'G: the real right scroll button, shown for the overflow, is removed',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [OVERFLOW] },
    beforeExtract: mutateElements([OVERFLOW], '.vf-tabs__scroll-button--right', `element.remove();`),
  },
  {
    id: 'browser-tabs-scroll-button-duplicated',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'H: the real right scroll button is cloned',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      '.vf-tabs__scroll-button--right',
      `element.after(element.cloneNode(true));`,
    ),
  },
  {
    id: 'browser-tabs-scroll-button-becomes-a-div',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'I: the real left scroll button is replaced by a div with tabindex -1',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      '.vf-tabs__scroll-button--left',
      `
      const impostor = document.createElement('div');
      for (const attribute of element.attributes) if (!['type', 'disabled'].includes(attribute.name)) impostor.setAttribute(attribute.name, attribute.value);
      impostor.append(...element.childNodes);
      element.replaceWith(impostor);
    `,
    ),
  },
  {
    id: 'browser-tabs-tab-removed-scroll-button-added',
    target: 'razor',
    caseIds: [DEFAULT],
    description:
      'O on the real page: the second tab is removed and the left scroll button cloned, so five focusable elements remain',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      nth(2),
      `
      const total = root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length;
      const left = root.querySelector('.vf-tabs__scroll-button--left');
      left.after(left.cloneNode(true));
      element.remove();
      if (root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length !== total) throw new Error('MUTATION_NOT_APPLIED: total moved');
      evidence.push({ caseId, focusableTotal: total });
    `,
    ),
  },
  {
    id: 'browser-tabs-consumer-button-wears-the-tab-class',
    target: 'razor',
    caseIds: [PANEL_CONTROL],
    description: "the consumer's Save button inside the panel is given the tab class, so it counts as the component's",
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [PANEL_CONTROL] },
    beforeExtract: mutateElements([PANEL_CONTROL], '.parity-panel-control', `element.classList.add('vf-tabs__tab');`),
  },
  {
    id: 'browser-tabs-consumer-button-stands-in-for-a-tab',
    target: 'razor',
    caseIds: [BEFORE],
    description:
      'AJ: the real third tab is removed and the consumer button before the tabs is given the tab class and role, so the counts and the explicit roles all still add up',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [BEFORE] },
    beforeExtract: mutateElements(
      [BEFORE],
      '.parity-before',
      `
      root.querySelector('${nth(3)}').remove();
      element.classList.add('vf-tabs__tab');
      element.setAttribute('role', 'tab');
    `,
    ),
  },
  {
    id: 'browser-tabs-panel-missing',
    target: 'razor',
    caseIds: [PANEL],
    description: 'J: the real panel is removed',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [PANEL] },
    beforeExtract: mutateElements([PANEL], '.vf-tabs__panel', `element.remove();`),
  },
  {
    id: 'browser-tabs-panel-duplicated',
    target: 'razor',
    caseIds: [PANEL],
    description: 'K: the real panel is cloned',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [PANEL] },
    beforeExtract: mutateElements([PANEL], '.vf-tabs__panel', `element.after(element.cloneNode(true));`),
  },
  {
    id: 'browser-tabs-template-becomes-a-hidden-panel',
    target: 'razor',
    caseIds: [PANEL],
    description:
      "AR: the adapter's inert template for the second item is turned into a real hidden tabpanel, the permanent N-panel shape",
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [PANEL] },
    beforeExtract: mutateElements(
      [PANEL],
      'template[data-vf-razor-tabs-panel="1"]',
      `
      const hidden = document.createElement('div');
      hidden.className = 'vf-tabs__panel';
      hidden.setAttribute('role', 'tabpanel');
      hidden.setAttribute('tabindex', '0');
      hidden.hidden = true;
      hidden.append(element.content.cloneNode(true));
      element.replaceWith(hidden);
    `,
    ),
  },
  {
    id: 'browser-tabs-panel-moved-outside-owner',
    target: 'razor',
    caseIds: [PANEL],
    description: 'L: the real panel is moved out of the root, after it',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [PANEL] },
    beforeExtract: mutateElements([PANEL], '.vf-tabs__panel', `element.closest('.vf-tabs').after(element);`),
  },

  // ------------------------------------------------------- B. relationships
  {
    id: 'browser-tabs-controls-wrong-target',
    target: 'razor',
    caseIds: [PANEL],
    description: "the selected tab's aria-controls names the second tab instead of the panel",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [PANEL] },
    beforeExtract: mutateElements(
      [PANEL],
      nth(1),
      `element.setAttribute('aria-controls', root.querySelector('${nth(2)}').id);`,
    ),
  },
  {
    id: 'browser-tabs-panel-labelled-by-wrong-tab',
    target: 'razor',
    caseIds: [PANEL],
    description: 'the real panel is labelled by the second tab while the first is selected',
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [PANEL] },
    beforeExtract: mutateElements(
      [PANEL],
      '.vf-tabs__panel',
      `element.setAttribute('aria-labelledby', root.querySelector('${nth(2)}').id);`,
    ),
  },
  {
    id: 'browser-tabs-dangling-edge-resolved',
    target: 'razor',
    caseIds: [PANEL],
    description: "the second tab's aria-controls is pointed at the first tab's panel",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [PANEL] },
    beforeExtract: mutateElements(
      [PANEL],
      nth(2),
      `element.setAttribute('aria-controls', root.querySelector('.vf-tabs__panel').id);`,
    ),
  },
  {
    id: 'browser-tabs-active-edge-dangling',
    target: 'razor',
    caseIds: [PANEL],
    description: "the selected tab's aria-controls resolves nowhere",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [PANEL] },
    beforeExtract: mutateElements([PANEL], nth(1), `element.setAttribute('aria-controls', 'nowhere-at-all');`),
  },
  {
    id: 'browser-tabs-edge-into-another-case',
    target: 'razor',
    caseIds: [PANEL],
    description: "AC: the selected tab's aria-controls names another case's panel",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [PANEL] },
    beforeExtract: mutateElements(
      [PANEL],
      nth(1),
      `element.setAttribute('aria-controls', document.querySelector('[data-parity-case="${SETTINGS}"] .vf-tabs__panel').id);`,
    ),
  },
  {
    id: 'browser-tabs-tab-id-override-ignored',
    target: 'razor',
    caseIds: [TAB_ID],
    description: "N: the consumer's tabId is replaced by a generated id on the real page, the label following it",
    expect: { dimensions: ['interaction.relationships'], caseIds: [TAB_ID] },
    beforeExtract: mutateElements(
      [TAB_ID],
      '#consumer-overview-tab',
      `
      element.id = 'vf-tabs-r-9999-tab-overview';
      root.querySelector('.vf-tabs__panel').setAttribute('aria-labelledby', element.id);
    `,
    ),
  },
  {
    id: 'browser-tabs-panel-id-override-ignored',
    target: 'razor',
    caseIds: [PANEL_ID],
    description: "O: the consumer's panelId is replaced by a generated id on the real page, aria-controls following it",
    expect: { dimensions: ['interaction.relationships'], caseIds: [PANEL_ID] },
    beforeExtract: mutateElements(
      [PANEL_ID],
      '#consumer-overview-panel',
      `
      element.id = 'vf-tabs-r-9999-panel-overview';
      root.querySelector('${nth(1)}').setAttribute('aria-controls', element.id);
    `,
    ),
  },
  {
    id: 'browser-tabs-duplicate-ids-deduplicated',
    target: 'razor',
    caseIds: [DUPLICATES],
    description: 'the second of two duplicated tabs is given an id of its own on the real page',
    expect: { dimensions: ['dom.relationships'], caseIds: [DUPLICATES] },
    beforeExtract: mutateElements([DUPLICATES], nth(2), `element.id = element.id + '-2';`),
  },

  // --------------------------------------------------- C. live state / ARIA
  //
  // Sections 40 and 48: the real controller runs, then one half of what it
  // did is undone between the gesture and the measurement.
  {
    id: 'browser-tabs-aria-selected-stale-after-click',
    target: 'razor',
    caseIds: [CLICK],
    description:
      'A: the click moved tabindex, the panel and the indicator, and aria-selected is put back on the first tab',
    expect: {
      dimensions: ['interaction.state', 'dom.aria', 'a11y.states', 'interaction.convergence'],
      caseIds: [CLICK],
    },
    afterInteraction: mutateElements(
      [CLICK],
      LIST,
      `
      const [first, second] = element.querySelectorAll('.vf-tabs__tab');
      if (second.getAttribute('aria-selected') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not moved');
      second.setAttribute('aria-selected', 'false');
      first.setAttribute('aria-selected', 'true');
    `,
    ),
  },
  {
    id: 'browser-tabs-tabindex-stale-after-click',
    target: 'razor',
    caseIds: [CLICK],
    description: 'B: the click moved aria-selected, the panel and the indicator, and the roving tabindex is put back',
    expect: {
      dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'],
      caseIds: [CLICK],
    },
    afterInteraction: mutateElements(
      [CLICK],
      LIST,
      `
      const [first, second] = element.querySelectorAll('.vf-tabs__tab');
      if (second.getAttribute('tabindex') !== '0') throw new Error('MUTATION_NOT_APPLIED: not moved');
      second.setAttribute('tabindex', '-1');
      first.setAttribute('tabindex', '0');
    `,
    ),
  },
  {
    id: 'browser-tabs-indicator-stale-after-click',
    target: 'razor',
    caseIds: [CLICK],
    description: 'AE: the click moved the selection and the panel, and the indicator is put back under the first tab',
    expect: {
      dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'],
      caseIds: [CLICK],
    },
    afterInteraction: mutateElements(
      [CLICK],
      '.vf-tabs__indicator',
      `
      if (element.style.transform !== 'translateX(97.3594px)') throw new Error('MUTATION_NOT_APPLIED: ' + element.style.transform);
      element.style.transform = 'translateX(0px)';
      element.style.width = '93.3594px';
    `,
    ),
  },
  {
    id: 'browser-tabs-indicator-rounded-after-click',
    target: 'razor',
    caseIds: [CLICK],
    description: 'AG: the click moved the indicator, and its offset and width are rounded to whole pixels',
    expect: { dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'], caseIds: [CLICK] },
    afterInteraction: mutateElements(
      [CLICK],
      '.vf-tabs__indicator',
      `
      if (element.style.width !== '85.6719px') throw new Error('MUTATION_NOT_APPLIED: ' + element.style.width);
      element.style.transform = 'translateX(97px)';
      element.style.width = '86px';
    `,
    ),
  },
  {
    id: 'browser-tabs-panel-stale-after-click',
    target: 'razor',
    caseIds: [CLICK],
    description: 'I: the click moved the selection and the indicator, and the panel is put back to the first tab',
    expect: {
      dimensions: [
        'interaction.state',
        'interaction.relationships',
        'dom.relationships',
        'dom.text',
        'interaction.convergence',
      ],
      caseIds: [CLICK],
    },
    afterInteraction: mutateElements(
      [CLICK],
      '.vf-tabs__panel',
      `
      const first = root.querySelector('${nth(1)}');
      if (element.getAttribute('aria-labelledby') === first.id) throw new Error('MUTATION_NOT_APPLIED: not moved');
      element.id = first.getAttribute('aria-controls');
      element.setAttribute('aria-labelledby', first.id);
      element.querySelector('p').textContent = 'Panel for overview';
    `,
    ),
  },
  {
    id: 'browser-tabs-inactive-panel-left-in-place',
    target: 'razor',
    caseIds: [CLICK],
    description: 'AD: the click created the new panel and the old one stays in the product DOM, hidden',
    expect: {
      dimensions: ['ownership.controls', 'dom.structure', 'interaction.state', 'interaction.convergence'],
      caseIds: [CLICK],
    },
    afterInteraction: mutateElements(
      [CLICK],
      '.vf-tabs__panel',
      `
      const stale = element.cloneNode(true);
      stale.hidden = true;
      element.before(stale);
    `,
    ),
  },

  // --------------------------------------------------------------- D. events
  {
    id: 'browser-tabs-current-reclick-silent',
    target: 'razor',
    caseIds: [CLICK_CURRENT],
    description: 'Q: the real controller re-selects the current tab and the notification is swallowed',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_CURRENT] },
    beforeInteraction: mutateElements(
      [CLICK_CURRENT],
      '[data-vf-razor="tabs"]',
      `element.addEventListener('vf-tabs:change', (event) => event.stopPropagation());`,
    ),
  },
  {
    id: 'browser-tabs-events-reversed',
    target: 'razor',
    caseIds: [TWO_CLICKS],
    description: 'R: the two real notifications reach the host in the wrong order',
    expect: { dimensions: ['interaction.events'], caseIds: [TWO_CLICKS] },
    beforeInteraction: mutateElements(
      [TWO_CLICKS],
      '[data-vf-razor="tabs"]',
      `
      const held = [];
      element.addEventListener('vf-tabs:change', (event) => {
        if (event.detail.replayed) return;
        event.stopPropagation();
        held.push(event.detail.value);
        if (held.length === 2) {
          for (const value of held.reverse()) element.dispatchEvent(new CustomEvent('vf-tabs:change', { bubbles: true, detail: { value, replayed: true } }));
        }
      });
    `,
    ),
  },
  {
    id: 'browser-tabs-event-carries-the-label',
    target: 'razor',
    caseIds: [CLICK],
    description: 'the real controller selects correctly and its event carries the label instead of the value',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK] },
    beforeInteraction: mutateElements(
      [CLICK],
      '[data-vf-razor="tabs"]',
      `
      element.addEventListener('vf-tabs:change', (event) => {
        if (event.detail.value === 'Settings') return;
        event.stopImmediatePropagation();
        element.dispatchEvent(new CustomEvent('vf-tabs:change', { bubbles: true, detail: { value: 'Settings' } }));
      });
    `,
    ),
  },

  // ------------------------------------------------------------ E. keyboard
  //
  // Section 50, each on the real Razor page.
  {
    id: 'browser-tabs-arrow-wrong-target',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'ArrowRight lands on the last tab instead of the next',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [ARROW_RIGHT],
    },
    beforeInteraction: interceptKey(
      ARROW_RIGHT,
      'ArrowRight',
      `event.preventDefault(); tabs[2].click(); tabs[2].focus();`,
    ),
  },
  {
    id: 'browser-tabs-arrow-down-ignored',
    target: 'razor',
    caseIds: [ARROW_DOWN],
    description: 'O: ArrowDown on the horizontal tablist is left to the page',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [ARROW_DOWN],
    },
    beforeInteraction: interceptKey(ARROW_DOWN, 'ArrowDown', ``),
  },
  {
    id: 'browser-tabs-arrow-without-prevent-default',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'P: ArrowRight selects and focuses the right tab and leaves the keydown unprevented',
    expect: { dimensions: ['interaction.state'], caseIds: [ARROW_RIGHT] },
    beforeInteraction: interceptKey(ARROW_RIGHT, 'ArrowRight', `tabs[1].click(); tabs[1].focus();`),
  },
  {
    id: 'browser-tabs-selection-moves-not-focus',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'U: ArrowRight selects the next tab and leaves focus on the origin',
    expect: { dimensions: ['interaction.focus'], caseIds: [ARROW_RIGHT] },
    beforeInteraction: interceptKey(
      ARROW_RIGHT,
      'ArrowRight',
      `event.preventDefault(); tabs[1].click(); from.focus();`,
    ),
  },
  {
    id: 'browser-tabs-focus-moves-not-selection',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'T: ArrowRight focuses the next tab and selects nothing',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [ARROW_RIGHT],
    },
    beforeInteraction: interceptKey(ARROW_RIGHT, 'ArrowRight', `event.preventDefault(); tabs[1].focus();`),
  },
  {
    id: 'browser-tabs-no-wrap',
    target: 'razor',
    caseIds: [WRAP],
    description: 'S: ArrowRight on the last tab stays there instead of wrapping',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [WRAP],
    },
    beforeInteraction: interceptKey(WRAP, 'ArrowRight', `event.preventDefault();`),
  },
  {
    id: 'browser-tabs-disabled-not-skipped',
    target: 'razor',
    caseIds: [SKIP],
    description: 'M/N: ArrowRight lands on the disabled middle tab, enabling it on the way',
    expect: {
      dimensions: [
        'interaction.state',
        'interaction.focus',
        'interaction.events',
        'dom.nativeAttributes',
        'interaction.convergence',
      ],
      caseIds: [SKIP],
    },
    beforeInteraction: interceptKey(
      SKIP,
      'ArrowRight',
      `event.preventDefault(); tabs[1].disabled = false; tabs[1].click(); tabs[1].focus();`,
    ),
  },
  {
    id: 'browser-tabs-home-wrong',
    target: 'razor',
    caseIds: [HOME],
    description: 'Q: Home lands on the middle tab',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [HOME],
    },
    beforeInteraction: interceptKey(HOME, 'Home', `event.preventDefault(); tabs[1].click(); tabs[1].focus();`),
  },
  {
    id: 'browser-tabs-navigation-starts-from-the-selected-tab',
    target: 'razor',
    caseIds: [FROM_FOCUSED],
    description: 'ArrowLeft from the focused last tab is computed from the selected first tab: it wraps to the last',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [FROM_FOCUSED],
    },
    beforeInteraction: interceptKey(
      FROM_FOCUSED,
      'ArrowLeft',
      `event.preventDefault(); tabs[2].click(); tabs[2].focus();`,
    ),
  },
  {
    id: 'browser-tabs-enter-double-activation',
    target: 'razor',
    caseIds: [ENTER],
    description: 'X: Enter is handled on keydown with a click of its own beside the native one',
    expect: { dimensions: ['interaction.state'], caseIds: [ENTER] },
    beforeInteraction: mutateElements(
      [ENTER],
      LIST,
      `element.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.target.click(); });`,
    ),
  },
  {
    id: 'browser-tabs-space-handled',
    target: 'razor',
    caseIds: [SPACE],
    description: 'Y: Space is handled on keydown with preventDefault and a click of its own',
    expect: { dimensions: ['interaction.state'], caseIds: [SPACE] },
    beforeInteraction: mutateElements(
      [SPACE],
      LIST,
      `element.addEventListener('keydown', (event) => { if (event.key === ' ') { event.preventDefault(); event.target.click(); } });`,
    ),
  },
  {
    id: 'browser-tabs-rtl-not-reversed',
    target: 'razor',
    caseIds: [RTL_LEFT],
    description: 'ArrowLeft under dir=rtl keeps its LTR meaning and wraps backward',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [RTL_LEFT],
    },
    beforeInteraction: interceptKey(RTL_LEFT, 'ArrowLeft', `event.preventDefault(); tabs[2].click(); tabs[2].focus();`),
  },
  {
    id: 'browser-tabs-every-tab-tabbable-before-native-tab',
    target: 'razor',
    caseIds: [TAB_INTO_LIST],
    description:
      'the roving tabindex is flattened to 0 on every real tab, so native Tab from the consumer button lands on the first',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'dom.nativeAttributes'],
      caseIds: [TAB_INTO_LIST],
    },
    beforeInteraction: mutateElements([TAB_INTO_LIST], TAB, `element.setAttribute('tabindex', '0');`),
  },

  // ------------------------------------------------------------ F. siblings
  {
    id: 'browser-tabs-sibling-state-leak',
    target: 'razor',
    caseIds: [SIBLING_CLICK],
    description: 'Z: clicking a tab in the second real sibling also selects a tab in the first',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [SIBLING_CLICK] },
    beforeInteraction: mutateElements(
      [SIBLING_CLICK],
      `.vf-tabs:last-of-type ${nth(2)}`,
      `
      const other = root.querySelector('.vf-tabs:first-of-type ${nth(3)}');
      element.addEventListener('click', () => other.click());
    `,
    ),
  },
  {
    id: 'browser-tabs-sibling-focus-leak',
    target: 'razor',
    caseIds: [SIBLING_KEYBOARD],
    description: 'AA: ArrowRight in the second real sibling moves its selection and sends focus into the first',
    expect: { dimensions: ['interaction.focus'], caseIds: [SIBLING_KEYBOARD] },
    beforeInteraction: mutateElements(
      [SIBLING_KEYBOARD],
      `.vf-tabs:last-of-type ${LIST}`,
      `
      const other = root.querySelector('.vf-tabs:first-of-type ${nth(2)}');
      element.addEventListener('keydown', () => setTimeout(() => other.focus(), 0));
    `,
    ),
  },

  // ------------------------------------------------------- G. current-only
  //
  // Section 52 on the real current target, with the reference and Razor
  // pages re-captured fresh to prove they were not touched.
  {
    id: 'browser-tabs-current-only-live-defect',
    target: 'current',
    caseIds: [CLICK],
    verifyIsolation: true,
    description:
      'current Vue moves aria-selected, tabindex and the panel, and the indicator is put back under the first tab; reference and Razor stay independent',
    expect: {
      dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'],
      caseIds: [CLICK],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    afterInteraction: mutateElements(
      [CLICK],
      '.vf-tabs__indicator',
      `
      if (element.style.transform !== 'translateX(97.3594px)') throw new Error('MUTATION_NOT_APPLIED: ' + element.style.transform);
      element.style.transform = 'translateX(0px)';
      element.style.width = '93.3594px';
    `,
    ),
  },

  // ------------------------------------------------------------ H. scroller
  {
    id: 'browser-tabs-scroll-state-stale',
    target: 'razor',
    caseIds: [SCROLL_RIGHT],
    description: 'AH: the viewport scrolled and the scroll state is put back to the start: classes, buttons and fade',
    expect: {
      dimensions: ['interaction.state', 'dom.canonicalClasses', 'dom.aria', 'dom.nativeAttributes'],
      caseIds: [SCROLL_RIGHT],
    },
    afterInteraction: afterScrollSettle(
      [SCROLL_RIGHT],
      '.vf-tabs__list',
      `
      if (!element.classList.contains('vf-tabs__list--can-scroll-left')) throw new Error('MUTATION_NOT_APPLIED: not scrolled');
      element.classList.remove('vf-tabs__list--can-scroll-left', 'vf-horizontal-scroller--can-scroll-left');
      element.classList.add('vf-tabs__list--can-scroll-right', 'vf-horizontal-scroller--can-scroll-right');
      const left = element.querySelector('.vf-tabs__scroll-button--left');
      left.classList.add('vf-tabs__scroll-button--hidden', 'vf-horizontal-scroller__control--hidden');
      left.setAttribute('aria-hidden', 'true');
      left.setAttribute('tabindex', '-1');
      left.disabled = true;
      element.querySelector('.vf-horizontal-scroller__fade--left')?.remove();
    `,
    ),
  },
  {
    id: 'browser-tabs-hidden-button-tabbable',
    target: 'razor',
    caseIds: [OVERFLOW],
    description: 'AI: the hidden left scroll button keeps tabindex 0 and is not aria-hidden',
    // Not a11y.role: the button is still visibility:hidden through its
    // class, so the tree ignores it whatever aria-hidden says - the DOM
    // attributes are the evidence, as they are for the user's Tab key.
    expect: { dimensions: ['dom.nativeAttributes', 'dom.aria'], caseIds: [OVERFLOW] },
    beforeExtract: mutateElements(
      [OVERFLOW],
      '.vf-tabs__scroll-button--left',
      `element.setAttribute('tabindex', '0'); element.setAttribute('aria-hidden', 'false');`,
    ),
  },
  {
    id: 'browser-tabs-fade-missing',
    target: 'razor',
    caseIds: [SCROLL_MANY],
    description: 'the viewport scrolled into the middle and the left fade is removed',
    expect: { dimensions: ['interaction.state', 'dom.structure'], caseIds: [SCROLL_MANY] },
    afterInteraction: afterScrollSettle([SCROLL_MANY], '.vf-horizontal-scroller__fade--left', `element.remove();`),
  },
  {
    id: 'browser-tabs-indicator-rounded',
    target: 'razor',
    caseIds: [CLIPPED],
    description: 'AG on the real page: the clipped indicator is written with a whole-pixel offset and width',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [CLIPPED],
    },
    beforeExtract: mutateElements(
      [CLIPPED],
      '.vf-tabs__indicator',
      `
      if (element.style.width !== '72.0469px') throw new Error('MUTATION_NOT_APPLIED: ' + element.style.width);
      element.style.transform = 'translateX(260px)';
      element.style.width = '72px';
    `,
    ),
  },
  {
    id: 'browser-tabs-clipped-indicator-visible',
    target: 'razor',
    caseIds: [HIDDEN],
    description: 'the indicator of a tab scrolled out of view is painted anyway, at its offset with the full width',
    // Not visual, and deliberately so: the screenshot stage captures beyond
    // the viewport, which fires a window resize, and both adapters re-measure
    // the indicator on resize exactly as the reference does - so every
    // screenshot shows a re-measured indicator and an inline-style defect
    // never reaches the pixels. dom.nativeAttributes is what catches it,
    // and this is the section-51 case where DOM evidence is independently
    // load-bearing.
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['style'] }, caseIds: [HIDDEN] },
    beforeExtract: mutateElements(
      [HIDDEN],
      '.vf-tabs__indicator',
      `
      if (element.style.opacity !== '0') throw new Error('MUTATION_NOT_APPLIED: ' + element.style.opacity);
      element.style.opacity = '1';
      element.style.transform = 'translateX(222px)';
      element.style.width = '137.891px';
    `,
    ),
  },
  {
    id: 'browser-tabs-ready-classes-missing',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the readiness classes never arrive on the root, the scroller and the indicator',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      '.vf-tabs',
      `
      if (!element.classList.contains('vf-tabs--scroll-controls-animated')) throw new Error('MUTATION_NOT_APPLIED: not ready');
      for (const node of [element, element.querySelector('.vf-tabs__list')]) node.classList.remove('vf-tabs--scroll-controls-ready', 'vf-tabs--scroll-controls-animated', 'vf-horizontal-scroller--controls-ready', 'vf-horizontal-scroller--controls-animated');
      element.querySelector('.vf-tabs__indicator').classList.remove('vf-tabs__indicator--ready');
    `,
    ),
  },
];

// ------------------------------------------------------------ policy mutations

function push(policy, approval) {
  policy.approvedDivergences.push(approval);
}

/** An approval on a dimension the validator must never accept. */
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

export const tabsPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [DEFAULT],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', [DEFAULT], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-post-visual-approval',
    'visual.postInteraction',
    [CLICK],
    'an approval for post-interaction pixels',
  ),
  smuggled('smuggled-wildcard-case', 'dom.aria', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [DEFAULT],
    'an approval for ownership.controls - the tabs would be able to waive the evidence that their tabs, buttons and panel are their own',
  ),
  smuggled(
    'smuggled-interaction-state-approval',
    'interaction.state',
    [CLICK],
    'an approval for interaction.state - "Razor is different because JS", which the enhancement exists to make unnecessary',
  ),
  smuggled(
    'smuggled-events-approval',
    'interaction.events',
    [CLICK],
    'an approval for interaction.events - a host never told would be excused',
  ),
  smuggled(
    'smuggled-convergence-approval',
    'interaction.convergence',
    [CLICK],
    'an approval for interaction.convergence - a gesture landing on a hybrid would be excused',
  ),
  idle(
    'idle-aria-selected-approval',
    'dom.aria',
    [CLICK, ARROW_RIGHT, ENTER, SPACE, HOME, DEFAULT, SETTINGS],
    'aria-selected',
    'button.vf-tabs__tab',
    'a broad aria-selected approval across every keyboard and pointer scenario, matching nothing on a clean run',
  ),
  idle(
    'idle-tabindex-approval',
    'dom.nativeAttributes',
    [CLICK, ARROW_RIGHT, DEFAULT, SETTINGS, TAB_INTO_LIST],
    'tabindex',
    'button.vf-tabs__tab',
    'a broad roving-tabindex approval, matching nothing on a clean run',
  ),
  idle(
    'idle-indicator-style-approval',
    'dom.nativeAttributes',
    [CLIPPED, HIDDEN, CLICK, OVERFLOW],
    'style',
    'span.vf-tabs__indicator',
    'an indicator style approval that would excuse rounded geometry, matching nothing on a clean run',
  ),
  {
    id: 'idle-focus-approval',
    klass: 'policy',
    description: 'a focus approval across the navigation and sibling scenarios, matching nothing on a clean run',
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id: 'idle-focus-approval',
        dimension: 'interaction.focus',
        target: 'razor',
        caseIds: [ARROW_RIGHT, HOME, SIBLING_KEYBOARD, TAB_INTO_LIST],
        detail: 'focusValue',
        path: 'focusValue',
        left: 'settings',
        right: 'overview',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  },
  {
    id: 'idle-selected-state-approval',
    klass: 'policy',
    description: 'an approval for the exposed selected state after a click, matching nothing on a clean run',
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id: 'idle-selected-state-approval',
        dimension: 'a11y.states',
        target: 'razor',
        caseIds: [CLICK, SETTINGS],
        detail: 'selected',
        path: 'secondTab',
        left: 'true',
        right: 'false',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  },
  idle(
    'idle-relationship-approval',
    'dom.relationships',
    [PANEL, TAB_ID, PANEL_ID, DUPLICATES],
    'aria-controls',
    'button.vf-tabs__tab',
    'an aria-controls approval that would excuse a resolved dangling edge, matching nothing on a clean run',
  ),
];
