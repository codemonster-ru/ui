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

## Reorderable columns

Enable `reorderableColumns` to make each non-interactive header area draggable. The table previews
the new order with a short movement animation while a mouse or touch pointer moves and commits it
when the pointer is released. Focus a header and press Left or Right Arrow for keyboard reordering.
Buttons, inputs, links, and resize handles inside a header keep their own interactions. Set
`reorderable: false` to disable reordering for a column. Movement animation is omitted when reduced
motion is requested or the rendered table contains more than 200 column cells.

```vue
<VfDataTable
  v-model:column-order="columnOrder"
  :columns="columns"
  :rows="rows"
  reorderable-columns
  @column-reorder-end="saveColumnOrder"
/>
```

```ts
import { ref } from 'vue';
import type { VfDataTableColumnOrder } from '@codemonster-ru/vueforge-core';

const storageKey = 'team-table-column-order';
const storedColumnOrder = localStorage.getItem(storageKey);
const columnOrder = ref<VfDataTableColumnOrder>(storedColumnOrder ? JSON.parse(storedColumnOrder) : []);

function saveColumnOrder(order: VfDataTableColumnOrder) {
  localStorage.setItem(storageKey, JSON.stringify(order));
}
```

The table removes unknown and duplicate keys from `columnOrder` and appends new column keys. Storage
remains consumer-owned so applications can choose local, session, remote, or no persistence.

## Column visibility

Pass `visibleColumnKeys` to control which columns render. The table does not prescribe a column
chooser, so the same state can be managed from a toolbar, popover, dialog, or another consumer-owned
interface.

```vue
<VfCheckbox
  v-for="column in optionalColumns"
  :key="column.key"
  :model-value="visibleColumnKeys.includes(column.key)"
  :label="column.header"
  @update:model-value="setColumnVisible(column.key, $event)"
/>

<VfDataTable :visible-column-keys="visibleColumnKeys" :columns="columns" :rows="rows" />
```

Keep required column keys in `visibleColumnKeys` and omit them from the chooser.

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

## Error

Set `error` when loading fails. The error state replaces body rows, is announced to assistive
technology, and uses `labels.error` as its default text. An active loading state takes precedence
over the error state.

Use the `error` slot to provide details or consumer-owned retry behavior:

```vue
<VfDataTable :columns="columns" :rows="rows" :error="Boolean(error)">
  <template #error>
    <div>
      <p>Could not load records.</p>
      <VfButton @click="loadRows">Try again</VfButton>
    </div>
  </template>
</VfDataTable>
```

Fetching and retry behavior remain outside the table.

## Localization

Use `labels` to replace every built-in visible and accessible label. The prop accepts a partial
`VfDataTableLabels` object, so applications only need to provide the labels they want to change.
Function labels receive the values needed for locale-specific formatting and pluralization.

```vue
<VfDataTable
  :columns="columns"
  :rows="rows"
  :labels="{
    empty: 'Нет данных',
    error: 'Не удалось загрузить данные',
    loading: 'Загрузка…',
    rows: 'Строк',
    rowsPerPage: 'Строк на странице',
    pageSummary: (page, pageCount) => `Страница ${page} из ${pageCount}`,
    paginationSummary: (firstRow, lastRow, totalRows) =>
      totalRows === 0 ? 'Нет строк' : `${firstRow}–${lastRow} из ${totalRows}`,
    previousPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
  }"
  pagination
/>
```

`emptyText` and `loadingText` remain supported and take precedence over `labels.empty` and
`labels.loading`, respectively.

## Sorting

Set `sortable: true` on columns that users may sort. Client sorting processes the complete `rows`
array before client pagination. A click cycles through ascending, descending, and unsorted states.

````playground-src
mode: component
framework: vue
height: 460
entry: /App.vue

```vue file=/App.vue
<template>
  <div class="sorting-demo">
    <p>Click headers to add sort columns in priority order.</p>

    <VfDataTable
      v-model:sort="sort"
      :columns="columns"
      :rows="rows"
      :default-page-size="3"
      :page-size-options="[3, 6]"
      caption="Team workload"
      multi-sort
      pagination
      row-key="id"
      striped
    />

    <p class="sorting-demo__state" aria-live="polite">
      Sort:
      <code>{{ sortLabel }}</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { VfDataTable } from '@codemonster-ru/vueforge-core';
import type { VfDataTableColumn, VfDataTableSort } from '@codemonster-ru/vueforge-core';

const columns: VfDataTableColumn[] = [
  { key: 'member', header: 'Member', sortable: true },
  { key: 'team', header: 'Team', sortable: true },
  { key: 'tasks', header: 'Tasks', sortable: true, align: 'end' },
];

const rows = [
  { id: 1, member: 'Alice', team: 'Design', tasks: 12 },
  { id: 2, member: 'Bob', team: 'Platform', tasks: 8 },
  { id: 3, member: 'Carol', team: 'Product', tasks: 15 },
  { id: 4, member: 'Diego', team: 'Design', tasks: 5 },
  { id: 5, member: 'Eve', team: 'Platform', tasks: 3 },
  { id: 6, member: 'Fatima', team: 'Product', tasks: 11 },
];

const sort = ref<VfDataTableSort[]>([]);

const sortLabel = computed(() =>
  sort.value.length ? sort.value.map(({ key, direction }) => `${key} ${direction}`).join(', ') : 'none',
);
</script>

<style scoped>
.sorting-demo {
  display: grid;
  gap: 1rem;
}

.sorting-demo p {
  margin: 0;
}

.sorting-demo__state {
  color: var(--vf-color-text-secondary);
}
</style>
```
````

Enable `multiSort` to let users add criteria with regular clicks. The `sort` array stores criteria
in priority order and the headers display that priority. Clicking a sorted column cycles through
ascending, descending, and removal without clearing the other criteria.

When an API provides already-paged rows, use manual pagination. Manual pagination always leaves row
ordering to the consumer, preventing the component from sorting only the current page:

```vue
<VfDataTable
  v-model:page="page"
  v-model:sort="sort"
  :columns="columns"
  :rows="pageRows"
  :total-rows="totalRows"
  pagination
  pagination-mode="manual"
  sorting-mode="manual"
  @update:sort="loadPage"
/>
```

Changing the sort resets pagination to page 1. Map column keys to the API's field names in the
consumer; the table does not prescribe a server query format.

## Pagination

Client pagination slices local rows. Use `paginationMode="manual"` with `totalRows` when rows are already paged by an API.

```vue
<VfDataTable :columns="columns" :rows="rows" pagination :default-page-size="10" />
```
