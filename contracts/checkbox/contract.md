# Checkbox contract

Status: Active

Component: `Checkbox`

Razor tag: `cm-checkbox`

## Purpose

Checkbox presents one native boolean form control with a visible label. It preserves browser focus,
keyboard activation, constraint validation, event, and form-submission behavior.

## Structure and native control

The root is `label.cm-checkbox` with one size class. It contains `input.cm-checkbox__input`, a
presentation-only `span.cm-checkbox__control`, and `span.cm-checkbox__content`. The input always uses
`type="checkbox"`; the decorative control is `aria-hidden="true"` and must not become a second
interactive target.

Safe form-control attributes and listeners, including `id`, `name`, `value`, `form`, and `aria-*`,
are forwarded to the input. Consumer `class` and `style` target the root. The escaped `label` prop is
used when the default slot is empty; trusted slot content otherwise takes precedence.

## Checked state and platform mapping

The semantic `checked` value is boolean. Vue exposes it through boolean `modelValue` and emits
`update:modelValue` after native changes. Annabel Razor renders the current `checked` attribute and
uses submitted form data for the next render. `indeterminate` adds
`data-cm-controller="checkbox"` and `data-cm-checkbox-indeterminate="true"` to the root. Vue sets the
native DOM property directly; Razor consumers register the shared Checkbox controller to restore it
after server rendering. The browser then exposes the mixed state to assistive technology. It is a
visual state, not a third submitted value, and degrades to unchecked when enhancement is absent.

## Validation and submission

`disabled` and `required` map directly to native attributes. `invalid` adds
`cm-checkbox--invalid` and `aria-invalid="true"` without changing native validity. A named checked
checkbox contributes its string `value` (default `on`) to `FormData`; unchecked and disabled
checkboxes contribute no value. Adapters do not use hidden fallback inputs.
