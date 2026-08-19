<script setup lang="ts">
import { computed } from 'vue';

export interface CoreDataTableRecipeColumn {
  key: string;
  header: string;
  align?: 'start' | 'center' | 'end';
}

export interface CoreDataTableRecipeRow {
  id: string | number;
  cells: Readonly<Record<string, string | number | null>>;
}

const props = withDefaults(
  defineProps<{
    id: string;
    columns: readonly CoreDataTableRecipeColumn[];
    rows?: readonly CoreDataTableRecipeRow[];
    caption?: string;
    label?: string;
    density?: 'default' | 'compact';
    striped?: boolean;
    columnDividers?: boolean;
    visibleColumnKeys?: readonly string[] | null;
    emptyText?: string;
  }>(),
  {
    rows: () => [],
    caption: '',
    label: '',
    density: 'default',
    visibleColumnKeys: null,
    emptyText: 'No data',
  },
);

const visibleColumns = computed(() => {
  if (props.visibleColumnKeys === null) return props.columns;
  const visibleKeys = new Set(props.visibleColumnKeys);
  return props.columns.filter(({ key }) => visibleKeys.has(key));
});
</script>

<template>
  <div
    :id="props.id"
    class="core-data-table-recipe"
    :class="{
      'core-data-table-recipe--compact': props.density === 'compact',
      'core-data-table-recipe--striped': props.striped,
      'core-data-table-recipe--column-dividers': props.columnDividers,
    }"
  >
    <div class="core-data-table-recipe__scroll">
      <table class="core-data-table-recipe__table" :aria-label="!props.caption && props.label ? props.label : undefined">
        <caption v-if="props.caption" class="core-data-table-recipe__caption">
          {{ props.caption }}
        </caption>
        <thead class="core-data-table-recipe__head">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              :class="column.align && column.align !== 'start' && `core-data-table-recipe__cell--${column.align}`"
              scope="col"
            >
              <span class="core-data-table-recipe__header-content">{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="core-data-table-recipe__body">
          <tr v-for="row in props.rows" :key="row.id" :data-core-data-table-row="String(row.id)">
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              :class="column.align && column.align !== 'start' && `core-data-table-recipe__cell--${column.align}`"
            >
              {{ row.cells[column.key] }}
            </td>
          </tr>
          <tr v-if="props.rows.length === 0" class="core-data-table-recipe__state-row">
            <td class="core-data-table-recipe__state-cell" :colspan="visibleColumns.length">
              {{ props.emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.core-data-table-recipe {
  display: flex;
  inline-size: 100%;
  min-inline-size: 0;
  flex-direction: column;
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.core-data-table-recipe__scroll {
  position: relative;
  inline-size: 100%;
  overflow-x: auto;
}

.core-data-table-recipe__table {
  inline-size: 100%;
  min-inline-size: calc(var(--cm-space-16) * 9);
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.core-data-table-recipe__caption {
  padding: var(--cm-field-padding-lg);
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
  text-align: start;
}

.core-data-table-recipe__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  color: var(--cm-color-text-primary);
  text-align: start;
  vertical-align: top;
}

.core-data-table-recipe__head th {
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  font-weight: var(--cm-font-weight-medium);
}

.core-data-table-recipe__body > tr + tr > td {
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.core-data-table-recipe--compact .core-data-table-recipe__table :where(th, td) {
  padding: var(--cm-field-padding-md);
}

.core-data-table-recipe--striped .core-data-table-recipe__body > tr:nth-child(even) > td {
  background: color-mix(
    in srgb,
    var(--cm-color-background-surface) 65%,
    var(--cm-color-background-surface-hover) 35%
  );
}

.core-data-table-recipe--column-dividers .core-data-table-recipe__table :where(th, td) + :where(th, td) {
  border-inline-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.core-data-table-recipe__header-content {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-data-table-recipe__cell--center {
  text-align: center;
}

.core-data-table-recipe__cell--end {
  text-align: end;
}

.core-data-table-recipe__state-cell {
  color: var(--cm-color-text-secondary);
  text-align: center;
}

@media (forced-colors: active) {
  .core-data-table-recipe,
  .core-data-table-recipe__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
