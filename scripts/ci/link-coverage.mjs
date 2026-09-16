// What the VfLink catalog has to prove, read as semantics.
//
// The first coverage module for a component whose owned control is an anchor
// and whose catalog is, on purpose, half of the Vue component. Three halves:
//
//   - the native half: an href, an empty href, no destination at all; the
//     one derivation (`_blank` without rel, `_blank` with rel, another target,
//     rel alone); each modifier, both together; the consumer attribute
//     contract (class, style, id, data-*, ARIA), and a case with no consumer
//     ARIA at all so the anchor's own silence is measured;
//   - the ownership half: every case declares how many controls the component
//     itself renders - one when there is an href, zero when there is none,
//     because an anchor without a destination is inert - and how many the
//     consumer's slot content adds. A catalog cannot buy the component a
//     control by declaring one for the no-destination anchor, and cannot lose
//     the anchor by declaring zero where there is an href;
//   - the boundary half: the vocabulary is closed to the native branch. A case
//     that named `to` or `component` would be describing the Vue adapter's
//     router handoff, which two of the three targets cannot render; a case
//     that declared an interaction would be driving something the reference
//     does not handle. Both are rejected outright, by name, so the boundary is
//     a rule the gate enforces rather than a convention the catalog happens
//     to follow.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const PROPS = ['href', 'target', 'rel', 'underline', 'tone'];
const VUE_ONLY_PROPS = ['to', 'component'];
const CONTENT_KEYS = ['text', 'markup', 'control'];
const MARKUP_SHAPES = ['label'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const content = (entry) => entry.content ?? {};
const hasHref = (entry) => props(entry).href !== undefined;
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key.startsWith('aria-') || key === 'role');

