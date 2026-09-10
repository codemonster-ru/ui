// The negative fixture for the VfSkeletonGate parity gate.
//
// The first mutation set for a component that renders another, so it has to
// prove two things at once that no earlier set had to separate:
//
//   - a defect in what the gate composes fails the gate's evidence;
//   - a defect in the *child* fails the gate's evidence too, and does so
//     visibly as a child defect rather than as a mysterious gate defect.
//
// The mutations that matter most here are the ones that leave plausible markup
// behind. The component's name invites a `v-if`, and a gate rewritten that way
// renders correct markup in both states - so the mutations below aim at what
// survives such a rewrite: the overlay still being in the document when the
// gate is ready, the content element still being the same node afterwards, and
// the skeleton in the overlay still being the canonical one.
//
// A note on where each attack lives. Source-level mutations (invert the
// predicate, drop a forwarded prop, hardcode the child's default) belong to the
// characterization gate, which rebuilds the component; the harness here mutates
// captures and live pages, which is what proves the *comparison* would report
// them. Both halves are needed: a source mutation with no comparison behind it
// says the unit tests noticed, not that parity would have.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const gateRoot = (node) => node.classes.includes('vf-skeleton-gate');
const contentWrapper = (node) => node.classes.includes('vf-skeleton-gate__content');
const overlay = (node) => node.classes.includes('vf-skeleton-gate__overlay');
const childSkeleton = (node) => node.classes.includes('vf-skeleton');

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
        if (snapshot === undefined) fail(`${caseId} has no static snapshot; the stage did not run at all`);
        if (snapshot[field] !== from) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(snapshot[field])}, not ${JSON.stringify(from)}`);
        }
        snapshot[field] = to;
      });
    },
  };
}

/**
 * A capture mutation that flips one field of a case's post-transition snapshot.
 *
 * Applied to the *current* target rather than to Razor, because Razor does not
 * transition at all: a transition defect can only exist on a target that
 * transitions, and aiming this at Razor would produce a mutation that could
 * never be applied.
 */
function transitionSnapshotMutation({ id, description, caseId, field, from, to, dimensions }) {
  return {
    id,
    klass: 'transition',
    description,
    expect: {
      dimensions,
      caseIds: [caseId],
      directions: ['reference-vs-current'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        const transition = capture.transitions?.[caseId];
        if (transition === undefined) fail(`${caseId} has no transition evidence; the stage did not run at all`);
        if (transition.supported !== true) fail(`${caseId} reports no transition support on current`);
        if (transition.state[field] !== from) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(transition.state[field])}, not ${JSON.stringify(from)}`);
        }
        transition.state[field] = to;
      });
    },
  };
}

