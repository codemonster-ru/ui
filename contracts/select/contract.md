# Select contract

Status: Active

Component: `Select`

Razor tag: `cm-select`

Select renders one native `<select>`. Without an action it has no wrapper. `options` is a non-empty ordered collection of
records with unique string `value`, non-empty escaped `label`, and optional `disabled`. Optional
`placeholder` renders a disabled empty-value option. `value` is the current string value; Vue maps
it to `v-model` and Razor renders server state.

`size` is `sm`, `md`, or `lg`. `invalid`, `disabled`, and `required` map to native or ARIA state.
Safe native attributes such as `id`, `name`, `autocomplete`, and `aria-describedby` reach the
select. Browser focus, keyboard selection, validation, events, and form serialization remain
authoritative. The baseline control does not emulate a listbox or require the shared runtime.

`clearable` adds a localized clear button when the control is enabled. Activating it selects the
empty native value, dispatches the ordinary bubbling `change` event, and restores focus to the
select. The button is hidden while the value is empty. When neither a placeholder nor an empty
consumer option exists, clearable selects include a hidden empty option so the cleared state is
represented by the native control.
Server-rendered markup uses the `select` progressive enhancement controller; Vue provides the same
behavior directly. Without JavaScript, selection and submission continue to use native semantics.
