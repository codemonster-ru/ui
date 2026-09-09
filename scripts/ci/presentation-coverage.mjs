// What the three M15 catalogs have to prove, read as semantics.
//
// Three rule sets in one file, sharing two one-line predicates and nothing
// else. That mirrors the components. VfBadge and VfTag have the same shape, so
// a single "toned span" rule set would be satisfiable by whichever catalog
// happened to hold the case - which is the substitution the whole batch exists
// to disprove. Each rule set therefore names its own block and its own tones,
// and neither can be satisfied by the other's cases.
//
// The rules that matter most are the ones nothing else would notice. A badge
// that started emitting vf-badge--neutral still renders a badge. A tag that
// gained a background still renders a tag. A divider corrected to role
//="separator" on both orientations still renders a divider, and is arguably
// better - which is precisely why it has to fail.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};

/** Every non-neutral tone both toned spans document. */
export const DOCUMENTED_TONES = ['primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

/** Both orientations VfDivider documents. */
export const DOCUMENTED_ORIENTATIONS = ['horizontal', 'vertical'];

/**
 * Rules a toned-span catalog has to satisfy, stated against one block name.
 *
 * The block name is a parameter of the *rule check*, not of the components:
 * nothing here is shared by VfBadge and VfTag at runtime. It is here so that a
 * badge case can never satisfy a tag rule - each call is bound to one block and
 * one catalog.
 */
function tonedSpanViolations(cases, block) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // The rule that is invisible in a rendered page and is the whole convention:
  // neutral is the absence of a modifier. Two cases, because "the default" and
  // "neutral passed explicitly" are different claims and a port could break
  // either one alone.
  require(`no shared ${block} case renders the default tone, so nothing proves neutral emits no modifier`, (entry) =>
    props(entry).tone === undefined);
  require(`no shared ${block} case passes neutral explicitly, so nothing proves the default is not a special case`, (
    entry,
  ) => props(entry).tone === 'neutral');

  for (const tone of DOCUMENTED_TONES) {
    require(`no shared ${block} case renders the ${tone} tone`, (entry) => props(entry).tone === tone);
  }

  require(`no shared ${block} case forwards a consumer class, so nothing proves the canonical classes come first`, (
    entry,
  ) => attrs(entry).class !== undefined);
  // A consumer class next to a modifier and a consumer class with no modifier
  // to follow are different positions in the class list.
  require(`no shared ${block} case forwards a consumer class at the neutral tone`, (entry) =>
    attrs(entry).class !== undefined && props(entry).tone === undefined);
  require(`no shared ${block} case forwards an inline style`, (entry) => attrs(entry).style !== undefined);
  require(`no shared ${block} case forwards a product data attribute`, (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  // The component writes no ARIA. That is only a measurement if a case proves
  // consumer ARIA reaches the root, and a case shows the bare element.
  require(`no shared ${block} case forwards a consumer role and accessible name`, (entry) =>
    attrs(entry).role !== undefined && attrs(entry)['aria-label'] !== undefined);
  require(`no shared ${block} case renders without any consumer ARIA, so the component's own absence of ARIA is never measured`, (
    entry,
  ) => attrs(entry).role === undefined && attrs(entry)['aria-label'] === undefined);

  require(`no shared ${block} case renders hostile slot text`, (entry) =>
    typeof entry.content?.text === 'string' && entry.content.text.includes('<'));
  require(`no shared ${block} case renders without slot content, so the single content channel is never proved empty`, (
    entry,
  ) => entry.content?.text === undefined);

  // Fail closed on a catalog that stopped being about this component at all.
  for (const entry of cases) {
    if (!entry.id?.startsWith(`${block}/`)) {
      violations.push(`${entry.id} is not a ${block} case, so it cannot count towards ${block} coverage`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  if (!visual.some((entry) => props(entry).tone === undefined)) {
    violations.push(`no ${block} screenshot renders the neutral tone`);
  }
  if (!DOCUMENTED_TONES.every((tone) => visual.some((entry) => props(entry).tone === tone))) {
    violations.push(
      `the ${block} screenshots do not cover every non-neutral tone, so a tone could lose its colour unseen`,
    );
  }

  return violations;
}

/** Every way the VfBadge catalog's coverage can be eroded. */
export function badgeCoverageViolations(cases) {
  return tonedSpanViolations(cases, 'badge');
}

/** Every way the VfTag catalog's coverage can be eroded. */
export function tagCoverageViolations(cases) {
  return tonedSpanViolations(cases, 'tag');
}

/** Every way the VfDivider catalog's coverage can be eroded. */
export function dividerCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  require('no shared divider case renders the default orientation', (entry) => props(entry).orientation === undefined);
  for (const orientation of DOCUMENTED_ORIENTATIONS) {
    require(`no shared divider case renders the ${orientation} orientation explicitly`, (entry) =>
      props(entry).orientation === orientation);
  }

  // The quirk. Both halves are required: a catalog that only proved the
  // vertical separator would pass a divider that also gave the horizontal one a
  // role, and a catalog that only proved the horizontal one would pass a
  // divider that had lost the separator entirely.
  require('no shared divider case renders a horizontal divider without a consumer role, so the absence of a role is never measured', (
    entry,
  ) =>
    (props(entry).orientation ?? 'horizontal') === 'horizontal' &&
    attrs(entry).role === undefined &&
    attrs(entry)['aria-orientation'] === undefined);
  require('no shared divider case renders a vertical divider without a consumer role, so role=separator is never measured', (
    entry,
  ) =>
    props(entry).orientation === 'vertical' &&
    attrs(entry).role === undefined &&
    attrs(entry)['aria-orientation'] === undefined);

  // The override path exists because attrs are bound last. Three separate
  // claims: adding a role where there was none, replacing one that was there,
  // and contradicting the orientation.
  require('no shared divider case gives a horizontal divider a consumer role', (entry) =>
    (props(entry).orientation ?? 'horizontal') === 'horizontal' && attrs(entry).role !== undefined);
  require('no shared divider case replaces the separator role on a vertical divider', (entry) =>
    props(entry).orientation === 'vertical' && attrs(entry).role !== undefined);
  require('no shared divider case overrides aria-orientation against the prop', (entry) =>
    attrs(entry)['aria-orientation'] !== undefined);

  require('no shared divider case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared divider case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared divider case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));

  // A divider has no slot. A catalog that grew content would be describing
  // some other component.
  for (const entry of cases) {
    if (entry.content !== undefined) {
      violations.push(`${entry.id} declares slot content, and VfDivider has no slot`);
    }
    if (!entry.id?.startsWith('divider/')) {
      violations.push(`${entry.id} is not a divider case, so it cannot count towards divider coverage`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  for (const orientation of DOCUMENTED_ORIENTATIONS) {
    if (!visual.some((entry) => (props(entry).orientation ?? 'horizontal') === orientation)) {
      violations.push(`no divider screenshot renders the ${orientation} orientation`);
    }
  }

  return violations;
}
