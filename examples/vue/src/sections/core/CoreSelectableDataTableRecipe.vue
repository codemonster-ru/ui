<script setup lang="ts">
import { computed } from 'vue';
import { CmCheckbox } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/checkbox.css';

export interface CoreSelectableDataTableRecipeColumn {
  key: string;
  header: string;
  align?: 'start' | 'center' | 'end';
}

export interface CoreSelectableDataTableRecipeRow {
  id: string | number;
  cells: Readonly<Record<string, string | number | null>>;
  selectable?: boolean;
}

const props = withDefaults(
  defineProps<{
    id: string;
    columns: readonly CoreSelectableDataTableRecipeColumn[];
    rows: readonly CoreSelectableDataTableRecipeRow[];
    selectedRowIds?: readonly (string | number)[];
    caption?: string;
    label?: string;
    striped?: boolean;
    columnDividers?: boolean;
    selectAllLabel?: string;
    selectRowLabelPrefix?: string;
  }>(),
  {
    selectedRowIds: () => [],
    caption: '',
    label: '',
    selectAllLabel: 'Select all rows',
    selectRowLabelPrefix: 'Select row',
  },
);

const emit = defineEmits<{
  'update:selectedRowIds': [ids: Array<string | number>];
}>();

const selectedIds = computed(() => new Set(props.selectedRowIds));
const selectableRows = computed(() => props.rows.filter(({ selectable }) => selectable !== false));
const allSelected = computed(
  () => selectableRows.value.length > 0 && selectableRows.value.every(({ id }) => selectedIds.value.has(id)),
);
const someSelected = computed(
  () => !allSelected.value && selectableRows.value.some(({ id }) => selectedIds.value.has(id)),
);

function setRowSelected(row: CoreSelectableDataTableRecipeRow, checked: boolean): void {
  if (row.selectable === false) return;
  const next = new Set(props.selectedRowIds);
  if (checked) next.add(row.id);
  else next.delete(row.id);
  emit('update:selectedRowIds', props.rows.filter(({ id }) => next.has(id)).map(({ id }) => id));
}

function setAllSelected(checked: boolean): void {
  const next = new Set(
    props.selectedRowIds.filter((id) => props.rows.some((row) => row.id === id && row.selectable === false)),
  );
  if (checked) {
    for (const { id } of selectableRows.value) next.add(id);
  }
  emit('update:selectedRowIds', props.rows.filter(({ id }) => next.has(id)).map(({ id }) => id));
}
</script>

<template>
  <div
    :id="props.id"
    class="core-selectable-data-table-recipe"
    :class="{
      'core-selectable-data-table-recipe--striped': props.striped,
      'core-selectable-data-table-recipe--column-dividers': props.columnDividers,
    }"
  >
    <div class="core-selectable-data-table-recipe__scroll">
      <table
        class="core-selectable-data-table-recipe__table"
        :aria-label="!props.caption && props.label ? props.label : undefined"
      >
        <caption v-if="props.caption" class="core-selectable-data-table-recipe__caption">
          {{ props.caption }}
        </caption>
        <thead class="core-selectable-data-table-recipe__head">
          <tr>
            <th class="core-selectable-data-table-recipe__selection-cell" scope="col">
              <CmCheckbox
                :model-value="allSelected"
                :indeterminate="someSelected"
                :disabled="selectableRows.length === 0"
                :aria-label="props.selectAllLabel"
                @update:model-value="setAllSelected"
              />
            </th>
            <th
              v-for="column in props.columns"
              :key="column.key"
              :class="
                column.align &&
                column.align !== 'start' &&
                `core-selectable-data-table-recipe__cell--${column.align}`
              "
              scope="col"
            >
              {{ column.header }}
            </th>
          </tr>
        </thead>
        <tbody class="core-selectable-data-table-recipe__body">
          <tr
            v-for="(row, rowIndex) in props.rows"
            :key="row.id"
            :aria-selected="selectedIds.has(row.id) ? 'true' : 'false'"
            :data-core-selectable-data-table-row="String(row.id)"
          >
            <td class="core-selectable-data-table-recipe__selection-cell">
              <CmCheckbox
                :model-value="selectedIds.has(row.id)"
                :disabled="row.selectable === false"
                :aria-label="`${props.selectRowLabelPrefix} ${rowIndex + 1}`"
                @update:model-value="setRowSelected(row, $event)"
              />
            </td>
            <td
              v-for="column in props.columns"
              :key="column.key"
              :class="
                column.align &&
                column.align !== 'start' &&
                `core-selectable-data-table-recipe__cell--${column.align}`
              "
            >
              {{ row.cells[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.core-selectable-data-table-recipe {
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

.core-selectable-data-table-recipe__scroll {
  position: relative;
  inline-size: 100%;
  overflow-x: auto;
}

.core-selectable-data-table-recipe__table {
  inline-size: 100%;
  min-inline-size: calc(var(--cm-space-16) * 9);
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.core-selectable-data-table-recipe__caption {
  padding: var(--cm-field-padding-lg);
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
  text-align: start;
}

.core-selectable-data-table-recipe__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  color: var(--cm-color-text-primary);
  text-align: start;
  vertical-align: top;
}

.core-selectable-data-table-recipe__head th {
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  font-weight: var(--cm-font-weight-medium);
}

.core-selectable-data-table-recipe__body > tr + tr > td {
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.core-selectable-data-table-recipe--striped .core-selectable-data-table-recipe__body > tr:nth-child(even) > td {
  background: color-mix(
    in srgb,
    var(--cm-color-background-surface) 65%,
    var(--cm-color-background-surface-hover) 35%
  );
}

.core-selectable-data-table-recipe--column-dividers
  .core-selectable-data-table-recipe__table
  :where(th, td)
  + :where(th, td) {
  border-inline-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.core-selectable-data-table-recipe__selection-cell {
  inline-size: 1%;
  white-space: nowrap;
}

.core-selectable-data-table-recipe__cell--center {
  text-align: center;
}

.core-selectable-data-table-recipe__cell--end {
  text-align: end;
}

@media (forced-colors: active) {
  .core-selectable-data-table-recipe,
  .core-selectable-data-table-recipe__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
