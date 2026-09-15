// The negative fixture for the VfStepper parity gate.
//
// The second mutation set for a component that owns controls and changes its
// own state, and the first for one that owns several of one role, keeps every
// item in the DOM and leaves Enter and Space to the browser. It has to prove:
//
//   - multi-control ownership is identity, not count. A page with the same
//     number of focusable elements and the wrong owner, an extra trigger, a
//     trigger that became a div, or a neighbouring consumer button counted as
//     the component's fails on ownership (section 10);
//   - the live state is four halves, not one value. aria-current moved while
//     the classes stayed, the classes moved while aria-current stayed, both
//     moved while the factor stayed - each fails on its own field of
//     interaction.state and on the DOM dimension it lives in (section 42);
//   - the keyboard contract is measured key by key: a wrong target, a wrong
//     axis handled, a missing preventDefault, a disabled step not skipped, a
//     wrap removed, Home or End wrong, focus not moved, Enter or Space turned
//     from native activation into a handled key (section 43);
//   - the live stage is directional. A defect only in current Vue fails only
//     the two directions that involve it, and the reference and Razor pages
//     re-captured fresh prove they were untouched (sections 39 and 40);
//   - the factor's serialisation is a DOM difference, not a pixel one: a
//     server writing PHP's fourteen digits fails on the style attribute while
//     the screenshot is identical (section 8).
//
// Capture mutations perturb the stored evidence and prove the comparator
// reports each dimension; browser mutations rewrite real elements on the real
// pages, before extraction or between a gesture and its measurement, and
// prove the extractor, the driver and the screenshots see the defect.
import { eachTheme, fail, mutateElements } from './mutations.mjs';

const DEFAULT = 'stepper/default';
const PROFILE = 'stepper/default-value-profile';
const FOUR = 'stepper/four-items-second';
const DISABLED = 'stepper/disabled-middle';
const BESIDE = 'stepper/beside-consumer-button';
const CLICK_FORWARD = 'stepper/interaction-click-forward';
const CLICK_CURRENT = 'stepper/interaction-click-current';
const CLICK_THEN_ARROW = 'stepper/interaction-click-then-arrow';
const ENTER = 'stepper/interaction-enter';
const SPACE = 'stepper/interaction-space';
const ARROW_RIGHT = 'stepper/interaction-arrow-right';
const WRONG_AXIS = 'stepper/interaction-horizontal-wrong-axis';
const VERTICAL_WRONG_AXIS = 'stepper/interaction-vertical-wrong-axis';
const HOME = 'stepper/interaction-home';
const END = 'stepper/interaction-end';
const SKIP = 'stepper/interaction-skip-disabled';
const WRAP = 'stepper/interaction-wrap-forward';
const DISABLED_KEYBOARD = 'stepper/interaction-disabled-keyboard';
const SIBLING_CLICK = 'stepper/interaction-sibling-isolation';

const TRIGGER = '.vf-stepper__trigger';
const nth = (index) => `.vf-stepper__item:nth-child(${index}) > .vf-stepper__trigger`;

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

const isTrigger = (node) => node.tag === 'button' && node.classes.includes('vf-stepper__trigger');
const isItem = (node) => node.tag === 'li' && node.classes.includes('vf-stepper__item');

/**
 * A keyboard defect on the real page: a capture-phase listener on the list
 * stops the controller from seeing the key and does something else instead.
 * The reference's handler is on the trigger; a capture listener on the list
 * runs before it on every target, which is what makes the same defect
 * expressible for the Razor controller and, in section 39's mutation, for
 * current Vue.
 */
function interceptKey(caseId, key, operation) {
  return mutateElements(
    [caseId],
    '.vf-stepper__list',
    `
    element.addEventListener('keydown', (event) => {
      if (event.key !== ${JSON.stringify(key)}) return;
      event.stopImmediatePropagation();
      const triggers = [...element.querySelectorAll('.vf-stepper__trigger')];
      const from = event.target.closest('.vf-stepper__trigger');
      ${operation}
    }, true);
  `,
  );
}

// ------------------------------------------------------------ capture mutations

