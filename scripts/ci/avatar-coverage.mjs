// What the VfAvatar catalog has to prove, read as semantics.
//
// One component whose contract is an ordering rather than a mapping, so the
// rules are shaped differently from every coverage module before it. Covering
// "each branch renders" is not enough: a reordering renders a branch for every
// input, and the only thing that can tell which branch won is a case that holds
// two competing props at once. So every adjacent pair in the chain gets its own
// requirement, and so does the case that holds all four channels together.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slotText = (entry) => entry.content?.text;
const truthy = (value) => value !== undefined && value !== null && value !== '';

/** The four content channels, in the order the reference resolves them. */
export const FALLBACK_BRANCHES = ['image', 'label', 'icon', 'slot'];

/** Which branch a case is written to exercise, by the same rule the component uses. */
export function branchOf(entry) {
  if (truthy(props(entry).image)) return 'image';
  if (truthy(props(entry).label)) return 'label';
  if (truthy(props(entry).icon)) return 'icon';

  return 'slot';
}

/** Every way the VfAvatar catalog's coverage can be eroded. */
export function avatarCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // Each branch has to be reachable on its own, or the catalog is not covering
  // the component at all.
  for (const branch of FALLBACK_BRANCHES) {
    require(`no shared avatar case renders the ${branch} branch`, (entry) => branchOf(entry) === branch);
  }

  // And each adjacent pair has to be present *together*, or nothing proves the
  // order. This is the difference between covering four branches and covering
  // a chain.
  require('no shared avatar case holds both an image and a label, so nothing proves the image wins', (entry) =>
    truthy(props(entry).image) && truthy(props(entry).label));
  require('no shared avatar case holds both a label and an icon, so nothing proves the label wins - the adjacent pair most easily reversed', (
    entry,
  ) => !truthy(props(entry).image) && truthy(props(entry).label) && truthy(props(entry).icon));
  require('no shared avatar case holds both an icon and slot content, so nothing proves the icon wins', (entry) =>
    !truthy(props(entry).image) &&
    !truthy(props(entry).label) &&
    truthy(props(entry).icon) &&
    slotText(entry) !== undefined);
  require('no shared avatar case holds all four channels at once', (entry) =>
    truthy(props(entry).image) &&
    truthy(props(entry).label) &&
    truthy(props(entry).icon) &&
    slotText(entry) !== undefined);

  // Truthiness rather than presence. Each channel separately, because a port
  // could switch one of the three tests and leave the others alone.
  require('no shared avatar case passes an empty image, so nothing proves an empty string falls through', (entry) =>
    props(entry).image === '');
  require('no shared avatar case passes an empty label, so nothing proves an empty string falls through', (entry) =>
    props(entry).label === '');
  require('no shared avatar case passes an empty icon, so nothing proves an empty string falls through', (entry) =>
    props(entry).icon === '');

  // The alt contract: present and set, present and empty.
  require('no shared avatar case gives the image an alt, so nothing proves the alt reaches the img', (entry) =>
    branchOf(entry) === 'image' && truthy(props(entry).imageAlt));
  require('no shared avatar case renders an image without an imageAlt, so nothing proves alt="" is written rather than omitted', (
    entry,
  ) => branchOf(entry) === 'image' && props(entry).imageAlt === undefined);

  // The two modifiers, suppressed by two different rules.
  require('no shared avatar case renders the default size and shape', (entry) =>
    props(entry).size === undefined && props(entry).shape === undefined);
  for (const size of ['sm', 'lg']) {
    require(`no shared avatar case renders the ${size} size`, (entry) => props(entry).size === size);
  }
  require('no shared avatar case passes md explicitly, so nothing proves the default size is not a special case', (
    entry,
  ) => props(entry).size === 'md');
  require('no shared avatar case renders the circle shape', (entry) => props(entry).shape === 'circle');
  require('no shared avatar case passes square explicitly, so nothing proves the shape modifier is suppressed by its own rule', (
    entry,
  ) => props(entry).shape === 'square');
  require('no shared avatar case sets a non-default size and shape at once, so the modifier order is never proved', (
    entry,
  ) => props(entry).size !== undefined && props(entry).size !== 'md' && props(entry).shape === 'circle');

  require('no shared avatar case renders hostile label text', (entry) =>
    typeof props(entry).label === 'string' && props(entry).label.includes('<'));
  require('no shared avatar case renders hostile slot content', (entry) =>
    typeof slotText(entry) === 'string' && slotText(entry).includes('<'));

  require('no shared avatar case forwards a consumer class, so nothing proves the canonical classes come first', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared avatar case forwards a consumer class at the default size', (entry) =>
    attrs(entry).class !== undefined && props(entry).size === undefined);
  require('no shared avatar case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared avatar case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  // The component writes no ARIA on the root. That is only a measurement if a
  // case proves consumer ARIA reaches it, and other cases show it bare.
  require('no shared avatar case forwards a consumer role and accessible name', (entry) =>
    attrs(entry).role !== undefined && attrs(entry)['aria-label'] !== undefined);
  require("no shared avatar case renders without any consumer ARIA, so the component's own absence of ARIA is never measured", (
    entry,
  ) => attrs(entry).role === undefined && attrs(entry)['aria-label'] === undefined);

  // VfAvatar does have a default slot a consumer could put a control in, and no
  // case does. The rule is therefore not "it is impossible" but "no case has
  // bought itself a static-interaction budget": every avatar case must measure
  // zero focusable elements, and a case that quietly raised that ceiling would
  // be how a component-grown control got through.
  for (const entry of cases) {
    if (entry.consumerInteractive !== undefined) {
      violations.push(
        `${entry.id} declares consumerInteractive; no avatar case puts a control in the default slot, so the ` +
          'static snapshot must be asserted against zero',
      );
    }
  }

  for (const entry of cases) {
    if (!entry.id?.startsWith('avatar/')) {
      violations.push(`${entry.id} is not an avatar case, so it cannot count towards avatar coverage`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  for (const branch of FALLBACK_BRANCHES) {
    if (!visual.some((entry) => branchOf(entry) === branch)) {
      violations.push(`no avatar screenshot renders the ${branch} branch, so it could lose its layout unseen`);
    }
  }
  if (!visual.some((entry) => props(entry).shape === 'circle')) {
    violations.push('no avatar screenshot renders the circle shape, so the border-radius could disappear unseen');
  }
  for (const size of ['sm', 'lg']) {
    if (!visual.some((entry) => props(entry).size === size)) {
      violations.push(`no avatar screenshot renders the ${size} size, so its custom properties are never seen`);
    }
  }

  return violations;
}
