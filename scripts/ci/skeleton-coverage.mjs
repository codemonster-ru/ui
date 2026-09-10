// What the VfSkeleton catalog has to prove, read as semantics.
//
// Its own file, not a third rule set inside presentation-coverage.mjs. That
// file holds the M15 toned spans and the divider; VfSkeleton shares no rule
// with any of them, and a coverage module that collects whatever the current
// milestone shipped stops telling a reader what it protects.
//
// The rules that matter most are the ones nothing else would notice. A skeleton
// that stopped emitting vf-skeleton--animated still renders a grey box. One
// that turned an empty radius into border-radius:0 still renders a grey box. A
// port that dropped aria-hidden still renders a grey box, and a screen reader
// starts reading it out.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};

/** Every way the VfSkeleton catalog's coverage can be eroded. */
export function skeletonCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // The inverted default. Two cases, because "the default" and "true passed
  // explicitly" are different claims and a port could break either one alone.
  require('no shared skeleton case renders the default, so nothing proves the animation modifier is present without being asked for', (
    entry,
  ) =>
    props(entry).animated === undefined && props(entry).minHeight === undefined && props(entry).radius === undefined);
  require('no shared skeleton case passes animated explicitly, so nothing proves the default is not a special case', (
    entry,
  ) => props(entry).animated === true);
  require('no shared skeleton case switches the animation off, so nothing proves the modifier can be absent', (entry) =>
    props(entry).animated === false);

  // min-height is typed string | number and the two travel different paths.
  require('no shared skeleton case passes a numeric min-height, so nothing proves the px suffix is appended', (entry) =>
    typeof props(entry).minHeight === 'number' && props(entry).minHeight !== 0);
  require('no shared skeleton case passes min-height 0, so nothing proves zero is a length rather than an absence', (
    entry,
  ) => props(entry).minHeight === 0);
  require('no shared skeleton case passes a string min-height, so nothing proves a string is passed through untouched', (
    entry,
  ) => typeof props(entry).minHeight === 'string' && props(entry).minHeight !== '');

  require('no shared skeleton case passes a custom radius, so nothing proves the default token can be replaced', (
    entry,
  ) => typeof props(entry).radius === 'string' && props(entry).radius !== '');
  // The quirk. Without this case, normalising '' into border-radius:0 passes.
  require('no shared skeleton case passes an empty radius, so nothing proves the declaration is dropped rather than zeroed', (
    entry,
  ) => props(entry).radius === '');

  require('no shared skeleton case forwards a consumer class, so nothing proves the canonical classes come first', (
    entry,
  ) => attrs(entry).class !== undefined);
  // A consumer class after a modifier and a consumer class with no modifier to
  // follow are different positions in the class list.
  require('no shared skeleton case forwards a consumer class to an unanimated skeleton', (entry) =>
    attrs(entry).class !== undefined && props(entry).animated === false);
  require("no shared skeleton case forwards an inline style, so nothing proves a consumer style merges after the component's own declarations", (
    entry,
  ) => attrs(entry).style !== undefined);
  require('no shared skeleton case forwards a style that collides with a declaration the component writes', (entry) =>
    typeof attrs(entry).style === 'string' && attrs(entry).style.includes('border-radius'));
  require('no shared skeleton case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));

  // The accessibility contract is one attribute, and half of it is that a
  // consumer can replace it.
  require('no shared skeleton case overrides aria-hidden, so the historical override path is never measured', (entry) =>
    attrs(entry)['aria-hidden'] !== undefined);
  require('no shared skeleton case forwards a consumer role and accessible name', (entry) =>
    attrs(entry).role !== undefined && attrs(entry)['aria-label'] !== undefined);
  require("no shared skeleton case renders with no consumer ARIA at all, so the component's own aria-hidden is never measured on its own", (
    entry,
  ) => attrs(entry)['aria-hidden'] === undefined && attrs(entry).role === undefined);

  // Fail closed on a catalog that stopped being about this component.
  for (const entry of cases) {
    if (entry.content !== undefined) {
      violations.push(`${entry.id} declares slot content, and VfSkeleton has no slot`);
    }
    if (!entry.id?.startsWith('skeleton/')) {
      violations.push(`${entry.id} is not a skeleton case, so it cannot count towards skeleton coverage`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  if (!visual.some((entry) => props(entry).animated === false)) {
    violations.push('no skeleton screenshot renders the unanimated variant, so the shimmer could disappear unseen');
  }
  if (!visual.some((entry) => props(entry).radius === '')) {
    violations.push('no skeleton screenshot renders the empty radius, so the dropped declaration is never seen');
  }
  if (!visual.some((entry) => props(entry).minHeight !== undefined)) {
    violations.push("no skeleton screenshot reserves a height, so the component's only geometry prop is never seen");
  }

  return violations;
}
