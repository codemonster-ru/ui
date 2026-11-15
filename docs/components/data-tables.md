# Table and DataTable

`Table` is a responsive semantic frame for application-authored native rows. `DataTable` renders
plain scalar data and reports sorting, selection, and pagination requests without becoming an ARIA
grid or owning application queries.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are available through the `table.css` and `data-table.css` npm subpath exports.

## Table

Table accepts `caption`, `density` (`default` or `compact`), `striped`, `columnDividers`, and
`stickyHeader`. Header, default body, footer, and caption slots contain trusted native table markup.

```vue
<CmTable caption="Invoices" striped>
  <template #header><tr><th scope="col">Number</th><th scope="col">Total</th></tr></template>
  <tr><th scope="row">INV-42</th><td>$120</td></tr>
</CmTable>
```

Vanilla markup: [table HTML](../../contracts/table/cases/default.html).

Table supplies `<thead>`, `<tbody>`, and `<tfoot>` wrappers but does not infer headers, scopes, or
relationships. Its outer element owns forwarded attributes and horizontal scrolling. No runtime is
needed.

## DataTable data model

Columns have a unique kebab-case `key`, non-empty `header`, optional `sortable`, and optional
`align` (`start`, `center`, or `end`). Rows have a unique kebab-case `id` and a `cells` record whose
values are strings, finite numbers, or null. Values are rendered as escaped text.
Set a row's `selectable` field to `false` when it must remain visible but cannot be added to or
removed from the current selection. In Vue, `rowSelectable(row, rowIndex)` can apply the same
restriction conditionally to a rendered row.
Pass `visibleColumnKeys` in the desired display order to hide or rearrange columns without changing
the complete column and row data. In Vue, `columnOrder` can supply an order separately from
visibility. Unlisted visible columns stay at the end in their existing order. Columns can set
`width`, `minWidth`, `maxWidth`, `nowrap`, `verticalAlign`, and header `scope`. A supplied
`columnWidths` entry overrides that column's width. The application owns the chooser UI and
persistence.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmDataTable, type CmDataTableSort } from '@codemonster-ru/ui-vue';

const selected = ref<string[]>(['atlas']);
const sort = ref<CmDataTableSort | null>({ key: 'name', direction: 'ascending' });
const page = ref(1);
const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];
const rows = [
  { id: 'atlas', cells: { name: 'Atlas', status: 'Active' } },
  { id: 'nova', cells: { name: 'Nova', status: 'Paused' } },
];
</script>

<template>
  <CmDataTable
    id="accounts"
    v-model:selected-row-ids="selected"
    v-model:sort="sort"
    v-model:page="page"
    caption="Accounts"
    :columns="columns"
    :rows="rows"
    :total-rows="25"
    selectable
  />
