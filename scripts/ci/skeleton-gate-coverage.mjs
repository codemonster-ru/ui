// What the VfSkeletonGate catalog has to prove, read as semantics.
//
// The first coverage module for a component that renders another migrated
// component, and the first whose contract has two states that can be driven
// into each other. The rules are shaped by both:
//
//   - a case count proves nothing here. Padding the catalog with more loading
//     cases while deleting every ready one leaves a component that never
//     settles, and every remaining case would still pass. So each state has to
//     be present on its own terms, and the *pair* that differs only in `ready`
//     has to be present too, because that pair is what the transition evidence
//     rests on;
//   - the predicate's edges are not `ready`. `ready` is a declared boolean, so
//     Vue casts it and there is nothing subtle left. The edges that are subtle
//     belong to the reserve precedence - zero, and the empty string - and to
//     the radius, which travels through the gate into a second component with
//     its own empty-value rule. Those are what a truthiness check or a
//     hardcoded default would break;
//   - what reaches the child is a dimension of its own. A catalog that only
//     ever rendered a default gate would pass a gate that forwarded nothing,
//     because the child's own defaults would supply everything.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const body = (entry) => entry.content?.body;
const skeletonSlot = (entry) => entry.content?.skeleton;
const isReady = (entry) => props(entry).ready === true;
const isLoading = (entry) => props(entry).ready !== true;
const hasContent = (entry) => body(entry) !== undefined;

