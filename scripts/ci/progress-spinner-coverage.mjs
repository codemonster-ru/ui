// What the VfProgressSpinner catalog has to prove, read as semantics.
//
// The M20 module, for the first migrated component that another migrated
// component had already been rendering. That history is the shape of the risk:
// the button forwards one size, one stroke width and one class, and a catalog
// that measured only those would be a catalog of the button's spinner rather
// than of the public one. So the rules below insist on everything the button
// never sends - eight tones, a numeric size, a zero size, a default stroke, a
// custom name - and refuse the props a button case would carry.
//
// Four halves:
//
//   - size: every form the rule distinguishes. Absent, a number, zero, a
//     fraction, a string, a token reference, an empty string. Each is a
//     different path through the size rule or the platform serialiser;
//   - stroke and tone: the geometry on both circles, and all eight tones with
//     primary required both explicitly and by absence;
//   - accessibility: the component's own role and name can only be measured
//     on a case with no consumer ARIA at all; a consumer role, a consumer
//     name, a consumer aria-hidden and consumer value attributes each have
//     to be shown doing what they do;
//   - the consumer contract: class order at the default tone and after a
//     modifier, a style beside no declaration and beside one, the custom
//     property overridden, a product data attribute.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];
const PROPS = ['label', 'size', 'strokeWidth', 'tone'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key === 'role' || key.startsWith('aria-'));
const isBare = (entry) => Object.keys(attrs(entry)).length === 0;

