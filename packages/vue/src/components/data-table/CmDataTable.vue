<script setup lang="ts">
import { computed, ref, useAttrs, watch, watchEffect, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type {
  CmDataTableColumn,
  CmDataTableDensity,
  CmDataTableRow,
  CmDataTableSort,
  CmDataTableSortDirection,
} from './data-table.types';

defineOptions({ inheritAttrs: false });
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const directions: readonly CmDataTableSortDirection[] = ['ascending', 'descending'];
const props = defineProps({
  id: { type: String, required: true },
  columns: { type: Array as PropType<readonly CmDataTableColumn[]>, required: true },
  rows: { type: Array as PropType<readonly CmDataTableRow[]>, default: () => [] },
  caption: { type: String, default: '' },
  density: {
    type: String as PropType<CmDataTableDensity>,
    default: 'default',
    validator: (value: string) => ['default', 'compact'].includes(value),
  },
  striped: Boolean,
  columnDividers: Boolean,
  stickyHeader: Boolean,
  selectable: Boolean,
  selectedRowIds: { type: Array as PropType<readonly string[]>, default: () => [] },
  sort: { type: Object as PropType<CmDataTableSort | null>, default: null },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: 1 },
  loading: Boolean,
  error: Boolean,
  emptyText: { type: String, default: 'No data' },
  loadingText: { type: String, default: 'Loading...' },
  errorText: { type: String, default: 'Failed to load data' },
  paginationLabel: { type: String, default: 'Table pagination' },
  previousPageLabel: { type: String, default: 'Previous page' },
  nextPageLabel: { type: String, default: 'Next page' },
  selectAllLabel: { type: String, default: 'Select all rows' },
});
const emit = defineEmits<{
  pageChange: [page: number];
  selectionChange: [selectedRowIds: string[]];
  sortChange: [sort: CmDataTableSort | null];
  'update:page': [page: number];
  'update:selectedRowIds': [selectedRowIds: string[]];
  'update:sort': [sort: CmDataTableSort | null];
}>();
const attrs = useAttrs();

const normalizedColumns = computed(() => {
  if (props.columns.length === 0) throw new TypeError('DataTable requires columns.');
  const keys = new Set<string>();
  for (const column of props.columns) {
    if (
      !idPattern.test(column.key) ||
      !column.header.trim() ||
      (column.align !== undefined && !['start', 'center', 'end'].includes(column.align)) ||
      keys.has(column.key)
    ) {
      throw new TypeError(`Invalid DataTable column: ${column.key}.`);
    }
    keys.add(column.key);
  }
  return props.columns;
});

const normalizedRows = computed(() => {
  const ids = new Set<string>();
  const keys = new Set(normalizedColumns.value.map(({ key }) => key));
  for (const row of props.rows) {
    if (!idPattern.test(row.id) || ids.has(row.id)) throw new TypeError(`Invalid DataTable row: ${row.id}.`);
    for (const [key, value] of Object.entries(row.cells)) {
      if (
        !keys.has(key) ||
        (!['string', 'number'].includes(typeof value) && value !== null) ||
        (typeof value === 'number' && !Number.isFinite(value))
      ) {
        throw new TypeError(`Invalid DataTable cell: ${row.id}.${key}.`);
      }
    }
    ids.add(row.id);
  }
  return props.rows;
});

if (!idPattern.test(props.id)) throw new TypeError('DataTable id must use lowercase kebab-case.');
if (
  ![props.page, props.pageCount].every((value) => Number.isInteger(value) && value > 0) ||
  props.page > props.pageCount
) {
  throw new TypeError('DataTable page must be within its positive pageCount.');
}
if (
  [
    props.emptyText,
    props.loadingText,
    props.errorText,
    props.paginationLabel,
    props.previousPageLabel,
    props.nextPageLabel,
    props.selectAllLabel,
  ].some((value) => !value.trim())
) {
  throw new TypeError('DataTable labels must be non-empty strings.');
}

function normalizeSort(sort: CmDataTableSort | null): CmDataTableSort | null {
  if (
    sort &&
    (!directions.includes(sort.direction) ||
      !normalizedColumns.value.some(({ key, sortable }) => key === sort.key && sortable))
  ) {
    throw new TypeError(`Invalid DataTable sort: ${sort.key}.`);
  }
  return sort ? { ...sort } : null;
}

const localSort = ref<CmDataTableSort | null>(normalizeSort(props.sort));
const localSelectedRowIds = ref([...props.selectedRowIds]);
const localPage = ref(props.page);
watch(
  () => props.sort,
  (sort) => (localSort.value = normalizeSort(sort)),
  { deep: true },
);
watch(
  () => props.selectedRowIds,
  (ids) => (localSelectedRowIds.value = [...ids]),
);
watch(
  () => props.page,
  (page) => (localPage.value = page),
);

const selectedIds = computed(() => new Set(localSelectedRowIds.value));
const enabledRowIds = computed(() => normalizedRows.value.map(({ id }) => id));
const allSelected = computed(
  () => enabledRowIds.value.length > 0 && enabledRowIds.value.every((id) => selectedIds.value.has(id)),
);
const partiallySelected = computed(
  () => !allSelected.value && enabledRowIds.value.some((id) => selectedIds.value.has(id)),
);
const selectAll = ref<HTMLInputElement>();
watchEffect(() => {
  if (selectAll.value) selectAll.value.indeterminate = partiallySelected.value;
});

