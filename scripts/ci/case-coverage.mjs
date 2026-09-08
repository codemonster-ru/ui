// What an interaction scenario proves, rather than which keys it happens to press.
//
// The first version of this guard asserted that some case somewhere pressed
// Enter. `icon-button/interaction-disabled-keyboard` presses Enter, so deleting
// the case that proves Enter *activates* an enabled button left the assertion
// green: the catalog still contained an Enter press, it just no longer
// contained the claim. Padding the catalog back over the count floor then hid
// the deletion from the count floor, which was the only check that did fire.
//
// So coverage is read as three things together - is the control operable, what
// was driven, and what was the outcome - and the outcome is a field on the
// case. `expect.activates` is not taken on trust: scripts/parity/run.mjs
// compares it against the activation counter each target actually recorded, so
// a case claiming an activation it does not cause fails the parity gate on all
// three targets rather than widening what counts as coverage here.
//
// Violations are returned rather than asserted so that a test can drive this
// with a deliberately eroded catalog and check which rule fired.

const stepsOf = (entry) => entry.interaction?.steps ?? [];

/** `disabled` is an attribute rather than a prop, matching the rendered DOM. */
export const isEnabled = (entry) => entry.attrs?.disabled !== true;

export const presses = (entry, key) =>
  stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);

export const pressesAnyKey = (entry) => stepsOf(entry).some((step) => step.action === 'pressKey');

export const clicks = (entry) => stepsOf(entry).some((step) => step.action === 'clickButton');

export const focuses = (entry) => stepsOf(entry).some((step) => step.action === 'focusButton');

/** The declared outcome, or undefined when the case declares none. */
export const outcome = (entry) => entry.interaction?.expect?.activates;

/** A case can only claim an activation if it drives something that activates. */
export const canActivate = (entry) => clicks(entry) || presses(entry, 'Enter') || presses(entry, ' ');

/**
 * Every way the icon button's activation coverage can be eroded.
 *
 * @param {Array<object>} cases The whole catalog, not only its scenarios.
 * @returns {string[]} One message per broken rule; empty means covered.
 */
export function activationCoverageViolations(cases) {
  const violations = [];
  const scenarios = cases.filter((entry) => entry.interaction);

  // Fail closed. A scenario with no declared outcome proves nothing below, so
  // dropping the field must not be a quiet way to opt out of being counted.
  for (const entry of scenarios) {
    if (typeof outcome(entry) !== 'boolean') {
      violations.push(`${entry.id} drives the component but declares no expected activation outcome`);
    }
  }

  // A disabled control is the inert half of the contract. Letting a disabled
  // case claim an activation is exactly how the disabled Enter case would be
  // able to stand in for the enabled one again.
  for (const entry of scenarios.filter((candidate) => outcome(candidate) === true)) {
    if (!isEnabled(entry)) violations.push(`${entry.id} is disabled but claims it activates`);
    if (!canActivate(entry)) violations.push(`${entry.id} claims it activates but drives no activating input`);
  }

  const proves = (predicate) =>
    scenarios.some((entry) => isEnabled(entry) && outcome(entry) === true && predicate(entry));

  if (!proves(clicks)) violations.push('no shared case proves that a real pointer click activates an enabled button');
  if (!proves((entry) => presses(entry, 'Enter'))) {
    violations.push('no shared case proves that Enter activates an enabled button');
  }
  if (!proves((entry) => presses(entry, ' '))) {
    violations.push('no shared case proves that Space activates an enabled button');
  }

  // The negative half: a disabled button must be proved unusable by keyboard,
  // not merely rendered as disabled.
  if (!scenarios.some((entry) => !isEnabled(entry) && pressesAnyKey(entry) && outcome(entry) === false)) {
    violations.push('no shared case proves that a disabled button refuses keyboard activation');
  }

  if (!cases.some(focuses)) violations.push('no shared case checks where focus lands');

  return violations;
}
