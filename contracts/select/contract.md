# Select contract

Status: Active

Component: `Select`

Razor tag: `cm-select`

Select renders one native `<select>` and no wrapper. `options` is a non-empty ordered collection of
records with unique string `value`, non-empty escaped `label`, and optional `disabled`. Optional
`placeholder` renders a disabled empty-value option. `value` is the current string value; Vue maps
it to `v-model` and Razor renders server state.

`size` is `sm`, `md`, or `lg`. `invalid`, `disabled`, and `required` map to native or ARIA state.
Safe native attributes such as `id`, `name`, `autocomplete`, and `aria-describedby` reach the
select. Browser focus, keyboard selection, validation, events, and form serialization remain
authoritative. The component does not emulate a listbox or require the shared runtime.
