// What the VfPanel catalog has to prove, read as semantics.
//
// The first coverage module written against a *neighbour* rather than against a
// component in isolation. VfCard is the nearest structural neighbour VfPanel has
// - same section root, same conditional unclassed header, same title falling
// back to an h3 - and a Card-shaped implementation of VfPanel passes every case
// that does not name a difference. So this module has two halves:
//
//   - the ordinary half: each header state alone, each combination, the empty
//     variants, the modifier, the consumer attribute contract;
//   - the substitution half: the rules that would still be satisfied by a
//     catalog of Card-derived cases of equal count, and would not be satisfied
//     by a panel implemented as a card. Those are the ones that require a case
//     with an empty default slot (a panel emits nothing, a card emits an empty
//     classed div), a case that hands the panel a footer slot (a panel has no
//     footer at all), a case whose default slot holds several root-level nodes
//     (nothing wraps them), and the subtle modifier both with and without
//     content (it repaints rather than tightens).
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const hasHeader = (entry) => Boolean(props(entry).title) || hasSlot(entry, 'header');
/** A slot that renders nothing: no text, no markup shape, no control. */
const rendersNothing = (entry, name) =>
  hasSlot(entry, name) &&
  slot(entry, name).text === '' &&
  slot(entry, name).markup === undefined &&
  slot(entry, name).control === undefined;