/** Every way the VfLink catalog's coverage can be eroded. */
export function linkCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('link/')) {
      violations.push(`${entry.id} is not a link case, so it cannot count towards link coverage`);
    }
    for (const name of Object.keys(props(entry))) {
      if (VUE_ONLY_PROPS.includes(name)) {
        violations.push(
          `${entry.id} declares prop [${name}], which selects the Vue adapter's router branch. That branch is a ` +
            'handoff to a component the reference never ships and a Razor target cannot render; it is pinned by ' +
            'VfLink.characterization.spec.ts and is not a cross-platform case',
        );
      } else if (!PROPS.includes(name)) {
        violations.push(`${entry.id} declares prop [${name}], which the reference VfLink does not have`);
      }
    }
    for (const name of Object.keys(content(entry))) {
      if (!CONTENT_KEYS.includes(name)) {
        violations.push(`${entry.id} puts [${name}] in the slot vocabulary; VfLink has one default slot`);
      }
    }
    if (content(entry).markup !== undefined && !MARKUP_SHAPES.includes(content(entry).markup)) {
      violations.push(`${entry.id} names markup shape [${content(entry).markup}], which no fixture renders`);
    }
    if (entry.interaction !== undefined) {
      violations.push(
        `${entry.id} declares an interaction. The reference handles no click and no key - activating a link is ` +
          "the browser's - so there is nothing of the component's to drive",
      );
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // One anchor per case, and it is a control exactly when it has an href.
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = hasHref(entry) ? 1 : 0;

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every link case owns an anchor, and a case that ` +
          'does not say whether that anchor is a control cannot be measured against anything',
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but ${
          hasHref(entry) ? 'has an href, so its anchor is a control' : 'has no href, so its anchor is inert'
        }; the budget is ${expected}`,
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    const rendered = content(entry).control !== undefined ? 1 : 0;
    if (consumer !== rendered) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s) but its slot puts ${rendered} in the anchor; the ` +
          'ownership stage is asserted against the declaration, so the two must agree',
      );
    }
  }

  // ---------------------------------------------------------- destinations
  require('no shared link case renders a plain href, so nothing proves the anchor is a link', (entry) =>
    hasHref(entry) && props(entry).href !== '' && props(entry).target === undefined && props(entry).rel === undefined);
  require('no shared link case renders an empty-string href, so nothing proves it stays a present attribute', (entry) =>
    props(entry).href === '');
  require('no shared link case renders an anchor with no destination, so the inert anchor - no href, no role, no tabindex, zero owned controls - is never measured', (
    entry,
  ) => !hasHref(entry) && entry.componentInteractive === 0);

  // ------------------------------------------------------------------- rel
  require('no shared link case renders target=_blank without rel, so the derived rel is never measured', (entry) =>
    props(entry).target === '_blank' && props(entry).rel === undefined);
  require('no shared link case renders target=_blank with an explicit rel, so nothing proves the explicit value wins without merging', (
    entry,
  ) => props(entry).target === '_blank' && typeof props(entry).rel === 'string' && props(entry).rel !== '');
  require('no shared link case renders another target without rel, so nothing proves the derivation is _blank-only', (
    entry,
  ) => typeof props(entry).target === 'string' && props(entry).target !== '_blank' && props(entry).rel === undefined);
  require('no shared link case renders rel without target, so nothing proves an explicit rel is written on its own', (
    entry,
  ) => typeof props(entry).rel === 'string' && props(entry).rel !== '' && props(entry).target === undefined);

  // ------------------------------------------------------------- modifiers
  require('no shared link case renders underline=hover', (entry) => props(entry).underline === 'hover');
  require('no shared link case renders underline=always', (entry) => props(entry).underline === 'always');
  require('no shared link case renders tone=muted', (entry) => props(entry).tone === 'muted');
  require('no shared link case renders both modifiers, so their order is never measured', (entry) =>
    ['hover', 'always'].includes(props(entry).underline) && props(entry).tone === 'muted');
  require('no shared link case renders the defaults with no modifier at all', (entry) =>
    hasHref(entry) && props(entry).underline === undefined && props(entry).tone === undefined);

  // ----------------------------------------------------------------- attrs
  require('no shared link case forwards a consumer class beside a modifier, so nothing proves the consumer class lands last', (
    entry,
  ) => attrs(entry).class !== undefined && props(entry).underline !== undefined);
  require('no shared link case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared link case forwards an id', (entry) => attrs(entry).id !== undefined);
  require('no shared link case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared link case forwards aria-label, so a consumer name is never measured', (entry) =>
    attrs(entry)['aria-label'] !== undefined);
  require('no shared link case forwards aria-current, which Chrome exposes in no accessibility state and the DOM alone carries', (
    entry,
  ) => attrs(entry)['aria-current'] !== undefined);
  require('no shared link case forwards aria-describedby, so a relationship out of the anchor is never measured', (
    entry,
  ) => attrs(entry)['aria-describedby'] !== undefined);
  require("no shared link case renders without any consumer ARIA, so the anchor's own silence is never measured", (
    entry,
  ) => hasHref(entry) && !hasConsumerAria(entry));

  // ------------------------------------------------------------------ slot
  require('no shared link case puts consumer markup in the anchor, so nothing proves the slot is unwrapped', (entry) =>
    content(entry).markup === 'label');
  require("no shared link case puts a consumer control in the anchor, so the ownership stage never has to tell the consumer's control from the component's anchor", (
    entry,
  ) => content(entry).control !== undefined && entry.consumerInteractive === 1 && hasHref(entry));

  // ---------------------------------------------------------------- visual
  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    [
      'a plain link',
      (entry) =>
        hasHref(entry) &&
        props(entry).underline === undefined &&
        props(entry).tone === undefined &&
        attrs(entry).class === undefined,
    ],
    ['the no-destination anchor', (entry) => !hasHref(entry)],
    ['underline=always, whose decoration is painted at rest', (entry) => props(entry).underline === 'always'],
    ['tone=muted, whose colour is the whole modifier', (entry) => props(entry).tone === 'muted'],
    ['both modifiers', (entry) => props(entry).underline !== undefined && props(entry).tone === 'muted'],
    ['a consumer control inside the anchor', (entry) => content(entry).control !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no link screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