export const stepperParityMutations = [
  // ------------------------------------------------------------- ownership
  //
  // Section 10 A: the same number of focusable elements, the wrong owner.
  {
    id: 'stepper-trigger-removed-consumer-remains',
    klass: 'ownership',
    description:
      'one component trigger is gone and the consumer button beside the stepper stands where it was: the focusable ' +
      'total is unchanged and the ownership evidence has to say so',
    expect: { dimensions: ['ownership.controls'], caseIds: [BESIDE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[BESIDE];
        if (snapshot.componentControls.length !== 3 || snapshot.consumerControlCount !== 1)
          fail('unexpected ownership');
        snapshot.componentControls = snapshot.componentControls.slice(0, 2);
        snapshot.consumerControlCount = 2;
        if (snapshot.focusableTotal !== 4) fail('the total changed');
      });
    },
  },
  {
    id: 'stepper-one-trigger-becomes-a-div-in-ownership',
    klass: 'ownership',
    description: 'the ownership record says the second trigger is a div: identity, with the count untouched',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = capture.interactions[DEFAULT].componentControls[1];
        if (control.tag !== 'button') fail('trigger is not a button');
        control.tag = 'div';
      });
    },
  },
  {
    id: 'stepper-fourth-component-trigger',
    klass: 'ownership',
    description: 'a fourth component-owned trigger is recorded for a three-item stepper',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DEFAULT];
        snapshot.componentControls.push({ ...snapshot.componentControls[2], value: 'extra' });
        snapshot.focusableTotal += 1;
      });
    },
  },
  {
    id: 'stepper-trigger-counted-twice',
    klass: 'ownership',
    description: 'the same trigger is recorded twice while the focusable total stays three',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DEFAULT];
        snapshot.componentControls.push({ ...snapshot.componentControls[2] });
        if (snapshot.focusableTotal !== 3) fail('the total changed');
      });
    },
  },
  {
    id: 'stepper-consumer-button-counted-as-the-components',
    klass: 'ownership',
    description: "the consumer's Continue button is recorded as a fourth component trigger",
    expect: { dimensions: ['ownership.controls'], caseIds: [BESIDE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[BESIDE];
        snapshot.componentControls.push({
          ...snapshot.componentControls[0],
          path: 'button',
          value: null,
          current: null,
          currentClass: false,
          name: 'Continue',
        });
        snapshot.consumerControlCount = 0;
        if (snapshot.focusableTotal !== 4) fail('the total changed');
      });
    },
  },
  {
    id: 'stepper-disabled-trigger-excluded-from-ownership',
    klass: 'ownership',
    description: "the disabled trigger is left out of the component's controls and counted as the consumer's",
    expect: { dimensions: ['ownership.controls'], caseIds: [DISABLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[DISABLED];
        const disabled = snapshot.componentControls.findIndex((control) => control.disabled);
        if (disabled === -1) fail('no disabled trigger recorded');
        snapshot.componentControls.splice(disabled, 1);
        snapshot.consumerControlCount += 1;
        if (snapshot.focusableTotal !== 3) fail('the total changed');
      });
    },
  },
  {
    id: 'stepper-every-trigger-becomes-an-anchor',
    klass: 'ownership',
    description: 'the right count with the wrong identity: three anchors',
    expect: { dimensions: ['ownership.controls'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const control of capture.interactions[DEFAULT].componentControls) control.tag = 'a';
      });
    },
  },

  // ------------------------------------------------------- state, split
  //
  // Section 42: each half of the state stale on its own.
  snapshotMutation({
    id: 'stepper-classes-stale-after-click',
    description: 'A: aria-current moved, the item classes did not',
    caseId: CLICK_FORWARD,
    field: 'itemStates',
    from: ['complete', 'current', 'upcoming'],
    to: ['current', 'upcoming', 'upcoming'],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-aria-current-stale-after-click',
    description: 'B: the classes moved, aria-current did not',
    caseId: CLICK_FORWARD,
    field: 'currentValue',
    from: 'profile',
    to: 'account',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-factor-stale-after-click',
    description: 'C: classes and aria-current moved, the progress factor did not',
    caseId: CLICK_FORWARD,
    field: 'progressFactor',
    from: '0.5',
    to: '0',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-trigger-modifier-stale-after-click',
    description: "the trigger's own current modifier stayed on the first trigger",
    caseId: CLICK_FORWARD,
    field: 'currentClassValue',
    from: 'profile',
    to: 'account',
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-item-recreated',
    description: 'an item was re-created rather than updated: four items recorded',
    caseId: CLICK_FORWARD,
    field: 'itemCount',
    from: 3,
    to: 4,
    dimensions: ['interaction.state'],
  }),

  // --------------------------------------------------------------- events
  snapshotMutation({
    id: 'stepper-event-carries-the-index',
    description: 'D: the state is right and the change notification carries the index instead of the value',
    caseId: CLICK_FORWARD,
    field: 'events',
    from: [{ value: 'profile' }],
    to: [{ value: '1' }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'stepper-events-reversed',
    description: 'two changes notified in the wrong order',
    caseId: CLICK_THEN_ARROW,
    field: 'events',
    from: [{ value: 'profile' }, { value: 'confirm' }],
    to: [{ value: 'confirm' }, { value: 'profile' }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'stepper-current-reclick-emits',
    description: 'a click on the current step notifies a change',
    caseId: CLICK_CURRENT,
    field: 'events',
    from: [],
    to: [{ value: 'account' }],
    dimensions: ['interaction.events'],
  }),
  snapshotMutation({
    id: 'stepper-event-doubled',
    description: 'one click notifies twice',
    caseId: CLICK_FORWARD,
    field: 'events',
    from: [{ value: 'profile' }],
    to: [{ value: 'profile' }, { value: 'profile' }],
    dimensions: ['interaction.events'],
  }),

  // -------------------------------------------------------------- keyboard
  snapshotMutation({
    id: 'stepper-arrow-not-prevented-in-snapshot',
    description: 'the arrow moved the step and the keydown was left unprevented',
    caseId: ARROW_RIGHT,
    field: 'keydownPrevented',
    from: [true],
    to: [false],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-wrong-axis-prevented-in-snapshot',
    description: 'the wrong-axis key was prevented although nothing moved',
    caseId: WRONG_AXIS,
    field: 'keydownPrevented',
    from: [false],
    to: [true],
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-enter-without-native-click',
    description: 'Enter moved the step with no native click counted: a handled key, not native activation',
    caseId: ENTER,
    field: 'activations',
    from: 1,
    to: 0,
    dimensions: ['interaction.state'],
  }),
  snapshotMutation({
    id: 'stepper-focus-not-moved-in-snapshot',
    description: 'the arrow moved the step and focus stayed on the origin',
    caseId: ARROW_RIGHT,
    field: 'focusValue',
    from: 'profile',
    to: 'account',
    dimensions: ['interaction.focus'],
  }),

  // ------------------------------------------------------- live DOM records
  {
    id: 'stepper-live-dom-aria-current-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record keeps aria-current on the first trigger',
    expect: { dimensions: ['dom.aria', 'interaction.convergence'], caseIds: [CLICK_FORWARD] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK_FORWARD];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [first, second] = findAll(dom, isTrigger);
        if (second.attributes['aria-current'] !== 'step') fail('second trigger is not current');
        delete second.attributes['aria-current'];
        first.attributes['aria-current'] = 'step';
      });
    },
  },
  {
    id: 'stepper-live-dom-classes-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record keeps the initial item classes',
    expect: { dimensions: ['dom.canonicalClasses', 'interaction.convergence'], caseIds: [CLICK_FORWARD] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK_FORWARD];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [first, second] = findAll(dom, isItem);
        first.classes = ['vf-stepper__item', 'vf-stepper__item--current'];
        second.classes = ['vf-stepper__item', 'vf-stepper__item--upcoming'];
      });
    },
  },
  {
    id: 'stepper-live-dom-factor-stale',
    klass: 'live dom',
    description: 'the post-interaction DOM record keeps the initial progress factor',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.convergence'], caseIds: [CLICK_FORWARD] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK_FORWARD];
        if (!dom) fail('no post-interaction DOM; the live stage did not run');
        const [nav] = findAll(dom, (node) => node.tag === 'nav');
        if (!nav.attributes.style.includes('0.5')) fail('factor is not 0.5');
        nav.attributes.style = nav.attributes.style.replace('0.5', '0');
      });
    },
  },
  {
    id: 'stepper-post-dom-copied-from-initial',
    klass: 'live dom',
    description:
      'W: the post-interaction DOM record is a copy of the initial extraction, so the gesture measured nothing',
    expect: { dimensions: ['interaction.convergence'], caseIds: [CLICK_FORWARD] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        if (!capture.interactionDom?.[CLICK_FORWARD]) fail('no post-interaction DOM');
        capture.interactionDom[CLICK_FORWARD] = structuredClone(capture.extracted[CLICK_FORWARD].dom);
      });
    },
  },

  // ---------------------------------------------------- initial style / aria
  {
    id: 'stepper-factor-with-fourteen-digits',
    klass: 'style',
    description: "section 8: the Razor page writes PHP's fourteen-digit 0.33333333333333; the pixels are identical",
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: [FOUR] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const [nav] = findAll(capture.extracted[FOUR].dom, (node) => node.tag === 'nav');
        if (!nav.attributes.style.includes('0.3333333333333333')) fail('factor is not 1/3');
        nav.attributes.style = nav.attributes.style.replace('0.3333333333333333', '0.33333333333333');
      });
    },
  },
  {
    id: 'stepper-aria-current-missing-initially',
    klass: 'aria',
    description: 'section 13: the current trigger has no aria-current in the initial DOM record',
    expect: { dimensions: ['dom.aria'], caseIds: [PROFILE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const current = findAll(capture.extracted[PROFILE].dom, isTrigger).find(
          (node) => node.attributes['aria-current'] === 'step',
        );
        if (!current) fail('no current trigger');
        delete current.attributes['aria-current'];
      });
    },
  },
];

