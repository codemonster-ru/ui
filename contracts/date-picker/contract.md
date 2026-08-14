# DatePicker contract

Status: Active

Component: `DatePicker`

Razor tag: `cm-date-picker`

DatePicker renders one native `<input type="date">`. `value`, `min`, and `max` are empty or valid
`YYYY-MM-DD` calendar dates. Vue maps `value` to string `v-model`; Razor renders the server or
submitted value. `size` is `sm`, `md`, or `lg`; `invalid`, `disabled`, `readonly`, and `required`
preserve native and ARIA state.

Safe input attributes including `id`, `name`, `autocomplete`, `step`, and `aria-describedby` are
forwarded. Browser calendar UI, locale presentation, keyboard editing, constraint validation, and
form submission remain authoritative. The serialized value is always ISO date syntax.

`clearable` adds an editable-date action named by `clearLabel`, which defaults to `Clear date`.
Enhanced markup uses a `cm-date-picker-wrap` presentation wrapper. Activating the action empties the
native input, dispatches its ordinary bubbling input event, and restores focus. The action is hidden
while empty and omitted for disabled or readonly controls. Vue owns this behavior directly; Razor
uses the existing `input` progressive-enhancement controller.

The legacy custom calendar, multiple/range selection, month/year and time modes, minute steps,
display formatting, first-day policy, and calendar-specific labels are not retained. No real
consumer evidence justifies carrying that Vue-specific calendar surface into both adapters. Native
browser locale presentation and calendar interaction supersede them; applications that require
multi-value or scheduling workflows should compose a dedicated domain control.
