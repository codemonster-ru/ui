# Table contract

Status: Active

Component: `Table`

Razor tag: `cm-table`

## Purpose and structure

Table provides a responsive visual frame around an authored native `<table>`. Its stable structure is
`cm-table-wrap` → `cm-table__scroll` → `table.cm-table`. Root attributes and consumer classes apply
to the outer wrapper so labels and layout constraints describe the complete scroll region.

The optional caption renders before all row groups. A non-empty `caption` slot replaces the escaped
plain-text `caption` prop. The `header`, default, and `footer` slots render inside `<thead>`, `<tbody>`,
and `<tfoot>` respectively; absent groups are omitted. Slot authors remain responsible for valid
`tr`, `th`, `td`, `scope`, and header relationships.

## Presentation

`density="compact"`, `striped`, `columnDividers`, and `stickyHeader` add stable modifier classes.
Sticky headers operate inside the horizontal scroll region and require authored header cells.
Presentation never changes table semantics, source order, or keyboard behavior.

## Accessibility and security

Use a caption when surrounding context does not already name the table. Table adds no grid role or
keyboard interaction. Slot markup crosses each adapter's trusted composition boundary; ordinary
caption text and attributes are escaped. Untrusted data must not be promoted to a slot.