// ------------------------------------------------------------ browser mutations

export const stepperBrowserMutations = [
  // --------------------------------------------------------- A. ownership
  {
    id: 'browser-stepper-trigger-becomes-a-consumer-button',
    target: 'razor',
    caseIds: [BESIDE],
    description:
      'the real second trigger loses its identity and stands as an unclassed button; the focusable total is unchanged',
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [BESIDE] },
    beforeExtract: mutateElements(
      [BESIDE],
      nth(2),
      `
      const total = root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length;
      element.classList.remove('vf-stepper__trigger');
      if (root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length !== total) throw new Error('MUTATION_NOT_APPLIED: total moved');
      evidence.push({ caseId, focusableTotal: total });
    `,
    ),
  },
  {
    id: 'browser-stepper-trigger-becomes-a-div',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real second native button is replaced by a div with role=button and tabindex=0',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      nth(2),
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
    id: 'browser-stepper-extra-trigger',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the real stepper grows a fourth trigger inside the third item',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: mutateElements(
      [DEFAULT],
      nth(3),
      `
      const clone = element.cloneNode(true);
      clone.setAttribute('data-vf-stepper-value', 'extra');
      element.after(clone);
    `,
    ),
  },
  {
    id: 'browser-stepper-consumer-button-wears-the-trigger-class',
    target: 'razor',
    caseIds: [BESIDE],
    description: "the consumer's Continue button is given the trigger class, so it counts as the component's",
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [BESIDE] },
    beforeExtract: mutateElements(
      [BESIDE],
      ':scope > button:not(.vf-stepper__trigger)',
      `element.classList.add('vf-stepper__trigger');`,
    ),
  },
  {
    id: 'browser-stepper-disabled-trigger-declassed',
    target: 'razor',
    caseIds: [DISABLED],
    description: "the real disabled trigger loses its identity: still in the DOM, no longer the component's",
    expect: { dimensions: ['ownership.controls', 'dom.canonicalClasses'], caseIds: [DISABLED] },
    beforeExtract: mutateElements(
      [DISABLED],
      `${TRIGGER}[disabled]`,
      `element.classList.remove('vf-stepper__trigger');`,
    ),
  },

  // ------------------------------------------------- B. initial ARIA / style
  {
    id: 'browser-stepper-aria-current-missing',
    target: 'razor',
    caseIds: [PROFILE],
    description: 'the real current trigger loses aria-current while every class and the factor stay',
    expect: { dimensions: ['dom.aria'], caseIds: [PROFILE] },
    beforeExtract: mutateElements([PROFILE], `${TRIGGER}[aria-current]`, `element.removeAttribute('aria-current');`),
  },
  {
    id: 'browser-stepper-aria-current-false-everywhere',
    target: 'razor',
    caseIds: [PROFILE],
    description: 'every non-current trigger announces aria-current="false"',
    expect: { dimensions: ['dom.aria'], caseIds: [PROFILE] },
    beforeExtract: mutateElements(
      [PROFILE],
      `${TRIGGER}:not([aria-current])`,
      `element.setAttribute('aria-current', 'false');`,
    ),
  },
  {
    id: 'browser-stepper-factor-with-fourteen-digits',
    target: 'razor',
    caseIds: [FOUR],
    description: "section 8 on the real page: the root writes PHP's 0.33333333333333; no pixel moves",
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: [FOUR] },
    beforeExtract: mutateElements(
      [FOUR],
      '.vf-stepper',
      `
      if (element.style.getPropertyValue('--vf-stepper-progress-factor') !== '0.3333333333333333') throw new Error('MUTATION_NOT_APPLIED: factor');
      element.style.setProperty('--vf-stepper-progress-factor', '0.33333333333333');
    `,
    ),
  },

  // --------------------------------------------------- C. live state / ARIA
  //
  // Sections 40 and 42: the real controller runs, then one half of what it
  // did is undone between the gesture and the measurement.
  {
    id: 'browser-stepper-aria-current-stale-after-click',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'E: the click moved the classes and the factor, and aria-current is put back on the first trigger',
    expect: { dimensions: ['interaction.state', 'dom.aria', 'interaction.convergence'], caseIds: [CLICK_FORWARD] },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper__list',
      `
      const [first, second] = element.querySelectorAll('.vf-stepper__trigger');
      if (second.getAttribute('aria-current') !== 'step') throw new Error('MUTATION_NOT_APPLIED: not moved');
      second.removeAttribute('aria-current');
      first.setAttribute('aria-current', 'step');
    `,
    ),
  },
  {
    id: 'browser-stepper-classes-stale-after-click',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description:
      'F: the click moved aria-current, the trigger modifier and the factor, and the item classes are put back',
    expect: {
      dimensions: ['interaction.state', 'dom.canonicalClasses', 'interaction.convergence'],
      caseIds: [CLICK_FORWARD],
    },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper__list',
      `
      const [first, second] = element.querySelectorAll('.vf-stepper__item');
      if (!second.classList.contains('vf-stepper__item--current')) throw new Error('MUTATION_NOT_APPLIED: not moved');
      first.className = 'vf-stepper__item vf-stepper__item--current';
      second.className = 'vf-stepper__item vf-stepper__item--upcoming';
    `,
    ),
  },
  {
    id: 'browser-stepper-factor-stale-after-click',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'G: the click moved every class and aria-current, and the progress factor is put back to 0',
    expect: {
      dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'],
      caseIds: [CLICK_FORWARD],
    },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper',
      `
      if (element.style.getPropertyValue('--vf-stepper-progress-factor') !== '0.5') throw new Error('MUTATION_NOT_APPLIED: factor');
      element.style.setProperty('--vf-stepper-progress-factor', '0');
    `,
    ),
  },
  {
    id: 'browser-stepper-trigger-modifier-stale-after-click',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: "the click moved everything but the trigger's own current modifier",
    expect: {
      dimensions: ['interaction.state', 'dom.canonicalClasses', 'interaction.convergence'],
      caseIds: [CLICK_FORWARD],
    },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper__list',
      `
      const [first, second] = element.querySelectorAll('.vf-stepper__trigger');
      if (!second.classList.contains('vf-stepper__trigger--current')) throw new Error('MUTATION_NOT_APPLIED: not moved');
      second.classList.remove('vf-stepper__trigger--current');
      first.classList.add('vf-stepper__trigger--current');
    `,
    ),
  },
  {
    id: 'browser-stepper-item-recreated',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'the selected trigger is re-created inside a wrapper span after the click: the structure moved',
    expect: { dimensions: ['ownership.controls', 'dom.structure', 'interaction.convergence'], caseIds: [CLICK_FORWARD] },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      nth(2),
      `
      const wrapper = document.createElement('span');
      element.replaceWith(wrapper);
      wrapper.append(element);
    `,
    ),
  },

  // --------------------------------------------------------------- D. events
  {
    id: 'browser-stepper-event-payload-index',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'H: the real controller selects correctly and its event carries the index instead of the value',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_FORWARD] },
    beforeInteraction: mutateElements(
      [CLICK_FORWARD],
      '[data-vf-razor="stepper"]',
      `
      element.addEventListener('vf-stepper:change', (event) => {
        if (event.detail.value === '1') return;
        event.stopImmediatePropagation();
        const triggers = [...element.querySelectorAll('.vf-stepper__trigger')].map((t) => t.getAttribute('data-vf-stepper-value'));
        element.dispatchEvent(new CustomEvent('vf-stepper:change', { bubbles: true, detail: { value: String(triggers.indexOf(event.detail.value)) } }));
      });
    `,
    ),
  },
  {
    id: 'browser-stepper-current-reclick-emits',
    target: 'razor',
    caseIds: [CLICK_CURRENT],
    description: 'J: a click on the current step dispatches a change',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_CURRENT] },
    beforeInteraction: mutateElements(
      [CLICK_CURRENT],
      nth(1),
      `
      element.addEventListener('click', () => {
        element.closest('.vf-stepper').dispatchEvent(new CustomEvent('vf-stepper:change', { bubbles: true, detail: { value: 'account' } }));
      });
    `,
    ),
  },
  {
    id: 'browser-stepper-event-swallowed',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'the real controller selects and its event never reaches the host',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_FORWARD] },
    beforeInteraction: mutateElements(
      [CLICK_FORWARD],
      '[data-vf-razor="stepper"]',
      `element.addEventListener('vf-stepper:change', (event) => event.stopPropagation());`,
    ),
  },
  {
    id: 'browser-stepper-disabled-trigger-activates',
    target: 'razor',
    caseIds: [DISABLED_KEYBOARD],
    description:
      'K: the disabled attribute is dropped from the real middle trigger, so it takes focus and ArrowRight moves',
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
    beforeInteraction: mutateElements([DISABLED_KEYBOARD], `${TRIGGER}[disabled]`, `element.disabled = false;`),
  },

  // ------------------------------------------------------------ E. keyboard
  //
  // Section 43, each on the real Razor page.
  {
    id: 'browser-stepper-arrow-wrong-target',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'ArrowRight lands on the last step instead of the next',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [ARROW_RIGHT],
    },
    beforeInteraction: interceptKey(
      ARROW_RIGHT,
      'ArrowRight',
      `event.preventDefault(); triggers[2].click(); triggers[2].focus();`,
    ),
  },
  {
    id: 'browser-stepper-wrong-axis-handled',
    target: 'razor',
    caseIds: [WRONG_AXIS],
    description: 'L: ArrowDown on a horizontal stepper is handled as the next key',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [WRONG_AXIS],
    },
    beforeInteraction: interceptKey(
      WRONG_AXIS,
      'ArrowDown',
      `event.preventDefault(); triggers[1].click(); triggers[1].focus();`,
    ),
  },
  {
    id: 'browser-stepper-vertical-wrong-axis-handled',
    target: 'razor',
    caseIds: [VERTICAL_WRONG_AXIS],
    description: 'M: ArrowRight on a vertical stepper is handled as the next key',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [VERTICAL_WRONG_AXIS],
    },
    beforeInteraction: interceptKey(
      VERTICAL_WRONG_AXIS,
      'ArrowRight',
      `event.preventDefault(); triggers[1].click(); triggers[1].focus();`,
    ),
  },
  {
    id: 'browser-stepper-arrow-without-prevent-default',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'ArrowRight moves the step and focus and leaves the default unprevented',
    expect: { dimensions: ['interaction.state'], caseIds: [ARROW_RIGHT] },
    beforeInteraction: interceptKey(ARROW_RIGHT, 'ArrowRight', `triggers[1].click(); triggers[1].focus();`),
  },
  {
    id: 'browser-stepper-disabled-not-skipped',
    target: 'razor',
    caseIds: [SKIP],
    description: 'O: ArrowRight lands on the disabled middle step instead of skipping it',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [SKIP],
    },
    beforeInteraction: interceptKey(
      SKIP,
      'ArrowRight',
      `event.preventDefault(); triggers[1].disabled = false; triggers[1].click(); triggers[1].focus(); triggers[1].disabled = true;`,
    ),
  },
  {
    id: 'browser-stepper-wrap-removed',
    target: 'razor',
    caseIds: [WRAP],
    description: 'N: ArrowRight on the last step stays on it instead of wrapping',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.focus', 'interaction.convergence'],
      caseIds: [WRAP],
    },
    beforeInteraction: interceptKey(WRAP, 'ArrowRight', `event.preventDefault();`),
  },
  {
    id: 'browser-stepper-home-wrong',
    target: 'razor',
    caseIds: [HOME],
    description: 'P: Home lands on the second step',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [HOME],
    },
    beforeInteraction: interceptKey(HOME, 'Home', `event.preventDefault(); triggers[1].click(); triggers[1].focus();`),
  },
  {
    id: 'browser-stepper-end-wrong',
    target: 'razor',
    caseIds: [END],
    description: 'Q: End lands on the second step',
    expect: {
      dimensions: ['interaction.state', 'interaction.focus', 'interaction.events', 'interaction.convergence'],
      caseIds: [END],
    },
    beforeInteraction: interceptKey(END, 'End', `event.preventDefault(); triggers[1].click(); triggers[1].focus();`),
  },
  {
    id: 'browser-stepper-focus-not-moved',
    target: 'razor',
    caseIds: [ARROW_RIGHT],
    description: 'R: ArrowRight selects the next step and leaves focus where it was',
    expect: { dimensions: ['interaction.focus'], caseIds: [ARROW_RIGHT] },
    beforeInteraction: interceptKey(
      ARROW_RIGHT,
      'ArrowRight',
      `event.preventDefault(); triggers[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));`,
    ),
  },
  {
    id: 'browser-stepper-enter-handled-manually',
    target: 'razor',
    caseIds: [ENTER],
    description:
      'S: Enter is handled on keydown with preventDefault and a programmatic click, instead of native activation',
    expect: { dimensions: ['interaction.state'], caseIds: [ENTER] },
    beforeInteraction: interceptKey(ENTER, 'Enter', `event.preventDefault(); from.click();`),
  },
  {
    id: 'browser-stepper-space-handled-manually',
    target: 'razor',
    caseIds: [SPACE],
    description:
      'T: Space is handled on keydown with preventDefault and a programmatic click, instead of native activation',
    expect: { dimensions: ['interaction.state'], caseIds: [SPACE] },
    beforeInteraction: interceptKey(SPACE, ' ', `event.preventDefault(); from.click();`),
  },
  {
    id: 'browser-stepper-enter-painted-by-hand',
    target: 'razor',
    caseIds: [ENTER],
    description: 'Enter is handled on keydown and the state is painted by hand, with no click at all',
    expect: { dimensions: ['interaction.state'], caseIds: [ENTER] },
    beforeInteraction: interceptKey(
      ENTER,
      'Enter',
      `
      event.preventDefault();
      const items = [...element.querySelectorAll('.vf-stepper__item')];
      items[0].className = 'vf-stepper__item vf-stepper__item--complete';
      items[1].className = 'vf-stepper__item vf-stepper__item--current';
      triggers[0].removeAttribute('aria-current'); triggers[0].classList.remove('vf-stepper__trigger--current');
      triggers[1].setAttribute('aria-current', 'step'); triggers[1].classList.add('vf-stepper__trigger--current');
      element.closest('.vf-stepper').style.setProperty('--vf-stepper-progress-factor', '0.5');
      element.closest('.vf-stepper').dispatchEvent(new CustomEvent('vf-stepper:change', { bubbles: true, detail: { value: 'profile' } }));
      `,
    ),
  },
  {
    id: 'browser-stepper-focus-moved-to-nav',
    target: 'razor',
    caseIds: [CLICK_FORWARD],
    description: 'the nav takes focus after the click',
    expect: { dimensions: ['interaction.focus'], caseIds: [CLICK_FORWARD] },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper',
      `element.setAttribute('tabindex', '-1'); element.focus();`,
    ),
  },

  // -------------------------------------------------------- F. instances
  {
    id: 'browser-stepper-sibling-cross-select',
    target: 'razor',
    caseIds: [SIBLING_CLICK],
    description: 'clicking a trigger in the second real sibling also selects a step in the first',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [SIBLING_CLICK] },
    beforeInteraction: mutateElements(
      [SIBLING_CLICK],
      '.vf-stepper:last-of-type .vf-stepper__item:nth-child(1) > .vf-stepper__trigger',
      `
      const other = root.querySelector('.vf-stepper:first-of-type .vf-stepper__item:nth-child(3) > .vf-stepper__trigger');
      element.addEventListener('click', () => other.click());
    `,
    ),
  },

  // ------------------------------------------------------- G. current-only
  //
  // Section 39 on the real current target, with the reference and Razor
  // pages re-captured fresh to prove they were not touched.
  {
    id: 'browser-stepper-current-only-live-defect',
    target: 'current',
    caseIds: [CLICK_FORWARD],
    verifyIsolation: true,
    description:
      'U: current Vue moves aria-current and the classes, and the progress factor is put back to 0; reference and Razor stay independent',
    expect: {
      dimensions: ['interaction.state', 'dom.nativeAttributes', 'interaction.convergence'],
      caseIds: [CLICK_FORWARD],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    afterInteraction: mutateElements(
      [CLICK_FORWARD],
      '.vf-stepper',
      `
      if (element.style.getPropertyValue('--vf-stepper-progress-factor') !== '0.5') throw new Error('MUTATION_NOT_APPLIED: factor');
      element.style.setProperty('--vf-stepper-progress-factor', '0');
    `,
    ),
  },

  // ---------------------------------------------------------- H. visual
  {
    id: 'browser-stepper-marker-invisible',
    target: 'razor',
    caseIds: [PROFILE],
    description: 'the real current marker is painted nowhere while staying in the DOM',
    expect: { dimensions: ['visual', 'dom.nativeAttributes'], caseIds: [PROFILE] },
    beforeExtract: mutateElements(
      [PROFILE],
      '.vf-stepper__item--current .vf-stepper__marker',
      `element.style.visibility = 'hidden';`,
    ),
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
        left: 'step',
        right: 'absent',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  };
}

