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
Rows may set `selectable` to false to declare that their selection checkbox is disabled.

Applications format dates, numbers, status labels, and links before or around this baseline. The
shared data API deliberately excludes arbitrary HTML cells, client-side query execution, multi-sort,
row expansion, column pinning, resizing, and reordering. Those capabilities require a separate
portable contract rather than callbacks or framework-only slots.

## Structure and states

The root owns `cm-data-table`, the shared controller marker, current sort/page data attributes, and
selected-count state. It contains a responsive table scroll region and, when `pageCount > 1`, a
pagination navigation region. An optional ordered `pageSizeOptions` collection renders a native
page-size select and must contain the current positive `pageSize`. When non-negative `totalRows` is
provided, DataTable derives `pageCount`, renders the visible row range, and keeps both summaries in
sync with page-size requests. Caption, headers, cells, state messages, labels, templates, and
attributes are escaped. Loading takes precedence over error; error takes precedence over empty rows.

Presentation props map to the same stable table modifiers as Table. `density="compact"` is the only
non-default density. Sorting uses `aria-sort` on the owning `<th>` and a native button. Selection uses
native checkboxes with row-specific accessible names. The select-all checkbox covers only enabled
rendered rows and exposes native checked, indeterminate, or disabled state. Selection changes retain
already selected disabled rows while adding or removing only eligible rows.

## Interaction and ownership

Activating a sortable header cycles unsorted → ascending → descending → unsorted, updates rendered
sort state optimistically, and reports `sortChange`. DataTable never reorders rows itself; the
application supplies rows in the requested order. Selection updates native controls and reports
`selectionChange` in rendered row order. Previous and next buttons clamp to `1...pageCount`, update
the requested page, and report `pageChange`; applications replace rows for that page. Changing the
page-size select reports `pageSizeChange`, resets the requested page to one, and reports that page
change when necessary. DataTable calculates page count only when `totalRows` is supplied; it never
slices or fetches rows. Summary templates require their documented placeholders. Visible previous
and next text is independent from the buttons' accessible labels so both can be localized.

Vue owns interaction directly. Server-rendered Razor markup uses the shared DataTable controller.
The initial HTML remains a readable native table without JavaScript. Controlled Vue props are
authoritative on rerender, while Razor applications are authoritative when replacing server markup.

## Accessibility and security

Supply `caption` unless nearby context already names the data. Do not add `role="grid"`: the
interaction remains native buttons and checkboxes inside a semantic table. Loading and error states
use a polite status cell without hiding an already focused control. All collection data is untrusted
plain data and is contextually escaped; executable accessors and raw markup are rejected.