/** Every way the VfProgressSpinner catalog's coverage can be eroded. */
export function progressSpinnerCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------------- size
  require('no shared spinner case leaves size absent with no consumer attributes, so the token default is never measured on its own', (
    entry,
  ) => props(entry).size === undefined && isBare(entry) && props(entry).tone === undefined);
  require('no shared spinner case passes a numeric size, so the pixel conversion is never measured', (entry) =>
    typeof props(entry).size === 'number' && props(entry).size > 0 && Number.isInteger(props(entry).size));
  require('no shared spinner case passes size 0, so nothing proves zero is a length rather than an absence', (entry) =>
    props(entry).size === 0);
  require('no shared spinner case passes a fractional size', (entry) =>
    typeof props(entry).size === 'number' && !Number.isInteger(props(entry).size));
  require('no shared spinner case passes a string size, so nothing proves a string passes through verbatim', (entry) =>
    typeof props(entry).size === 'string' && props(entry).size !== '' && !props(entry).size.startsWith('var('));
  require('no shared spinner case passes a token reference as the size - the form VfButton forwards', (entry) =>
    typeof props(entry).size === 'string' && props(entry).size.startsWith('var('));
  require('no shared spinner case passes an empty-string size, so nothing proves it writes no declaration', (entry) =>
    props(entry).size === '');

  // ----------------------------------------------------------- stroke width
  require('no shared spinner case leaves strokeWidth at its default on a bare spinner', (entry) =>
    props(entry).strokeWidth === undefined && isBare(entry));
  require('no shared spinner case passes a stroke width thicker than the default, so the track is never proved to thicken with the arc', (
    entry,
  ) => typeof props(entry).strokeWidth === 'number' && props(entry).strokeWidth > 4);
  require('no shared spinner case passes a fractional stroke width', (entry) =>
    typeof props(entry).strokeWidth === 'number' && !Number.isInteger(props(entry).strokeWidth));
  require('no shared spinner case passes strokeWidth 0, so nothing proves zero is written rather than dropped', (
    entry,
  ) => props(entry).strokeWidth === 0);

  // ------------------------------------------------------------------- tone
  //
  // Every tone on a case with no consumer attribute, so the modifier and the
  // arc colour are measured on their own. Primary is required both explicitly
  // and by absence.
  for (const tone of TONES) {
    require(`no shared spinner case renders the ${tone} tone without consumer attributes`, (entry) =>
      (props(entry).tone ?? 'primary') === tone && isBare(entry));
  }
  require('no shared spinner case names the primary tone explicitly, so "explicit primary emits nothing" is assumed', (
    entry,
  ) => props(entry).tone === 'primary');
  require('no shared spinner case renders the neutral tone, the one a badge-derived rule would suppress', (entry) =>
    props(entry).tone === 'neutral');

  // ---------------------------------------------------------------- the name
  require('no shared spinner case passes a custom label', (entry) =>
    typeof props(entry).label === 'string' && props(entry).label !== '' && props(entry).label !== 'Loading');
  require('no shared spinner case passes an empty label, so nothing proves the attribute is written empty rather than dropped', (
    entry,
  ) => props(entry).label === '');

  // --------------------------------------------------------- accessibility
  require("no shared spinner case renders without any consumer ARIA, so the component's own role and name are never measured", (
    entry,
  ) => !hasConsumerAria(entry));
  require('no shared spinner case forwards a consumer role, so nothing proves it replaces progressbar rather than duplicating it', (
    entry,
  ) => attrs(entry).role !== undefined);
  require('no shared spinner case forwards a consumer aria-label beside a label prop, so nothing proves the consumer name wins', (
    entry,
  ) => attrs(entry)['aria-label'] !== undefined && props(entry).label !== undefined);
  require('no shared spinner case forwards aria-hidden onto the root', (entry) =>
    attrs(entry)['aria-hidden'] !== undefined);
  require('no shared spinner case forwards consumer value attributes, so nothing proves they pass through onto the progressbar', (
    entry,
  ) =>
    attrs(entry)['aria-valuenow'] !== undefined &&
    attrs(entry)['aria-valuemin'] !== undefined &&
    attrs(entry)['aria-valuemax'] !== undefined);

  // ------------------------------------------------------------------ attrs
  require('no shared spinner case forwards a consumer class at the default tone, with no modifier to follow', (entry) =>
    attrs(entry).class !== undefined && props(entry).tone === undefined);
  require('no shared spinner case forwards a consumer class after a tone modifier, so the order of all three is never measured', (
    entry,
  ) => attrs(entry).class !== undefined && props(entry).tone !== undefined && props(entry).tone !== 'primary');
  require('no shared spinner case forwards an inline style beside no size declaration', (entry) =>
    attrs(entry).style !== undefined && props(entry).size === undefined);
  require('no shared spinner case forwards an inline style beside a size, so the merge order is never measured', (
    entry,
  ) =>
    attrs(entry).style !== undefined &&
    props(entry).size !== undefined &&
    !String(attrs(entry).style).includes('--vf-progress-spinner-size'));
  require('no shared spinner case overrides the size custom property from a consumer style, so nothing proves the consumer wins', (
    entry,
  ) => props(entry).size !== undefined && String(attrs(entry).style ?? '').includes('--vf-progress-spinner-size'));
  require('no shared spinner case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared spinner case composes size, tone, stroke width, a class and a style at once', (entry) =>
    props(entry).size !== undefined &&
    props(entry).tone !== undefined &&
    props(entry).strokeWidth !== undefined &&
    attrs(entry).class !== undefined &&
    attrs(entry).style !== undefined);

  // ------------------------------------------------------------- the shape
  for (const entry of cases) {
    if (!entry.id?.startsWith('progress-spinner/')) {
      violations.push(`${entry.id} is not a progress-spinner case, so it cannot count towards spinner coverage`);
    }
    // No slot, so no content. A case declaring some is a case for another
    // component, and the fixture would have nowhere to put it.
    for (const name of Object.keys(entry.content ?? {})) {
      violations.push(`${entry.id} declares a [${name}] slot, and VfProgressSpinner has no slot at all`);
    }
    // No slot also means no consumer control can reach the DOM, so every
    // static budget is zero. A budget of one would be the room a
    // component-grown control needs.
    if ((entry.consumerInteractive ?? 0) !== 0) {
      violations.push(
        `${entry.id} declares consumerInteractive ${entry.consumerInteractive}; the spinner has no slot, so no ` +
          'consumer control can be inside it and the budget is a fiction',
      );
    }
    for (const name of Object.keys(props(entry))) {
      if (!PROPS.includes(name)) {
        // `loading`, `variant`, `block` are the button's; `value`, `max`,
        // `indeterminate` are the progress bar's; `animated` is the
        // skeleton's. A case carrying any of them was written for that
        // component, and the button one in particular is the substitution
        // this module exists to refuse.
        violations.push(`${entry.id} declares the ${name} prop, which VfProgressSpinner does not have`);
      }
    }
    if (props(entry).tone !== undefined && !TONES.includes(props(entry).tone)) {
      violations.push(`${entry.id} declares tone ${JSON.stringify(props(entry).tone)}, which is not a feedback tone`);
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    [
      'a bare default spinner',
      (entry) => props(entry).size === undefined && isBare(entry) && props(entry).tone === undefined,
    ],
    ...TONES.filter((tone) => tone !== 'primary').map((tone) => [
      `the ${tone} tone`,
      (entry) => props(entry).tone === tone,
    ]),
    ['a numeric size', (entry) => typeof props(entry).size === 'number' && props(entry).size > 0],
    [
      'a string size',
      (entry) =>
        typeof props(entry).size === 'string' && props(entry).size !== '' && !props(entry).size.startsWith('var('),
    ],
    ['a token size', (entry) => typeof props(entry).size === 'string' && props(entry).size.startsWith('var(')],
    ['a thick stroke', (entry) => typeof props(entry).strokeWidth === 'number' && props(entry).strokeWidth > 4],
    ['a zero stroke, where a track that was still drawn would show', (entry) => props(entry).strokeWidth === 0],
    [
      'a consumer override of the size property, where a component that ignored it would show at the prop size',
      (entry) => String(attrs(entry).style ?? '').includes('--vf-progress-spinner-size'),
    ],
    [
      'the composed case',
      (entry) => props(entry).size !== undefined && props(entry).tone !== undefined && attrs(entry).class !== undefined,
    ],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no spinner screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
