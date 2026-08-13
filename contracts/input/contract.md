# Input contract

Status: Active

Component: `Input`

Razor tag: `cm-input`

## Purpose

Input is a thin adapter over one native single-line `<input>`. It shares visual sizing and invalid
presentation while preserving browser editing, focus, autofill, constraint validation, and form
submission semantics.

## Native control

The semantic root is always `<input>`, owns `cm-input` plus one of `cm-input--sm`,
`cm-input--md`, or `cm-input--lg`, and has no wrapper. It allows only the approved text-like types:
`text`, `email`, `password`, `search`, `tel`, and `url`. Invalid finite values produce a development
diagnostic and fall back to `text` in production.

Safe native attributes and listeners are forwarded to the input. Consumer classes merge after the
stable contract classes. Adapters do not replace native `name`, `id`, `autocomplete`, `placeholder`,
`inputmode`, `pattern`, length constraints, or form ownership with parallel component APIs.

## Value and platform mapping

The semantic `value` is always a string. Vue exposes it through `modelValue` and emits
`update:modelValue` from the native input event. Annabel Razor accepts `value`, renders the escaped
native value attribute, and relies on the submitted request value for the next render. Both mappings
must produce the same significant DOM for the same current value.

The shared contract does not add local uncontrolled state, clearing controls, password reveal, or
input masking. Those behaviors require separate contracts because they add interaction and markup.

## State and accessibility

`disabled`, `readonly`, and `required` map directly to their native boolean attributes. `invalid`
adds `aria-invalid="true"` and `cm-input--invalid`; it does not disable editing or native submission.
Input never generates an accessible name. Consumers normally compose it with Field, or provide a
native `aria-label` or `aria-labelledby` when it stands alone.

Input preserves native keyboard, focus, input, change, and form behavior. Ordinary values and
attributes are contextually escaped; no prop is a trusted-markup boundary.

## Submission and constraint validation

The native control is a successful form control whenever it has a `name` and is not disabled.
Readonly controls remain successful; disabled controls do not contribute form data. Editing updates
the DOM value before the browser serializes `FormData`, independently of another adapter render.

Native constraint attributes remain on the input. An empty required input is invalid and blocks an
ordinary browser submission until it receives a valid value. Server-provided validation state is
represented separately by `invalid` and related Field error content; it does not replace native
constraints. The Input behavior scenarios are normative for every adapter.
