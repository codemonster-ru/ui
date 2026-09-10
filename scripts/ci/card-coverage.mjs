// What the VfCard catalog has to prove, read as semantics.
//
// The first coverage module for a component with several optional regions, and
// the rules are shaped by that: each region has to appear alone, each pair has
// to appear together, and every wrapper whose presence is decided by something
// other than its content has to be proved empty as well as full. A catalog that
// only held fully composed cards would pass a component that had lost a region
// entirely, because the composed case would still render two of the three.
//
// The rules nothing else would notice: that the wrappers carry no class; that
// an empty-string title renders no header; that a header slot rendering nothing
// brings the fallback heading back; and that consumer slot content is allowed
// to be interactive when the component itself is not.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const hasHeader = (entry) => Boolean(props(entry).title) || hasSlot(entry, 'header');

/** Every way the VfCard catalog's coverage can be eroded. */
export function cardCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  require('no shared card case renders an empty card, so nothing proves all three regions can be absent at once', (
    entry,
  ) => !hasHeader(entry) && !hasSlot(entry, 'body') && !hasSlot(entry, 'footer'));

  // Each region alone. A composed case cannot stand in: it would still render
  // if one region had been lost.
  require('no shared card case renders the body alone', (entry) =>
    hasSlot(entry, 'body') && !hasHeader(entry) && !hasSlot(entry, 'footer'));
  require('no shared card case renders a title alone', (entry) =>
    Boolean(props(entry).title) && !hasSlot(entry, 'header') && !hasSlot(entry, 'body') && !hasSlot(entry, 'footer'));
  require('no shared card case renders the footer alone, so nothing proves the three regions are independent rather than ordered gates', (
    entry,
  ) => hasSlot(entry, 'footer') && !hasHeader(entry) && !hasSlot(entry, 'body'));
  require('no shared card case renders a header slot alone', (entry) =>
    hasSlot(entry, 'header') && !props(entry).title && !hasSlot(entry, 'body') && !hasSlot(entry, 'footer'));

  // Each pair, and all three.
  require('no shared card case renders the header and body without a footer', (entry) =>
    hasHeader(entry) && hasSlot(entry, 'body') && !hasSlot(entry, 'footer'));
  require('no shared card case renders the body and footer without a header', (entry) =>
    !hasHeader(entry) && hasSlot(entry, 'body') && hasSlot(entry, 'footer'));
  require('no shared card case renders the header and footer without a body', (entry) =>
    hasHeader(entry) && !hasSlot(entry, 'body') && hasSlot(entry, 'footer'));
  require('no shared card case renders all three regions', (entry) =>
    hasHeader(entry) && hasSlot(entry, 'body') && hasSlot(entry, 'footer'));

  // The header rules, which are the component's whole subtlety.
  require('no shared card case passes both a title and a header slot, so nothing proves the slot suppresses the fallback heading', (
    entry,
  ) => Boolean(props(entry).title) && Boolean(slot(entry, 'header')?.text));
  require('no shared card case passes a header slot that renders nothing, so nothing proves the fallback heading comes back', (
    entry,
  ) => hasSlot(entry, 'header') && slot(entry, 'header').text === '');
  require('no shared card case passes an empty-string title, so nothing proves it renders no header rather than an empty one', (
    entry,
  ) => props(entry).title === '');

  // The wrappers that render empty. Without these, keying them on rendered
  // content instead of on slot presence passes.
  require('no shared card case passes an empty body slot, so nothing proves the wrapper is keyed on presence rather than content', (
    entry,
  ) => slot(entry, 'body')?.text === '' && slot(entry, 'body')?.control === undefined);
  require('no shared card case passes an empty footer slot, so nothing proves the wrapper is keyed on presence rather than content', (
    entry,
  ) => slot(entry, 'footer')?.text === '' && slot(entry, 'footer')?.control === undefined);

  require('no shared card case renders the compact modifier', (entry) => props(entry).compact === true);
  require('no shared card case renders hostile title text', (entry) =>
    typeof props(entry).title === 'string' && props(entry).title.includes('<'));

  require('no shared card case forwards a consumer class, so nothing proves the canonical classes come first', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared card case forwards a consumer class at the default, with no modifier to follow', (entry) =>
    attrs(entry).class !== undefined && props(entry).compact === undefined);
  require('no shared card case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared card case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared card case forwards a consumer role and accessible name', (entry) =>
    attrs(entry).role !== undefined && attrs(entry)['aria-label'] !== undefined);
  require("no shared card case renders without any consumer ARIA, so the section's own absence of a landmark role is never measured", (
    entry,
  ) => attrs(entry).role === undefined && attrs(entry)['aria-label'] === undefined);

  // The slot-ownership fixtures. Two of them, in two different slots: one slot
  // proving the distinction would let the other be classified by accident.
  require('no shared card case puts a consumer control in the body slot, so the static snapshot never has to tell consumer interaction from component interaction', (
    entry,
  ) => slot(entry, 'body')?.control !== undefined);
  require('no shared card case puts a consumer control in the footer slot, so slot ownership is proved by one slot alone', (
    entry,
  ) => slot(entry, 'footer')?.control !== undefined);

  // The declaration the static snapshot is asserted against has to match the
  // controls the fixtures actually render, or a case could declare a budget of
  // five and hide four component-grown buttons inside it.
  for (const entry of cases) {
    const rendered = ['header', 'body', 'footer'].filter((name) => slot(entry, name)?.control !== undefined).length;
    const declared = entry.consumerInteractive ?? 0;

    if (rendered !== declared) {
      violations.push(
        `${entry.id} renders ${rendered} consumer control(s) but declares consumerInteractive ${declared}; ` +
          'the static snapshot is asserted against the declaration, so the two must agree',
      );
    }
  }

  for (const entry of cases) {
    if (!entry.id?.startsWith('card/')) {
      violations.push(`${entry.id} is not a card case, so it cannot count towards card coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!['header', 'body', 'footer'].includes(name)) {
        violations.push(`${entry.id} declares a [${name}] slot, and VfCard has only header, default and footer`);
      }
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['an empty card', (entry) => !hasHeader(entry) && !hasSlot(entry, 'body') && !hasSlot(entry, 'footer')],
    ['the body alone', (entry) => hasSlot(entry, 'body') && !hasHeader(entry) && !hasSlot(entry, 'footer')],
    ['a title alone', (entry) => Boolean(props(entry).title) && !hasSlot(entry, 'body') && !hasSlot(entry, 'footer')],
    ['the footer alone', (entry) => hasSlot(entry, 'footer') && !hasHeader(entry) && !hasSlot(entry, 'body')],
    ['all three regions', (entry) => hasHeader(entry) && hasSlot(entry, 'body') && hasSlot(entry, 'footer')],
    ['the compact modifier', (entry) => props(entry).compact === true],
    [
      'an empty body wrapper',
      (entry) => slot(entry, 'body')?.text === '' && slot(entry, 'body')?.control === undefined,
    ],
    ['consumer slot content that is interactive', (entry) => slot(entry, 'body')?.control !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no card screenshot renders ${what}, so its geometry could move unseen`);
    }
  }

  return violations;
}
