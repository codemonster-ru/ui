<script setup lang="ts">
import { chevronDown } from '@codemonster-ru/ui-icons';
import {
  measureDataTableColumnContent,
  measureDataTableResizeBoundary,
  observeDataTablePins,
  resizedDataTableWidths,
  type CmDataTableResizeBoundary,
} from '@codemonster-ru/ui-runtime';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  watch,
  watchEffect,
  type CSSProperties,
  type PropType,
} from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import {
  ariaSortFor,
  clampPage,
  formatTemplate,
  nextSortState,
  resolveSelectionState,
  sortLabelFor,
  toggleAllSelection,
} from '@codemonster-ru/ui-runtime/core';
import { assertCm, warnCm } from '../../internal/warn';
import CmIconButton from '../icon-button/CmIconButton.vue';
import CmIcon from '../icon/CmIcon.vue';
import CmProgressSpinner from '../progress-spinner/CmProgressSpinner.vue';
import CmSkeleton from '../skeleton/CmSkeleton.vue';
import type {
  CmDataTableCellValue,
  CmDataTableColumn,
  CmDataTableColumnWidths,
  CmDataTableDensity,
  CmDataTableMode,
  CmDataTableRow,
  CmDataTableSort,
  CmDataTableSortDirection,
} from './data-table.types';

defineOptions({ inheritAttrs: false });
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const directions: readonly CmDataTableSortDirection[] = ['ascending', 'descending'];
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
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
  visibleColumnKeys: { type: Array as PropType<readonly string[] | null>, default: null },
  columnOrder: { type: Array as PropType<readonly string[] | null>, default: null },
  columnWidths: { type: Object as PropType<Readonly<CmDataTableColumnWidths> | null>, default: null },
  defaultColumnWidths: { type: Object as PropType<Readonly<CmDataTableColumnWidths>>, default: () => ({}) },
  resizableColumns: Boolean,
  resizeColumnLabelTemplate: { type: String, default: 'Resize {column} column' },
  selectable: Boolean,
  rowSelectable: {
    type: Function as PropType<(row: CmDataTableRow, rowIndex: number) => boolean>,
    default: undefined,
  },
  selectedRowIds: { type: Array as PropType<readonly string[]>, default: () => [] },
  expandedRowKeys: { type: Array as PropType<readonly string[] | null>, default: null },
  defaultExpandedRowKeys: { type: Array as PropType<readonly string[]>, default: () => [] },
  sort: { type: Object as PropType<CmDataTableSort | null>, default: null },
  sortingMode: {
    type: String as PropType<CmDataTableMode>,
    default: 'manual',
    validator: (value: string) => ['manual', 'client'].includes(value),
  },
  pagination: { type: Boolean, default: undefined },
  paginationMode: {
    type: String as PropType<CmDataTableMode>,
    default: 'manual',
    validator: (value: string) => ['manual', 'client'].includes(value),
  },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizeOptions: { type: Array as PropType<readonly number[]>, default: () => [] },
  totalRows: { type: Number as PropType<number | null>, default: null },
  loading: Boolean,
  loadingVariant: {
    type: String as PropType<'status' | 'mask' | 'skeleton'>,
    default: 'status',
    validator: (value: string) => ['status', 'mask', 'skeleton'].includes(value),
  },
  loadingRows: { type: Number, default: 3 },
  error: Boolean,
  emptyText: { type: String, default: 'No data' },
  loadingText: { type: String, default: 'Loading...' },
  errorText: { type: String, default: 'Failed to load data' },
  paginationLabel: { type: String, default: 'Table pagination' },
  rowsPerPageLabel: { type: String, default: 'Rows per page' },
  pageSummaryTemplate: { type: String, default: 'Page {page} of {pageCount}' },
  paginationSummaryTemplate: { type: String, default: '{firstRow}-{lastRow} of {totalRows}' },
  emptyPaginationSummaryText: { type: String, default: '0 rows' },
  previousPageText: { type: String, default: 'Previous' },
  nextPageText: { type: String, default: 'Next' },
  previousPageLabel: { type: String, default: 'Previous page' },
  nextPageLabel: { type: String, default: 'Next page' },
  selectAllLabel: { type: String, default: 'Select all rows' },
  selectRowLabelTemplate: { type: String, default: 'Select {row}' },
  expandRowLabelTemplate: { type: String, default: 'Expand {row}' },
  collapseRowLabelTemplate: { type: String, default: 'Collapse {row}' },
  sortAscendingLabelTemplate: { type: String, default: 'Sort {column} ascending' },
  sortDescendingLabelTemplate: { type: String, default: 'Sort {column} descending' },
  clearSortLabelTemplate: { type: String, default: 'Clear sorting for {column}' },
});
const emit = defineEmits<{
  pageChange: [page: number];
  pageSizeChange: [pageSize: number];
  selectionChange: [selectedRowIds: string[]];
  sortChange: [sort: CmDataTableSort | null];
  'update:page': [page: number];
  'update:pageSize': [pageSize: number];
  'update:selectedRowIds': [selectedRowIds: string[]];
  'update:expandedRowKeys': [expandedRowKeys: string[]];
  'update:columnWidths': [columnWidths: CmDataTableColumnWidths];
  'column-resize-end': [columnWidths: CmDataTableColumnWidths];
  'update:sort': [sort: CmDataTableSort | null];
}>();
defineSlots<{
  caption?: () => unknown;
  empty?: () => unknown;
  error?: () => unknown;
  loading?: () => unknown;
  footer?: () => unknown;
  'expanded-row'?: (props: { row: CmDataTableRow; rowKey: string; rowIndex: number }) => unknown;
  [slot: `header-${string}`]: ((props: { column: CmDataTableColumn }) => unknown) | undefined;
  [slot: `cell-${string}`]:
    | ((props: {
        row: CmDataTableRow;
        column: CmDataTableColumn;
        value: CmDataTableCellValue;
        rowIndex: number;
      }) => unknown)
    | undefined;
}>();
const attrs = useAttrs();