export const stepperPolicyMutations = [
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
    [CLICK_FORWARD],
    'an approval for post-interaction pixels',
  ),
  smuggled('smuggled-wildcard-case', 'dom.aria', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [BESIDE],
    'an approval for ownership.controls - the stepper would be able to waive the evidence that its triggers are its own',
  ),
  smuggled(
    'smuggled-interaction-state-approval',
    'interaction.state',
    [CLICK_FORWARD],
    'an approval for interaction.state - "Razor is different because JS", which the enhancement exists to make unnecessary',
  ),
  smuggled(
    'smuggled-events-approval',
    'interaction.events',
    [CLICK_FORWARD],
    'an approval for interaction.events - a host never told would be excused',
  ),
  smuggled(
    'smuggled-convergence-approval',
    'interaction.convergence',
    [CLICK_FORWARD],
    'an approval for interaction.convergence - a gesture landing on a hybrid would be excused',
  ),
  idle(
    'idle-aria-current-approval',
    'dom.aria',
    [CLICK_FORWARD, ARROW_RIGHT, ENTER, SPACE, HOME, END],
    'aria-current',
    'button.vf-stepper__trigger',
    'a broad aria-current approval across every keyboard and pointer scenario, matching nothing on a clean run',
  ),
  idle(
    'idle-factor-approval',
    'dom.nativeAttributes',
    [FOUR, PROFILE, CLICK_FORWARD],
    'style',
    'nav.vf-stepper',
    'a root style approval that would excuse a fourteen-digit factor, matching nothing on a clean run',
  ),
  idle(
    'idle-disabled-approval',
    'dom.nativeAttributes',
    [DISABLED, DISABLED_KEYBOARD],
    'disabled',
    'button.vf-stepper__trigger',
    'a disabled-attribute approval that tolerates no real difference',
  ),
  {
    id: 'idle-focus-approval',
    klass: 'policy',
    description: 'a focus approval across the navigation scenarios, matching nothing on a clean run',
    rejectedBy: 'occurrences',
    apply(policy) {
      push(policy, {
        id: 'idle-focus-approval',
        dimension: 'interaction.focus',
        target: 'razor',
        caseIds: [ARROW_RIGHT, HOME, END],
        detail: 'focusValue',
        path: 'focusValue',
        left: 'profile',
        right: 'account',
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'A deliberately idle entry used by the parity mutation harness.',
      });
    },
  },
];