</template>
```

DataTable uses manual sorting and paging by default. Handle `sortChange`, `selectionChange`,
and `pageChange` or their Vue models, then supply the authoritative rows and state. DataTable
does no fetching.

When Vue has the complete row collection, set `sortingMode="client"` to sort scalar values
in the browser and `paginationMode="client"` to derive the row count and display one page.
Client sorting orders finite numbers numerically and text case-insensitively with natural
number ordering. Empty values stay last. Active client sorting runs before client paging.
Explicit manual paging (`pagination` with `paginationMode="manual"`) preserves the supplied
page's order and still reports sort requests. Set `:pagination="false"` to hide the pager
and show all supplied rows.

For ordered sorting in Vue, bind `v-model:sort-list` and set `multiSort`. Each item uses the
current `ascending` or `descending` direction. The first column is primary; subsequent columns
break ties. A header cycles through ascending, descending, and removal while leaving the other
criteria in order. The table announces only the primary sort through `aria-sort` and shows
the priority beside each sorted column.

The historical `VfDataTable` entry from `@codemonster-ru/ui-vue/historical` combines the same
renderer with the original `sort` array (`asc`/`desc`), `selectedRowKeys` and `expandedRowKeys`
models. Use `rowKey` with a field path or resolver: numeric `42` and string `"42"` remain distinct.
The default key is the original source index, so selection remains attached while client sorting
reorders the view. Client sorting and, when enabled, client paging are the historical defaults.
The adapter also restores caption and cell/expanded slots, optional column headers, and a
generated table ID.

Enable `pagination` on `VfDataTable` for numbered pages. Up to seven pages show every number.
Longer ranges show the first and last pages, numbers near the current page, and ellipses for
omitted pages. Below a 480 px pager width, the current page and arrow buttons stay visible.
Use `labels.pageSummary(page, pageCount)` for the current page name, `labels.goToPage(page)`
for other page buttons, and `labels.paginationSummary(first, last, total)` for the row range.
Use `v-model:page` and `v-model:page-size` to own the selection. For server-paged rows, set
`paginationMode="manual"` and provide `totalRows`. Client paging derives its count from the
supplied rows. `CmDataTable` and the Vanilla controller use the previous/next pager by default.

Select-all affects only eligible rendered rows. Vue preserves selections outside the current page.
A disabled row that is already selected remains selected until the application changes the
selection.

Vue accepts a `caption` slot and a `footer` slot containing native table rows. Use
`header-<key>` to customize a heading with its `column`, or `cell-<key>` to render a value
with `row`, `column`, `value`, and the zero-based `rowIndex`. Sortable headings keep their
native sort button and accessible action label. Use the `loading`, `error`, and `empty` slots
to customize their status row. The equivalent Vanilla markup contains the authored text and
elements directly in the corresponding table regions.

Add an `expanded-row` or `expandedRow` slot to enable a labelled disclosure button in each row. The slot
receives `row`, `rowKey` (the row ID), and `rowIndex`. Use `defaultExpandedRowKeys` for
initial expansion or `v-model:expanded-row-keys` for controlled state. Customize the
accessible action labels with `expandRowLabelTemplate` and `collapseRowLabelTemplate`
using the `{row}` placeholder.

In [authored Vanilla rows](../../contracts/data-table/cases/expansion.html), link a native
`data-cm-data-table-expand` button to a details row in the same table body with `aria-controls`.
The controller updates `aria-expanded` and `hidden`, then dispatches
`cm:data-table-expansion-change` with `detail.rowId` and `detail.expanded`. Optional
`data-cm-data-table-expand-label` and `data-cm-data-table-collapse-label` supply the accessible
names after activation. A hidden Vanilla detail row still submits any named enabled form
controls. Vue renders its detail slot only while expanded.

Set `loadingVariant="skeleton"` to show placeholder rows when loading. Adjust their count
with `loadingRows` (default three). The placeholders are hidden from assistive technology
and the loading message remains available as a status announcement. Set
`loadingVariant="mask"` to keep loaded rows in place behind the loading status mask. The
covered table is inert while loading. The default `status` variant shows a single status row.

Localize selection and sorting accessible names with `selectAllLabel`, `selectRowLabelTemplate`,
`sortAscendingLabelTemplate`, `sortDescendingLabelTemplate`, and `clearSortLabelTemplate`. The row
template must contain `{row}`; each sort template must contain `{column}`. Vanilla HTML uses the equivalent
kebab-case props and the shared runtime preserves those labels as sorting cycles.

### Using host records

Pass `rowKey` to render existing records without copying each one into an `{ id, cells }` object.
A string reads an own property path, such as `account.id`. A function receives the original row
and its zero-based source index before client sorting and pagination. Column keys can read nested
properties in the same way. Cell and expanded-row slots, plus the `rowSelectable` callback, receive
the original row object.

Selection and expansion keep their string IDs. Finite numeric keys convert to strings, so the
number `7` and string `"7"` refer to the same ID. A missing path uses its source index. Duplicate
IDs and malformed keys are omitted with a development diagnostic. Cell fallbacks render strings,
finite numbers, and empty values. A scoped cell can render other fields directly from the row.

### Resizing columns

Set `resizable-columns` to expose a focusable separator between two resizable columns. Drag it,
press Left or Right Arrow to move it 8 px, or double-click it to fit the widest rendered cell.
The separator reports its accessible name, current width and bounds. The two columns trade width
within their `minWidth` and `maxWidth` limits. The final column and boundaries touching a column
with `resizable: false` have no separator.

Use `defaultColumnWidths` for initial widths or `v-model:column-widths` to own the width map.
`column-resize-end` reports the final widths once per completed interaction. Localize the separator
name with `resizeColumnLabelTemplate` and the `{column}` placeholder.

In Vanilla, use the [resizable fixture](../../contracts/data-table/cases/resizable.html) and the
DataTable controller. It updates the header and body cell widths and dispatches
`cm:data-table-column-widths-change` and `cm:data-table-column-resize-end`, each with
`detail.columnWidths`.

### Action labels in Vue

`VfDataTable` accepts `labels.selectRow`, `labels.expandRow`, and `labels.collapseRow` callbacks.
Each receives a one-based row position on the displayed page. `labels.sortAscending`,
`labels.sortDescending`, `labels.clearSort`, and `labels.resizeColumn` receive the column's
header text or its key when the header is omitted. Sort labels describe the next action.
Omitted callbacks use the built-in labels. `CmDataTable` accepts the same optional callbacks
through `actionLabels`, with its label templates as fallbacks.

### Reordering columns in Vue

Set `reorderableColumns` on `VfDataTable`. Drag a header or focus it and press Left or Right
Arrow. A drag previews the order and commits on release. Escape cancels the preview.
Columns move within their start-pinned, unpinned, or end-pinned group. A column with
`reorderable: false` cannot initiate a move. Other columns in the same group can pass it.

Use `defaultColumnOrder` for the initial order or `v-model:column-order` to own it.
`column-reorder-end` reports the full key array, including hidden columns, once per completed
move. Use `labels.reorderColumn`, `labels.reorderColumnInstructions`, and `labels.columnMoved`
for accessible names, instructions, and announcements. Sort buttons and resize separators have
their own controls. In Vanilla HTML, the application owns changes to the authored column order.

### Pinning columns

Set a column's `pinned` value to `start` or `end` to keep it in view during horizontal scrolling.
The table groups visible columns by pin side and preserves their order within each group. It
uses the rendered header widths to keep adjacent pins aligned after a resize. The logical sides
follow the text direction.

For Vanilla HTML, [author the pinned header and body cells](../../contracts/data-table/cases/pinned.html)
in their final order with matching `data-cm-data-table-column` keys and `data-cm-data-table-pin` sides.
The DataTable controller applies the measured offsets. The authored table remains scrollable
before enhancement.

## Vanilla HTML and progressive enhancement

Vanilla HTML renders the current server-owned page and state:

Vanilla markup: [data-table HTML](../../contracts/data-table/cases/default.html).

Register only the DataTable controller, then translate custom events into navigation, a request, or
another server render:

```ts
import { CmRuntime, createCmDataTableController } from '@codemonster-ru/ui-runtime';