export const skeletonGateParityMutations = [
  // ------------------------------------------------------------ composition
  {
    id: 'gate-overlay-holds-something-that-is-not-the-canonical-skeleton',
    klass: 'structure',
    description: 'the child in the overlay stops carrying vf-skeleton, so the gate draws its own placeholder',
    expect: {
      dimensions: ['dom.canonicalClasses'],
      caseIds: ['skeleton-gate/default'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/default', childSkeleton, 'the child skeleton');
        node.classes = node.classes.filter((name) => !name.startsWith('vf-skeleton'));
        node.consumerClasses = [...node.consumerClasses, 'gate-placeholder'];
      });
    },
  },
  {
    id: 'gate-child-loses-a-forwarded-prop',
    klass: 'native attributes',
    description: 'the radius stops reaching the child, so a rounded gate holds a square skeleton',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['skeleton-gate/radius'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/radius', childSkeleton, 'the child skeleton');
        // The extractor parses the style attribute with the browser's own CSS
        // parser, and the browser expands `border-radius` into its four corner
        // longhands. So the rounding is dropped by removing those rather than
        // by removing a declaration named border-radius, which does not exist
        // in the capture at all. Worth stating: it is the reason a mutation
        // written against the *source* spelling silently fails to apply.
        const declarations = (node.attributes.style ?? '').split(';');
        const remaining = declarations.filter((declaration) => !declaration.includes('radius'));
        if (remaining.length === declarations.length) fail('the child carried no rounding to drop');
        node.attributes = { ...node.attributes, style: remaining.join(';') };
      });
    },
  },
  {
    id: 'gate-forwards-the-reserved-height-to-the-child',
    klass: 'native attributes',
    description: 'the child is asked for the reserved height rather than the min-height, so the two stop disagreeing',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['skeleton-gate/reserve-height'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/reserve-height', childSkeleton, 'the child skeleton');
        if (!node.attributes.style?.includes('min-height:40px')) {
          fail(`the child carried ${JSON.stringify(node.attributes.style)}, not the forwarded 40px`);
        }
        node.attributes = {
          ...node.attributes,
          style: node.attributes.style.replace('min-height:40px', 'min-height:140px'),
        };
      });
    },
  },
  // --------------------------------------------------------------- the state
  {
    id: 'gate-content-loses-the-ready-modifier',
    klass: 'canonical classes',
    description: 'a settled gate never fades its content in, so the consumer content stays invisible',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton-gate/ready-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/ready-content', contentWrapper, 'the content wrapper');
        if (!node.classes.includes('vf-skeleton-gate__content--ready')) fail('the wrapper was not ready');
        node.classes = node.classes.filter((name) => name !== 'vf-skeleton-gate__content--ready');
      });
    },
  },
  {
    id: 'gate-announces-busy-when-settled',
    klass: 'aria',
    description: 'a settled gate writes aria-busy="false" instead of dropping the attribute',
    expect: { dimensions: ['dom.aria'], caseIds: ['skeleton-gate/ready-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/ready-content', gateRoot, 'the gate root');
        if (node.attributes['aria-busy'] !== undefined) fail('the settled gate already carried aria-busy');
        node.attributes = { ...node.attributes, 'aria-busy': 'false' };
      });
    },
  },
  {
    id: 'gate-stops-hiding-its-faded-content',
    klass: 'aria',
    description: 'the faded content stays in the accessibility tree behind the skeleton',
    expect: { dimensions: ['dom.aria'], caseIds: ['skeleton-gate/loading-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/loading-content', contentWrapper, 'the content wrapper');
        if (node.attributes['aria-hidden'] !== 'true') fail('the loading content was not aria-hidden');
        const { 'aria-hidden': removed, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'gate-stops-marking-its-faded-content-inert',
    klass: 'native attributes',
    description: "the consumer's controls stay clickable underneath the skeleton",
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['skeleton-gate/interactive-content-loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(
          capture,
          'skeleton-gate/interactive-content-loading',
          contentWrapper,
          'the content wrapper',
        );
        if (node.attributes.inert === undefined) fail('the loading content was not inert');
        const { inert: removed, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'gate-overlay-stops-hiding-itself-from-assistive-technology',
    klass: 'aria',
    description: 'the skeleton enters the accessibility tree and announces itself',
    expect: { dimensions: ['dom.aria'], caseIds: ['skeleton-gate/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton-gate/default', overlay, 'the overlay');
        if (node.attributes['aria-hidden'] !== 'true') fail('the overlay was not aria-hidden');
        node.attributes = { ...node.attributes, 'aria-hidden': 'false', role: 'status' };
      });
    },
  },
  // ------------------------------------------------------------- the shape
  {
    id: 'gate-removes-the-overlay-when-ready',
    klass: 'structure',
    description: 'the overlay is unmounted rather than hidden, which is what a v-if rewrite does',
    expect: { dimensions: ['dom.structure'], caseIds: ['skeleton-gate/ready-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const root = findNode(capture, 'skeleton-gate/ready-content', gateRoot, 'the gate root');
        const before = root.children.length;
        root.children = root.children.filter((child) => !child.classes.includes('vf-skeleton-gate__overlay'));
        if (root.children.length === before) fail('the ready gate rendered no overlay to remove');
      });
    },
  },
  {
    id: 'gate-removes-the-content-wrapper-when-loading',
    klass: 'structure',
    description: 'the consumer content is unmounted while the skeleton shows, destroying whatever state it held',
    expect: { dimensions: ['dom.structure'], caseIds: ['skeleton-gate/loading-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const root = findNode(capture, 'skeleton-gate/loading-content', gateRoot, 'the gate root');
        const before = root.children.length;
        root.children = root.children.filter((child) => !child.classes.includes('vf-skeleton-gate__content'));
        if (root.children.length === before) fail('the loading gate rendered no content wrapper to remove');
      });
    },
  },
  {
    id: 'gate-renders-the-skeleton-in-both-halves',
    klass: 'structure',
    description: 'a second skeleton appears inside the content wrapper',
    expect: { dimensions: ['dom.structure'], caseIds: ['skeleton-gate/loading-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'skeleton-gate/loading-content', contentWrapper, 'the content wrapper');
        const child = findNode(capture, 'skeleton-gate/loading-content', childSkeleton, 'the child skeleton');
        content.children = [...content.children, structuredClone(child)];
      });
    },
  },
  {
    id: 'gate-adds-a-wrapper-around-the-consumer-content',
    klass: 'structure',
    description: 'an extra element appears between the content wrapper and the consumer content',
    expect: { dimensions: ['dom.structure'], caseIds: ['skeleton-gate/rich-content-ready'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'skeleton-gate/rich-content-ready', contentWrapper, 'the content wrapper');
        if (content.children.length === 0) fail('the case rendered no consumer content to wrap');
        content.children = [
          {
            tag: 'div',
            classes: ['vf-skeleton-gate__inner'],
            consumerClasses: [],
            attributes: {},
            children: content.children,
          },
        ];
      });
    },
  },
  {
    id: 'gate-moves-consumer-attributes-onto-the-child',
    klass: 'native attributes',
    description: "the consumer's data attribute lands on the skeleton instead of the gate root",
    expect: { dimensions: ['dom.productData'], caseIds: ['skeleton-gate/consumer-data'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const root = findNode(capture, 'skeleton-gate/consumer-data', gateRoot, 'the gate root');
        const child = findNode(capture, 'skeleton-gate/consumer-data', childSkeleton, 'the child skeleton');
        if (root.attributes['data-testid'] === undefined) fail('the root carried no consumer data attribute');
        const { 'data-testid': moved, ...rest } = root.attributes;
        root.attributes = rest;
        child.attributes = { ...child.attributes, 'data-testid': moved };
      });
    },
  },
  {
    id: 'gate-duplicates-the-consumer-content',
    klass: 'structure',
    description: 'the default slot is rendered twice',
    expect: { dimensions: ['dom.structure'], caseIds: ['skeleton-gate/rich-content-ready'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'skeleton-gate/rich-content-ready', contentWrapper, 'the content wrapper');
        if (content.children.length === 0) fail('the case rendered no consumer content to duplicate');
        content.children = [...content.children, ...structuredClone(content.children)];
      });
    },
  },
  // ----------------------------------------------------- static ownership
  //
  // Section 15 of the M17 plan, direction B and C. A consumer's button is the
  // catalog's declaration; anything beyond it is the component's.
  staticSnapshotMutation({
    id: 'gate-static-snapshot-gains-a-control-the-consumer-did-not-provide',
    description: 'the gate reports two focusable elements where the consumer provided one',
    caseId: 'skeleton-gate/interactive-content-ready',
    field: 'focusableCount',
    from: 1,
    to: 2,
  }),
  staticSnapshotMutation({
    id: 'gate-static-snapshot-grows-a-control-in-an-empty-case',
    description: 'a gate whose consumer provided nothing reports a focusable element of its own',
    caseId: 'skeleton-gate/default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'gate-static-snapshot-exposes-an-interactive-role',
    description: 'the loading gate exposes an interactive role no case gives its slot content',
    caseId: 'skeleton-gate/default',
    field: 'interactiveRoleCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'gate-static-snapshot-stops-being-recorded',
    description: 'the gate stops claiming it owns no interaction, so the measurement means nothing',
    caseId: 'skeleton-gate/default',
    field: 'interactionPosture',
    from: 'none',
    to: 'unmeasured',
  }),
  // ----------------------------------------------------------- transitions
  //
  // Section 13. A transition that ran and did the wrong thing has to fail on
  // its own evidence, not only on the initial render.
  transitionSnapshotMutation({
    id: 'gate-transition-leaves-a-stale-skeleton-visible',
    description: 'the overlay keeps its layout box after the gate becomes ready, so the skeleton stays on screen',
    caseId: 'skeleton-gate/loading-content',
    field: 'overlayDisplay',
    from: 'none',
    to: 'block',
    dimensions: ['transition.branch'],
  }),
  transitionSnapshotMutation({
    id: 'gate-transition-leaves-the-content-inert',
    description: "the content is faded in but never made reachable, so the consumer's controls stay dead",
    caseId: 'skeleton-gate/loading-content',
    field: 'contentInert',
    from: false,
    to: true,
    dimensions: ['transition.branch'],
  }),
  transitionSnapshotMutation({
    id: 'gate-transition-never-updates-the-content-modifier',
    description: 'the gate reports ready but the content wrapper never gained the modifier the stylesheet fades on',
    caseId: 'skeleton-gate/loading-content',
    field: 'contentReady',
    from: true,
    to: false,
    dimensions: ['transition.branch'],
  }),
  transitionSnapshotMutation({
    id: 'gate-transition-keeps-announcing-busy',
    description: 'the gate settles visually and goes on telling assistive technology it is loading',
    caseId: 'skeleton-gate/loading-content',
    field: 'rootBusy',
    from: null,
    to: 'true',
    dimensions: ['transition.branch'],
  }),
  transitionSnapshotMutation({
    id: 'gate-transition-drops-the-child-on-the-way-back',
    description: 'going back to loading leaves the overlay without a skeleton in it',
    caseId: 'skeleton-gate/ready-content',
    field: 'childSkeletonPresent',
    from: true,
    to: false,
    dimensions: ['transition.branch'],
  }),
  {
    id: 'gate-transition-lands-on-a-hybrid-of-the-two-states',
    klass: 'transition',
    description: 'the transitioned gate does not equal a gate rendered in that state from the start',
    expect: {
      dimensions: ['transition.convergence'],
      caseIds: ['skeleton-gate/loading-content'],
      directions: ['reference-vs-current'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        const transition = capture.transitions?.['skeleton-gate/loading-content'];
        if (transition?.supported !== true) fail('the case produced no transition to diverge');
        const node = transition.dom[0];
        if (!node?.classes.includes('vf-skeleton-gate')) fail('the transition captured no gate root');
        // The state is right and the markup is not: exactly the hybrid a
        // half-applied update leaves behind.
        node.consumerClasses = [...node.consumerClasses, 'stale'];
      });
    },
  },
  {
    id: 'gate-transition-recreates-the-consumer-content',
    klass: 'transition',
    description: 'the content element is destroyed and rebuilt, discarding whatever DOM state it held',
    expect: {
      dimensions: ['transition.identity'],
      caseIds: ['skeleton-gate/loading-content'],
      directions: ['reference-vs-current'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        const transition = capture.transitions?.['skeleton-gate/loading-content'];
        if (transition?.supported !== true) fail('the case produced no transition');
        if (transition.identity?.contentChild !== 'same-node') {
          fail(`the content child reported ${JSON.stringify(transition.identity?.contentChild)}`);
        }
        transition.identity.contentChild = 'recreated';
      });
    },
  },
  {
    id: 'gate-transition-recreates-the-child-skeleton',
    klass: 'transition',
    description: 'the skeleton is unmounted and remounted, which is what a v-if rewrite of the overlay does',
    expect: {
      dimensions: ['transition.identity'],
      caseIds: ['skeleton-gate/loading-content'],
      directions: ['reference-vs-current'],
    },
    apply(captures) {
      eachTheme(captures, 'current', (capture) => {
        const transition = capture.transitions?.['skeleton-gate/loading-content'];
        if (transition?.supported !== true) fail('the case produced no transition');
        if (transition.identity?.overlayChild !== 'same-node') {
          fail(`the overlay child reported ${JSON.stringify(transition.identity?.overlayChild)}`);
        }
        transition.identity.overlayChild = 'recreated';
      });
    },
  },
];

