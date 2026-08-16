<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import { CmIconButton, CmSelect } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/select.css';

export type CoreSortableDataTableColumnKey = 'member' | 'role' | 'status' | 'tasks';
export type CoreSortableDataTableDirection = 'asc' | 'desc';
export interface CoreSortableDataTableSort {
  key: CoreSortableDataTableColumnKey;
  direction: CoreSortableDataTableDirection;
}

const columns = [
  { key: 'member', header: 'Member', align: 'start' },
  { key: 'role', header: 'Role', align: 'start' },
  { key: 'status', header: 'Status', align: 'start' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
] as const;
const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline', tasks: 3 },
  { id: 6, member: 'Frank', role: 'Support', status: 'Available', tasks: 9 },
  { id: 7, member: 'Grace', role: 'Platform', status: 'Busy', tasks: 11 },
] as const;
const pageSizeOptions = [
  { label: '3', value: '3' },
  { label: '5', value: '5' },
  { label: '10', value: '10' },
] as const;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const props = defineProps({
  sort: {
    type: Array as PropType<readonly CoreSortableDataTableSort[]>,
    default: () => [],
  },
});
const emit = defineEmits<{
  'update:sort': [sort: CoreSortableDataTableSort[]];
}>();
const page = ref(1);
const pageSize = ref(3);

