# DataTable contract

Status: Active

Component: `DataTable`

Razor tag: `cm-data-table`

## Purpose and data model

DataTable renders application-owned tabular data with portable sorting, selection, and pagination
requests. `id` is a stable kebab-case prefix. `columns` is a non-empty ordered collection with unique
kebab-case `key`, non-empty escaped `header`, optional `sortable`, and optional `align` (`start`,
`center`, or `end`). `rows` contains unique kebab-case `id` values and a `cells` record keyed by
columns. Cell values are strings, finite numbers, or null and are rendered as escaped text.

Applications format dates, numbers, status labels, and links before or around this baseline. The
shared data API deliberately excludes arbitrary HTML cells, client-side query execution, multi-sort,
row expansion, column pinning, resizing, and reordering. Those capabilities require a separate
portable contract rather than callbacks or framework-only slots.

## Structure and states

The root owns `cm-data-table`, the shared controller marker, current sort/page data attributes, and
selected-count state. It contains a responsive table scroll region and, when `pageCount > 1`, a
pagination navigation region. Caption, headers, cells, state messages, labels, and attributes are
escaped. Loading takes precedence over error; error takes precedence over empty rows.

Presentation props map to the same stable table modifiers as Table. `density="compact"` is the only
non-default density. Sorting uses `aria-sort` on the owning `<th>` and a native button. Selection uses
native checkboxes with row-specific accessible names. The select-all checkbox covers only enabled
rendered rows and exposes native checked or indeterminate state.

## Interaction and ownership

Activating a sortable header cycles unsorted → ascending → descending → unsorted, updates rendered
sort state optimistically, and reports `sortChange`. DataTable never reorders rows itself; the
application supplies rows in the requested order. Selection updates native controls and reports
`selectionChange` in rendered row order. Previous and next buttons clamp to `1...pageCount`, update
the requested page, and report `pageChange`; applications replace rows for that page.

Vue owns interaction directly. Server-rendered Razor markup uses the shared DataTable controller.
The initial HTML remains a readable native table without JavaScript. Controlled Vue props are
authoritative on rerender, while Razor applications are authoritative when replacing server markup.

## Accessibility and security

Supply `caption` unless nearby context already names the data. Do not add `role="grid"`: the
interaction remains native buttons and checkboxes inside a semantic table. Loading and error states
use a polite status cell without hiding an already focused control. All collection data is untrusted
plain data and is contextually escaped; executable accessors and raw markup are rejected.