const normalizedColumns = computed(() => {
  assertCm(props.columns.length > 0, 'DataTable requires columns.');
  const keys = new Set<string>();
  const columns: CmDataTableColumn[] = [];
  for (const column of props.columns) {
    if (
      !idPattern.test(column.key) ||
      !column.header.trim() ||
      (column.align !== undefined && !['start', 'center', 'end'].includes(column.align)) ||
      (column.verticalAlign !== undefined && !['top', 'middle', 'bottom', 'baseline'].includes(column.verticalAlign)) ||
      (column.scope !== undefined && !['col', 'row', 'colgroup', 'rowgroup'].includes(column.scope)) ||
      (column.pinned !== undefined && column.pinned !== 'start' && column.pinned !== 'end') ||
      keys.has(column.key)
    ) {
      warnCm(`Invalid DataTable column: ${column.key}. The column is not rendered.`);
      continue;
    }
    keys.add(column.key);
    columns.push(column);
  }
  return columns;
});

const normalizedRows = computed(() => {
  const ids = new Set<string>();
  const keys = new Set(normalizedColumns.value.map(({ key }) => key));
  const rows: CmDataTableRow[] = [];
  for (const row of props.rows) {
    if (
      !idPattern.test(row.id) ||
      ids.has(row.id) ||
      (row.selectable !== undefined && typeof row.selectable !== 'boolean')
    ) {
      warnCm(`Invalid DataTable row: ${row.id}. The row is not rendered.`);
      continue;
    }
    const invalidCell = Object.entries(row.cells).find(
      ([key, value]) =>
        !keys.has(key) ||
        (!['string', 'number'].includes(typeof value) && value !== null) ||
        (typeof value === 'number' && !Number.isFinite(value)),
    );
    if (invalidCell) {
      warnCm(`Invalid DataTable cell: ${row.id}.${invalidCell[0]}. The row is not rendered.`);
      continue;
    }
    ids.add(row.id);
    rows.push(row);
  }
  return rows;
});

