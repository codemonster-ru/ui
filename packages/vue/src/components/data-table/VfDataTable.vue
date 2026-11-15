<script setup lang="ts" generic="Row extends VfDataTableRow">
import { computed, ref } from 'vue';
import { useId } from '../../composables/id';
import CmDataTable from './CmDataTable.vue';
import type { CmDataTableColumnWidths, CmDataTableSort } from './data-table.types';
import type {
  VfDataTableColumn,
  VfDataTableProps,
  VfDataTableRow,
  VfDataTableRowKey,
  VfDataTableSort,
} from './historical-data-table.types';
import { tableRowField } from './row-field';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDataTableProps<Row>>(), {
  defaultPage: 1,
  defaultPageSize: 10,
  sortingMode: 'client',
  paginationMode: 'client',
  pagination: false,
  loadingVariant: 'mask',
  pageSizeOptions: () => [10, 25, 50],
  labels: () => ({}),
});
const emit = defineEmits<{
  'update:selectedRowKeys': [keys: VfDataTableRowKey[]];
  'update:expandedRowKeys': [keys: VfDataTableRowKey[]];
  'update:page': [page: number];
  'update:pageSize': [size: number];
  'update:sort': [sort: VfDataTableSort[]];
  'update:columnWidths': [widths: CmDataTableColumnWidths];
  'column-resize-end': [widths: CmDataTableColumnWidths];
}>();
const slots = defineSlots<{
  caption?: () => unknown;
  empty?: () => unknown;
  error?: () => unknown;
  loading?: () => unknown;
  footer?: () => unknown;
  'expanded-row'?: (scope: { row: Row; rowKey: VfDataTableRowKey; rowIndex: number }) => unknown;
  [slot: `header${string}`]: ((scope: { column: VfDataTableColumn }) => unknown) | undefined;
  [slot: `cell${string}`]:
    ((scope: { row: Row; column: VfDataTableColumn; value: unknown; rowIndex: number }) => unknown) | undefined;
}>();
const id = useId({ prefix: 'vf-data-table', providedId: () => props.id });
const page = ref(props.defaultPage);
const pageSize = ref(props.defaultPageSize);
const selection = ref([...(props.defaultSelectedRowKeys ?? [])]);
const sort = ref([...(props.defaultSort ?? [])]);
const columnByKey = computed(() => new Map(props.columns.map((column) => [column.key, column])));
const columns = computed(() =>
  props.columns.map((column) => ({ ...column, header: column.header?.trim() || column.key })),
);

const native = computed(() => ({
  id: id.value,
  columns: columns.value,
  rows: props.rows,
  rowKey: rowId,
  rowSelectable: props.rowSelectable,
  caption: props.caption,
  density: props.density,
  striped: props.striped,
  columnDividers: props.columnDividers,
  stickyHeader: props.stickyHeader,
  visibleColumnKeys: props.visibleColumnKeys,
  columnOrder: props.columnOrder ?? props.defaultColumnOrder,
  columnWidths: props.columnWidths,
  defaultColumnWidths: props.defaultColumnWidths,
  resizableColumns: props.resizableColumns,
  selectable: props.selectable,
  selectedRowIds: (props.selectedRowKeys ?? selection.value).map(encodeKey),
  controlledSelection: props.selectedRowKeys !== undefined,
  expandedRowKeys: props.expandedRowKeys?.map(encodeKey),
  defaultExpandedRowKeys: props.defaultExpandedRowKeys?.map(encodeKey),
  selectRowLabelTemplate: 'Select {row}',
  rowLabelResolver: (index: number) => `row ${index + 1}`,
  sortList: (props.sort ?? sort.value).map(toNativeSort),
  multiSort: props.multiSort,
  sortingMode: props.sortingMode,
  pagination: props.pagination,
  paginationMode: props.paginationMode,
  page: props.page ?? page.value,
  pageCount: props.pageCount,
  pageSize: props.pageSize ?? pageSize.value,
  pageSizeOptions: props.pageSizeOptions,
  totalRows: props.totalRows,
  loading: props.loading,
  loadingVariant: props.loadingVariant,
  loadingRows: props.loadingRows,
  error: props.error,
  emptyText: props.emptyText ?? props.labels.empty,
  loadingText: props.loadingText ?? props.labels.loading,
  errorText: props.errorText ?? props.labels.error,
  paginationLabel: props.paginationLabel ?? props.labels.pagination,
  rowsPerPageLabel: props.rowsPerPageLabel ?? props.labels.rowsPerPage ?? props.labels.rows,
  previousPageLabel: props.previousPageLabel ?? props.labels.previousPage,
  nextPageLabel: props.nextPageLabel ?? props.labels.nextPage,
  selectAllLabel: props.selectAllLabel ?? props.labels.selectAllRows,
}));