const normalizedSort = computed(() => {
  const seen = new Set<CoreSortableDataTableColumnKey>();
  return props.sort.filter(({ direction, key }) => {
    if (!columns.some((column) => column.key === key) || !['asc', 'desc'].includes(direction) || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
});
const sortedRows = computed(() =>
  rows
    .map((row, index) => ({ index, row }))
    .sort((left, right) => compareRows(left.row, right.row) || left.index - right.index)
    .map(({ row }) => row),
);
const pageCount = computed(() => Math.max(1, Math.ceil(rows.length / pageSize.value)));
const visibleRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return sortedRows.value.slice(start, start + pageSize.value);
});
const firstVisibleRow = computed(() => (page.value - 1) * pageSize.value + 1);
const lastVisibleRow = computed(() => Math.min(page.value * pageSize.value, rows.length));

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

function sortIndex(key: CoreSortableDataTableColumnKey): number {
  return normalizedSort.value.findIndex((sort) => sort.key === key);
}

function sortDirection(key: CoreSortableDataTableColumnKey): CoreSortableDataTableDirection | undefined {
  return normalizedSort.value[sortIndex(key)]?.direction;
}

function ariaSort(key: CoreSortableDataTableColumnKey): 'ascending' | 'descending' | 'none' {
  const direction = sortDirection(key);
  return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
}

function sortLabel(column: (typeof columns)[number]): string {
  const direction = sortDirection(column.key);
  if (direction === 'asc') return `Sort ${column.header} descending`;
  if (direction === 'desc') return `Clear sorting for ${column.header}`;
  return `Sort ${column.header} ascending`;
}

function compareValues(left: string | number, right: string | number): number {
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : collator.compare(String(left), String(right));
}

function compareRows(left: (typeof rows)[number], right: (typeof rows)[number]): number {
  for (const sort of normalizedSort.value) {
    const comparison = compareValues(left[sort.key], right[sort.key]);
    if (comparison !== 0) return sort.direction === 'asc' ? comparison : -comparison;
  }
  return 0;
}

function toggleSort(column: (typeof columns)[number]): void {
  const index = sortIndex(column.key);
  const direction = sortDirection(column.key);
  const nextSort = normalizedSort.value.filter(({ key }) => key !== column.key);
  const nextDirection = direction === undefined ? 'asc' : direction === 'asc' ? 'desc' : undefined;
  if (nextDirection) {
    const next: CoreSortableDataTableSort = { direction: nextDirection, key: column.key };
    if (index >= 0) nextSort.splice(index, 0, next);
    else nextSort.push(next);
  }
  page.value = 1;
  emit('update:sort', nextSort);
}

function setPage(nextPage: number): void {
  page.value = Math.min(Math.max(1, nextPage), pageCount.value);
}

function setPageSize(value: string): void {
  const nextSize = Number(value);
  if (![3, 5, 10].includes(nextSize)) return;
  pageSize.value = nextSize;
  page.value = 1;
}
</script>

<template>
  <div class="demo-application-sortable-table">
    <div class="demo-application-sortable-table__scroll">
      <table class="demo-application-sortable-table__table">
        <caption>
          Sortable team workload
        </caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="column.align === 'end' && 'demo-application-sortable-table__cell--end'"
              scope="col"
              :aria-sort="ariaSort(column.key)"
            >
              <span class="demo-application-sortable-table__header-content">
                <button type="button" :aria-label="sortLabel(column)" @click="toggleSort(column)">
                  <span>{{ column.header }}</span>
                  <svg v-if="sortDirection(column.key) === 'asc'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M8.25 14 12 10.25 15.75 14"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else-if="sortDirection(column.key) === 'desc'"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8.25 10 12 13.75 15.75 10"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 9.5h16L12 2.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                    <path d="M4 14.5h16L12 21.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                  </svg>
                  <span
                    v-if="normalizedSort.length > 1 && sortIndex(column.key) >= 0"
                    class="demo-application-sortable-table__priority"
                    aria-hidden="true"
                  >
                    {{ sortIndex(column.key) + 1 }}
                  </span>
                </button>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id" :data-core-sortable-row="row.id">
            <td>{{ row.member }}</td>
            <td>{{ row.role }}</td>
            <td>{{ row.status }}</td>
            <td class="demo-application-sortable-table__cell--end">{{ row.tasks }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="demo-application-sortable-table__pagination" aria-label="Table pagination">
      <span class="demo-application-sortable-table__summary"
        >{{ firstVisibleRow }}-{{ lastVisibleRow }} of {{ rows.length }}</span
      >
      <div class="demo-application-sortable-table__page-size">
        <span>Rows</span>
        <CmSelect
          :model-value="String(pageSize)"
          :options="pageSizeOptions"
          size="sm"
          aria-label="Rows per page"
          @update:model-value="setPageSize"
        />
      </div>
      <div class="demo-application-sortable-table__actions">
        <CmIconButton label="Previous page" size="sm" variant="ghost" :disabled="page === 1" @click="setPage(page - 1)">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15.25 5.75 9 12l6.25 6.25"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </CmIconButton>
        <div class="demo-application-sortable-table__pages">
          <button
            v-for="item in pageCount"
            :key="item"
            class="demo-application-sortable-table__page"
            type="button"
            :aria-current="item === page ? 'page' : undefined"
            :aria-label="item === page ? `Page ${item} of ${pageCount}` : `Go to page ${item}`"
            @click="item !== page && setPage(item)"
          >
            {{ item }}
          </button>
        </div>
        <CmIconButton
          label="Next page"
          size="sm"
          variant="ghost"
          :disabled="page === pageCount"
          @click="setPage(page + 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8.75 5.75 15 12l-6.25 6.25"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </CmIconButton>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.demo-application-sortable-table {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.demo-application-sortable-table__scroll {
  width: 100%;
  overflow-x: auto;
}

.demo-application-sortable-table__table {
  width: 100%;
  min-width: calc(var(--cm-space-16) * 9);
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.demo-application-sortable-table__table caption,
.demo-application-sortable-table__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.demo-application-sortable-table__table caption {
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-sortable-table__table th {
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-sortable-table__table tbody tr + tr td {
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-sortable-table__table tbody tr:nth-child(even) td {
  background: color-mix(in srgb, var(--cm-color-background-surface) 65%, var(--cm-color-background-surface-hover) 35%);
}

.demo-application-sortable-table__table :where(th, td) + :where(th, td) {
  border-inline-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-sortable-table__cell--end {
  text-align: end !important;
}

.demo-application-sortable-table__header-content,
.demo-application-sortable-table__header-content button {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.demo-application-sortable-table__header-content button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  text-align: inherit;
}

.demo-application-sortable-table__header-content button:focus-visible {
  outline: var(--cm-focus-ring-width) solid var(--cm-color-interactive-primary-border);
  outline-offset: var(--cm-focus-ring-width);
}

.demo-application-sortable-table__header-content svg {
  width: var(--cm-icon-size-sm);
  height: var(--cm-icon-size-sm);
  flex: none;
}

.demo-application-sortable-table__priority {
  display: inline-grid;
  min-width: 1rem;
  min-height: 1rem;
  place-items: center;
  border-radius: 999px;
  font-size: 0.75em;
  line-height: 1;
}

.demo-application-sortable-table__pagination {
  container-type: inline-size;
  display: flex;
  width: 100%;
  min-height: calc(var(--cm-control-height-sm) + var(--cm-field-padding-block-lg) * 2);
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--cm-space-3);
  padding: var(--cm-field-padding-md);
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
}

.demo-application-sortable-table__summary {
  margin-inline-end: auto;
}

.demo-application-sortable-table__page-size,
.demo-application-sortable-table__actions,
.demo-application-sortable-table__pages {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.demo-application-sortable-table__pages {
  gap: var(--cm-space-1);
}

.demo-application-sortable-table__page-size :deep(.cm-select) {
  width: auto;
}

.demo-application-sortable-table__page {
  display: inline-grid;
  min-width: var(--cm-control-height-sm);
  height: var(--cm-control-height-sm);
  place-items: center;
  padding-inline: var(--cm-space-2);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  background: transparent;
  color: var(--cm-color-text-primary);
  cursor: pointer;
  font: inherit;
}

.demo-application-sortable-table__page:hover,
.demo-application-sortable-table__page[aria-current='page'] {
  background: var(--cm-color-background-surface-active);
}

.demo-application-sortable-table__page[aria-current='page'] {
  font-weight: var(--cm-font-weight-medium);
  cursor: default;
}

.demo-application-sortable-table__page:focus-visible {
  outline: var(--cm-focus-ring-width) solid var(--cm-color-interactive-primary-border);
  outline-offset: calc(-1 * var(--cm-focus-ring-width));
}

@media (forced-colors: active) {
  .demo-application-sortable-table,
  .demo-application-sortable-table__table :where(th, td),
  .demo-application-sortable-table__pagination {
    border-color: CanvasText;
  }
}

@media (width <= 960px) {
  .demo-application-sortable-table {
    margin-block-end: calc(-1 * var(--cm-border-width));
  }
}

</style>