/** Every way the VfSkeletonGate catalog's coverage can be eroded. */
export function skeletonGateCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // The two states, each on its own. These are the padding attacks A and B: a
  // catalog with every loading case deleted, or every ready one, fails here no
  // matter how many cases replace them.
  require(
    'no shared skeleton-gate case is in the loading state, so nothing proves the gate ever presents a skeleton',
    isLoading,
  );
  require(
    'no shared skeleton-gate case is in the ready state, so nothing proves the gate ever settles',
    isReady,
  );
  require('no shared skeleton-gate case is loading with consumer content in it', (entry) =>
    isLoading(entry) && hasContent(entry));
  require('no shared skeleton-gate case is ready with consumer content in it', (entry) =>
    isReady(entry) && hasContent(entry));

  // Both halves are present in both states, which is the component's whole
  // shape. A catalog whose loading and ready cases carried *different* content
  // could not tell a gate that hides a half from one that removes it, so the
  // rule is about a matched pair rather than about two cases existing.
  const pairs = cases.filter(
    (entry) =>
      isLoading(entry) &&
      hasContent(entry) &&
      cases.some(
        (other) =>
          isReady(other) &&
          other.id !== entry.id &&
          JSON.stringify(other.content) === JSON.stringify(entry.content) &&
          JSON.stringify({ ...props(other), ready: undefined }) === JSON.stringify({ ...props(entry), ready: undefined }),
      ),
  );
  if (pairs.length === 0) {
    violations.push(
      'no two shared skeleton-gate cases differ only in `ready`, so nothing compares the same gate in both states ' +
        'and a component that removed a half rather than hiding it could not be told from one that hid it',
    );
  }

  // The transition. A declared transition has to name a case that exists and
  // has to actually change the state, or it is a scenario that proves nothing.
  const transitions = cases.filter((entry) => entry.transition);
  if (transitions.length === 0) {
    violations.push(
      'no shared skeleton-gate case declares a transition, so the state is only ever measured as rendered ' +
        'and a gate that never updates after mount would pass every case in the catalog',
    );
  }
  for (const entry of transitions) {
    const target = cases.find((candidate) => candidate.id === entry.transition.matches);

    if (!target) {
      violations.push(`${entry.id} transitions to a case [${entry.transition.matches}] that is not in the catalog`);
      continue;
    }
    if (typeof entry.transition.to?.ready !== 'boolean') {
      violations.push(`${entry.id} declares a transition that does not set ready, which is the only thing to drive`);
      continue;
    }
    if (entry.transition.to.ready === isReady(entry)) {
      violations.push(`${entry.id} declares a transition to the state it already renders in`);
    }
    if (isReady(target) !== entry.transition.to.ready) {
      violations.push(
        `${entry.id} transitions to ready=${entry.transition.to.ready} but names ${target.id}, ` +
          `which renders ready=${isReady(target)}; the convergence check would compare two different states`,
      );
    }
    const from = { ...props(entry) };
    const to = { ...props(target) };
    delete from.ready;
    delete to.ready;
    if (JSON.stringify(from) !== JSON.stringify(to) || JSON.stringify(entry.content) !== JSON.stringify(target.content)) {
      violations.push(
        `${entry.id} and ${target.id} differ in more than \`ready\`, so a converged transition could not equal ` +
          'the case it is supposed to land on for reasons that have nothing to do with the transition',
      );
    }
  }
  if (!transitions.some((entry) => entry.transition.to.ready === true)) {
    violations.push('no shared skeleton-gate case drives the loading-to-ready transition, which is the common direction');
  }
  if (!transitions.some((entry) => entry.transition.to.ready === false)) {
    violations.push(
      'no shared skeleton-gate case drives the ready-to-loading transition, so nothing proves the gate can go back',
    );
  }

  // The reserve precedence and its two edges. Padding attack C: a catalog that
  // keeps both states but drops these leaves a truthiness check indetectable.
  require('no shared skeleton-gate case passes both a minHeight and a reserveHeight, so nothing proves which one the root uses', (
    entry,
  ) => props(entry).minHeight !== undefined && props(entry).reserveHeight !== undefined);
  require('no shared skeleton-gate case passes a zero reserveHeight, so nothing distinguishes the null check from a truthiness check', (
    entry,
  ) => props(entry).reserveHeight === 0);
  require('no shared skeleton-gate case passes an empty reserveHeight, so nothing proves it wins the precedence contest and then writes nothing', (
    entry,
  ) => props(entry).reserveHeight === '');

  // What reaches the child. Padding attack D: dropping any one of these leaves
  // a forwarding path with no case behind it.
  require('no shared skeleton-gate case forwards a numeric minHeight to the child skeleton', (entry) =>
    typeof props(entry).minHeight === 'number');
  require('no shared skeleton-gate case forwards a string minHeight to the child skeleton', (entry) =>
    typeof props(entry).minHeight === 'string');
  require('no shared skeleton-gate case forwards a radius to the child skeleton', (entry) =>
    typeof props(entry).radius === 'string' && props(entry).radius !== '');
  require('no shared skeleton-gate case forwards an empty radius, so nothing proves the child drops the declaration rather than rounding to zero', (
    entry,
  ) => props(entry).radius === '');
  require('no shared skeleton-gate case leaves the radius unset, so nothing proves the child supplies its own default rather than the gate hardcoding one', (
    entry,
  ) => props(entry).radius === undefined && skeletonSlot(entry) === undefined);

  // The gate's own presentation props.
  require('no shared skeleton-gate case sets a fade duration', (entry) => props(entry).fadeDuration !== undefined);
  require('no shared skeleton-gate case sets normalizeContentSpacing', (entry) =>
    props(entry).normalizeContentSpacing === true);
  require('no shared skeleton-gate case sets preserveLastHeight, so the prop reaches no comparison at all', (entry) =>
    props(entry).preserveLastHeight === true);

  // The slots.
  require('no shared skeleton-gate case passes a skeleton slot, so nothing proves it replaces the child component', (
    entry,
  ) => skeletonSlot(entry) !== undefined);
  require('no shared skeleton-gate case passes a skeleton slot to a ready gate', (entry) =>
    skeletonSlot(entry) !== undefined && isReady(entry));
  require('no shared skeleton-gate case renders an empty gate with no content slot at all', (entry) =>
    !hasContent(entry) && skeletonSlot(entry) === undefined);
  require('no shared skeleton-gate case renders rich consumer markup', (entry) => body(entry)?.markup !== undefined);
  require('no shared skeleton-gate case renders rich consumer markup while loading, where it has to survive being faded and made inert', (
    entry,
  ) => body(entry)?.markup !== undefined && isLoading(entry));

  // Consumer attributes.
  require('no shared skeleton-gate case forwards a consumer class, so nothing proves the canonical class comes first', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared skeleton-gate case forwards an inline style, so nothing proves it merges after the component declarations', (
    entry,
  ) => attrs(entry).style !== undefined);
  require('no shared skeleton-gate case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared skeleton-gate case overrides aria-busy on a loading gate', (entry) =>
    attrs(entry)['aria-busy'] !== undefined && isLoading(entry));
  require('no shared skeleton-gate case overrides aria-busy on a ready gate, where the component writes none of its own', (
    entry,
  ) => attrs(entry)['aria-busy'] !== undefined && isReady(entry));

  // Slot ownership, in both states. One state proving the distinction would let
  // the other be classified by accident, and the loading half is the one that
  // measures `inert`.
  require('no shared skeleton-gate case puts a consumer control in the content slot of a ready gate, so the static snapshot never has to tell consumer interaction from component interaction', (
    entry,
  ) => body(entry)?.control !== undefined && isReady(entry));
  require('no shared skeleton-gate case puts a consumer control in the content slot of a loading gate, so nothing measures that the faded content is inert rather than merely faded', (
    entry,
  ) => body(entry)?.control !== undefined && isLoading(entry));

  // The declaration the static snapshot is asserted against has to match the
  // controls the fixtures actually render, or a case could declare a budget of
  // five and hide four component-grown buttons inside it.
  for (const entry of cases) {
    const rendered = body(entry)?.control !== undefined ? 1 : 0;
    const declared = entry.consumerInteractive ?? 0;

    if (rendered !== declared) {
      violations.push(
        `${entry.id} renders ${rendered} consumer control(s) but declares consumerInteractive ${declared}; ` +
          'the static snapshot is asserted against the declaration, so the two must agree',
      );
    }
  }

  for (const entry of cases) {
    if (!entry.id?.startsWith('skeleton-gate/')) {
      violations.push(`${entry.id} is not a skeleton-gate case, so it cannot count towards skeleton-gate coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!['body', 'skeleton'].includes(name)) {
        violations.push(`${entry.id} declares a [${name}] slot, and VfSkeletonGate has only default and skeleton`);
      }
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    // A gate with no content and no reserved height is a zero-height box: the
    // overlay is absolutely positioned, so the skeleton contributes no height
    // and there are no pixels to capture. The screenshot that stands for "a
    // default skeleton" is therefore a reserved empty gate, and requiring the
    // reservation here is what stops someone flagging the truly-empty case
    // visual again and getting a capture failure instead of a picture.
    [
      'a default skeleton in a box with room for it',
      (entry) =>
        isLoading(entry) &&
        !hasContent(entry) &&
        skeletonSlot(entry) === undefined &&
        props(entry).radius === undefined &&
        (props(entry).reserveHeight !== undefined || props(entry).minHeight !== undefined),
    ],
    ['a ready gate', isReady],
    ['a loading gate with content behind the skeleton', (entry) => isLoading(entry) && hasContent(entry)],
    ['a ready gate with content', (entry) => isReady(entry) && hasContent(entry)],
    ['a reserved height', (entry) => props(entry).reserveHeight !== undefined],
    ['a rounded gate', (entry) => typeof props(entry).radius === 'string' && props(entry).radius !== ''],
    ['rich consumer markup', (entry) => body(entry)?.markup !== undefined],
    ['a replaced skeleton slot', (entry) => skeletonSlot(entry) !== undefined],
    ['consumer slot content that is interactive', (entry) => body(entry)?.control !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no skeleton-gate screenshot renders ${what}, so its geometry could move unseen`);
    }
  }

  return violations;
}