function encodeKey(key: VfDataTableRowKey): string {
  return typeof key === 'number' ? `n-${key}` : `s-${key}`;
}

function decodeKey(id: string): VfDataTableRowKey {
  return id.startsWith('n-') ? Number(id.slice(2)) : id.slice(2);
}

function rowId(row: Row, index: number): string {
  const key =
    typeof props.rowKey === 'function'
      ? props.rowKey(row, index)
      : props.rowKey
        ? tableRowField(row, props.rowKey)
        : undefined;
  return encodeKey(typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key)) ? key : index);
}

function toNativeSort({ key, direction }: VfDataTableSort): CmDataTableSort {
  return { key, direction: direction === 'asc' ? 'ascending' : 'descending' };
}

function updateSort(value: CmDataTableSort[]): void {
  const next = value.map<VfDataTableSort>(({ key, direction }) => ({
    key,
    direction: direction === 'ascending' ? 'asc' : 'desc',
  }));
  if (props.sort === undefined) sort.value = next;
  emit('update:sort', next);
  if (props.pagination && (props.page ?? page.value) !== 1) updatePage(1);
}

function updateSelection(ids: string[]): void {
  const keys = ids.map(decodeKey);
  if (props.selectedRowKeys === undefined) selection.value = keys;
  emit('update:selectedRowKeys', keys);
}

function updatePage(value: number): void {
  if (props.page === undefined) page.value = value;
  emit('update:page', value);
}

function updatePageSize(value: number): void {
  if (props.pageSize === undefined) pageSize.value = value;
  emit('update:pageSize', value);
}

function columnSlots<Prefix extends 'header' | 'cell'>(prefix: Prefix): `${Prefix}${string}`[] {
  return Object.keys(slots).filter((name): name is `${Prefix}${string}` => name.startsWith(prefix));
}

function sourceColumn(column: VfDataTableColumn): VfDataTableColumn {
  return columnByKey.value.get(column.key) ?? column;
}
</script>

<template>
  <CmDataTable
    v-bind="{ ...$attrs, ...native }"
    @update:sort-list="updateSort"
    @update:selected-row-ids="updateSelection"
    @update:expanded-row-keys="emit('update:expandedRowKeys', $event.map(decodeKey))"
    @update:page="updatePage"
    @update:page-size="updatePageSize"
    @update:column-widths="emit('update:columnWidths', $event)"
    @column-resize-end="emit('column-resize-end', $event)"
  >
    <template v-if="slots.caption" #caption><slot name="caption" /></template>
    <template v-if="slots.empty" #empty><slot name="empty" /></template>
    <template v-if="slots.error" #error><slot name="error" /></template>
    <template v-if="slots.loading" #loading><slot name="loading" /></template>
    <template v-if="slots.footer" #footer><slot name="footer" /></template>
    <template v-for="name in columnSlots('header')" #[name]="{ column }">
      <slot :name="name" :column="sourceColumn(column)" />
    </template>
    <template v-for="name in columnSlots('cell')" #[name]="{ row, column, rowIndex }">
      <slot
        :name="name"
        :row="row"
        :column="sourceColumn(column)"
        :value="tableRowField(row, column.key)"
        :row-index="rowIndex"
      />
    </template>
    <template v-if="slots['expanded-row']" #expanded-row="{ row, rowKey: opaqueKey, rowIndex }">
      <slot name="expanded-row" :row="row" :row-key="decodeKey(opaqueKey)" :row-index="rowIndex" />
    </template>
  </CmDataTable>
</template>