const requestedColumns = computed(() => {
  if (props.visibleColumnKeys === null) return normalizedColumns.value;
  if (!assertCm(props.visibleColumnKeys.length > 0, 'DataTable visibleColumnKeys must not be empty.')) {
    return normalizedColumns.value;
  }
  const columns = new Map(normalizedColumns.value.map((column) => [column.key, column]));
  const seen = new Set<string>();
  const visible: CmDataTableColumn[] = [];
  for (const key of props.visibleColumnKeys) {
    const column = typeof key === 'string' ? columns.get(key) : undefined;
    if (!column || seen.has(key)) {
      warnCm(`Invalid DataTable visible column: ${String(key)}. The column is not rendered.`);
      continue;
    }
    seen.add(key);
    visible.push(column);
  }
  return visible;
});
const orderedColumns = computed(() => {
  if (props.columnOrder === null) return requestedColumns.value;
  const columns = new Map(requestedColumns.value.map((column) => [column.key, column]));
  const ordered = props.columnOrder.flatMap((key) => {
    const column = columns.get(key);
    if (!column) return [];
    columns.delete(key);
    return [column];
  });
  return [...ordered, ...columns.values()];
});
const visibleColumns = computed(() => [
  ...orderedColumns.value.filter((column) => column.pinned === 'start'),
  ...orderedColumns.value.filter((column) => !column.pinned),
  ...orderedColumns.value.filter((column) => column.pinned === 'end'),
]);
const localColumnWidths = ref<CmDataTableColumnWidths>({ ...props.defaultColumnWidths });
const tableRef = ref<HTMLTableElement | null>(null);
const pinOffsets = ref<Readonly<Record<string, number>> | null>(null);
watch(
  [tableRef, visibleColumns],
  ([table, columns], _, onCleanup) => {
    pinOffsets.value = null;
    if (!table || !columns.some(({ pinned }) => pinned)) return;
    onCleanup(observeDataTablePins(table, (offsets) => (pinOffsets.value = offsets)));
  },
  { flush: 'post' },
);
const previewColumnWidths = ref<CmDataTableColumnWidths | null>(null);
const activeColumnWidths = computed(() => previewColumnWidths.value ?? props.columnWidths ?? localColumnWidths.value);
const fixedColumns = computed(
  () =>
    props.resizableColumns &&
    visibleColumns.value.length > 0 &&
    visibleColumns.value.every((column) => /^\d+(?:\.\d+)?px$/u.test(activeColumnWidths.value[column.key] ?? '')),
);
const resizeValues = ref<Record<string, { minimum: number; maximum: number; value: number }>>({});
let drag: { boundary: CmDataTableResizeBoundary; start: number; pointer: number } | null = null;

watch([visibleColumns, () => props.resizableColumns], () => {
  drag = null;
  previewColumnWidths.value = null;
  resizeValues.value = {};
});

assertCm(idPattern.test(props.id), 'DataTable id must use lowercase kebab-case.');
const normalizedPageSizeOptions = computed(() => {
  const seen = new Set<number>();
  const options: number[] = [];
  for (const option of props.pageSizeOptions) {
    if (!Number.isInteger(option) || option < 1 || seen.has(option)) {
      warnCm('DataTable pageSizeOptions must contain unique positive integers. The option is dropped.');
      continue;
    }
    seen.add(option);
    options.push(option);
  }
  if (options.length > 0 && !seen.has(safePageSize.value)) {
    warnCm('DataTable pageSizeOptions must contain pageSize. The active size is appended.');
    options.push(safePageSize.value);
  }
  return options;
});

