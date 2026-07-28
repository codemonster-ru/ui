# Features

Data table renders structured rows from column definitions.

## Import

```ts
import { VfDataTable } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDataTable
    caption="Team roster"
    :columns="columns"
    :rows="rows"
    row-key="id"
    striped
    column-dividers
  />
</template>

<script setup lang="ts">
import { VfDataTable, type VfDataTableColumn } from '@codemonster-ru/vueforge-core';

const columns: VfDataTableColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
];

const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline', tasks: 3 },
];
</script>
```
````

## Cell Slots

Use `cell-{key}` slots to format individual columns without taking over the full table markup.

```vue
<VfDataTable :columns="columns" :rows="rows" row-key="id" density="compact">
  <template #cell-status="{ value }">
    {{ String(value).toUpperCase() }}
  </template>
</VfDataTable>
```

## Column sizing and alignment

Set `width`, `minWidth`, and `maxWidth` on a column to constrain its header and cells. Set `nowrap`
when compact content such as actions or statuses must remain on one line. Use `align` for horizontal
alignment and `verticalAlign` for vertical alignment.

```ts
const columns: VfDataTableColumn[] = [
  { key: 'member', header: 'Member', minWidth: '10rem', maxWidth: '24rem' },
  { key: 'role', header: 'Role', verticalAlign: 'middle' },
  { key: 'tasks', header: 'Tasks', width: '1%', minWidth: '6rem', nowrap: true, align: 'end' },
];
```

## Resizable columns

Enable `resizableColumns` to render a resize handle between columns. Drag a handle with a pointer,
focus it and press Left or Right Arrow, or double-click it to fit the column to its widest rendered
cell. Hovering a header previews its resizable edge; hovering or focusing the edge highlights the
same boundary through the header and visible body rows. A column with `resizable: false` does not
expose a handle.

Resizing preserves the combined width of the active and adjacent columns, so every other column
boundary and the overall table width remain fixed. The last column and a column followed by
`resizable: false` do not expose a handle.

```vue
<VfDataTable
  v-model:column-widths="columnWidths"
  :columns="columns"
  :rows="rows"
  resizable-columns
  @column-resize-end="saveColumnWidths"
/>
```

```ts
import { ref } from 'vue';
import type { VfDataTableColumnWidths } from '@codemonster-ru/vueforge-core';

const storageKey = 'team-table-column-widths';
const storedColumnWidths = localStorage.getItem(storageKey);
const columnWidths = ref<VfDataTableColumnWidths>(storedColumnWidths ? JSON.parse(storedColumnWidths) : {});

function saveColumnWidths(widths: VfDataTableColumnWidths) {
  localStorage.setItem(storageKey, JSON.stringify(widths));
}
```

`columnWidths` is a serializable record keyed by `VfDataTableColumn.key`. Persist on
`column-resize-end` instead of on every `update:columnWidths` event.

## Row selection

Set `selectable` and provide a stable `row-key` to render row checkboxes and a select-all checkbox.
Use `v-model:selected-row-keys` when the selected keys are controlled by the parent.

```vue
<VfDataTable
  v-model:selected-row-keys="selectedRowKeys"
  selectable
  row-key="id"
  :columns="columns"
  :rows="rows"
  striped
/>
```

The header checkbox becomes indeterminate when only some visible rows are selected. Use the
selected keys to perform bulk actions such as deleting the selected records.

## Loading

The default loading state renders a mask over the current table with a progress spinner. Use `loadingVariant="skeleton"` for placeholder rows.

```vue
<VfDataTable :columns="columns" loading loading-variant="skeleton" :loading-rows="4" />
```

Use the `loading` slot to replace the mask content when visible text or custom layout is needed.

## Pagination

Client pagination slices local rows. Use `paginationMode="manual"` with `totalRows` when rows are already paged by an API.

```vue
<VfDataTable :columns="columns" :rows="rows" pagination :default-page-size="10" />
```
