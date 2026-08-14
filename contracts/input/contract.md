# Input contract

Status: Active

Component: `Input`

Razor tag: `cm-input`

## Purpose

Input is a thin adapter over one native single-line `<input>`. It shares visual sizing and invalid
presentation while preserving browser editing, focus, autofill, constraint validation, and form
submission semantics.

## Native control

The semantic form control is always `<input>` and owns `cm-input` plus one of `cm-input--sm`,
`cm-input--md`, or `cm-input--lg`. Without authored adornments or actions it remains the only
element. Enhanced inputs use a `cm-input-wrap` presentation wrapper. It allows only the approved text-like types:
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

## Adornments and actions

The optional `leading` and `trailing` slots render trusted component content in
`cm-input__leading` and `cm-input__trailing`. Their content does not name the input
automatically; consumers must hide decorative content or supply appropriate accessible semantics.

`clearable` adds a localized clear button for editable inputs. Activating it sets the native value
to an empty string, dispatches the ordinary bubbling input event, and restores focus to the input.
The button is hidden while the value is empty and omitted for disabled or readonly controls.

`passwordReveal` is effective only with `type="password"`. Its button toggles the native input type,
preserves the value, focus, and selection, and exposes the current state with `aria-pressed` and the
localized `showPasswordLabel` / `hidePasswordLabel`. These actions use the `input` progressive
enhancement controller in server-rendered markup; Vue provides the same behavior directly.

Input masking and arbitrary icon-name lookup stay outside the shared contract. Adornments are
framework-native slots so the contract does not depend on one icon registry.

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
