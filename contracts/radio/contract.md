# Radio contract

Status: Active

Component: `Radio`

Razor tag: `cm-radio`

## Purpose and structure

Radio presents one option in a native same-name radio group. The root is `label.cm-radio` with one
size class and contains `input.cm-radio__input`, presentation-only `span.cm-radio__control`, and
`span.cm-radio__content`. The input always uses `type="radio"`; the decorative control is hidden
from assistive technology.

Safe control attributes and listeners are forwarded to the input while consumer `class` and `style`
target the root. The default slot takes precedence over the escaped `label` prop.

## Selection and platform mapping

The contract `checked` state describes whether this option is selected. Vue accepts `modelValue`
plus this radio's string `value`, derives checked equality, and emits the option value after a native
change. Annabel Razor receives the server-derived `checked` state. Radio-group exclusivity remains
native and depends on consumers assigning the same non-empty `name` to related options.

## Validation and submission

`disabled` and `required` map to native attributes. `invalid` adds `cm-radio--invalid` and
`aria-invalid="true"` without replacing native validity. A selected, named, enabled radio contributes
its string value to `FormData`; unselected and disabled radios contribute nothing. Adapters do not
render hidden fallback inputs or a synthetic radiogroup.