new CmRuntime().register('data-table', createCmDataTableController).start(document);

document.querySelector('#accounts')?.addEventListener('cm:data-table-sort-change', (event) => {
  const sort = (event as CustomEvent<{ sort: { key: string; direction: string } | null }>).detail.sort;
  console.log(sort);
});
```

Pass `page-size` and an ordered `page-size-options` array to render a native page-size selector.
Changing it reports `pageSizeChange` in Vue or `cm:data-table-page-size-change` through the shared
runtime and requests page one when the current page is not already the first. The application still
owns row fetching and the rows supplied for the requested page. Pass `total-rows` to derive the page
count and render `firstRow-lastRow of totalRows`; omit it when the application owns `page-count`.
The page and range summary templates plus visible previous/next text can be localized independently
from the buttons' accessible labels.

Vanilla templates render visible columns in the same order in the header and each row. Use the
[ColumnChooser](#choosing-columns) to report an ordered list of visible column keys. The
application owns the required-column policy, persistence and table rendering.

The controller cycles one sortable column through ascending, descending, and unsorted states. It
synchronizes native row checkboxes and clamps previous/next page requests. It does not reorder,
hide, or replace rows. Without JavaScript, users retain a readable semantic table.

## Scope, accessibility, and security

- Give each standalone table a caption or an equivalent nearby name.
- DataTable uses a native table with buttons and checkboxes, not `role="grid"`; ordinary table and
  form-control keyboard behavior remains available.
- Loading takes precedence over error, and error takes precedence over the empty state.
- Format dates, money, links, and status text before passing the shared scalar data model.
- Treat row and column values as untrusted. Both adapters escape them and reject arbitrary HTML,
  executable accessors, unknown cell keys, duplicate identifiers, and non-finite numbers.
- Supply rich cell and header content as trusted Vue slots or authored Vanilla markup. The
  Vanilla table controller leaves expanded content and its state to the application.
- Multi-sort query semantics and interactive column pinning, resizing, and reordering remain
  application-owned policy. `visibleColumnKeys` covers the stable shared visibility/order state.
- Vanilla templates can render skeleton rows with `.cm-skeleton` markup and a loading status
  announcement. The standard portable loading state uses a visible status row.
- Do not initialize shared runtime over Vue-owned DataTable markup.

## Choosing columns

`CmColumnChooser` is a popover of checkboxes that decides which columns a table shows. Popover owns
disclosure and focus. The chooser reports the shown keys in declaration order so the table can be
handed them directly.

Required columns are always shown and cannot be cleared. A chooser whose columns are all required
reads as fully shown and disabled, because there is nothing left to reveal — which is deliberately
unlike the select-all checkbox on rows, where nothing selectable means nothing is checked.

```vue
<script setup lang="ts">
import { CmColumnChooser, CmDataTable } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'owner', header: 'Owner' },
  { key: 'size', header: 'Size' },
];
const visibleColumnKeys = ref<string[] | null>(null);
const rows = [
  { id: 'atlas', cells: { name: 'Atlas', owner: 'Ada', size: '4 MB' } },
  { id: 'beacon', cells: { name: 'Beacon', owner: 'Grace', size: '2 MB' } },
];
</script>

