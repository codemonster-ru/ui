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

```razor
<cm-table caption="Invoices" :striped="true">
  <razor-slot name="header"><tr><th scope="col">Number</th><th scope="col">Total</th></tr></razor-slot>
  <tr><th scope="row">INV-42</th><td>$120</td></tr>
</cm-table>
```

Table supplies `<thead>`, `<tbody>`, and `<tfoot>` wrappers but does not infer headers, scopes, or
relationships. Its outer element owns forwarded attributes and horizontal scrolling. No runtime is
needed.

## DataTable data model

Columns have a unique kebab-case `key`, non-empty `header`, optional `sortable`, and optional
`align` (`start`, `center`, or `end`). Rows have a unique kebab-case `id` and a `cells` record whose
values are strings, finite numbers, or null. Values are rendered as escaped text.
Set a row's `selectable` field to `false` when it must remain visible but cannot be added to or
removed from the current selection.

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

DataTable does not reorder or fetch rows after an interaction. Handle `sortChange`,
`selectionChange`, and `pageChange` or their Vue models, then supply the authoritative rows and
state. This keeps remote queries, authorization, caching, and error handling in the application.
Select-all affects only eligible rendered rows. A disabled row that is already selected remains
selected until the application changes the controlled selection.

## Razor and progressive enhancement

Razor renders the current server-owned page and state:

```razor
<cm-data-table
  id="accounts"
  caption="Accounts"
  :columns="$columns"
  :rows="$rows"
  :selected-row-ids="$selectedRowIds"
  :sort="$sort"
  :page="$page"
  :page-count="$pageCount"
  :selectable="true"
/>
```

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
- Multi-sort, client query execution, expansion, pinning, resizing, and column reordering are not in
  the stable cross-platform contract. Applications may compose those features outside DataTable
  until a portable contract is approved.
- Do not initialize shared runtime over Vue-owned DataTable markup.