function safeCount(value: number): number {
  const usable = assertCm(
    Number.isInteger(value) && value > 0,
    'DataTable page, pageCount, and pageSize must be positive integers.',
  );
  return usable ? value : 1;
}
const safePage = computed(() => safeCount(props.page));
const safePageCount = computed(() => safeCount(props.pageCount));
const safePageSize = computed(() => safeCount(props.pageSize));
const clientPagination = computed(() => props.pagination !== false && props.paginationMode === 'client');
const safeTotalRows = computed(() => {
  if (clientPagination.value) return normalizedRows.value.length;
  if (props.totalRows === null) return null;
  const usable = assertCm(
    Number.isInteger(props.totalRows) && props.totalRows >= 0,
    'DataTable totalRows must be a non-negative integer or null.',
  );
  return usable ? props.totalRows : null;
});
if (
  [
    props.emptyText,
    props.loadingText,
    props.errorText,
    props.paginationLabel,
    props.rowsPerPageLabel,
    props.emptyPaginationSummaryText,
    props.previousPageText,
    props.nextPageText,
    props.previousPageLabel,
    props.nextPageLabel,
    props.selectAllLabel,
  ].some((value) => !value.trim())
) {
  warnCm('DataTable labels must be non-empty strings.');
}
if (!props.pageSummaryTemplate.includes('{page}') || !props.pageSummaryTemplate.includes('{pageCount}')) {
  warnCm('DataTable pageSummaryTemplate must contain {page} and {pageCount}.');
}
if (
  !props.paginationSummaryTemplate.includes('{firstRow}') ||
  !props.paginationSummaryTemplate.includes('{lastRow}') ||
  !props.paginationSummaryTemplate.includes('{totalRows}')
) {
  warnCm('DataTable paginationSummaryTemplate must contain first, last, and total row placeholders.');
}
if (!props.selectRowLabelTemplate.includes('{row}')) {
  warnCm('DataTable selectRowLabelTemplate must contain {row}.');
}
if (
  [props.sortAscendingLabelTemplate, props.sortDescendingLabelTemplate, props.clearSortLabelTemplate].some(
    (template) => !template.includes('{column}'),
  )
) {
  warnCm('DataTable sort label templates must contain {column}.');
}

function normalizeSort(sort: CmDataTableSort | null): CmDataTableSort | null {
  if (
    sort &&
    (!directions.includes(sort.direction) ||
      !normalizedColumns.value.some(({ key, sortable }) => key === sort.key && sortable))
  ) {
    warnCm(`Invalid DataTable sort: ${sort.key}. The table renders unsorted.`);
    return null;
  }
  return sort ? { ...sort } : null;
}

const localSort = ref<CmDataTableSort | null>(normalizeSort(props.sort));
const localSelectedRowIds = ref([...props.selectedRowIds]);
const localExpandedRowKeys = ref([...props.defaultExpandedRowKeys]);
const expandedRowKeys = computed(() => new Set(props.expandedRowKeys ?? localExpandedRowKeys.value));
const localPage = ref(safePage.value);
const localPageSize = ref(safePageSize.value);
const resolvedPageCount = computed(() =>
  safeTotalRows.value === null
    ? safePageCount.value
    : Math.max(1, Math.ceil(safeTotalRows.value / localPageSize.value)),
);
if (!assertCm(safePage.value <= resolvedPageCount.value, 'DataTable page must be within its resolved pageCount.')) {
  localPage.value = resolvedPageCount.value;
}
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
  () => safePage.value,
  (page) => (localPage.value = Math.min(page, resolvedPageCount.value)),
);
watch(
  () => safePageSize.value,
  (pageSize) => (localPageSize.value = pageSize),
);
watch(resolvedPageCount, (count) => {
  localPage.value = Math.min(localPage.value, count);
});

function compareCells(left: CmDataTableCellValue | undefined, right: CmDataTableCellValue | undefined): number {
  if (left == null || right == null) return Number(left == null) - Number(right == null);
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : collator.compare(String(left), String(right));
}

const renderedRows = computed(() => {
  let rows = normalizedRows.value;
  const sort = localSort.value;
  // Manual paging supplies one ordered slice from the application.
  if (sort && props.sortingMode === 'client' && !(props.pagination && props.paginationMode === 'manual')) {
    rows = [...rows].sort((left, right) => {
      const leftValue = left.cells[sort.key];
      const rightValue = right.cells[sort.key];
      const comparison = compareCells(leftValue, rightValue);
      return sort.direction === 'descending' && leftValue != null && rightValue != null ? -comparison : comparison;
    });
  }
  if (!clientPagination.value) return rows;
  const start = (Math.min(localPage.value, resolvedPageCount.value) - 1) * localPageSize.value;
  return rows.slice(start, start + localPageSize.value);
});
const renderedRowIds = computed(() => renderedRows.value.map(({ id }) => id));

