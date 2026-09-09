// Platform-independent presentation rules for the three M15 components.
//
// One file, four functions, and no shared abstraction between them - the same
// finding M14 recorded for the checkable controls, reached independently here
// and for a different reason.
//
// VfBadge and VfTag are the closest pair in the catalog: a span, one `tone`
// prop, a default slot, and the same rule that `neutral` emits no modifier at
// all. A `resolveTonedSpan(block, tone)` taking the block name would collapse
// both into one line. It is deliberately not written, because:
//
//   - their props are typed by two distinct public unions, `VfBadgeTone` and
//     `VfFeedbackTone`, which the library exports separately and which are free
//     to diverge without either component changing;
//   - their stylesheets are not the same shape. A badge tone sets background,
//     border-colour and colour; a tag tone sets border-colour and colour and
//     never touches background. The class list is the half that looks alike;
//     the half that does not is the half that matters visually.
//
// A shared helper would make "Tag is Badge with another block name" true in the
// source, and the whole point of migrating them in one batch is to prove that
// it is not. Two three-line functions that read identically are cheaper than
// one abstraction that has to be argued about, and they let a mutation break
// exactly one component.
//
// VfDivider shares nothing with either. It is here because it is the third
// component of the same milestone, not because it is the same kind of thing:
// it has no tone, no slot, always emits its orientation modifier, and owns the
// only accessibility rule in the batch.
//
// These record the behaviour of the reference implementations at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** The tone literals `VfBadgeTone` allows. Duplicated from the Vue type on purpose: shared-core may not import the adapter. */
export type VfBadgeToneName = 'neutral' | 'primary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';

/** The tone literals `VfFeedbackTone` allows. Same members as VfBadgeToneName today; a separate type because the public API keeps them separate. */
export type VfFeedbackToneName = 'neutral' | 'primary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';

/** The orientation literals `VfDividerOrientation` allows. */
export type VfDividerOrientationName = 'horizontal' | 'vertical';

/**
 * The badge root class list, in the order the reference emits it.
 *
 * `neutral` emits no modifier: the default tone is expressed by absence. That
 * is the opposite of the M14 checkable convention, where the size modifier is
 * always present including at the default. Both conventions are historical.
 */
export function resolveBadgeClasses(tone: string): string[] {
  const classes = ['vf-badge'];

  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);

  return classes;
}

/**
 * The tag root class list, in the order the reference emits it.
 *
 * Reads the same as resolveBadgeClasses and is not the same rule: it is typed
 * against a different public union and it names a stylesheet with different
 * tone semantics. See the file header for why the duplication is kept.
 */
export function resolveTagClasses(tone: string): string[] {
  const classes = ['vf-tag'];

  if (tone !== 'neutral') classes.push(`vf-tag--${tone}`);

  return classes;
}

/**
 * The divider root class list.
 *
 * The orientation modifier is always emitted, including at the default
 * `horizontal` - unlike the two toned spans in this same batch.
 */
export function resolveDividerClasses(orientation: string): string[] {
  return ['vf-divider', `vf-divider--${orientation}`];
}

/**
 * The `role` a divider exposes, or `undefined` when it exposes none.
 *
 * The historical quirk of the batch: only a vertical divider is given
 * `role="separator"`. A horizontal one is a `div` with an `aria-orientation`
 * and no role at all, which makes that attribute inert. Standards cleanup would
 * give both a role; that would be a product change, so the rule is stated here
 * as-is and pinned by its own vectors.
 *
 * Note this decides only what the component writes. A caller's `role` attribute
 * is bound after the component's own in the template and still wins.
 */
export function resolveDividerRole(orientation: string): 'separator' | undefined {
  return orientation === 'vertical' ? 'separator' : undefined;
}
