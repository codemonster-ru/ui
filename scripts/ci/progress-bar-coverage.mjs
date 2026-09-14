// What the VfProgressBar catalog has to prove, read as semantics.
//
// The M21 module, for the component that sits beside VfProgressSpinner and
// shares its role name and its tone union. That adjacency is the shape of the
// risk: a spinner case carries a tone and a name, and a catalog that measured
// only those would be a catalog of a coloured progressbar with nothing to
// announce. So the rules below insist on everything a spinner never has - a
// zero, a middle, a full value, a custom maximum, an overflow, a negative, a
// fractional ratio, the indeterminate branch, the visible label - and refuse
// the props a spinner case would carry.
//
// Six halves:
//
//   - the value: zero, a middle, exactly the maximum, above it, below zero,
//     a fraction, a number below 1e-6. Each is a different path through the
//     clamp or the serialiser;
//   - the maximum: the default measured on a bare case, a custom one, zero
//     and a negative (both fall back), a fraction, one below one;
//   - the branch: indeterminate on its own, with an ignored value beside it,
//     composed with a tone and stripes;
//   - the label: shown, shown at a value that rounds, shown at zero, shown
//     beside a custom name - the last is what keeps "the label is not the
//     name" a measurement;
//   - accessibility: the component's own role, name and value can only be
//     measured on a case with no consumer ARIA at all; a consumer role, a
//     consumer name, a consumer labelledby, each consumer aria-value
//     attribute, a valuetext, a valuenow on an indeterminate bar and an
//     aria-hidden each have to be shown doing what they do;
//   - the paint and the consumer contract: all eight tones, stripes with and
//     without animation, animated alone, every height form, class order at
//     the default and after modifiers, a style beside no declaration and
//     beside one, the custom property overridden, a product data attribute.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];
const PROPS = ['value', 'max', 'indeterminate', 'label', 'height', 'showValue', 'tone', 'striped', 'animated'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key === 'role' || key.startsWith('aria-'));
const isBare = (entry) => Object.keys(attrs(entry)).length === 0;
const determinate = (entry) => props(entry).indeterminate !== true;
const number = (entry, name) => (typeof props(entry)[name] === 'number' ? props(entry)[name] : undefined);
const max = (entry) => number(entry, 'max') ?? 100;