const selectedIds = computed(() => new Set(localSelectedRowIds.value));
const enabledRowIds = computed(() =>
  renderedRows.value.flatMap((row, index) =>
    row.selectable !== false && (props.rowSelectable?.(row, index) ?? true) ? [row.id] : [],
  ),
);
const enabledIds = computed(() => new Set(enabledRowIds.value));
const selectionState = computed(() => resolveSelectionState(enabledRowIds.value, localSelectedRowIds.value));
const allSelected = computed(() => selectionState.value.all);
const partiallySelected = computed(() => selectionState.value.partial);
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
    attrs.class,
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
    'data-cm-data-table-page-size',
    'data-cm-data-table-total-rows',
    'data-cm-data-table-selected-count',
  ]),
);
const maskLoading = computed(() => props.loading && props.loadingVariant === 'mask');
const state = computed(() => {
  if (props.loading && !maskLoading.value) return 'loading';
  if (props.error && !props.loading) return 'error';
  return renderedRows.value.length === 0 ? 'empty' : undefined;
});
const skeletonLoading = computed(() => props.loading && props.loadingVariant === 'skeleton');
const skeletonRowCount = computed(() => (Number.isSafeInteger(props.loadingRows) ? Math.max(1, props.loadingRows) : 3));
const showPagination = computed(
  () =>
    props.pagination ??
    (resolvedPageCount.value > 1 || normalizedPageSizeOptions.value.length > 0 || safeTotalRows.value !== null),
);
const pageSummary = computed(() =>
  formatTemplate(props.pageSummaryTemplate, { page: localPage.value, pageCount: resolvedPageCount.value }),
);
const paginationSummary = computed(() => {
  if (safeTotalRows.value === null) return '';
  if (safeTotalRows.value === 0) return props.emptyPaginationSummaryText;
  const firstRow = (localPage.value - 1) * localPageSize.value + 1;
  const lastRow = Math.min(localPage.value * localPageSize.value, safeTotalRows.value);
  return formatTemplate(props.paginationSummaryTemplate, { firstRow, lastRow, totalRows: safeTotalRows.value });
});
const columnCount = computed(() => visibleColumns.value.length + (props.selectable ? 1 : 0));

function cellAttrs(column: CmDataTableColumn) {
  const style = cellStyle(column);
  return {
    ...(column.align && column.align !== 'start' ? { class: `cm-data-table__cell--${column.align}` } : {}),
    ...(style ? { style } : {}),
    'data-cm-data-table-column': props.resizableColumns || column.pinned ? column.key : undefined,
    'data-cm-data-table-pin': column.pinned,
  };
}

function cellStyle(column: CmDataTableColumn): CSSProperties | undefined {
  const width = activeColumnWidths.value[column.key] ?? column.width;
  const { minWidth, maxWidth, verticalAlign, nowrap } = column;
  const offset = column.pinned ? pinOffsets.value?.[column.key] : undefined;
  if (!(width || minWidth || maxWidth || verticalAlign || nowrap) && offset === undefined) return undefined;
  return {
    inlineSize: width,
    minInlineSize: minWidth,
    maxInlineSize: maxWidth,
    verticalAlign,
    whiteSpace: nowrap ? 'nowrap' : undefined,
    '--cm-data-table-pin-offset': offset === undefined ? undefined : `${offset}px`,
  };
}

function canResize(column: CmDataTableColumn, index: number): boolean {
  const adjacent = visibleColumns.value[index + 1];
  return props.resizableColumns && column.resizable !== false && !!adjacent && adjacent.resizable !== false;
}

function measureResizeValues(handle: HTMLElement): void {
  const boundary = measureDataTableResizeBoundary(handle);
  if (boundary) resizeValues.value[boundary.column] = boundary;
}

function updateResizeValues(event: Event): void {
  if (event.currentTarget instanceof HTMLElement) measureResizeValues(event.currentTarget);
}

onMounted(() => {
  for (const handle of tableRef.value?.querySelectorAll<HTMLElement>('[data-cm-data-table-resize]') ?? []) {
    if (handle.closest('table') === tableRef.value) measureResizeValues(handle);
  }
});

function reportColumnWidths(boundary: CmDataTableResizeBoundary, delta: number, preview: boolean): void {
  const widths = { ...activeColumnWidths.value, ...resizedDataTableWidths(boundary, delta) };
  if (preview) previewColumnWidths.value = widths;
  if (props.columnWidths === null) localColumnWidths.value = widths;
  if (preview || props.columnWidths === null) {
    resizeValues.value[boundary.column] = { ...boundary, value: Number.parseFloat(widths[boundary.column]) };
  }
  emit('update:columnWidths', { ...widths });
  if (!preview) emit('column-resize-end', { ...widths });
}

