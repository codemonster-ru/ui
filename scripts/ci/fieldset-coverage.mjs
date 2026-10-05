// What the VfFieldset catalog has to prove, read as semantics.
//
// Three optional parts, each opened by a prop (JavaScript truthiness) or a
// slot (presence), an invalid rule with two inputs, a relationship graph the
// fieldset writes onto itself, native attributes it must leave native, and a
// neighbour - VfGroupBox - whose markup looks enough like this one to be
// copied. Each rule below names the case shape that proves one of those, so a
// catalog padded with composed cases cannot hide the loss of the case that
// carried a rule.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const emptySlot = (entry, name) => hasSlot(entry, name) && slot(entry, name).text === '' && !slot(entry, name).markup;
const present = (value) => typeof value === 'string' && value !== '';
const has = (entry, part) => present(props(entry)[part]) || hasSlot(entry, part);
const bare = (entry) => !has(entry, 'label') && !has(entry, 'description') && !has(entry, 'error');
const controlsIn = (entry) => {
  const controls = slot(entry, 'body')?.controls;
  return controls === 'input-and-button' || controls === 'radios' ? 2 : 0;
};

const FIELDSET_SLOTS = ['label', 'description', 'error', 'body'];

/** Every way the VfFieldset catalog's coverage can be eroded. */
export function fieldsetCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  require('no shared fieldset case renders a bare fieldset with no legend, no paragraph and no modifier', (entry) =>
    bare(entry) && props(entry).invalid !== true && !entry.group);

  // Each part by its prop, by its slot, and as the JavaScript truthiness edge.
  for (const part of ['label', 'description', 'error']) {
    require(`no shared fieldset case renders the ${part} prop alone`, (entry) =>
      present(props(entry)[part]) && !hasSlot(entry, part) && props(entry)[part] !== '0');
    require(`no shared fieldset case passes an empty ${part}, so nothing proves "" opens nothing`, (entry) =>
      props(entry)[part] === '' && !hasSlot(entry, part));
    require(`no shared fieldset case renders a ${part} slot without its prop`, (entry) =>
      hasSlot(entry, part) && !emptySlot(entry, part) && props(entry)[part] === undefined);
  }
  require('no shared fieldset case passes the label "0", so PHP truthiness could drop it unseen', (entry) =>
    props(entry).label === '0');
  require('no shared fieldset case passes the error "0", so nothing proves "0" is invalid', (entry) =>
    props(entry).error === '0');

  // Slot precedence and fallback.
  require('no shared fieldset case passes both a label prop and a label slot, so nothing proves the slot wins', (
    entry,
  ) => present(props(entry).label) && hasSlot(entry, 'label') && !emptySlot(entry, 'label'));
  require('no shared fieldset case passes an empty label slot over a label prop, so nothing proves the prop is the fallback', (
    entry,
  ) => present(props(entry).label) && emptySlot(entry, 'label'));
  require('no shared fieldset case passes an empty label slot with no prop, so nothing proves presence opens an empty legend', (
    entry,
  ) => props(entry).label === undefined && emptySlot(entry, 'label'));
  require('no shared fieldset case passes an empty description slot over its prop', (entry) =>
    present(props(entry).description) && emptySlot(entry, 'description'));
  require('no shared fieldset case passes an empty error slot alone, so nothing proves an empty error slot is invalid', (
    entry,
  ) => props(entry).error === undefined && emptySlot(entry, 'error') && props(entry).invalid !== true);

  // The invalid rule.
  require('no shared fieldset case sets invalid without an error, so nothing proves invalid is a class and nothing else', (
    entry,
  ) => props(entry).invalid === true && !has(entry, 'error'));
  require('no shared fieldset case sets invalid=false beside an error, so nothing proves an error is invalid on its own', (
    entry,
  ) => props(entry).invalid === false && present(props(entry).error));

  // The relationship graph.
  require('no shared fieldset case renders a description and an error together, so their order in aria-describedby is never compared', (
    entry,
  ) => has(entry, 'description') && has(entry, 'error'));
  require('no shared fieldset case forwards a consumer aria-describedby over a computed one, so nothing proves it replaces it', (
    entry,
  ) => attrs(entry)['aria-describedby'] !== undefined && (has(entry, 'description') || has(entry, 'error')));
  require('no shared fieldset case passes aria-describedby explicitly as nothing, so nothing proves it erases the computed value', (
    entry,
  ) =>
    Object.hasOwn(attrs(entry), 'aria-describedby') &&
    attrs(entry)['aria-describedby'] === null &&
    (has(entry, 'description') || has(entry, 'error')));
  require('no shared fieldset case forwards a consumer aria-describedby alone', (entry) =>
    attrs(entry)['aria-describedby'] !== undefined && bare(entry));
  require('no shared fieldset case renders two fieldsets with a description and an error each, so cross-wired ids would pass', (
    entry,
  ) =>
    Array.isArray(entry.group) &&
    entry.group.length >= 2 &&
    entry.group.every((member) => present(member.description) && present(member.error)));

  // Native and consumer attributes.
  require('no shared fieldset case disables the fieldset natively around consumer controls', (entry) =>
    attrs(entry).disabled === true && controlsIn(entry) > 0);
  require('no shared fieldset case forwards form and name as native attributes', (entry) =>
    attrs(entry).form !== undefined && attrs(entry).name !== undefined);
  require('no shared fieldset case forwards a consumer class, style, id and data attribute together', (entry) =>
    ['class', 'style', 'id'].every((name) => attrs(entry)[name] !== undefined) &&
    Object.keys(attrs(entry)).some((name) => name.startsWith('data-')));
  require('no shared fieldset case forwards a consumer role and aria-invalid, so the fieldset writing its own would pass', (
    entry,
  ) => attrs(entry).role !== undefined && attrs(entry)['aria-invalid'] !== undefined);

  // Content and the group box.
  require('no shared fieldset case puts consumer controls in the body', (entry) =>
    slot(entry, 'body')?.controls === 'input-and-button');
  require('no shared fieldset case puts a radio group in the body', (entry) =>
    slot(entry, 'body')?.controls === 'radios');
  require('no shared fieldset case renders the group box shape - a label around plain content - so a group box port would pass', (
    entry,
  ) =>
    present(props(entry).label) &&
    typeof slot(entry, 'body')?.text === 'string' &&
    !has(entry, 'description') &&
    !has(entry, 'error') &&
    props(entry).invalid === undefined &&
    Object.keys(attrs(entry)).length === 0);
  require('no shared fieldset case renders hostile text', (entry) =>
    ['label', 'description', 'error'].some((part) => String(props(entry)[part] ?? '').includes('<')));

  for (const entry of cases) {
    if (!entry.id?.startsWith('fieldset/')) {
      violations.push(`${entry.id} is not a fieldset case, so it cannot count towards fieldset coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!FIELDSET_SLOTS.includes(name)) {
        violations.push(
          `${entry.id} declares a [${name}] slot, and VfFieldset has only label, description, error and default`,
        );
      }
    }
    // The static snapshot is asserted against this number, so it must be the
    // number of controls the fixture actually renders.
    if ((entry.consumerInteractive ?? 0) !== controlsIn(entry)) {
      violations.push(
        `${entry.id} renders ${controlsIn(entry)} consumer control(s) but declares consumerInteractive ${entry.consumerInteractive ?? 0}`,
      );
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['a bare fieldset', (entry) => bare(entry) && props(entry).invalid !== true],
    ['a legend', (entry) => present(props(entry).label)],
    ['a description', (entry) => present(props(entry).description)],
    ['an error', (entry) => present(props(entry).error)],
    ['invalid without an error', (entry) => props(entry).invalid === true && !has(entry, 'error')],
    ['consumer controls', (entry) => controlsIn(entry) > 0],
    ['a disabled fieldset', (entry) => attrs(entry).disabled === true],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate))
      violations.push(`no fieldset screenshot renders ${what}, so its geometry could move unseen`);
  }

  return violations;
}
