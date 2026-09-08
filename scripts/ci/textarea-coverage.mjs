// What the shared VfTextarea catalog has to prove, read as semantics.
//
// Built on the M10.1 model the later slices reuse: nothing here is satisfied by
// a case merely existing, by a case being named a particular thing, or by a
// gesture being performed without a declared outcome.
//
// VfTextarea's own risk is that almost everything it does is invisible. The
// value lives in a property rather than in markup, the filled signal goes to a
// component that is not this one, and the relationships come from the field
// around it. A catalog that stopped exercising any of those would still render
// a perfectly ordinary textarea, which is why the rules below are mostly about
// state and relationships rather than appearance.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const field = (entry) => entry.field ?? null;
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const drives = (entry, action) => stepsOf(entry).some((step) => step.action === action);
const typed = (entry) => stepsOf(entry).find((step) => step.action === 'typeTextarea')?.value;

/** Documented sizes, which the catalog must exercise in full. */
export const DOCUMENTED_SIZES = ['sm', 'md', 'lg'];

/**
 * Every way the VfTextarea catalog's coverage can be eroded.
 *
 * @param {Array<object>} cases The whole catalog.
 * @returns {string[]} One message per broken rule; empty means covered.
 */
export function textareaCoverageViolations(cases) {
  const violations = [];
  const scenarios = cases.filter((entry) => entry.interaction);
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ the value
  require('no shared case renders an empty control', (entry) => props(entry).modelValue === undefined);
  require('no shared case renders a value', (entry) =>
    typeof props(entry).modelValue === 'string' && props(entry).modelValue !== '');
  // A single-line value would not distinguish a textarea from an input.
  require('no shared case renders a multiline value, which is the only thing that makes this a textarea', (entry) =>
    typeof props(entry).modelValue === 'string' && props(entry).modelValue.includes('\n'));
  // The value travels as element text on the server, so a value containing
  // markup is the case that proves it is escaped rather than parsed.
  require('no shared case renders a value containing markup characters, so escaping is never compared', (entry) =>
    typeof props(entry).modelValue === 'string' && /[<>&"]/.test(props(entry).modelValue));
  require('no shared case renders a whitespace-only value, so the length-not-content filled rule is never compared', (
    entry,
  ) =>
    typeof props(entry).modelValue === 'string' &&
    props(entry).modelValue.trim() === '' &&
    props(entry).modelValue !== '');

  // ----------------------------------------------------------------- sizes
  for (const size of DOCUMENTED_SIZES) {
    require(`no shared case renders the ${size} size`, (entry) => props(entry).size === size);
  }
  require('no shared case leaves size unset, so the default is never compared', (entry) =>
    props(entry).size === undefined);

  // ----------------------------------------------------- native attributes
  for (const [name, message] of [
    ['rows', 'no shared case sets an explicit row count'],
    ['placeholder', 'no shared case sets a placeholder'],
    ['disabled', 'no shared case renders a disabled control'],
    ['readonly', 'no shared case renders a readonly control'],
    ['required', 'no shared case renders a required control'],
    ['maxlength', 'no shared case sets a length limit'],
    ['name', 'no shared case sets a form name'],
    ['class', 'no shared case forwards a consumer class'],
    ['style', 'no shared case forwards a consumer style'],
    ['aria-label', 'no shared case sets a consumer accessible name'],
  ]) {
    require(message, (entry) => attrs(entry)[name] !== undefined);
  }
  require('no shared case forwards a data attribute', (entry) =>
    Object.keys(attrs(entry)).some((name) => name.startsWith('data-')));
  require('no shared case sets the invalid prop', (entry) => props(entry).invalid === true);

  // ------------------------------------------------------ field composition
  require('no shared case wraps the control in a field', (entry) => field(entry) !== null);
  require('no shared case renders a top-placed field label', (entry) =>
    field(entry)?.label !== undefined && field(entry)?.placement !== 'floating');
  require('no shared case renders a floating field', (entry) => field(entry)?.placement === 'floating');
  require('no shared case renders a floating field holding a value', (entry) =>
    field(entry)?.placement === 'floating' &&
    typeof props(entry).modelValue === 'string' &&
    props(entry).modelValue !== '');
  require('no shared case renders a field description', (entry) => field(entry)?.description !== undefined);
  require('no shared case renders a field error', (entry) => field(entry)?.error !== undefined);
  require('no shared case renders a field description and error together, which is the only case that proves their order', (
    entry,
  ) => field(entry)?.description !== undefined && field(entry)?.error !== undefined);
  require('no shared case renders a required field', (entry) => field(entry)?.required === true);

  // --------------------------------------------------------------- scenarios
  // Fail closed: a scenario with no declared outcome proves nothing below.
  for (const entry of scenarios) {
    if (Object.keys(expectOf(entry)).length === 0) {
      violations.push(`${entry.id} drives the component but declares no expected outcome`);
    }
  }

  const proves = (message, predicate) => {
    if (!scenarios.some(predicate)) violations.push(message);
  };

  proves(
    'no shared case proves that clicking the field label focuses its control',
    (entry) => drives(entry, 'clickLabel') && expectOf(entry).focusRole === 'control',
  );
  proves(
    'no shared case focuses the control directly',
    (entry) => drives(entry, 'focusTextarea') && expectOf(entry).focusRole === 'control',
  );
  proves(
    'no shared case proves that typing moves the field from empty to filled',
    (entry) => typed(entry) !== undefined && typed(entry) !== '' && expectOf(entry).filled === true,
  );
  proves(
    'no shared case proves that typing several lines keeps every newline',
    (entry) =>
      typeof typed(entry) === 'string' && typed(entry).includes('\n') && expectOf(entry).value === typed(entry),
  );
  proves(
    'no shared case proves that emptying a filled control returns the field to empty',
    (entry) => typed(entry) === '' && expectOf(entry).filled === false,
  );
  proves(
    'no shared case proves that focus leaves the control without losing the filled state',
    (entry) => drives(entry, 'blurTextarea') && expectOf(entry).filled === true,
  );
  // The inert half: an uneditable control must be proved uneditable, and the
  // two kinds of uneditable differ - readonly still takes focus.
  proves(
    'no shared case proves that a disabled control cannot be typed into',
    (entry) => attrs(entry).disabled === true && typed(entry) !== undefined && expectOf(entry).value === '',
  );
  proves(
    'no shared case proves that a readonly control keeps its value and still takes focus',
    (entry) =>
      attrs(entry).readonly === true &&
      typed(entry) !== undefined &&
      expectOf(entry).focusRole === 'control' &&
      expectOf(entry).value !== '',
  );

  return violations;
}
