// What the three checkable catalogs have to prove, read as semantics.
//
// Three rule sets in one file, sharing a couple of one-line predicates and
// nothing else. That mirrors the components: they look alike and are not alike,
// so a single "choice control" rule set would have had to be satisfied by
// whichever component happened to have the state - which is exactly the
// substitution the M10.1 model exists to prevent.
//
// The rules that matter most are the ones nothing else would notice. A checkbox
// whose indeterminate stopped working still renders a checkbox. A radio group
// that lost mutual exclusion still renders two radios. A switch that stopped
// calling itself a switch still toggles.
//
// Violations are returned rather than asserted so a test can drive these with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const drives = (entry, action) => stepsOf(entry).some((step) => step.action === action);
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);

/** Sizes every one of the three renders, including the default. */
export const DOCUMENTED_SIZES = ['sm', 'md', 'lg'];

/** Rules every checkable catalog shares, because all three have these states. */
function commonViolations(cases, name) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  for (const size of DOCUMENTED_SIZES) {
    require(`no shared case renders the ${size} size`, (entry) => props(entry).size === size);
  }
  require('no shared case renders a disabled control', (entry) => props(entry).disabled === true);
  require('no shared case renders an invalid control', (entry) => props(entry).invalid === true);
  require('no shared case renders a label', (entry) => props(entry).label !== undefined);
  require('no shared case renders a control without a label', (entry) => props(entry).label === undefined);
  require('no shared case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared case forwards a data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared case forwards a native attribute', (entry) =>
    ['name', 'required', 'value'].some((key) => attrs(entry)[key] !== undefined));

  // Fail closed: a scenario with no declared outcome proves nothing below.
  for (const entry of cases.filter((candidate) => candidate.interaction)) {
    if (Object.keys(expectOf(entry)).length === 0) {
      violations.push(`${entry.id} drives the component but declares no expected outcome`);
    }
  }

  const scenarios = cases.filter((entry) => entry.interaction);
  if (!scenarios.some((entry) => drives(entry, 'clickCheckable') && expectOf(entry).liveChecked === true)) {
    violations.push(`no shared ${name} case proves that a real pointer click checks the control`);
  }
  if (!scenarios.some((entry) => drives(entry, 'clickCheckableContent') && expectOf(entry).liveChecked === true)) {
    violations.push(`no shared ${name} case proves that clicking the label reaches the control`);
  }
  if (
    !scenarios.some(
      (entry) =>
        props(entry).disabled === true && drives(entry, 'clickCheckable') && expectOf(entry).liveChecked === false,
    )
  ) {
    violations.push(`no shared ${name} case proves that a disabled control refuses the pointer`);
  }

  return violations;
}

/** Every way the VfCheckbox catalog's coverage can be eroded. */
export function checkboxCoverageViolations(cases) {
  const violations = commonViolations(cases, 'checkbox');
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const scenarios = cases.filter((entry) => entry.interaction);

  require('no shared case renders a checked checkbox', (entry) => props(entry).modelValue === true);
  require('no shared case renders an unchecked checkbox', (entry) => props(entry).modelValue === undefined);
  // The state that exists only as a DOM property, and the only reason this
  // component needs a browser at all.
  require('no shared case renders an indeterminate checkbox', (entry) => props(entry).indeterminate === true);
  require('no shared case renders indeterminate together with a checked model, which is the only case that proves mixed wins', (
    entry,
  ) => props(entry).indeterminate === true && props(entry).modelValue === true);
  require('no shared case sets a consumer accessible name', (entry) => attrs(entry)['aria-label'] !== undefined);

  if (!scenarios.some((entry) => presses(entry, ' ') && expectOf(entry).liveChecked === true)) {
    violations.push('no shared checkbox case proves that Space checks the control');
  }
  if (
    !scenarios.some(
      (entry) => props(entry).disabled === true && presses(entry, ' ') && expectOf(entry).liveChecked === false,
    )
  ) {
    violations.push('no shared checkbox case proves that a disabled control refuses Space');
  }
  if (!scenarios.some((entry) => drives(entry, 'clickCheckable') && expectOf(entry).liveChecked === false)) {
    violations.push('no shared checkbox case proves that clicking a checked box unchecks it');
  }
  if (!scenarios.some((entry) => props(entry).indeterminate === true && expectOf(entry).liveIndeterminate === false)) {
    violations.push('no shared checkbox case proves that clicking an indeterminate box resolves it');
  }

  return violations;
}

/** Every way the VfRadio catalog's coverage can be eroded. */
export function radioCoverageViolations(cases) {
  const violations = commonViolations(cases, 'radio');
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const scenarios = cases.filter((entry) => entry.interaction);
  const groups = cases.filter((entry) => Array.isArray(entry.group));

  require('no shared case renders a selected radio', (entry) =>
    props(entry).value !== undefined && props(entry).modelValue === props(entry).value);
  require('no shared case renders an unselected radio', (entry) =>
    props(entry).value !== undefined && props(entry).modelValue === undefined);
  // The quirk that makes 1 and '1' different radios.
  require('no shared case proves the selection comparison is strict rather than loose', (entry) =>
    props(entry).value !== undefined &&
    props(entry).modelValue !== undefined &&
    props(entry).value !== props(entry).modelValue &&
    String(props(entry).value) === String(props(entry).modelValue));

  // A radio's contract is a group contract; testing one in isolation proves
  // nothing about mutual exclusion.
  if (groups.length === 0) {
    violations.push('no shared radio case renders a real group, so mutual exclusion is never compared');
  }
  if (!groups.some((entry) => entry.group.some((member) => member.modelValue === member.value))) {
    violations.push('no shared radio group starts with a member selected');
  }
  if (!groups.some((entry) => entry.group.some((member) => member.disabled === true))) {
    violations.push('no shared radio group contains a disabled member');
  }
  if (
    !scenarios.some(
      (entry) =>
        Array.isArray(entry.group) &&
        expectOf(entry).groupCheckedCount === 1 &&
        expectOf(entry).groupChecked !== undefined,
    )
  ) {
    violations.push('no shared radio case proves that choosing one member unselects the others');
  }

  return violations;
}

/** Every way the VfSwitch catalog's coverage can be eroded. */
export function switchCoverageViolations(cases) {
  const violations = commonViolations(cases, 'switch');
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const scenarios = cases.filter((entry) => entry.interaction);

  require('no shared case renders an on switch', (entry) => props(entry).modelValue === true);
  require('no shared case renders an off switch', (entry) => props(entry).modelValue === undefined);
  // The two props no other checkable control has.
  require('no shared case renders the static presentation', (entry) => props(entry).static === true);
  require('no shared case renders a non-auto thumb contrast', (entry) =>
    props(entry).thumbContrast !== undefined && props(entry).thumbContrast !== 'auto');
  require('no shared case renders thumb slot content', (entry) => entry.content?.thumb !== undefined);
  // The VNode walk that distinguishes this component from VfCheckbox.
  require('no shared case renders a whitespace-only slot, so the content rule is never compared', (entry) =>
    typeof entry.content?.label === 'string' && entry.content.label.trim() === '');

  if (!scenarios.some((entry) => presses(entry, ' ') && expectOf(entry).liveChecked === true)) {
    violations.push('no shared switch case proves that Space toggles the control');
  }
  if (!scenarios.some((entry) => drives(entry, 'clickCheckable') && expectOf(entry).liveChecked === false)) {
    violations.push('no shared switch case proves that clicking an on switch turns it off');
  }

  return violations;
}