function startResize(event: PointerEvent): void {
  if (event.button !== 0 || drag || !(event.currentTarget instanceof HTMLElement)) return;
  const boundary = measureDataTableResizeBoundary(event.currentTarget);
  if (!boundary) return;
  drag = { boundary, start: event.clientX, pointer: event.pointerId };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function moveResize(event: PointerEvent): void {
  if (!drag || drag.pointer !== event.pointerId) return;
  reportColumnWidths(drag.boundary, (event.clientX - drag.start) * drag.boundary.direction, true);
}

function finishResize(event: PointerEvent): void {
  if (!drag || drag.pointer !== event.pointerId) return;
  drag = null;
  const widths = previewColumnWidths.value;
  previewColumnWidths.value = null;
  if (widths) emit('column-resize-end', { ...widths });
  const handle = event.currentTarget;
  if (props.columnWidths !== null && handle instanceof HTMLElement) {
    void nextTick(() => measureResizeValues(handle));
  }
}

function resizeWithKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const handle = event.currentTarget;
  const boundary = measureDataTableResizeBoundary(handle);
  if (!boundary) return;
  event.preventDefault();
  reportColumnWidths(boundary, (event.key === 'ArrowRight' ? 8 : -8) * boundary.direction, false);
  if (props.columnWidths !== null) void nextTick(() => measureResizeValues(handle));
}

function autosizeColumn(event: MouseEvent): void {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const handle = event.currentTarget;
  const boundary = measureDataTableResizeBoundary(handle);
  if (!boundary) return;
  reportColumnWidths(boundary, measureDataTableColumnContent(handle) - boundary.value, false);
  if (props.columnWidths !== null) void nextTick(() => measureResizeValues(handle));
}

