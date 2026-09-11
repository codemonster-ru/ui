// What the VfAlert catalog has to prove, read as semantics.
//
// The first coverage module written for a component that owns a semantic role
// and - the M19 finding - owns no interaction. So the module has three halves:
//
//   - the ordinary half: every tone, each title state alone and in
//     combination, each icon state, the consumer attribute contract;
//   - the accessibility half: the role the component writes must be measured
//     on a case with no consumer ARIA at all, a consumer role must be shown
//     replacing it, and consumer live-region attributes must be shown
//     travelling beside it. A catalog whose every case carried a consumer role
//     would never measure the component's own;
//   - the ownership half: consumer controls in the two slots that render
//     content, and a declared budget that agrees with the fixtures. There is
//     no "dismissible" rule and no "dismiss present" rule, because the
//     reference has no dismiss control; what there is instead is a refusal to
//     let a case buy one - by naming a prop the component does not have, or by
//     declaring a control in a slot that cannot reach the DOM.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const hasTitle = (entry) => Boolean(props(entry).title) || hasSlot(entry, 'title');
/** A slot that renders nothing: no text, no markup shape, no control. */
const rendersNothing = (entry, name) =>
  hasSlot(entry, name) &&
  slot(entry, name).text === '' &&
  slot(entry, name).markup === undefined &&
  slot(entry, name).control === undefined;
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key === 'role' || key.startsWith('aria-'));

