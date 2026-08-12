# DatePicker contract

Status: Active

Component: `DatePicker`

Razor tag: `cm-date-picker`

DatePicker renders one native `<input type="date">` and no wrapper. `value`, `min`, and `max` are
empty or valid `YYYY-MM-DD` calendar dates. Vue maps `value` to string `v-model`; Razor renders the
server or submitted value. `size` is `sm`, `md`, or `lg`; `invalid`, `disabled`, `readonly`, and
`required` preserve native and ARIA state.

Safe input attributes including `id`, `name`, `autocomplete`, `step`, and `aria-describedby` are
forwarded. Browser calendar UI, locale presentation, keyboard editing, constraint validation, and
form submission remain authoritative. The serialized value is always ISO date syntax. The
component does not parse time zones, implement date ranges, or require shared runtime.
