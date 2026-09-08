// What the shared VfButton catalog has to prove, read as semantics.
//
// Built on the M10.1 lesson rather than repeating the mistake it fixed. That
// guard asserted a key was pressed somewhere, which the disabled case satisfied
// while proving the opposite, and a count floor was the only thing that noticed
// when the real case was deleted. So nothing here is satisfied by a case merely
// existing, by a case being named a particular thing, or by a gesture being
// performed without a declared outcome.
//
// VfButton's own risk is that it looks trivial. A button whose loading state
// stopped disabling it renders identically and is operable again, so the rules
// that matter most are the ones pinning what a case *proves* about activation.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const outcome = (entry) => entry.interaction?.expect?.activates;

/** Enabled means the case is neither disabled by attribute nor loading. */
const isEnabled = (entry) => attrs(entry).disabled !== true && props(entry).loading !== true;
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);
const pressesAnyKey = (entry) => stepsOf(entry).some((step) => step.action === 'pressKey');
const clicks = (entry) => stepsOf(entry).some((step) => step.action === 'clickButton');

/** A case can only claim an activation if it drives something that activates. */
const canActivate = (entry) => clicks(entry) || presses(entry, 'Enter') || presses(entry, ' ');

/** Documented values, which the catalog must exercise in full. */
export const DOCUMENTED_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warn',
  'help',
  'danger',
  'contrast',
  'ghost',
];
export const DOCUMENTED_SIZES = ['sm', 'md', 'lg'];

/**
 * Every way the VfButton catalog's coverage can be eroded.
 *
 * @param {Array<object>} cases The whole catalog.
 * @returns {string[]} One message per broken rule; empty means covered.
 */
export function buttonCoverageViolations(cases) {
  const violations = [];
  const scenarios = cases.filter((entry) => entry.interaction);
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------ variants and sizes
  for (const variant of DOCUMENTED_VARIANTS) {
    require(`no shared case renders the ${variant} variant`, (entry) =>
      (props(entry).variant ?? 'primary') === variant);
  }
  for (const size of DOCUMENTED_SIZES) {
    require(`no shared case renders the ${size} size`, (entry) => props(entry).size === size);
  }
  // md is the default and emits no modifier, so a case that omits size entirely
  // is what proves the default path, not the case that names it.
  require('no shared case leaves size unset, so the default is never compared', (entry) =>
    props(entry).size === undefined);

  // ----------------------------------------------------------------- states
  require('no shared case renders a block button', (entry) => props(entry).block === true);
  require('no shared case renders a disabled button', (entry) => attrs(entry).disabled === true);
  require('no shared case renders a loading button', (entry) => props(entry).loading === true);
  require('no shared case overrides the rendered type', (entry) => props(entry).type !== undefined);

  // ------------------------------------------------------ attrs and content
  require('no shared case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared case forwards a consumer style', (entry) => attrs(entry).style !== undefined);
  require('no shared case forwards a native attribute', (entry) =>
    ['name', 'value'].some((name) => attrs(entry)[name] !== undefined));
  require('no shared case forwards a data attribute', (entry) =>
    Object.keys(attrs(entry)).some((name) => name.startsWith('data-')));
  require('no shared case sets a consumer accessible name', (entry) => attrs(entry)['aria-label'] !== undefined);
  require('no shared case renders label text', (entry) => entry.content?.label !== undefined);
  require('no shared case composes an icon into the slot', (entry) => entry.content?.icon !== undefined);
  // An icon with no label is the only case where the accessible name cannot
  // come from the content, so it is the one that proves aria-label carries it.
  require('no shared case renders an icon-only button named by aria-label', (entry) =>
    entry.content?.icon !== undefined &&
    entry.content?.label === undefined &&
    attrs(entry)['aria-label'] !== undefined);

  // -------------------------------------------------------------- scenarios
  // Fail closed: a scenario with no declared outcome proves nothing below, so
  // dropping the field must not be a quiet way to opt out of being counted.
  for (const entry of scenarios) {
    if (typeof outcome(entry) !== 'boolean') {
      violations.push(`${entry.id} drives the component but declares no expected activation outcome`);
    }
  }

  // A disabled or loading control is the inert half of the contract. Letting
  // one claim an activation is how it could stand in for an enabled case.
  for (const entry of scenarios.filter((candidate) => outcome(candidate) === true)) {
    if (!isEnabled(entry)) violations.push(`${entry.id} is not operable but claims it activates`);
    if (!canActivate(entry)) violations.push(`${entry.id} claims it activates but drives no activating input`);
  }

  const proves = (label, predicate) => {
    if (!scenarios.some((entry) => isEnabled(entry) && outcome(entry) === true && predicate(entry))) {
      violations.push(`no shared case proves that ${label} activates an enabled button`);
    }
  };

  proves('a real pointer click', clicks);
  proves('Enter', (entry) => presses(entry, 'Enter'));
  proves('Space', (entry) => presses(entry, ' '));

  const refuses = (label, message, predicate) => {
    if (!scenarios.some((entry) => outcome(entry) === false && predicate(entry))) violations.push(message);
  };

  refuses(
    'disabled Enter',
    'no shared case proves that a disabled button refuses keyboard activation',
    (entry) => attrs(entry).disabled === true && presses(entry, 'Enter'),
  );
  refuses(
    'disabled Space',
    'no shared case proves that a disabled button refuses Space',
    (entry) => attrs(entry).disabled === true && presses(entry, ' '),
  );
  // The rule that catches a loading regression: a loading button is inert
  // because loading applies the native disabled attribute, and nothing else in
  // the catalog would notice if it stopped.
  refuses(
    'loading keyboard',
    'no shared case proves that a loading button refuses keyboard activation',
    (entry) => props(entry).loading === true && pressesAnyKey(entry),
  );

  if (!cases.some((entry) => stepsOf(entry).some((step) => step.action === 'focusButton'))) {
    violations.push('no shared case checks where focus lands');
  }

  return violations;
}
