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

Select-all affects only eligible rendered rows. Vue preserves selections outside the current page.
A disabled row that is already selected remains selected until the application changes the
selection.

Vue accepts a `caption` slot and a `footer` slot containing native table rows. Use
`header-<key>` to customize a heading with its `column`, or `cell-<key>` to render a value
with `row`, `column`, `value`, and the zero-based `rowIndex`. Sortable headings keep their
native sort button and accessible action label. Use the `loading`, `error`, and `empty` slots
to customize their status row. The equivalent Vanilla markup contains the authored text and
elements directly in the corresponding table regions.

Add an `expanded-row` slot to enable a labelled disclosure button in each row. The slot
receives `row`, `rowKey` (the row ID), and `rowIndex`. Use `defaultExpandedRowKeys` for
initial expansion or `v-model:expanded-row-keys` for controlled state. Customize the
accessible action labels with `expandRowLabelTemplate` and `collapseRowLabelTemplate`
using the `{row}` placeholder.

Set `loadingVariant="skeleton"` to show placeholder rows when loading. Adjust their count
with `loadingRows` (default three). The placeholders are hidden from assistive technology
and the loading message remains available as a status announcement. Set
`loadingVariant="mask"` to keep loaded rows in place behind the loading status mask. The
covered table is inert while loading. The default `status` variant shows a single status row.

Localize selection and sorting accessible names with `selectAllLabel`, `selectRowLabelTemplate`,
`sortAscendingLabelTemplate`, `sortDescendingLabelTemplate`, and `clearSortLabelTemplate`. The row
template must contain `{row}`; each sort template must contain `{column}`. Vanilla HTML uses the equivalent
kebab-case props and the shared runtime preserves those labels as sorting cycles.

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