<template>
  <CmColumnChooser
    id="projects-columns"
    v-model:visible-column-keys="visibleColumnKeys"
    :columns="columns"
    :required-column-keys="['name']"
  />
  <CmDataTable id="projects" :columns="columns" :rows="rows" :visible-column-keys="visibleColumnKeys" />
</template>
```

Vanilla markup: [column-chooser HTML](../../contracts/column-chooser/cases/default.html).

In Vue, `VfDataTableColumnChooser` from `@codemonster-ru/ui-vue/historical` restores the default
gear trigger, generated ID, body portal and historical `v-model` binding. The `trigger` slot
receives `visibleColumnKeys` and `disabled`; it can supply one native or Vue button. With a bound
model, the chooser emits the proposed keys in column order and displays the accepted model value.
Without a model, the historical chooser displays every column and still emits the proposed keys.

Render the initial checked state in HTML. Put `data-cm-column-chooser-key` on each option checkbox
and `data-cm-column-chooser-all` on the aggregate checkbox. Mark required options with
`data-cm-column-chooser-required`, `checked` and `disabled`. Give every checkbox a native label
and use a unique trigger and panel ID for each chooser.

Register both `popover` and `column-chooser` for the canonical root's
`data-cm-controller="popover column-chooser"`. The Vanilla showcase bundle registers both for you.

```ts
import {
  CmRuntime,
  createCmColumnChooserController,
  createCmPopoverController,
  type ColumnChooserVisibleColumnsChangeDetail,
} from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime()
  .register('popover', createCmPopoverController)
  .register('column-chooser', createCmColumnChooserController);
runtime.start(document);

document.addEventListener('cm:column-chooser-visible-columns-change', (event) => {
  const { visibleColumnKeys } = (event as CustomEvent<ColumnChooserVisibleColumnsChangeDetail>).detail;
  console.log(visibleColumnKeys);
});
```

The event bubbles after the controller updates the checked and indeterminate properties. Use
the reported keys to update the table or request a new server render. Opening and closing the
panel leaves the selection intact. For an enhanced subtree that will be removed, call
`runtime.stop(root)` or use `runtime.observe(container)` for automatic disposal.