// ------------------------------------------------------------ browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const skeletonGateBrowserMutations = [
  {
    id: 'browser-gate-overlay-stays-visible-when-ready',
    target: 'razor',
    caseIds: ['skeleton-gate/ready-content'],
    description: 'the real settled gate keeps its skeleton on screen',
    expect: {
      dimensions: ['dom.nativeAttributes', 'visual'],
      caseIds: ['skeleton-gate/ready-content'],
    },
    beforeExtract: mutateElements(
      ['skeleton-gate/ready-content'],
      '.vf-skeleton-gate__overlay',
      `
      if (element.style.display !== 'none') throw new Error('MUTATION_NOT_APPLIED: display');
      element.style.display = '';
    `,
    ),
  },
  {
    id: 'browser-gate-faded-content-becomes-reachable',
    target: 'razor',
    caseIds: ['skeleton-gate/interactive-content-loading'],
    description: "inert removed from the real loading gate, so the consumer's button is clickable under the skeleton",
    expect: {
      dimensions: ['dom.nativeAttributes'],
      caseIds: ['skeleton-gate/interactive-content-loading'],
    },
    beforeExtract: mutateElements(
      ['skeleton-gate/interactive-content-loading'],
      '.vf-skeleton-gate__content',
      `
      if (!element.hasAttribute('inert')) throw new Error('MUTATION_NOT_APPLIED: inert');
      element.removeAttribute('inert');
    `,
    ),
  },
  {
    id: 'browser-gate-child-loses-its-shimmer',
    target: 'razor',
    caseIds: ['skeleton-gate/default'],
    description: 'the animation modifier removed from the real child inside the real gate',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton-gate/default'] },
    beforeExtract: mutateElements(
      ['skeleton-gate/default'],
      '.vf-skeleton-gate__overlay .vf-skeleton',
      `
      if (!element.classList.contains('vf-skeleton--animated')) throw new Error('MUTATION_NOT_APPLIED: modifier');
      element.classList.remove('vf-skeleton--animated');
    `,
    ),
  },
  {
    id: 'browser-gate-grows-a-control-of-its-own',
    target: 'razor',
    caseIds: ['skeleton-gate/default'],
    description: 'the real gate renders a button beside its slot, which the consumer never asked for',
    // Two dimensions, and the second is the point. A component-grown control is
    // a structural difference here only because Razor alone grew it; the static
    // measurement is what would still catch it if every target grew it at once.
    expect: {
      dimensions: ['dom.structure', 'static.noInteraction'],
      caseIds: ['skeleton-gate/default'],
    },
    beforeExtract: mutateElements(
      ['skeleton-gate/default'],
      '.vf-skeleton-gate__content',
      `
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Reload';
      element.append(button);
    `,
    ),
  },
  {
    id: 'browser-gate-transition-leaves-the-skeleton-behind',
    target: 'current',
    caseIds: ['skeleton-gate/loading-content'],
    description: 'the real overlay is forced back into layout after the real transition has run',
    // Applied after the transition, on a target that actually transitions. This
    // is section 13: initial-state parity alone must not be enough, and the
    // only stage that can see this is the post-transition one.
    expect: {
      dimensions: ['transition.branch'],
      caseIds: ['skeleton-gate/loading-content'],
      directions: ['reference-vs-current'],
    },
    afterTransition: mutateElements(
      ['skeleton-gate/loading-content'],
      '.vf-skeleton-gate__overlay',
      `
      if (element.style.display !== 'none') throw new Error('MUTATION_NOT_APPLIED: display');
      element.style.display = 'block';
    `,
    ),
  },
  {
    id: 'browser-gate-transition-never-releases-the-content',
    target: 'current',
    caseIds: ['skeleton-gate/loading-content'],
    description: 'the real content wrapper is made inert again after the real transition has run',
    expect: {
      dimensions: ['transition.branch'],
      caseIds: ['skeleton-gate/loading-content'],
      directions: ['reference-vs-current'],
    },
    afterTransition: mutateElements(
      ['skeleton-gate/loading-content'],
      '.vf-skeleton-gate__content',
      `
      if (element.hasAttribute('inert')) throw new Error('MUTATION_NOT_APPLIED: already inert');
      element.setAttribute('inert', '');
    `,
    ),
  },
];

