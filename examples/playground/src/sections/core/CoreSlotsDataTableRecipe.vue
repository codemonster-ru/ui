<script setup lang="ts">
import { CmBadge, CmTable } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/badge.css';
import '@codemonster-ru/ui-css/table.css';

const rows = [
  { id: 1, member: 'Alice', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', status: 'Offline', tasks: 3 },
] as const;

function statusTone(status: (typeof rows)[number]['status']): 'success' | 'warning' | 'neutral' {
  if (status === 'Available') return 'success';
  if (status === 'Busy') return 'warning';
  return 'neutral';
}
</script>

<template>
  <CmTable class="demo-application-slots-table">
    <template #header>
      <tr>
        <th scope="col">Member</th>
        <th scope="col">Status</th>
        <th class="demo-application-slots-table__tasks" scope="col">
          <span class="demo-application-slots-table__header-content">Tasks open</span>
        </th>
      </tr>
    </template>

    <tr v-for="row in rows" :key="row.id" :data-core-slots-table-row="row.id">
      <td>{{ row.member }}</td>
      <td>
        <CmBadge :tone="statusTone(row.status)">{{ row.status }}</CmBadge>
      </td>
      <td class="demo-application-slots-table__tasks">{{ row.tasks }}</td>
    </tr>

    <template #footer>
      <tr>
        <td colspan="3">Total: 43 open tasks</td>
      </tr>
    </template>
  </CmTable>
</template>

<style scoped>
.demo-application-slots-table__header-content {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.demo-application-slots-table__tasks {
  text-align: end;
}
</style>