/** Every way the VfAlert catalog's coverage can be eroded. */
export function alertCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------------- tone
  //
  // Every tone, and each on a case with a title and content so the glyph, the
  // surface and the icon colour are all measured. Primary is the default and
  // is required both explicitly and by absence.
  for (const tone of TONES) {
    require(`no shared alert case renders the ${tone} tone with a title and content`, (entry) =>
      (props(entry).tone ?? 'primary') === tone && hasTitle(entry) && hasSlot(entry, 'body'));
  }
  require('no shared alert case renders the default tone by omitting the prop, so the default itself is never measured', (
    entry,
  ) => props(entry).tone === undefined);
  require('no shared alert case renders the neutral tone, whose modifier no stylesheet defines and whose class list is the only thing that separates it from primary', (
    entry,
  ) => props(entry).tone === 'neutral');

  // --------------------------------------------------------------- the role
  //
  // The component's own role can only be measured on a case that forwards no
  // consumer ARIA at all. And it has to be measured on more than one tone,
  // because "tone never changes the role" is a claim about every tone.
  require("no shared alert case renders without any consumer ARIA, so the section's own role is never measured", (
    entry,
  ) => !hasConsumerAria(entry));
  require('no shared alert case renders the danger tone without consumer ARIA, so "danger is still role=alert" is assumed rather than measured', (
    entry,
  ) => props(entry).tone === 'danger' && !hasConsumerAria(entry));
  require('no shared alert case renders the info tone without consumer ARIA, so "info is not a status" is assumed rather than measured', (
    entry,
  ) => props(entry).tone === 'info' && !hasConsumerAria(entry));
  require('no shared alert case forwards a consumer role, so nothing proves it replaces the component role rather than duplicating it', (
    entry,
  ) => attrs(entry).role !== undefined);
  require('no shared alert case forwards consumer live-region attributes, so nothing proves they travel beside the component role', (
    entry,
  ) => attrs(entry)['aria-live'] !== undefined && attrs(entry)['aria-atomic'] !== undefined);
  require('no shared alert case forwards a consumer accessible name', (entry) =>
    attrs(entry)['aria-label'] !== undefined);

  // ------------------------------------------------------------------ title
  require('no shared alert case renders an empty alert, so nothing proves the body wrapper is unconditional', (entry) =>
    !hasTitle(entry) && !hasSlot(entry, 'body') && !hasSlot(entry, 'icon') && props(entry).hideIcon !== true);
  require('no shared alert case renders the default slot alone', (entry) =>
    hasSlot(entry, 'body') && !hasTitle(entry) && !hasSlot(entry, 'icon') && props(entry).hideIcon !== true);
  require('no shared alert case renders a title alone', (entry) =>
    Boolean(props(entry).title) && !hasSlot(entry, 'title') && !hasSlot(entry, 'body') && !hasSlot(entry, 'icon'));
  require('no shared alert case renders a title slot alone, with no prop', (entry) =>
    hasSlot(entry, 'title') && !props(entry).title && Boolean(slot(entry, 'title').text));
  require('no shared alert case passes both a title and a title slot, so nothing proves the slot suppresses the prop text', (
    entry,
  ) => Boolean(props(entry).title) && Boolean(slot(entry, 'title')?.text));
  require('no shared alert case passes a title slot that renders nothing with a title, so nothing proves the prop text comes back', (
    entry,
  ) => rendersNothing(entry, 'title') && Boolean(props(entry).title));
  require('no shared alert case passes a title slot that renders nothing with an empty prop, so the empty paragraph is never rendered', (
    entry,
  ) => rendersNothing(entry, 'title') && props(entry).title === '');
  require('no shared alert case passes an empty-string title alone, so nothing proves it renders no paragraph rather than an empty one', (
    entry,
  ) => props(entry).title === '' && !hasSlot(entry, 'title'));
  require('no shared alert case renders hostile title text', (entry) =>
    typeof props(entry).title === 'string' && props(entry).title.includes('<'));

  // ------------------------------------------------------------------- icon
  require('no shared alert case passes an explicit icon, so nothing proves it replaces the tone glyph', (entry) =>
    props(entry).icon !== undefined && props(entry).hideIcon !== true);
  require('no shared alert case passes an icon slot with content, so nothing proves it replaces the glyph inside the decorative container', (
    entry,
  ) => Boolean(slot(entry, 'icon')?.text) && props(entry).hideIcon !== true);
  require('no shared alert case passes an icon slot that renders nothing, so nothing proves the glyph comes back', (
    entry,
  ) => rendersNothing(entry, 'icon') && props(entry).hideIcon !== true);
  require('no shared alert case hides the icon with a title and content', (entry) =>
    props(entry).hideIcon === true && hasTitle(entry) && hasSlot(entry, 'body'));
  require('no shared alert case hides the icon on an otherwise empty alert, where the single-column grid is the only thing visible', (
    entry,
  ) => props(entry).hideIcon === true && !hasTitle(entry) && !hasSlot(entry, 'body') && !hasSlot(entry, 'icon'));
  require('no shared alert case hides the icon while passing an icon slot, so nothing proves the slot is discarded with the container', (
    entry,
  ) => props(entry).hideIcon === true && hasSlot(entry, 'icon'));

  // ---------------------------------------------------------------- content
  require('no shared alert case passes an empty default slot, so nothing proves the body wrapper renders regardless', (
    entry,
  ) => rendersNothing(entry, 'body'));
  require('no shared alert case puts several root-level nodes in the default slot', (entry) =>
    slot(entry, 'body')?.markup !== undefined);
  require('no shared alert case carries long content, so the body max-width and the icon alignment are never exercised', (
    entry,
  ) => (slot(entry, 'body')?.text ?? '').length >= 160);

  // ------------------------------------------------------------------ attrs
  require('no shared alert case forwards a consumer class, so nothing proves the canonical classes come first', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared alert case forwards a consumer class at the default tone, with no modifier to follow', (entry) =>
    attrs(entry).class !== undefined && props(entry).tone === undefined);
  require('no shared alert case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared alert case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));

  // -------------------------------------------------------------- ownership
  //
  // Consumer controls in both slots that render content. There is no case
  // with a component-owned control, because there is no such control; every
  // case therefore proves the component-owned count is zero, and these two
  // prove that a consumer's control is counted as the consumer's.
  require('no shared alert case puts a consumer control in the default slot, so the static snapshot never has to tell consumer interaction from component interaction', (
    entry,
  ) => slot(entry, 'body')?.control !== undefined);
  require('no shared alert case puts a consumer control in the title slot, so slot ownership is proved by one slot alone', (
    entry,
  ) => slot(entry, 'title')?.control !== undefined);
  require('no shared alert case puts a consumer control in an alert with the icon hidden, so the ownership measurement is only ever taken with the container present', (
    entry,
  ) => slot(entry, 'body')?.control !== undefined && props(entry).hideIcon === true);

  // The declaration the static snapshot is asserted against has to match the
  // controls the fixtures actually render, or a case could declare a budget of
  // two and hide a component-grown dismiss button inside it. A control in the
  // icon slot never counts: the container is aria-hidden, and with hideIcon it
  // does not exist at all, so declaring a budget for one would be a fiction.
  for (const entry of cases) {
    if (slot(entry, 'icon')?.control !== undefined) {
      violations.push(
        `${entry.id} puts a control in the icon slot, which is aria-hidden and removed by hideIcon; the static ` +
          'budget would count a control assistive technology cannot reach',
      );
    }

    const rendered = ['title', 'body'].filter((name) => slot(entry, name)?.control !== undefined).length;
    const declared = entry.consumerInteractive ?? 0;

    if (rendered !== declared) {
      violations.push(
        `${entry.id} renders ${rendered} consumer control(s) but declares consumerInteractive ${declared}; ` +
          'the static snapshot is asserted against the declaration, so the two must agree',
      );
    }
  }

  for (const entry of cases) {
    if (!entry.id?.startsWith('alert/')) {
      violations.push(`${entry.id} is not an alert case, so it cannot count towards alert coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!['icon', 'title', 'body'].includes(name)) {
        violations.push(`${entry.id} declares a [${name}] slot, and VfAlert has only icon, title and default`);
      }
    }
    // The prop a completed alert would have, and the reference does not. A
    // case naming it is a case written for a component that does not exist,
    // and a budget declared under it would be the cover a grown button needs.
    for (const name of ['dismissible', 'dismissable', 'closable', 'closeable']) {
      if (props(entry)[name] !== undefined) {
        violations.push(
          `${entry.id} declares the ${name} prop, which VfAlert does not have; there is no dismiss control to configure`,
        );
      }
    }
    if (props(entry).tone !== undefined && !TONES.includes(props(entry).tone)) {
      violations.push(`${entry.id} declares tone ${JSON.stringify(props(entry).tone)}, which is not a feedback tone`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['an empty alert', (entry) => !hasTitle(entry) && !hasSlot(entry, 'body') && props(entry).hideIcon !== true],
    ...TONES.map((tone) => [`the ${tone} tone`, (entry) => (props(entry).tone ?? 'primary') === tone]),
    ['a hidden icon', (entry) => props(entry).hideIcon === true],
    ['an explicit icon', (entry) => props(entry).icon !== undefined],
    ['a consumer icon slot', (entry) => Boolean(slot(entry, 'icon')?.text)],
    ['a title slot', (entry) => Boolean(slot(entry, 'title')?.text)],
    [
      'an empty title paragraph, where a wrongly suppressed paragraph would show as a lost row of the content gap',
      (entry) => rendersNothing(entry, 'title') && props(entry).title === '',
    ],
    ['long content', (entry) => (slot(entry, 'body')?.text ?? '').length >= 160],
    ['consumer slot content that is interactive', (entry) => slot(entry, 'body')?.control !== undefined],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no alert screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