/** Every way the VfPanel catalog's coverage can be eroded. */
export function panelCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  require('no shared panel case renders an empty panel, so nothing proves the section can be bare', (entry) =>
    !hasHeader(entry) && !hasSlot(entry, 'body'));

  // Each part alone, then together. A composed case cannot stand in: it would
  // still render if one part had been lost.
  require('no shared panel case renders the default slot alone', (entry) =>
    hasSlot(entry, 'body') && !hasHeader(entry));
  require('no shared panel case renders a title alone', (entry) =>
    Boolean(props(entry).title) && !hasSlot(entry, 'header') && !hasSlot(entry, 'body'));
  require('no shared panel case renders a header slot alone', (entry) =>
    hasSlot(entry, 'header') && !props(entry).title && !hasSlot(entry, 'body'));
  require('no shared panel case renders a title above the default slot', (entry) =>
    Boolean(props(entry).title) && !hasSlot(entry, 'header') && hasSlot(entry, 'body'));
  require('no shared panel case renders a header slot above the default slot', (entry) =>
    hasSlot(entry, 'header') && hasSlot(entry, 'body'));

  // The header rules. Same shape as VfCard's, owned here independently.
  require('no shared panel case passes both a title and a header slot, so nothing proves the slot suppresses the fallback heading', (
    entry,
  ) => Boolean(props(entry).title) && Boolean(slot(entry, 'header')?.text));
  require('no shared panel case passes a header slot that renders nothing, so nothing proves the fallback heading comes back', (
    entry,
  ) => rendersNothing(entry, 'header') && Boolean(props(entry).title));
  require('no shared panel case passes a header slot that renders nothing and no title, so the empty fallback heading is never rendered', (
    entry,
  ) => rendersNothing(entry, 'header') && !props(entry).title);
  require('no shared panel case passes an empty-string title, so nothing proves it renders no header rather than an empty one', (
    entry,
  ) => props(entry).title === '');

  // --------------------------------------------- the Card-substitution rules
  //
  // Each of these is a case a Card-derived catalog of the same size would not
  // contain, and each is a case a Card-shaped implementation of VfPanel fails.

  require('no shared panel case passes an empty default slot, so nothing distinguishes a panel (which emits nothing) from a card (which emits an empty classed body wrapper holding a row and a column gap open)', (
    entry,
  ) => rendersNothing(entry, 'body'));
  require('no shared panel case hands the panel a footer slot, so "a panel renders no footer" is assumed rather than measured - which is exactly what a Card-shaped implementation would get wrong', (
    entry,
  ) => hasSlot(entry, 'footer'));
  require('no shared panel case puts several root-level nodes in the default slot, so nothing proves they become siblings of the header rather than children of a wrapper', (
    entry,
  ) => slot(entry, 'body')?.markup !== undefined);
  require('no shared panel case renders the subtle modifier with content', (entry) =>
    props(entry).subtle === true && hasSlot(entry, 'body'));
  require('no shared panel case renders the subtle modifier on an empty panel, where the repainted background is the only thing visible and nothing else can account for the difference', (
    entry,
  ) => props(entry).subtle === true && !hasHeader(entry) && !hasSlot(entry, 'body'));
  require('no shared panel case renders the subtle modifier with a header', (entry) =>
    props(entry).subtle === true && hasHeader(entry));

  require('no shared panel case renders hostile title text', (entry) =>
    typeof props(entry).title === 'string' && props(entry).title.includes('<'));

  require('no shared panel case forwards a consumer class, so nothing proves the canonical classes come first', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared panel case forwards a consumer class at the default, with no modifier to follow', (entry) =>
    attrs(entry).class !== undefined && props(entry).subtle === undefined);
  require('no shared panel case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared panel case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared panel case forwards a consumer role and accessible name', (entry) =>
    attrs(entry).role !== undefined && attrs(entry)['aria-label'] !== undefined);
  require("no shared panel case renders without any consumer ARIA, so the section's own absence of a landmark role is never measured", (
    entry,
  ) => attrs(entry).role === undefined && attrs(entry)['aria-label'] === undefined);

  // The slot-ownership fixtures. Two of them, in the two slots a panel actually
  // renders: one slot proving the distinction would let the other be classified
  // by accident.
  require('no shared panel case puts a consumer control in the default slot, so the static snapshot never has to tell consumer interaction from component interaction', (
    entry,
  ) => slot(entry, 'body')?.control !== undefined);
  require('no shared panel case puts a consumer control in the header slot, so slot ownership is proved by one slot alone', (
    entry,
  ) => slot(entry, 'header')?.control !== undefined);

  // The declaration the static snapshot is asserted against has to match the
  // controls the fixtures actually render, or a case could declare a budget of
  // five and hide four component-grown buttons inside it. Only the two rendered
  // slots count: a control in the ignored footer slot would never reach the DOM,
  // so declaring one would make the budget a fiction.
  for (const entry of cases) {
    if (slot(entry, 'footer')?.control !== undefined) {
      violations.push(
        `${entry.id} puts a control in the footer slot, which a panel never renders; the static budget would ` +
          'count a control that cannot appear',
      );
    }

    const rendered = ['header', 'body'].filter((name) => slot(entry, name)?.control !== undefined).length;
    const declared = entry.consumerInteractive ?? 0;

    if (rendered !== declared) {
      violations.push(
        `${entry.id} renders ${rendered} consumer control(s) but declares consumerInteractive ${declared}; ` +
          'the static snapshot is asserted against the declaration, so the two must agree',
      );
    }
  }

  for (const entry of cases) {
    if (!entry.id?.startsWith('panel/')) {
      violations.push(`${entry.id} is not a panel case, so it cannot count towards panel coverage`);
    }
    // `footer` is listed because one case deliberately hands the panel a slot it
    // does not have. Anything else is a slot neither component declares.
    for (const name of Object.keys(entry.content ?? {})) {
      if (!['header', 'body', 'footer'].includes(name)) {
        violations.push(`${entry.id} declares a [${name}] slot, and VfPanel has only header and default`);
      }
    }
    // The modifier a Card-derived catalog would bring with it. A panel has no
    // compact prop at all, so a case naming one is a card case wearing a panel
    // id.
    if (props(entry).compact !== undefined) {
      violations.push(`${entry.id} declares the compact prop, which belongs to VfCard; VfPanel's modifier is subtle`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['an empty panel', (entry) => !hasHeader(entry) && !hasSlot(entry, 'body')],
    ['the default slot alone', (entry) => hasSlot(entry, 'body') && !hasHeader(entry)],
    ['a title alone', (entry) => Boolean(props(entry).title) && !hasSlot(entry, 'body')],
    ['a header slot', (entry) => hasSlot(entry, 'header')],
    ['the subtle modifier', (entry) => props(entry).subtle === true],
    [
      'an empty default slot, where a wrongly added wrapper would show as a row and a gap',
      (entry) => rendersNothing(entry, 'body'),
    ],
    [
      'a footer slot the panel ignores, where a wrongly added footer would show as a row and a gap',
      (entry) => hasSlot(entry, 'footer'),
    ],
    ['several root-level nodes in the default slot', (entry) => slot(entry, 'body')?.markup !== undefined],
    ['consumer slot content that is interactive', (entry) => slot(entry, 'body')?.control !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no panel screenshot renders ${what}, so its geometry could move unseen`);
    }
  }

  return violations;
}
