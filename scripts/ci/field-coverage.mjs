// What the shared VfField catalog has to prove, read as semantics.
//
// Built on the M10.1 lesson rather than repeating the mistake it fixed. That
// guard asserted a key was pressed somewhere, which the disabled case satisfied
// while proving the opposite, and a count floor was the only thing that noticed
// when the real case was deleted. So nothing here is satisfied by a case merely
// existing, by a case being named a particular thing, or by a gesture being
// performed without a declared outcome.
//
// VfField's dimensions are mostly relationships, and a relationship is exactly
// what a padded catalog hides best: thirty cases that all render a label prove
// nothing about whether any label reaches its control. Each rule below names a
// dimension the component actually has, and the interaction rules additionally
// require the case to declare what it proves - checked against real browser
// behaviour by scripts/parity/run.mjs, so the declaration cannot be fiction.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const field = (entry) => entry.field ?? {};
const control = (entry) => entry.control ?? {};
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};

/** A case whose label text comes from a prop or from label slot content. */
const labelled = (entry) => field(entry).label !== undefined || entry.content?.label?.text !== undefined;
const floatingPlacement = (entry) => field(entry).placement === 'floating';
const drives = (entry, action) => stepsOf(entry).some((step) => step.action === action);

/**
 * Every way the VfField catalog's coverage can be eroded.
 *
 * @param {Array<object>} cases The whole catalog.
 * @returns {string[]} One message per broken rule; empty means covered.
 */
export function fieldCoverageViolations(cases) {
  const violations = [];
  const scenarios = cases.filter((entry) => entry.interaction);
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // -------------------------------------------------------------- structure
  require('no shared case renders a field with no label at all', (entry) => !labelled(entry));
  require('no shared case renders a plain top label', (entry) => labelled(entry) && !floatingPlacement(entry));
  require('no shared case renders a floating label', (entry) => labelled(entry) && floatingPlacement(entry));
  require('no shared case takes its label from slot content rather than the prop', (entry) =>
    entry.content?.label?.text !== undefined);

  // The quirk that is easiest to lose: floating placement without a label must
  // still be compared, because that is where the field and its control disagree.
  require('no shared case asks for a floating label without supplying one', (entry) =>
    floatingPlacement(entry) && !labelled(entry));

  // ------------------------------------------------------- describing text
  require('no shared case renders a description', (entry) => field(entry).description !== undefined);
  require('no shared case renders an error', (entry) => field(entry).error !== undefined);
  require('no shared case renders a description and an error together, which is the only case that proves their order', (
    entry,
  ) => field(entry).description !== undefined && field(entry).error !== undefined);
  require('no shared case sets invalid without error text, so the prop-only path is never compared', (entry) =>
    field(entry).invalid === true && field(entry).error === undefined);
  require('no shared case takes its description from slot content', (entry) =>
    entry.content?.description?.text !== undefined);
  require('no shared case takes its error from slot content', (entry) => entry.content?.error?.text !== undefined);

  // ------------------------------------------------------------- modifiers
  require('no shared case renders the required marker', (entry) => field(entry).required === true);
  for (const variant of ['in', 'on', 'over']) {
    require(`no shared case renders the ${variant} floating variant`, (entry) =>
      floatingPlacement(entry) && labelled(entry) && (field(entry).variant ?? 'in') === variant);
  }

  // ---------------------------------------------------------- control state
  require('no shared case renders a filled control', (entry) => control(entry).modelValue !== undefined);
  require('no shared case renders an empty control', (entry) => control(entry).modelValue === undefined);
  require('no shared case renders a disabled control', (entry) => entry.attrs?.disabled === true);
  require('no shared case forwards a consumer class to the field root', (entry) =>
    entry.fieldAttrs?.class !== undefined);
  require('no shared case forwards a consumer style to the field root', (entry) =>
    entry.fieldAttrs?.style !== undefined);
  require('no shared case forwards a consumer data attribute to the field root', (entry) =>
    Object.keys(entry.fieldAttrs ?? {}).some((name) => name.startsWith('data-')));

  // ------------------------------------------------------------ scenarios
  // Every scenario has to say what it proves. A gesture with no declared
  // outcome counts for nothing below, so dropping the declaration must not be a
  // quiet way to opt out of being counted.
  for (const entry of scenarios) {
    if (Object.keys(expectOf(entry)).length === 0) {
      violations.push(`${entry.id} drives the component but declares no expected outcome`);
    }
  }

  const proves = (message, predicate) => {
    if (!scenarios.some(predicate)) violations.push(message);
  };

  // Clicking the label is the only proof that the for/id edge works the way a
  // user experiences it, rather than merely being present as an attribute.
  proves(
    'no shared case proves that clicking a top label focuses its control',
    (entry) => drives(entry, 'clickLabel') && !floatingPlacement(entry) && expectOf(entry).focusRole === 'control',
  );
  proves(
    'no shared case proves that clicking a floating label focuses its control',
    (entry) => drives(entry, 'clickLabel') && floatingPlacement(entry) && expectOf(entry).focusRole === 'control',
  );
  proves(
    'no shared case proves that typing moves a field from empty to filled',
    (entry) => drives(entry, 'type') && expectOf(entry).filled === true,
  );
  proves(
    'no shared case proves that a field returns to empty when its value is cleared',
    (entry) => drives(entry, 'clickClear') && expectOf(entry).filled === false,
  );
  proves(
    'no shared case proves that typing fills a floating field, which is what the floating label depends on',
    (entry) => drives(entry, 'type') && floatingPlacement(entry) && expectOf(entry).filled === true,
  );
  proves(
    'no shared case focuses the control directly',
    (entry) => drives(entry, 'focus') && expectOf(entry).focusRole === 'control',
  );

  return violations;
}
