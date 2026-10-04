// What the VfTable catalog has to prove, read as semantics.
//
// Two wrappers that carry every consumer attribute, a caption opened by a prop
// or a slot, three row groups each opened by the presence of its own slot, and
// four modifier classes. A catalog of fully composed tables would pass a port
// that rendered every row group unconditionally or put the attributes on the
// table, so each rule below names the narrow case that carries one fact.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const filled = (entry, name) => (slot(entry, name)?.rows ?? 0) > 0;
const emptySection = (entry, name) =>
  hasSlot(entry, name) && (slot(entry, name).rows ?? 0) === 0 && !slot(entry, name).control;
const present = (value) => typeof value === 'string' && value !== '';
const sections = (entry) => ['header', 'body', 'footer'].filter((name) => hasSlot(entry, name));
const only = (entry, names) => {
  const open = sections(entry);
  return open.length === names.length && names.every((name) => open.includes(name));
};
const MODIFIERS = ['columnDividers', 'compact', 'striped', 'stickyHeader'];
const modifiers = (entry) => MODIFIERS.filter((name) => props(entry)[name] === true);
const consumerFocusable = (entry) =>
  (slot(entry, 'body')?.control === true ? 1 : 0) + (attrs(entry).tabindex !== undefined ? 1 : 0);

const TABLE_SLOTS = ['caption', 'header', 'body', 'footer'];

/** Every way the VfTable catalog's coverage can be eroded. */
export function tableCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  require('no shared table case renders an empty table, so nothing proves every child can be absent at once', (entry) =>
    sections(entry).length === 0 && !present(props(entry).caption) && !hasSlot(entry, 'caption') && !entry.group);

  // Each row group alone, each pair, and all three.
  for (const name of ['header', 'body', 'footer']) {
    require(`no shared table case opens the ${name} slot alone`, (entry) => only(entry, [name]) && filled(entry, name));
  }
  require('no shared table case opens head and body without a foot', (entry) => only(entry, ['header', 'body']));
  require('no shared table case opens body and foot without a head', (entry) => only(entry, ['body', 'footer']));
  require('no shared table case opens head and foot without a body, so a tbody rendered unconditionally would pass', (
    entry,
  ) => only(entry, ['header', 'footer']));
  require('no shared table case opens all three row groups with a caption', (entry) =>
    only(entry, ['header', 'body', 'footer']) && present(props(entry).caption));
  require('no shared table case passes three slots that render nothing, so keying row groups on content would pass', (
    entry,
  ) => ['header', 'body', 'footer'].every((name) => emptySection(entry, name)));

  // The caption.
  require('no shared table case renders a caption prop', (entry) =>
    present(props(entry).caption) && !hasSlot(entry, 'caption'));
  require('no shared table case passes an empty caption', (entry) =>
    props(entry).caption === '' && !hasSlot(entry, 'caption'));
  require('no shared table case passes the caption "0", so PHP truthiness could drop it unseen', (entry) =>
    props(entry).caption === '0');
  require('no shared table case renders a caption slot without the prop', (entry) =>
    hasSlot(entry, 'caption') && slot(entry, 'caption').text !== '' && props(entry).caption === undefined);
  require('no shared table case passes a caption slot over the prop, so nothing proves the slot wins', (entry) =>
    present(props(entry).caption) && present(slot(entry, 'caption')?.text));
  require('no shared table case passes an empty caption slot over the prop, so nothing proves the prop is the fallback', (
    entry,
  ) => present(props(entry).caption) && slot(entry, 'caption')?.text === '');
  require('no shared table case passes an empty caption slot alone', (entry) =>
    props(entry).caption === undefined && slot(entry, 'caption')?.text === '');

  // The modifiers.
  for (const name of MODIFIERS) {
    require(`no shared table case sets ${name} alone`, (entry) =>
      modifiers(entry).length === 1 && props(entry)[name] === true);
  }
  require('no shared table case sets all four modifiers', (entry) => modifiers(entry).length === 4);
  require('no shared table case combines two non-adjacent modifiers', (entry) =>
    modifiers(entry).join() === 'columnDividers,striped');
  require('no shared table case limits the height of a sticky-header table, so the scroll container never has to scroll', (
    entry,
  ) => props(entry).stickyHeader === true && /max-height/.test(String(attrs(entry).style ?? '')));

  // Where the attributes land.
  require('no shared table case forwards a consumer class, style, id and data attribute beside a modifier', (entry) =>
    ['class', 'style', 'id'].every((name) => attrs(entry)[name] !== undefined) &&
    Object.keys(attrs(entry)).some((name) => name.startsWith('data-')) &&
    modifiers(entry).length > 0);
  require('no shared table case forwards a consumer role, accessible name and tabindex beside a caption', (entry) =>
    attrs(entry).role !== undefined &&
    attrs(entry)['aria-label'] !== undefined &&
    attrs(entry).tabindex !== undefined &&
    present(props(entry).caption));
  require('no shared table case forwards a consumer aria-describedby', (entry) =>
    attrs(entry)['aria-describedby'] !== undefined);
  require('no shared table case renders two tables, so leaking attributes, modifiers or sections between instances would pass', (
    entry,
  ) => Array.isArray(entry.group) && entry.group.length >= 2);
  require('no shared table case puts a consumer control in a body cell', (entry) =>
    slot(entry, 'body')?.control === true);
  require('no shared table case renders a hostile caption', (entry) =>
    String(props(entry).caption ?? '').includes('<'));

  for (const entry of cases) {
    if (!entry.id?.startsWith('table/')) {
      violations.push(`${entry.id} is not a table case, so it cannot count towards table coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!TABLE_SLOTS.includes(name)) {
        violations.push(
          `${entry.id} declares a [${name}] slot, and VfTable has only caption, header, default and footer`,
        );
      }
    }
    if ((entry.consumerInteractive ?? 0) !== consumerFocusable(entry)) {
      violations.push(
        `${entry.id} renders ${consumerFocusable(entry)} consumer focusable element(s) but declares consumerInteractive ${entry.consumerInteractive ?? 0}`,
      );
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['an empty table', (entry) => sections(entry).length === 0],
    ['head and foot without a body', (entry) => only(entry, ['header', 'footer'])],
    ['a caption', (entry) => present(props(entry).caption)],
    ...MODIFIERS.map((name) => [`the ${name} modifier`, (entry) => props(entry)[name] === true]),
    ['consumer attributes on the wrapper', (entry) => attrs(entry).class !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate))
      violations.push(`no table screenshot renders ${what}, so its geometry could move unseen`);
  }

  return violations;
}