// ------------------------------------------------------------ policy mutations

/**
 * Approvals the registry validator must reject.
 *
 * The last two are specific to this component. A gate parity failure can
 * originate in the child, and the tempting response is an approval that says
 * "the skeleton inside a gate may differ" - which would waive the composition
 * contract this whole milestone exists to establish. The transition approvals
 * are the same shape: waiving them would waive the evidence that the component
 * still updates after mount.
 */
function push(policy, approval) {
  policy.approvedDivergences.push(approval);
}

function smuggled(id, dimension, caseIds, reason) {
  return {
    id,
    klass: 'policy',
    description: reason,
    // Every one of these is refused by the validator before a browser is
    // launched, which is the strongest place to refuse an approval: a rule that
    // never survives validation cannot be waiting to excuse a real difference.
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

export const skeletonGatePolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    ['skeleton-gate/default'],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', ['skeleton-gate/default'], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.canonicalClasses',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-static-snapshot-approval',
    'static.noInteraction',
    ['skeleton-gate/default'],
    'an approval for static.noInteraction - the gate would be able to waive the evidence that the interaction ' +
      'stage ran at all, which is also what tells a consumer control from a component-owned one',
  ),
  smuggled(
    'smuggled-transition-branch-approval',
    'transition.branch',
    ['skeleton-gate/loading-content'],
    'an approval for transition.branch - the gate would be able to waive the evidence that it still updates ' +
      'after mount, which is the only thing the transition stage measures',
  ),
  smuggled(
    'smuggled-transition-convergence-approval',
    'transition.convergence',
    ['skeleton-gate/loading-content'],
    'an approval for transition.convergence - a gate that landed on a hybrid of its two states would be excused',
  ),
  smuggled(
    'smuggled-transition-identity-approval',
    'transition.identity',
    ['skeleton-gate/loading-content'],
    'an approval for transition.identity - a gate that destroyed and recreated the consumer content on every ' +
      'state change would be excused, which is exactly what a v-if rewrite does',
  ),
  smuggled(
    'broad-composition-approval',
    'dom.canonicalClasses',
    ['skeleton-gate/default', 'skeleton-gate/radius', 'skeleton-gate/radius-empty'],
    'one approval spanning every case whose child configuration differs, so a defect in what the gate forwards ' +
      'to VfSkeleton would be excused by a rule reviewed for something else',
  ),
];