const classes = computed(() =>
  mergeCmClasses(
    'cm-data-table',
    props.density === 'compact' ? 'cm-data-table--compact' : undefined,
    props.striped ? 'cm-data-table--striped' : undefined,
    props.columnDividers ? 'cm-data-table--column-dividers' : undefined,
    props.stickyHeader ? 'cm-data-table--sticky-header' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'id',
    'data-cm-controller',
    'data-cm-data-table-sort-key',
    'data-cm-data-table-sort-direction',
    'data-cm-data-table-page',
    'data-cm-data-table-page-count',
    'data-cm-data-table-selected-count',
  ]),
);
const stateText = computed(() =>
  props.loading
    ? props.loadingText
    : props.error
      ? props.errorText
      : normalizedRows.value.length === 0
        ? props.emptyText
        : '',
);
const columnCount = computed(() => normalizedColumns.value.length + (props.selectable ? 1 : 0));

function cellAttrs(column: CmDataTableColumn): Record<string, string> {
  return column.align && column.align !== 'start' ? { class: `cm-data-table__cell--${column.align}` } : {};
}

function rowLabel(id: string): string {
  return id
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function sortLabel(column: CmDataTableColumn): string {
  if (localSort.value?.key !== column.key) return `Sort ${column.header} ascending`;
  return localSort.value.direction === 'ascending'
    ? `Sort ${column.header} descending`
    : `Clear sorting for ${column.header}`;
}

function changeSort(column: CmDataTableColumn): void {
  if (!column.sortable) return;
  const sort =
    localSort.value?.key !== column.key
      ? { key: column.key, direction: 'ascending' as const }
      : localSort.value.direction === 'ascending'
        ? { key: column.key, direction: 'descending' as const }
        : null;
  localSort.value = sort;
  emit('update:sort', sort);
  emit('sortChange', sort);
}

function reportSelection(ids: string[]): void {
  localSelectedRowIds.value = ids;
  emit('update:selectedRowIds', ids);
  emit('selectionChange', ids);
}

function changeRowSelection(rowId: string, checked: boolean): void {
  const next = new Set(localSelectedRowIds.value);
  if (checked) next.add(rowId);
  else next.delete(rowId);
  reportSelection(normalizedRows.value.map(({ id }) => id).filter((id) => next.has(id)));
}

function changeAllSelection(checked: boolean): void {
  reportSelection(checked ? [...enabledRowIds.value] : []);
}

function changePage(page: number): void {
  const next = Math.min(props.pageCount, Math.max(1, page));
  if (next === localPage.value) return;
  localPage.value = next;
  emit('update:page', next);
  emit('pageChange', next);
}
</script>

<template>
  <div
    :id="props.id"
    v-bind="rootAttrs"
    :class="classes"
    data-cm-controller="data-table"
    :data-cm-data-table-sort-key="localSort?.key ?? ''"
    :data-cm-data-table-sort-direction="localSort?.direction ?? ''"
    :data-cm-data-table-page="localPage"
    :data-cm-data-table-page-count="props.pageCount"
    :data-cm-data-table-selected-count="localSelectedRowIds.length"
  >
    <div class="cm-data-table__scroll">
      <table class="cm-data-table__table">
        <caption v-if="props.caption" class="cm-data-table__caption">
          {{
            props.caption
          }}
        </caption>
        <thead class="cm-data-table__head">
          <tr>
            <th v-if="props.selectable" class="cm-data-table__selection" scope="col">
              <input
                ref="selectAll"
                type="checkbox"
                :aria-label="props.selectAllLabel"
                :checked="allSelected"
                data-cm-data-table-select-all
                @change="changeAllSelection(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th
              v-for="column in normalizedColumns"
              :key="column.key"
              v-bind="cellAttrs(column)"
              scope="col"
              :aria-sort="column.sortable ? (localSort?.key === column.key ? localSort.direction : 'none') : undefined"
            >
              <button
                v-if="column.sortable"
                class="cm-data-table__sort"
                type="button"
                :aria-label="sortLabel(column)"
                :data-cm-data-table-sort="column.key"
                @click="changeSort(column)"
              >
                {{ column.header }}<span class="cm-data-table__sort-indicator" aria-hidden="true"></span>
              </button>
              <template v-else>{{ column.header }}</template>
            </th>
          </tr>
        </thead>
        <tbody class="cm-data-table__body">
          <tr v-if="stateText">
            <td class="cm-data-table__state" :colspan="columnCount" role="status">{{ stateText }}</td>
          </tr>
          <tr
            v-for="row in stateText ? [] : normalizedRows"
            v-else
            :key="row.id"
            v-bind="selectedIds.has(row.id) ? { class: 'cm-data-table__row--selected' } : {}"
            :data-cm-data-table-row="row.id"
          >
            <td v-if="props.selectable" class="cm-data-table__selection">
              <input
                type="checkbox"
                :aria-label="`Select ${rowLabel(row.id)}`"
                :value="row.id"
                :checked="selectedIds.has(row.id)"
                data-cm-data-table-select-row
                @change="changeRowSelection(row.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td v-for="column in normalizedColumns" :key="column.key" v-bind="cellAttrs(column)">
              {{ row.cells[column.key] ?? '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav v-if="props.pageCount > 1" class="cm-data-table__pagination" :aria-label="props.paginationLabel">
      <!-- prettier-ignore -->
      <button class="cm-data-table__page-button" type="button" :aria-label="props.previousPageLabel" data-cm-data-table-page-action="previous" :disabled="localPage <= 1" @click="changePage(localPage - 1)">Previous</button>
      <span class="cm-data-table__page-summary" aria-live="polite">Page {{ localPage }} of {{ props.pageCount }}</span>
      <!-- prettier-ignore -->
      <button class="cm-data-table__page-button" type="button" :aria-label="props.nextPageLabel" data-cm-data-table-page-action="next" :disabled="localPage >= props.pageCount" @click="changePage(localPage + 1)">Next</button>
    </nav>
  </div>
</template>