function toggleExpandedRow(id: string): void {
  const next = new Set(expandedRowKeys.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  const keys = [...next];
  if (props.expandedRowKeys === null) localExpandedRowKeys.value = keys;
  emit('update:expandedRowKeys', keys);
}

function rowLabel(id: string): string {
  return id
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function sortLabel(column: CmDataTableColumn): string {
  const template = {
    ascending: props.sortAscendingLabelTemplate,
    clear: props.clearSortLabelTemplate,
    descending: props.sortDescendingLabelTemplate,
  }[sortLabelFor(localSort.value, column.key)];
  return formatTemplate(template, { column: column.header });
}

function columnAriaSort(column: CmDataTableColumn): CmDataTableSortDirection | 'none' {
  return ariaSortFor(localSort.value, column.key);
}

function changeSort(column: CmDataTableColumn): void {
  if (!column.sortable) return;
  const sort = nextSortState(localSort.value, column.key);
  localSort.value = sort;
  emit('update:sort', sort);
  emit('sortChange', sort);
}

function reportSelection(ids: string[]): void {
  const visible = new Set(renderedRowIds.value);
  const next = [...new Set([...ids, ...localSelectedRowIds.value.filter((id) => !visible.has(id))])];
  localSelectedRowIds.value = next;
  emit('update:selectedRowIds', next);
  emit('selectionChange', next);
}

function changeRowSelection(rowId: string, checked: boolean): void {
  if (!enabledIds.value.has(rowId)) return;
  const next = new Set(localSelectedRowIds.value);
  if (checked) next.add(rowId);
  else next.delete(rowId);
  reportSelection(renderedRowIds.value.filter((id) => next.has(id)));
}

function changeAllSelection(checked: boolean): void {
  reportSelection(toggleAllSelection(renderedRowIds.value, enabledRowIds.value, localSelectedRowIds.value, checked));
}

function changePage(page: number): void {
  const next = clampPage(page, resolvedPageCount.value);
  if (next === localPage.value) return;
  localPage.value = next;
  emit('update:page', next);
  emit('pageChange', next);
}

function changePageSize(pageSize: number): void {
  if (!normalizedPageSizeOptions.value.includes(pageSize) || pageSize === localPageSize.value) return;
  localPageSize.value = pageSize;
  emit('update:pageSize', pageSize);
  emit('pageSizeChange', pageSize);
  if (localPage.value !== 1) changePage(1);
}

useCmHydrated();
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
    :data-cm-data-table-page-count="resolvedPageCount"
    :data-cm-data-table-page-size="localPageSize"
    :data-cm-data-table-total-rows="safeTotalRows ?? undefined"
    :data-cm-data-table-selected-count="localSelectedRowIds.length"
  >
    <div class="cm-data-table__scroll">
      <table
        ref="tableRef"
        class="cm-data-table__table"
        :inert="maskLoading || undefined"
        :data-cm-data-table-fixed-columns="fixedColumns ? '' : undefined"
        :data-cm-data-table-pins-ready="pinOffsets ? '' : undefined"
      >
        <caption v-if="props.caption || $slots.caption" class="cm-data-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>
        <thead class="cm-data-table__head">
          <tr>
            <th v-if="props.selectable" class="cm-data-table__selection" scope="col">
              <input
                ref="selectAll"
                type="checkbox"
                :aria-label="props.selectAllLabel"
                :checked="allSelected"
                :disabled="enabledRowIds.length === 0"
                data-cm-data-table-select-all
                @change="changeAllSelection(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th v-if="$slots['expanded-row']" class="cm-data-table__expansion" scope="col" aria-label="Row details" />
            <th
              v-for="(column, index) in visibleColumns"
              :key="column.key"
              v-bind="cellAttrs(column)"
              :scope="column.scope ?? 'col'"
              :aria-sort="column.sortable ? columnAriaSort(column) : undefined"
            >
              <button
                v-if="column.sortable"
                class="cm-data-table__sort"
                type="button"
                :aria-label="sortLabel(column)"
                :data-cm-data-table-sort="column.key"
                :data-cm-data-table-sort-ascending-label-template="props.sortAscendingLabelTemplate"
                :data-cm-data-table-sort-descending-label-template="props.sortDescendingLabelTemplate"
                :data-cm-data-table-clear-sort-label-template="props.clearSortLabelTemplate"
                @click="changeSort(column)"
              >
                <slot :name="`header-${column.key}`" :column="column">{{ column.header }}</slot>
                <span class="cm-data-table__sort-indicator" aria-hidden="true"></span>
              </button>
              <template v-else>
                <slot :name="`header-${column.key}`" :column="column">{{ column.header }}</slot>
              </template>
              <span
                v-if="canResize(column, index)"
                class="cm-data-table__column-resizer"
                role="separator"
                aria-orientation="vertical"
                :aria-label="formatTemplate(props.resizeColumnLabelTemplate, { column: column.header })"
                :aria-valuemin="resizeValues[column.key]?.minimum"
                :aria-valuemax="resizeValues[column.key]?.maximum"
                :aria-valuenow="resizeValues[column.key]?.value ?? 0"
                tabindex="0"
                data-cm-data-table-resize
                @focus="updateResizeValues"
                @pointerdown="startResize"
                @pointermove="moveResize"
                @pointerup="finishResize"
                @pointercancel="finishResize"
                @lostpointercapture="finishResize"
                @keydown="resizeWithKeyboard"
                @dblclick="autosizeColumn"
              />
            </th>
          </tr>
        </thead>
        <tbody class="cm-data-table__body" :aria-busy="skeletonLoading || undefined">
          <template v-if="skeletonLoading">
            <tr v-for="row in skeletonRowCount" :key="row" aria-hidden="true">
              <td v-if="props.selectable" class="cm-data-table__selection" />
              <td v-if="$slots['expanded-row']" class="cm-data-table__expansion" />
              <td v-for="column in visibleColumns" :key="column.key" v-bind="cellAttrs(column)">
                <CmSkeleton class="cm-data-table__skeleton" radius="control" />
              </td>
            </tr>
          </template>
          <tr v-else-if="state">
            <td
              class="cm-data-table__state"
              :colspan="Math.max(1, columnCount + Number(Boolean($slots['expanded-row'])))"
              role="status"
            >
              <slot :name="state">{{ props[`${state}Text`] }}</slot>
            </td>
          </tr>
          <template v-else>
            <template v-for="(row, rowIndex) in renderedRows" :key="row.id">
              <tr
                v-bind="selectedIds.has(row.id) ? { class: 'cm-data-table__row--selected' } : {}"
                :data-cm-data-table-row="row.id"
              >
                <td v-if="props.selectable" class="cm-data-table__selection">
                  <input
                    type="checkbox"
                    :aria-label="formatTemplate(props.selectRowLabelTemplate, { row: rowLabel(row.id) })"
                    :value="row.id"
                    :checked="selectedIds.has(row.id)"
                    :disabled="!enabledIds.has(row.id)"
                    data-cm-data-table-select-row
                    @change="changeRowSelection(row.id, ($event.target as HTMLInputElement).checked)"
                  />
                </td>
                <td v-if="$slots['expanded-row']" class="cm-data-table__expansion">
                  <CmIconButton
                    size="sm"
                    :label="
                      formatTemplate(
                        expandedRowKeys.has(row.id) ? props.collapseRowLabelTemplate : props.expandRowLabelTemplate,
                        { row: rowLabel(row.id) },
                      )
                    "
                    :aria-expanded="expandedRowKeys.has(row.id)"
                    :aria-controls="expandedRowKeys.has(row.id) ? `${props.id}-expanded-${row.id}` : undefined"
                    @click="toggleExpandedRow(row.id)"
                  >
                    <CmIcon :icon="chevronDown" />
                  </CmIconButton>
                </td>
                <td v-for="column in visibleColumns" :key="column.key" v-bind="cellAttrs(column)">
                  <slot
                    :name="`cell-${column.key}`"
                    :row="row"
                    :column="column"
                    :value="row.cells[column.key] ?? null"
                    :row-index="rowIndex"
                  >
                    {{ row.cells[column.key] ?? '' }}
                  </slot>
                </td>
              </tr>
              <tr
                v-if="$slots['expanded-row'] && expandedRowKeys.has(row.id)"
                :id="`${props.id}-expanded-${row.id}`"
                class="cm-data-table__expanded-row"
              >
                <td :colspan="columnCount + 1">
                  <slot name="expanded-row" :row="row" :row-key="row.id" :row-index="rowIndex" />
                </td>
              </tr>
            </template>
          </template>
        </tbody>
        <tfoot v-if="$slots.footer">
          <slot name="footer" />
        </tfoot>
      </table>
      <div v-if="maskLoading" class="cm-data-table__loading-mask" role="status" :aria-label="props.loadingText">
        <slot name="loading">
          <CmProgressSpinner :label="props.loadingText" aria-hidden="true" />
        </slot>
      </div>
    </div>
    <span v-if="skeletonLoading" class="cm-data-table__loading-status" role="status">{{ props.loadingText }}</span>
    <nav v-if="showPagination" class="cm-data-table__pagination" :aria-label="props.paginationLabel">
      <label v-if="normalizedPageSizeOptions.length > 0" class="cm-data-table__page-size">
        <span>{{ props.rowsPerPageLabel }}</span>
        <select
          data-cm-data-table-page-size-control
          @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="option in normalizedPageSizeOptions"
            :key="option"
            :value="option"
            :selected="option === localPageSize"
          >
            {{ option }}
          </option>
        </select>
      </label>
      <span
        v-if="safeTotalRows !== null"
        class="cm-data-table__pagination-summary"
        aria-live="polite"
        :data-cm-data-table-pagination-summary-template="props.paginationSummaryTemplate"
        :data-cm-data-table-empty-pagination-summary="props.emptyPaginationSummaryText"
      >
        {{ paginationSummary }}
      </span>
      <!-- prettier-ignore -->
      <button class="cm-data-table__page-button" type="button" :aria-label="props.previousPageLabel" data-cm-data-table-page-action="previous" :disabled="localPage <= 1" @click="changePage(localPage - 1)">{{ props.previousPageText }}</button>
      <span
        class="cm-data-table__page-summary"
        aria-live="polite"
        :data-cm-data-table-page-summary-template="props.pageSummaryTemplate"
        >{{ pageSummary }}</span
      >
      <!-- prettier-ignore -->
      <button class="cm-data-table__page-button" type="button" :aria-label="props.nextPageLabel" data-cm-data-table-page-action="next" :disabled="localPage >= resolvedPageCount" @click="changePage(localPage + 1)">{{ props.nextPageText }}</button>
    </nav>
  </div>
</template>
