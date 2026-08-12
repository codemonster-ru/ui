# Switch contract

Status: Active

Component: `Switch`

Razor tag: `cm-switch`

## Purpose and structure

Switch presents an immediate boolean setting through a native checkbox with `role="switch"`. The
root is `label.cm-switch` with one size class and contains `input.cm-switch__input`, a decorative
`span.cm-switch__control` with `span.cm-switch__thumb`, and `span.cm-switch__content`. Decorative
elements are hidden from assistive technology.

Safe form-control attributes and listeners are forwarded to the input; consumer `class` and `style`
target the root. The default slot takes precedence over the escaped `label` prop. Switch is not a
replacement for Checkbox when the action represents multi-selection or acceptance.

## Checked state and platform mapping

The semantic `checked` value is boolean and is mirrored through `aria-checked` because the native
control has switch semantics. Vue exposes boolean `modelValue` and emits `update:modelValue` after
native changes. Annabel Razor renders the current `checked` state and relies on submitted form data
for the next render.

## Validation and submission

`disabled` and `required` map directly to native attributes. `invalid` adds `cm-switch--invalid` and
`aria-invalid="true"`. A named enabled switch contributes its string `value` (default `on`) only
while checked. Adapters preserve native focus, Space activation, change events, validity, and form
submission and do not add hidden fallback inputs.