/** Every way the VfProgressBar catalog's coverage can be eroded. */
export function progressBarCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------------ value
  require('no shared bar case leaves the value absent on a bare determinate bar, so the zero default is never measured on its own', (
    entry,
  ) => number(entry, 'value') === undefined && isBare(entry) && determinate(entry) && props(entry).max === undefined);
  require('no shared bar case passes value 0, so nothing proves zero is written as a value and a width rather than dropped', (
    entry,
  ) => number(entry, 'value') === 0 && determinate(entry) && isBare(entry));
  require('no shared bar case passes a mid-range value at the default maximum', (entry) => {
    const value = number(entry, 'value');
    return (
      value !== undefined &&
      value > 0 &&
      value < 100 &&
      props(entry).max === undefined &&
      determinate(entry) &&
      isBare(entry)
    );
  });
  require('no shared bar case passes a value equal to the maximum, so a full track is never measured', (entry) => {
    const value = number(entry, 'value');
    return value !== undefined && value === max(entry) && max(entry) > 0 && determinate(entry) && isBare(entry);
  });
  require('no shared bar case passes a value above the maximum, so the overflow clamp is never measured', (entry) => {
    const value = number(entry, 'value');
    return value !== undefined && value > max(entry) && max(entry) > 0 && determinate(entry);
  });
  require('no shared bar case passes a negative value, so the zero clamp is never measured', (entry) => {
    const value = number(entry, 'value');
    return value !== undefined && value < 0 && determinate(entry);
  });
  require('no shared bar case passes a fractional value at the default maximum, so nothing proves the value is written unrounded', (
    entry,
  ) => {
    const value = number(entry, 'value');
    return (
      value !== undefined &&
      !Number.isInteger(value) &&
      value >= 1e-6 &&
      props(entry).max === undefined &&
      determinate(entry)
    );
  });
  require('no shared bar case passes a value below 1e-6, so the exponent serialisation is never measured', (entry) => {
    const value = number(entry, 'value');
    return value !== undefined && value > 0 && value < 1e-6 && determinate(entry);
  });

  // ---------------------------------------------------------------- maximum
  require('no shared bar case passes a custom maximum above zero with a value inside it, so aria-valuemax and the ratio are never measured', (
    entry,
  ) => {
    const value = number(entry, 'value');
    const custom = number(entry, 'max');
    return (
      custom !== undefined &&
      custom > 0 &&
      custom !== 100 &&
      value !== undefined &&
      value > 0 &&
      value < custom &&
      determinate(entry)
    );
  });
  require('no shared bar case passes max 0, so the divide-by-zero fallback is never measured', (entry) =>
    number(entry, 'max') === 0 && determinate(entry));
  require('no shared bar case passes a negative maximum, so the fallback to 100 is never measured', (entry) => {
    const custom = number(entry, 'max');
    return custom !== undefined && custom < 0 && determinate(entry);
  });
  require('no shared bar case passes a fractional maximum, so a ratio of two fractions is never measured', (entry) => {
    const custom = number(entry, 'max');
    return custom !== undefined && custom > 0 && !Number.isInteger(custom) && determinate(entry);
  });
  require('no shared bar case passes a value that clamps to a maximum below one', (entry) => {
    const custom = number(entry, 'max');
    const value = number(entry, 'value');
    return (
      custom !== undefined && custom > 0 && custom < 1 && value !== undefined && value > custom && determinate(entry)
    );
  });

  // -------------------------------------------------------------- the branch
  require('no shared bar case is indeterminate with no consumer attributes, so the omitted value semantics are never measured on their own', (
    entry,
  ) => props(entry).indeterminate === true && isBare(entry) && props(entry).value === undefined);
  require('no shared bar case passes a value, a maximum and showValue beside indeterminate, so nothing proves they are ignored', (
    entry,
  ) =>
    props(entry).indeterminate === true &&
    props(entry).value !== undefined &&
    props(entry).max !== undefined &&
    props(entry).showValue === true);
  require('no shared bar case composes indeterminate with a tone and stripes', (entry) =>
    props(entry).indeterminate === true && props(entry).tone !== undefined && props(entry).striped === true);

  // --------------------------------------------------------------- the label
  require('no shared bar case shows the value, so the label element is never measured', (entry) =>
    props(entry).showValue === true && determinate(entry) && isBare(entry));
  require('no shared bar case shows a value whose percentage rounds, so half-up rounding is never measured apart from the width', (
    entry,
  ) => {
    const value = number(entry, 'value');
    return (
      props(entry).showValue === true &&
      value !== undefined &&
      !Number.isInteger((value / max(entry)) * 100) &&
      determinate(entry)
    );
  });
  require('no shared bar case shows the value at zero, so nothing proves the label reads 0% rather than vanishing', (
    entry,
  ) => props(entry).showValue === true && number(entry, 'value') === 0 && determinate(entry));
  require('no shared bar case shows the value beside a custom label, so nothing proves the visible percentage is not the accessible name', (
    entry,
  ) =>
    props(entry).showValue === true &&
    typeof props(entry).label === 'string' &&
    props(entry).label !== 'Progress' &&
    determinate(entry));
  require('no shared bar case passes a custom label', (entry) =>
    typeof props(entry).label === 'string' && props(entry).label !== '' && props(entry).label !== 'Progress');
  require('no shared bar case passes an empty label, so nothing proves the attribute is written empty rather than dropped', (
    entry,
  ) => props(entry).label === '');

  // ---------------------------------------------------------- accessibility
  require("no shared bar case renders without any consumer ARIA, so the component's own role, name and value are never measured", (
    entry,
  ) => !hasConsumerAria(entry));
  require('no shared bar case forwards a consumer role, so nothing proves it replaces progressbar rather than duplicating it', (
    entry,
  ) => attrs(entry).role !== undefined);
  require('no shared bar case forwards a consumer aria-label beside a label prop, so nothing proves the consumer name wins', (
    entry,
  ) => attrs(entry)['aria-label'] !== undefined && props(entry).label !== undefined);
  require('no shared bar case forwards aria-labelledby, so nothing proves a consumer relationship names the bar over its own aria-label', (
    entry,
  ) => attrs(entry)['aria-labelledby'] !== undefined);
  require('no shared bar case forwards a consumer aria-valuenow on a determinate bar with a different prop value, so nothing proves the attribute and the fill are measured apart', (
    entry,
  ) => {
    const value = number(entry, 'value');
    const forwarded = attrs(entry)['aria-valuenow'];
    return determinate(entry) && value !== undefined && forwarded !== undefined && String(value) !== String(forwarded);
  });
  require('no shared bar case forwards a consumer aria-valuemax, so nothing proves it replaces the resolved maximum', (
    entry,
  ) => attrs(entry)['aria-valuemax'] !== undefined && determinate(entry));
  require('no shared bar case forwards a consumer aria-valuemin, so nothing proves it replaces the fixed floor', (
    entry,
  ) => attrs(entry)['aria-valuemin'] !== undefined && determinate(entry));
  require('no shared bar case forwards aria-valuetext', (entry) => attrs(entry)['aria-valuetext'] !== undefined);
  require('no shared bar case forwards a consumer aria-valuenow onto an indeterminate bar, so nothing proves it is forwarded rather than stripped', (
    entry,
  ) => props(entry).indeterminate === true && attrs(entry)['aria-valuenow'] !== undefined);
  require('no shared bar case forwards aria-hidden onto the root', (entry) =>
    attrs(entry)['aria-hidden'] !== undefined);

  // ------------------------------------------------------------------- paint
  for (const tone of TONES) {
    require(`no shared bar case renders the ${tone} tone with a visible fill and no consumer attributes`, (entry) => {
      const value = number(entry, 'value') ?? 0;
      return (props(entry).tone ?? 'primary') === tone && isBare(entry) && value > 0 && determinate(entry);
    });
  }
  require('no shared bar case names the primary tone explicitly, so "explicit primary emits nothing" is assumed', (
    entry,
  ) => props(entry).tone === 'primary');
  require('no shared bar case renders the neutral tone, the one a badge-derived rule would suppress', (entry) =>
    props(entry).tone === 'neutral');
  require('no shared bar case is striped without animated', (entry) =>
    props(entry).striped === true && props(entry).animated !== true && determinate(entry) && isBare(entry));
  require('no shared bar case is animated without striped, so nothing proves animated alone emits no modifier', (
    entry,
  ) => props(entry).animated === true && props(entry).striped !== true);
  require('no shared bar case is striped and animated, so the stripe animation is never measured', (entry) =>
    props(entry).striped === true && props(entry).animated === true && determinate(entry) && isBare(entry));

  // ------------------------------------------------------------------ height
  require('no shared bar case passes a numeric height, so the pixel conversion is never measured', (entry) => {
    const height = number(entry, 'height');
    return height !== undefined && height > 0 && isBare(entry);
  });
  require('no shared bar case passes height 0, so nothing proves zero is a length rather than an absence', (entry) =>
    number(entry, 'height') === 0);
  require('no shared bar case passes a string height, so nothing proves a string passes through verbatim', (entry) =>
    typeof props(entry).height === 'string' && props(entry).height !== '');
  require('no shared bar case passes an empty-string height, so nothing proves it writes no declaration', (entry) =>
    props(entry).height === '');

  // ------------------------------------------------------------------- attrs
  require('no shared bar case forwards a consumer class at the default, with no modifier to follow', (entry) =>
    attrs(entry).class !== undefined && props(entry).tone === undefined && props(entry).striped === undefined);
  require('no shared bar case forwards a consumer class after a tone and a stripe modifier, so the order of all four is never measured', (
    entry,
  ) =>
    attrs(entry).class !== undefined &&
    props(entry).tone !== undefined &&
    props(entry).tone !== 'primary' &&
    props(entry).striped === true);
  require('no shared bar case forwards an inline style beside no height declaration', (entry) =>
    attrs(entry).style !== undefined && props(entry).height === undefined);
  require('no shared bar case forwards an inline style beside a height, so the merge order is never measured', (
    entry,
  ) =>
    attrs(entry).style !== undefined &&
    props(entry).height !== undefined &&
    !String(attrs(entry).style).includes('--vf-progress-bar-height'));
  require('no shared bar case overrides the height custom property from a consumer style, so nothing proves the consumer wins', (
    entry,
  ) => props(entry).height !== undefined && String(attrs(entry).style ?? '').includes('--vf-progress-bar-height'));
  require('no shared bar case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared bar case composes a custom maximum, a tone, stripes, a visible label, a height, a class and a style at once', (
    entry,
  ) =>
    props(entry).max !== undefined &&
    props(entry).tone !== undefined &&
    props(entry).striped === true &&
    props(entry).showValue === true &&
    props(entry).height !== undefined &&
    attrs(entry).class !== undefined &&
    attrs(entry).style !== undefined);

  // ------------------------------------------------------------- the shape
  for (const entry of cases) {
    if (!entry.id?.startsWith('progress-bar/')) {
      violations.push(`${entry.id} is not a progress-bar case, so it cannot count towards bar coverage`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      violations.push(`${entry.id} declares a [${name}] slot, and VfProgressBar has no slot at all`);
    }
    if ((entry.consumerInteractive ?? 0) !== 0) {
      violations.push(
        `${entry.id} declares consumerInteractive ${entry.consumerInteractive}; the bar has no slot, so no ` +
          'consumer control can be inside it and the budget is a fiction',
      );
    }
    for (const name of Object.keys(props(entry))) {
      if (!PROPS.includes(name)) {
        // `size` and `strokeWidth` are the spinner's; `loading` is the
        // button's. A case carrying any of them was written for that
        // component, and the spinner one in particular is the substitution
        // this module exists to refuse.
        violations.push(`${entry.id} declares the ${name} prop, which VfProgressBar does not have`);
      }
    }
    if (props(entry).tone !== undefined && !TONES.includes(props(entry).tone)) {
      violations.push(`${entry.id} declares tone ${JSON.stringify(props(entry).tone)}, which is not a feedback tone`);
    }
    for (const name of ['value', 'max']) {
      if (props(entry)[name] !== undefined && typeof props(entry)[name] !== 'number') {
        // A numeric string is a real Vue quirk (it reads as non-finite) and a
        // real Razor input (it reads as a number); the two adapters disagree
        // by design, so the catalog cannot carry one. Pinned by each side's
        // own suite instead.
        violations.push(
          `${entry.id} declares a non-numeric ${name}, which the two adapters read differently by design`,
        );
      }
    }
  }

  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    ['a bare default bar', (entry) => number(entry, 'value') === undefined && isBare(entry) && determinate(entry)],
    ['an empty fill at zero', (entry) => number(entry, 'value') === 0 && determinate(entry)],
    [
      'a mid-range fill',
      (entry) =>
        (number(entry, 'value') ?? 0) > 0 &&
        (number(entry, 'value') ?? 0) < max(entry) &&
        determinate(entry) &&
        isBare(entry) &&
        props(entry).showValue !== true,
    ],
    ['a full track', (entry) => number(entry, 'value') === max(entry) && max(entry) > 0 && determinate(entry)],
    [
      'a custom maximum',
      (entry) =>
        number(entry, 'max') !== undefined &&
        number(entry, 'max') !== 100 &&
        number(entry, 'max') > 0 &&
        determinate(entry),
    ],
    ['the indeterminate sweep', (entry) => props(entry).indeterminate === true],
    ['the visible label', (entry) => props(entry).showValue === true && determinate(entry)],
    [
      'a label that rounds away from the width',
      (entry) =>
        props(entry).showValue === true &&
        !Number.isInteger(((number(entry, 'value') ?? 0) / max(entry)) * 100) &&
        determinate(entry),
    ],
    ...TONES.filter((tone) => tone !== 'primary').map((tone) => [
      `the ${tone} tone`,
      (entry) => props(entry).tone === tone,
    ]),
    ['stripes', (entry) => props(entry).striped === true && determinate(entry)],
    ['a numeric height', (entry) => (number(entry, 'height') ?? 0) > 0],
    ['a string height', (entry) => typeof props(entry).height === 'string' && props(entry).height !== ''],
    [
      'a consumer override of the height property, where a component that ignored it would show at the prop height',
      (entry) => String(attrs(entry).style ?? '').includes('--vf-progress-bar-height'),
    ],
    [
      'the composed case',
      (entry) => props(entry).max !== undefined && props(entry).tone !== undefined && attrs(entry).class !== undefined,
    ],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no bar screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
