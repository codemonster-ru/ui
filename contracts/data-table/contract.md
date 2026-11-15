# DataTable contract

Status: Active

Component: `DataTable`

## Purpose and data model

DataTable renders application-owned tabular data with portable sorting, selection, and pagination
requests. `id` is a stable kebab-case prefix. `columns` is a non-empty ordered collection with unique
kebab-case `key`, non-empty escaped `header`, optional `sortable`, and optional `align` (`start`,
`center`, or `end`). `rows` contains unique kebab-case `id` values and a `cells` record keyed by
columns. Cell values are strings, finite numbers, or null and are rendered as escaped text.
Rows may set `selectable` to false to declare that their selection checkbox is disabled.
An optional non-empty `visibleColumnKeys` collection of unique keys selects and orders rendered
columns. Every key must identify a declared column; row cells remain validated against the complete
column collection.

Applications format dates, numbers, status labels, and links before or around this baseline. The
shared data API deliberately excludes arbitrary HTML cells, client-side query execution, multi-sort,
interactive column reordering, pinning, and resizing. Rich row content belongs in an
application-owned `Table` composition; advanced query, layout, and persistence policy remains with
the application rather than crossing the scalar boundary through callbacks or framework-only slots.

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
Selection and sorting accessible names are localizable through required-placeholder templates:
`selectRowLabelTemplate` uses `{row}`, while the ascending, descending, and clear-sort templates use
`{column}`. Vanilla HTML carries the sort templates in data attributes so the shared runtime can preserve
the localized name throughout the sort cycle.

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

Vue owns interaction directly. Server-rendered Vanilla HTML markup uses the shared DataTable controller.
The initial HTML remains a readable native table without JavaScript. Controlled Vue props are
authoritative on rerender, while Vanilla applications are authoritative when replacing server markup.

Vue also supports custom contents in the pagination region. The `pagination` slot receives
`page`, `pageCount`, `pageSize`, `pageSizeOptions`, `totalRows`, and `renderedRowCount`.

For row details in Vanilla, place a native `button type="button"` with `data-cm-data-table-expand`,
`aria-expanded`, and `aria-controls` in the data row. Give the details `tr` the corresponding ID
and `cm-data-table__expanded-row`, with both rows in the same table body. Mark collapsed details
`hidden`. The runtime updates visibility and `aria-expanded` and sends
`cm:data-table-expansion-change` with `{ rowId, expanded }` from the owning table root.
The optional `data-cm-data-table-expand-label` and `data-cm-data-table-collapse-label` supply the
localized accessible names. Closing while focus is inside the details returns focus to its button.

The Vanilla details stay mounted, so enabled named controls still submit while hidden. The
application owns any decision to disable those controls. Vue mounts its scoped detail content
while the row is expanded.

## Accessibility and security

Supply `caption` unless nearby context already names the data. Do not add `role="grid"`: the
interaction remains native buttons and checkboxes inside a semantic table. Loading and error states
use a polite status cell without hiding an already focused control. All collection data is untrusted
plain data and is contextually escaped; executable accessors and raw markup are rejected.

The stable loading status is the portable DataTable fallback. Applications that require skeleton
rows compose `Skeleton` with an authored `Table`; DataTable does not own a second layout model.

With resizable columns, each adjacent resizable pair has a focusable vertical separator.
Pointer drag, Left or Right Arrow, and double-click redistribute the pair's combined width,
within the two columns' size bounds. Double-click fits the first column to its widest
rendered cell. The Vue adapter reports `update:columnWidths` during a resize and
`column-resize-end` at the end. Vanilla dispatches the corresponding
`cm:data-table-column-widths-change` and `cm:data-table-column-resize-end` events.

A column's `pinned` value of `start` or `end` keeps it at that logical edge while the table scrolls.
The Vue adapter groups the visible columns by pin side and retains each group's order. Vanilla
HTML authors the same final order. The measured header widths determine cumulative offsets for
adjacent pins and are updated after a resize. Native selection, sorting, and resizing controls
keep their own behavior in pinned cells.

Vue accepts host records when `rowKey` is set. String keys and column keys read own properties
through dot paths. A row key function receives the original row and its source index before client
sorting or paging. A missing path uses the source index, and finite numbers convert to strings.
Duplicate or malformed keys are dropped. Cell and expanded-row slots and the selection predicate
receive the original record. Vanilla templates render the resulting stable string row IDs and
cell values directly.
