<script setup lang="ts">
const columns = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
] as const;

const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available' },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy' },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available' },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away' },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline' },
  { id: 6, member: 'Frank', role: 'Support', status: 'Available' },
  { id: 7, member: 'Grace', role: 'Platform', status: 'Busy' },
] as const;
</script>

<template>
  <div class="core-sticky-data-table-recipe">
    <div class="core-sticky-data-table-recipe__scroll">
      <table class="core-sticky-data-table-recipe__table">
        <thead class="core-sticky-data-table-recipe__head">
          <tr>
            <th
              v-for="(column, columnIndex) in columns"
              :key="column.key"
              class="core-sticky-data-table-recipe__header-cell"
              :data-core-column-index="columnIndex"
              :data-core-column-key="column.key"
              scope="col"
            >
              <span class="core-sticky-data-table-recipe__header-content">{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="core-sticky-data-table-recipe__body">
          <tr v-for="row in rows" :key="row.id" class="core-sticky-data-table-recipe__data-row">
            <td
              v-for="(column, columnIndex) in columns"
              :key="column.key"
              class="core-sticky-data-table-recipe__cell"
              :data-core-column-index="columnIndex"
              :data-core-column-key="column.key"
            >
              {{ row[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.core-sticky-data-table-recipe {
  display: flex;
  inline-size: 100%;
  max-block-size: 13rem;
  min-inline-size: 0;
  flex-direction: column;
  overflow: auto;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.core-sticky-data-table-recipe__scroll {
  position: relative;
  inline-size: 100%;
  overflow-x: auto;
}

.core-sticky-data-table-recipe__table {
  inline-size: 100%;
  min-inline-size: 36rem;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.core-sticky-data-table-recipe__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  color: var(--cm-color-text-primary);
  text-align: start;
  vertical-align: top;
}

.core-sticky-data-table-recipe__header-cell {
  position: sticky;
  z-index: 1;
  inset-block-start: 0;
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  font-weight: var(--cm-font-weight-medium);
}

.core-sticky-data-table-recipe__header-content {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-sticky-data-table-recipe__body > tr + tr > td {
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

@media (forced-colors: active) {
  .core-sticky-data-table-recipe,
  .core-sticky-data-table-recipe__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
