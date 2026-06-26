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

<script setup>
import { VfDataTable } from '@codemonster-ru/vueforge-core';

const columns = [
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
