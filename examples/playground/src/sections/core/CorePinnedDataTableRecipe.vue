<script setup lang="ts">
import { CmButton } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/button.css';

const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline', tasks: 3 },
] as const;
</script>

<template>
  <div class="demo-application-pinned-table">
    <div class="demo-application-pinned-table__scroll" tabindex="0" aria-label="Scrollable pinned team table">
      <table class="demo-application-pinned-table__table">
        <thead>
          <tr>
            <th class="demo-application-pinned-table__pinned demo-application-pinned-table__pinned--start" scope="col">
              Member
            </th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th class="demo-application-pinned-table__tasks" scope="col">Tasks</th>
            <th class="demo-application-pinned-table__pinned demo-application-pinned-table__pinned--end" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" :data-core-pinned-row="row.id">
            <td class="demo-application-pinned-table__pinned demo-application-pinned-table__pinned--start">
              {{ row.member }}
            </td>
            <td>{{ row.role }}</td>
            <td>{{ row.status }}</td>
            <td class="demo-application-pinned-table__tasks">{{ row.tasks }}</td>
            <td class="demo-application-pinned-table__pinned demo-application-pinned-table__pinned--end">
              <CmButton size="sm" variant="ghost">Edit</CmButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.demo-application-pinned-table {
  display: flex;
  width: 100%;
  max-width: 32rem;
  min-width: 0;
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.demo-application-pinned-table__scroll {
  width: 100%;
  overflow-x: auto;
}

.demo-application-pinned-table__scroll:focus-visible {
  outline: var(--cm-focus-ring-width) solid var(--cm-color-interactive-primary-border);
  outline-offset: calc(-1 * var(--cm-focus-ring-width));
}

.demo-application-pinned-table__table {
  width: 100%;
  min-width: 49rem;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.demo-application-pinned-table__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.demo-application-pinned-table__table :where(th, td):nth-child(1),
.demo-application-pinned-table__table :where(th, td):nth-child(2) {
  min-width: 12rem;
}

.demo-application-pinned-table__table :where(th, td):nth-child(3) {
  min-width: 10rem;
}

.demo-application-pinned-table__table :where(th, td):nth-child(4) {
  min-width: 8rem;
}

.demo-application-pinned-table__table :where(th, td):nth-child(5) {
  width: 1%;
  min-width: 7rem;
}

.demo-application-pinned-table__table th {
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-pinned-table__table tbody tr + tr td {
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-pinned-table__table :where(th, td) + :where(th, td) {
  border-inline-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-pinned-table__table tbody tr:nth-child(even) td {
  background: color-mix(in srgb, var(--cm-color-background-surface) 65%, var(--cm-color-background-surface-hover) 35%);
}

.demo-application-pinned-table__pinned {
  position: sticky;
  z-index: 1;
  background: var(--cm-color-background-surface);
  white-space: nowrap;
}

th.demo-application-pinned-table__pinned {
  z-index: 2;
  background: var(--cm-color-background-surface);
}

.demo-application-pinned-table__table tbody tr:nth-child(even) .demo-application-pinned-table__pinned {
  background: color-mix(in srgb, var(--cm-color-background-surface) 65%, var(--cm-color-background-surface-hover) 35%);
}

.demo-application-pinned-table__pinned--start {
  inset-inline-start: 0;
}

.demo-application-pinned-table__pinned--end {
  inset-inline-end: 0;
  border-inline-start-color: transparent !important;
}

.demo-application-pinned-table__pinned--start::after,
.demo-application-pinned-table__pinned--end::after {
  position: absolute;
  inset-block: 0;
  width: var(--cm-border-width);
  background: var(--cm-color-border-divider);
  content: '';
  pointer-events: none;
}

.demo-application-pinned-table__pinned--start::after {
  inset-inline-end: 0;
}

.demo-application-pinned-table__pinned--end::after {
  inset-inline-start: 0;
}

.demo-application-pinned-table__pinned--start + :where(th, td) {
  border-inline-start-color: transparent !important;
}

.demo-application-pinned-table__tasks {
  text-align: end !important;
}

@media (forced-colors: active) {
  .demo-application-pinned-table,
  .demo-application-pinned-table__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
