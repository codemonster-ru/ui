# Textarea contract

Status: Active

Component: `Textarea`

Razor tag: `cm-textarea`

## Purpose and native control

Textarea is a thin adapter over one native multiline `<textarea>`. The semantic root owns
`cm-textarea` plus one size class and has no wrapper. Safe native attributes and listeners are
forwarded to it, including `name`, `id`, `rows`, `autocomplete`, `placeholder`, length constraints,
`wrap`, and form ownership. Consumer classes merge after stable contract classes.

## Value and platform mapping

The semantic value is a string rendered as escaped text content, never as a `value` attribute. Vue
exposes it through `modelValue` and emits `update:modelValue` from native input. Annabel Razor accepts
the current `value` and relies on submitted request data for the next render. Neither adapter adds
local uncontrolled state, automatic resizing, or character counters.

## Validation, accessibility, and submission

`disabled`, `readonly`, and `required` map to native attributes. `invalid` adds
`cm-textarea--invalid` and `aria-invalid="true"` without replacing native validity. Textarea does not
generate an accessible name; consumers compose it with Field or provide native ARIA naming.

A named enabled textarea contributes its current DOM value to `FormData`; readonly controls remain
successful and disabled controls do not. Native input, change, focus, keyboard, wrapping, and
constraint-validation behavior is preserved.
