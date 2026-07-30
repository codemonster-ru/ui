<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useAttrs } from 'vue';
import { icons, VueIconify } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import VfCheckbox from '@/components/checkbox/VfCheckbox.vue';
import VfProgressSpinner from '@/components/progress-spinner/VfProgressSpinner.vue';
import VfSelect from '@/components/select/VfSelect.vue';
import VfSkeleton from '@/components/skeleton/VfSkeleton.vue';
import { cx } from '@/utils/classes';
import type {
  VfDataTableColumn,
  VfDataTableColumnOrder,
  VfDataTableColumnWidths,
  VfDataTableDensity,
  VfDataTableLabels,
  VfDataTableLoadingVariant,
  VfDataTablePaginationMode,
  VfDataTableRow,
  VfDataTableRowKey,
  VfDataTableSort,
  VfDataTableSortingMode,
} from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDataTableProps {
  columns: VfDataTableColumn[];
  rows?: VfDataTableRow[];
  rowKey?: string | ((row: VfDataTableRow, index: number) => VfDataTableRowKey);
  selectable?: boolean;
  rowSelectable?: (row: VfDataTableRow, rowIndex: number) => boolean;
  selectedRowKeys?: VfDataTableRowKey[];
  defaultSelectedRowKeys?: VfDataTableRowKey[];
  caption?: string;
  density?: VfDataTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
  visibleColumnKeys?: string[];
  columnOrder?: VfDataTableColumnOrder;
  defaultColumnOrder?: VfDataTableColumnOrder;
  reorderableColumns?: boolean;
  columnWidths?: VfDataTableColumnWidths;
  defaultColumnWidths?: VfDataTableColumnWidths;
  resizableColumns?: boolean;
  loading?: boolean;
  loadingVariant?: VfDataTableLoadingVariant;
  loadingRows?: number;
  pagination?: boolean;
  paginationMode?: VfDataTablePaginationMode;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  totalRows?: number;
  sort?: VfDataTableSort[];
  defaultSort?: VfDataTableSort[];
  sortingMode?: VfDataTableSortingMode;
  multiSort?: boolean;
  labels?: Partial<VfDataTableLabels>;
  error?: boolean;
  emptyText?: string;
  loadingText?: string;
}

const defaultLabels: VfDataTableLabels = {
  empty: 'No data',
  error: 'Failed to load data',
  loading: 'Loading...',
  pagination: 'Table pagination',
  paginationSummary: (firstRow, lastRow, totalRows) =>
    totalRows === 0 ? '0 rows' : `${firstRow}-${lastRow} of ${totalRows}`,
  rows: 'Rows',
  rowsPerPage: 'Rows per page',
  pageSummary: (page, pageCount) => `Page ${page} of ${pageCount}`,
  previousPage: 'Previous page',
  nextPage: 'Next page',
  selectAllRows: 'Select all rows',
  selectRow: (rowIndex) => `Select row ${rowIndex}`,
  sortAscending: (column) => `Sort ${column} ascending`,
  sortDescending: (column) => `Sort ${column} descending`,
  clearSort: (column) => `Clear sorting for ${column}`,
  reorderColumn: (column, position, columnCount) => `${column}, column ${position} of ${columnCount}`,
  reorderColumnInstructions: 'Drag to reorder, or use Left and Right Arrow keys.',
  columnMoved: (column, position, columnCount) => `${column} column moved to position ${position} of ${columnCount}`,
  resizeColumn: (column) => `Resize ${column} column`,
};

const props = withDefaults(defineProps<VfDataTableProps>(), {
  rows: () => [],
  rowKey: undefined,
  selectable: false,
  rowSelectable: undefined,
  selectedRowKeys: undefined,
  defaultSelectedRowKeys: () => [],
  caption: undefined,
  density: 'default',
  striped: false,
  columnDividers: false,
  stickyHeader: false,
  visibleColumnKeys: undefined,
  columnOrder: undefined,
  defaultColumnOrder: () => [],
  reorderableColumns: false,
  columnWidths: undefined,
  defaultColumnWidths: () => ({}),
  resizableColumns: false,
  loading: false,
  loadingVariant: 'mask',
  loadingRows: 3,
  pagination: false,
  paginationMode: 'client',
  page: undefined,
  defaultPage: 1,
  pageSize: undefined,
  defaultPageSize: 10,
  pageSizeOptions: () => [10, 25, 50],
  totalRows: undefined,
  sort: undefined,
  defaultSort: () => [],
  sortingMode: 'client',
  multiSort: false,
  labels: () => ({}),
  error: false,
  emptyText: undefined,
  loadingText: undefined,
});

const emit = defineEmits<{
  'update:selectedRowKeys': [selectedRowKeys: VfDataTableRowKey[]];
  'update:page': [page: number];
  'update:pageSize': [pageSize: number];
  'update:columnOrder': [columnOrder: VfDataTableColumnOrder];
  'update:columnWidths': [columnWidths: VfDataTableColumnWidths];
  'update:sort': [sort: VfDataTableSort[]];
  'column-reorder-end': [columnOrder: VfDataTableColumnOrder];
  'column-resize-end': [columnWidths: VfDataTableColumnWidths];
}>();

const attrs = useAttrs();
const internalPage = ref(props.defaultPage);
const internalPageSize = ref(props.defaultPageSize);
const internalSelectedRowKeys = ref<VfDataTableRowKey[]>([...props.defaultSelectedRowKeys]);
const internalColumnOrder = ref<VfDataTableColumnOrder>([...props.defaultColumnOrder]);
const internalColumnWidths = ref<VfDataTableColumnWidths>({ ...props.defaultColumnWidths });
const internalSort = ref<VfDataTableSort[]>(props.defaultSort.map((sort) => ({ ...sort })));
const lastCommittedColumnWidths = ref<VfDataTableColumnWidths>({ ...props.defaultColumnWidths });
const tableRef = ref<HTMLTableElement>();
const scrollRef = ref<HTMLDivElement>();
const isResizing = ref(false);
const resizingColumnIndex = ref<number>();
const highlightedColumnBoundaryIndex = ref<number>();
const columnBoundaryGuideStyle = ref<Record<string, string>>();
const previewColumnOrder = ref<VfDataTableColumnOrder>();
const reorderingColumnKey = ref<string>();
const isReordering = ref(false);
const columnReorderAnnouncement = ref('');

interface ColumnReorderSession {
  pointerId: number;
  column: VfDataTableColumn;
  header: HTMLElement;
  startX: number;
  startY: number;
  pointerToColumnCenterOffset: number;
  originalOrder: VfDataTableColumnOrder;
  previewOrder: VfDataTableColumnOrder;
  active: boolean;
}

interface ColumnResizeSession {
  pointerId?: number;
  columnIndex: number;
  startX: number;
  startWidth: number;
  minWidth: number;
  maxWidth: number;
  adjacentStartWidth: number;
  adjacentMinWidth: number;
  adjacentMaxWidth: number;
  direction: number;
  columnWidths: VfDataTableColumnWidths;
  changed: boolean;
}

let reorderSession: ColumnReorderSession | undefined;
let resizeSession: ColumnResizeSession | undefined;
let columnBoundaryGuideFrame: number | undefined;
let columnReorderAnimationGeneration = 0;
let suppressHeaderSortClick = false;
let headerSortClickReset: number | undefined;
const activeColumnReorderAnimations = new Set<Animation>();
const resolvedLabels = computed<VfDataTableLabels>(() => {
  const labels = Object.fromEntries(
    Object.entries(props.labels).filter(([, label]) => label !== undefined),
  ) as Partial<VfDataTableLabels>;

  return {
    ...defaultLabels,
    ...labels,
    empty: props.emptyText ?? labels.empty ?? defaultLabels.empty,
    loading: props.loadingText ?? labels.loading ?? defaultLabels.loading,
  };
});

const classes = computed(() =>
  cx(
    'vf-table',
    'vf-data-table',
    props.density === 'compact' && 'vf-table--compact',
    props.striped && 'vf-table--striped',
    props.columnDividers && 'vf-table--column-dividers',
    props.stickyHeader && 'vf-table--sticky-header',
    props.resizableColumns && 'vf-data-table--resizable',
    props.resizableColumns &&
      renderedColumns.value.length > 0 &&
      renderedColumns.value.every((column) => renderedColumnWidths.value[column.key]) &&
      'vf-data-table--fixed-layout',
    isReordering.value && 'vf-data-table--reordering',
    isResizing.value && 'vf-data-table--resizing',
  ),
);

const totalRowCount = computed(() => Math.max(0, props.totalRows ?? props.rows.length));
const currentPageSize = computed(() => Math.max(1, props.pageSize ?? internalPageSize.value));
const pageCount = computed(() => Math.max(1, Math.ceil(totalRowCount.value / currentPageSize.value)));
const currentPage = computed(() => clampPage(props.page ?? internalPage.value));
const currentSort = computed(() => normalizeSort(props.sort ?? internalSort.value));
const sortedRows = computed(() => {
  if (
    currentSort.value.length === 0 ||
    props.sortingMode === 'manual' ||
    (props.pagination && props.paginationMode === 'manual')
  ) {
    return props.rows;
  }

  return props.rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareRows(left.row, right.row) || left.index - right.index)
    .map(({ row }) => row);
});
const visibleRows = computed(() => {
  if (!props.pagination || props.paginationMode === 'manual') {
    return sortedRows.value;
  }

  const start = (currentPage.value - 1) * currentPageSize.value;

  return sortedRows.value.slice(start, start + currentPageSize.value);
});
const hasRows = computed(() => visibleRows.value.length > 0);
const stateColspan = computed(() => Math.max(renderedColumns.value.length + (props.selectable ? 1 : 0), 1));
const skeletonRows = computed(() => Array.from({ length: Math.max(1, props.loadingRows) }, (_, index) => index));
const firstVisibleRow = computed(() => {
  if (!hasRows.value) {
    return 0;
  }

  return props.pagination ? (currentPage.value - 1) * currentPageSize.value + 1 : 1;
});
const lastVisibleRow = computed(() => {
  if (!hasRows.value) {
    return 0;
  }

  if (!props.pagination) {
    return visibleRows.value.length;
  }

  return Math.min(firstVisibleRow.value + visibleRows.value.length - 1, totalRowCount.value);
});
const paginationLabel = computed(() => {
  return resolvedLabels.value.paginationSummary(firstVisibleRow.value, lastVisibleRow.value, totalRowCount.value);
});
const canGoPrevious = computed(() => props.pagination && currentPage.value > 1);
const canGoNext = computed(() => props.pagination && currentPage.value < pageCount.value);
const pageSizeSelectOptions = computed(() =>
  props.pageSizeOptions.map((option) => ({
    value: String(option),
    label: String(option),
  })),
);
const currentSelectedRowKeys = computed(() => props.selectedRowKeys ?? internalSelectedRowKeys.value);
const currentColumnOrder = computed(() => normalizeColumnOrder(props.columnOrder ?? internalColumnOrder.value));
const displayedColumnOrder = computed(() => normalizeColumnOrder(previewColumnOrder.value ?? currentColumnOrder.value));
const orderedColumns = computed(() => {
  const columnsByKey = new Map(props.columns.map((column) => [column.key, column]));

  return displayedColumnOrder.value.flatMap((key) => {
    const column = columnsByKey.get(key);

    return column ? [column] : [];
  });
});
const renderedColumns = computed(() => {
  if (props.visibleColumnKeys === undefined) {
    return orderedColumns.value;
  }

  const visibleColumnKeys = new Set(props.visibleColumnKeys);

  return orderedColumns.value.filter((column) => visibleColumnKeys.has(column.key));
});
const currentColumnWidths = computed(() => props.columnWidths ?? internalColumnWidths.value);
const renderedColumnWidths = computed(() =>
  isResizing.value ? internalColumnWidths.value : currentColumnWidths.value,
);
const selectableVisibleRowKeys = computed(() =>
  visibleRows.value.flatMap((row, rowIndex) => (isRowSelectable(row, rowIndex) ? [selectionRowId(row, rowIndex)] : [])),
);
const allVisibleRowsSelected = computed(
  () =>
    selectableVisibleRowKeys.value.length > 0 &&
    selectableVisibleRowKeys.value.every((key) => currentSelectedRowKeys.value.includes(key)),
);
const someVisibleRowsSelected = computed(
  () =>
    !allVisibleRowsSelected.value &&
    selectableVisibleRowKeys.value.some((key) => currentSelectedRowKeys.value.includes(key)),
);

function rowId(row: VfDataTableRow, index: number): VfDataTableRowKey {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index);
  }

  if (props.rowKey) {
    const value = cellValue(row, props.rowKey);

    return typeof value === 'string' || typeof value === 'number' ? value : index;
  }

  return index;
}

function selectionRowId(row: VfDataTableRow, index: number): VfDataTableRowKey {
  const offset =
    props.pagination && props.paginationMode === 'client' ? (currentPage.value - 1) * currentPageSize.value : 0;

  return rowId(row, index + offset);
}

function isRowSelectable(row: VfDataTableRow, rowIndex: number) {
  return props.rowSelectable?.(row, rowIndex) ?? true;
}

function cellValue(row: VfDataTableRow, key: string) {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, row);
}

function columnHeader(column: VfDataTableColumn) {
  return column.header ?? column.key;
}

function normalizeSort(sort: VfDataTableSort[]) {
  const sortableColumnKeys = new Set(props.columns.filter((column) => column.sortable).map((column) => column.key));
  const normalizedSort = sort.filter(
    (item, index) =>
      sortableColumnKeys.has(item.key) &&
      (item.direction === 'asc' || item.direction === 'desc') &&
      sort.findIndex((candidate) => candidate.key === item.key) === index,
  );

  return props.multiSort ? normalizedSort : normalizedSort.slice(0, 1);
}

const sortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function compareSortValues(left: unknown, right: unknown) {
  if (Object.is(left, right)) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  return sortCollator.compare(String(left), String(right));
}

function compareRows(left: VfDataTableRow, right: VfDataTableRow) {
  for (const sort of currentSort.value) {
    const leftValue = cellValue(left, sort.key);
    const rightValue = cellValue(right, sort.key);

    if (leftValue == null || rightValue == null) {
      if (!Object.is(leftValue, rightValue)) {
        return leftValue == null ? 1 : -1;
      }

      continue;
    }

    const comparison = compareSortValues(leftValue, rightValue);

    if (comparison !== 0) {
      return sort.direction === 'asc' ? comparison : -comparison;
    }
  }

  return 0;
}

function columnSortIndex(column: VfDataTableColumn) {
  return currentSort.value.findIndex((sort) => sort.key === column.key);
}

function columnSortDirection(column: VfDataTableColumn) {
  return currentSort.value[columnSortIndex(column)]?.direction;
}

function columnAriaSort(column: VfDataTableColumn) {
  const direction = columnSortDirection(column);

  return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
}

function columnSortLabel(column: VfDataTableColumn) {
  const direction = columnSortDirection(column);

  if (direction === 'asc') {
    return resolvedLabels.value.sortDescending(columnHeader(column));
  }

  if (direction === 'desc') {
    return resolvedLabels.value.clearSort(columnHeader(column));
  }

  return resolvedLabels.value.sortAscending(columnHeader(column));
}

function toggleColumnSort(column: VfDataTableColumn) {
  if (!column.sortable) {
    return;
  }

  const sortIndex = columnSortIndex(column);
  const direction = sortIndex < 0 ? undefined : currentSort.value[sortIndex]?.direction;
  const nextDirection = direction === undefined ? 'asc' : direction === 'asc' ? 'desc' : undefined;
  const preserveOtherColumns = props.multiSort;
  const nextSort = preserveOtherColumns ? currentSort.value.filter((sort) => sort.key !== column.key) : [];

  if (nextDirection) {
    const nextItem: VfDataTableSort = { key: column.key, direction: nextDirection };

    if (preserveOtherColumns && sortIndex >= 0) {
      nextSort.splice(sortIndex, 0, nextItem);
    } else {
      nextSort.push(nextItem);
    }
  }

  internalSort.value = nextSort;
  emit(
    'update:sort',
    nextSort.map((sort) => ({ ...sort })),
  );

  if (props.pagination && currentPage.value !== 1) {
    setPage(1);
  }
}

function sortColumnFromHeader(column: VfDataTableColumn) {
  if (suppressHeaderSortClick) {
    return;
  }

  toggleColumnSort(column);
}

function normalizeColumnOrder(columnOrder: VfDataTableColumnOrder) {
  const columnKeys = props.columns.map((column) => column.key);
  const validColumnKeys = new Set(columnKeys);
  const normalizedOrder = columnOrder.filter(
    (key, index) => validColumnKeys.has(key) && columnOrder.indexOf(key) === index,
  );
  const orderedKeys = new Set(normalizedOrder);

  return [...normalizedOrder, ...columnKeys.filter((key) => !orderedKeys.has(key))];
}

function canReorderColumn(column: VfDataTableColumn) {
  return props.reorderableColumns && column.reorderable !== false;
}

function commitColumnOrder(columnOrder: VfDataTableColumnOrder, movedColumn: VfDataTableColumn) {
  const nextOrder = normalizeColumnOrder(columnOrder);

  if (nextOrder.every((key, index) => key === currentColumnOrder.value[index])) {
    return;
  }

  internalColumnOrder.value = nextOrder;
  emit('update:columnOrder', [...nextOrder]);
  emit('column-reorder-end', [...nextOrder]);

  const visibleColumnKeys = new Set(renderedColumns.value.map((column) => column.key));
  const nextVisibleOrder = nextOrder.filter((key) => visibleColumnKeys.has(key));
  const visiblePosition = nextVisibleOrder.indexOf(movedColumn.key) + 1;

  columnReorderAnnouncement.value = resolvedLabels.value.columnMoved(
    columnHeader(movedColumn),
    visiblePosition,
    nextVisibleOrder.length,
  );
}

function reorderedColumnOrder(
  columnOrder: VfDataTableColumnOrder,
  columnKey: string,
  targetColumnKey: string,
  position: 'before' | 'after',
) {
  if (columnKey === targetColumnKey) {
    return columnOrder;
  }

  const nextOrder = [...columnOrder];
  const columnIndex = nextOrder.indexOf(columnKey);

  if (columnIndex < 0) {
    return columnOrder;
  }

  nextOrder.splice(columnIndex, 1);
  const targetIndex = nextOrder.indexOf(targetColumnKey);

  if (targetIndex < 0) {
    return columnOrder;
  }

  nextOrder.splice(targetIndex + (position === 'after' ? 1 : 0), 0, columnKey);

  return nextOrder;
}

function moveColumn(column: VfDataTableColumn, targetColumn: VfDataTableColumn, position: 'before' | 'after') {
  const nextOrder = reorderedColumnOrder(currentColumnOrder.value, column.key, targetColumn.key, position);

  const previousPositions = captureColumnPositions();

  cancelColumnReorderAnimations();
  commitColumnOrder(nextOrder, column);
  animateColumnOrderChange(previousPositions);
}

function ordersMatch(left: VfDataTableColumnOrder, right: VfDataTableColumnOrder) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function columnHeaderElements() {
  return Array.from(tableRef.value?.querySelectorAll<HTMLElement>('thead [data-vf-column-key]') ?? []);
}

function columnElements() {
  return Array.from(tableRef.value?.querySelectorAll<HTMLElement>('[data-vf-column-key]') ?? []);
}

function captureColumnPositions() {
  return new Map(columnElements().map((element) => [element, element.getBoundingClientRect().left]));
}

function cancelColumnReorderAnimations() {
  activeColumnReorderAnimations.forEach((animation) => animation.cancel());
  activeColumnReorderAnimations.clear();
}

function motionDurationMilliseconds(value: string, fallback: number) {
  const duration = Number.parseFloat(value);

  if (!Number.isFinite(duration)) {
    return fallback;
  }

  return value.trim().endsWith('s') && !value.trim().endsWith('ms') ? duration * 1000 : duration;
}

function animateColumnOrderChange(previousPositions: Map<HTMLElement, number>) {
  const generation = ++columnReorderAnimationGeneration;

  void nextTick(() => {
    if (
      generation !== columnReorderAnimationGeneration ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const elements = columnElements();

    if (elements.length > 200 || elements.every((element) => typeof element.animate !== 'function')) {
      return;
    }

    const tableStyle = getComputedStyle(tableRef.value ?? elements[0]!);
    const duration = motionDurationMilliseconds(tableStyle.getPropertyValue('--vf-motion-duration-fast'), 160);
    const easing = tableStyle.getPropertyValue('--vf-motion-ease-standard').trim() || 'ease';

    elements.forEach((element) => {
      const previousLeft = previousPositions.get(element);

      if (previousLeft === undefined || typeof element.animate !== 'function') {
        return;
      }

      const delta = previousLeft - element.getBoundingClientRect().left;

      if (Math.abs(delta) < 0.5) {
        return;
      }

      const animation = element.animate([{ transform: `translateX(${delta}px)` }, { transform: 'translateX(0)' }], {
        duration,
        easing,
      });
      const removeAnimation = () => activeColumnReorderAnimations.delete(animation);

      animation.onfinish = removeAnimation;
      animation.oncancel = removeAnimation;
      activeColumnReorderAnimations.add(animation);
    });
  });
}

function previewColumnReorder(clientX: number) {
  const session = reorderSession;

  if (!session) {
    return;
  }

  if (renderedColumns.value.length < 2) {
    return;
  }

  const headerElements = new Map(
    columnHeaderElements().flatMap((element) => {
      const key = element.dataset.vfColumnKey;

      return key ? [[key, element] as const] : [];
    }),
  );
  const isRtl = getComputedStyle(tableRef.value ?? session.header).direction === 'rtl';
  const draggedColumnCenter = clientX + session.pointerToColumnCenterOffset;
  const columnRects = renderedColumns.value.map((column) => ({
    column,
    rect: headerElements.get(column.key)?.getBoundingClientRect(),
  }));

  if (columnRects.some(({ rect }) => !rect)) {
    return;
  }

  const insertionIndex = columnRects.slice(0, -1).filter(({ rect }, index) => {
    const adjacentRect = columnRects[index + 1]?.rect;

    if (!rect || !adjacentRect) {
      return false;
    }

    const boundary = isRtl ? (rect.left + adjacentRect.right) / 2 : (rect.right + adjacentRect.left) / 2;

    return isRtl ? draggedColumnCenter < boundary : draggedColumnCenter > boundary;
  }).length;
  const remainingColumns = renderedColumns.value.filter((column) => column.key !== session.column.key);
  const targetColumn =
    insertionIndex === remainingColumns.length
      ? remainingColumns[remainingColumns.length - 1]
      : remainingColumns[insertionIndex];
  const position = insertionIndex === remainingColumns.length ? 'after' : 'before';

  if (!targetColumn) {
    return;
  }

  const nextOrder = reorderedColumnOrder(session.previewOrder, session.column.key, targetColumn.key, position);

  if (!ordersMatch(nextOrder, session.previewOrder)) {
    const previousPositions = captureColumnPositions();

    cancelColumnReorderAnimations();
    session.previewOrder = nextOrder;
    previewColumnOrder.value = [...nextOrder];
    animateColumnOrderChange(previousPositions);
  }
}

function onColumnReorderPointerMove(event: PointerEvent) {
  const session = reorderSession;

  if (!session || event.pointerId !== session.pointerId) {
    return;
  }

  if (!session.active) {
    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);

    if (distance < 4) {
      return;
    }

    session.active = true;
    isReordering.value = true;
    reorderingColumnKey.value = session.column.key;
    previewColumnOrder.value = [...session.previewOrder];
  }

  event.preventDefault();
  previewColumnReorder(event.clientX);
}

function endColumnReorder(commit: boolean, event?: PointerEvent) {
  const session = reorderSession;

  if (!session || (event && event.pointerId !== session.pointerId)) {
    return;
  }

  const previousPositions = session.active ? captureColumnPositions() : undefined;

  if (session.active) {
    suppressHeaderSortClick = true;

    if (headerSortClickReset !== undefined) {
      window.clearTimeout(headerSortClickReset);
    }

    headerSortClickReset = window.setTimeout(() => {
      suppressHeaderSortClick = false;
      headerSortClickReset = undefined;
    });
  }

  cancelColumnReorderAnimations();
  reorderSession = undefined;
  previewColumnOrder.value = undefined;
  reorderingColumnKey.value = undefined;
  isReordering.value = false;
  window.removeEventListener('pointermove', onColumnReorderPointerMove);
  window.removeEventListener('pointerup', finishColumnReorder);
  window.removeEventListener('pointercancel', cancelColumnReorder);
  window.removeEventListener('keydown', cancelColumnReorderWithKeyboard);

  if (session.header.hasPointerCapture?.(session.pointerId)) {
    session.header.releasePointerCapture(session.pointerId);
  }

  if (commit && session.active && !ordersMatch(session.previewOrder, session.originalOrder)) {
    commitColumnOrder(session.previewOrder, session.column);
  }

  if (previousPositions) {
    animateColumnOrderChange(previousPositions);
  }
}

function finishColumnReorder(event: PointerEvent) {
  endColumnReorder(true, event);
}

function cancelColumnReorder(event?: PointerEvent) {
  endColumnReorder(false, event);
}

function cancelColumnReorderWithKeyboard(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  endColumnReorder(false);
}

function startColumnReorder(event: PointerEvent, column: VfDataTableColumn) {
  if (reorderSession || event.button !== 0 || !canReorderColumn(column)) {
    return;
  }

  const header = event.currentTarget as HTMLElement;
  const target = event.target instanceof Element ? event.target : undefined;
  const interactiveTarget = target?.closest(
    'a, button, input, select, textarea, [contenteditable="true"], [role="button"], [role="checkbox"], [role="link"], [role="separator"]',
  );

  if (interactiveTarget && interactiveTarget !== header) {
    return;
  }

  const headerRect = header.getBoundingClientRect();
  const order = [...currentColumnOrder.value];

  reorderSession = {
    pointerId: event.pointerId,
    column,
    header,
    startX: event.clientX,
    startY: event.clientY,
    pointerToColumnCenterOffset: headerRect.left + headerRect.width / 2 - event.clientX,
    originalOrder: order,
    previewOrder: [...order],
    active: false,
  };
  header.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', onColumnReorderPointerMove);
  window.addEventListener('pointerup', finishColumnReorder);
  window.addEventListener('pointercancel', cancelColumnReorder);
  window.addEventListener('keydown', cancelColumnReorderWithKeyboard);
}

function reorderColumnWithKeyboard(event: KeyboardEvent, column: VfDataTableColumn) {
  if (event.target !== event.currentTarget || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
    return;
  }

  const columnIndex = renderedColumns.value.findIndex((renderedColumn) => renderedColumn.key === column.key);
  const isRtl = getComputedStyle(tableRef.value ?? (event.currentTarget as HTMLElement)).direction === 'rtl';
  const visualDelta = event.key === 'ArrowRight' ? 1 : -1;
  const orderDelta = isRtl ? -visualDelta : visualDelta;
  const targetColumn = renderedColumns.value[columnIndex + orderDelta];

  if (!targetColumn) {
    return;
  }

  event.preventDefault();
  moveColumn(column, targetColumn, orderDelta < 0 ? 'before' : 'after');
}

function columnClasses(column: VfDataTableColumn) {
  return [
    column.align && `vf-data-table__cell--${column.align}`,
    column.verticalAlign && `vf-data-table__cell--vertical-${column.verticalAlign}`,
    column.nowrap && 'vf-data-table__cell--nowrap',
  ];
}

function columnStyle(column: VfDataTableColumn) {
  const width = renderedColumnWidths.value[column.key] ?? column.width;

  if (!width && !column.minWidth && !column.maxWidth) {
    return undefined;
  }

  return {
    width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
  };
}

function canResizeColumn(column: VfDataTableColumn, columnIndex: number) {
  if (!props.resizableColumns || column.resizable === false) {
    return false;
  }

  const adjacentColumn = renderedColumns.value[columnIndex + 1];

  return Boolean(adjacentColumn && adjacentColumn.resizable !== false);
}

function activeColumnBoundaryIndex() {
  return resizingColumnIndex.value ?? highlightedColumnBoundaryIndex.value;
}

function updateColumnBoundaryGuide() {
  const columnIndex = activeColumnBoundaryIndex();
  const table = tableRef.value;
  const scroll = scrollRef.value;

  if (columnIndex === undefined || !table || !scroll) {
    columnBoundaryGuideStyle.value = undefined;
    return;
  }

  const cells = Array.from(table.querySelectorAll<HTMLElement>(`[data-vf-column-index="${columnIndex}"]`));
  const headerCell = cells[0];
  const lastCell = cells[cells.length - 1];

  if (!headerCell || !lastCell) {
    columnBoundaryGuideStyle.value = undefined;
    return;
  }

  const headerRect = headerCell.getBoundingClientRect();
  const lastCellRect = lastCell.getBoundingClientRect();
  const scrollRect = scroll.getBoundingClientRect();
  const direction = getComputedStyle(table).direction;
  const boundaryPosition = direction === 'rtl' ? headerRect.left : headerRect.right;

  columnBoundaryGuideStyle.value = {
    left: `${boundaryPosition - scrollRect.left + scroll.scrollLeft}px`,
    top: `${headerRect.top - scrollRect.top + scroll.scrollTop}px`,
    height: `${Math.max(0, lastCellRect.bottom - headerRect.top)}px`,
    transform: direction === 'rtl' ? 'translateX(-100%)' : 'none',
  };
}

function scheduleColumnBoundaryGuideUpdate() {
  if (columnBoundaryGuideFrame !== undefined) {
    cancelAnimationFrame(columnBoundaryGuideFrame);
  }

  if (headerSortClickReset !== undefined) {
    window.clearTimeout(headerSortClickReset);
  }

  columnBoundaryGuideFrame = requestAnimationFrame(() => {
    columnBoundaryGuideFrame = undefined;
    updateColumnBoundaryGuide();
  });
}

function setHighlightedColumnBoundary(columnIndex?: number) {
  highlightedColumnBoundaryIndex.value = columnIndex;
  updateColumnBoundaryGuide();
}

function columnCell(columnIndex: number) {
  return tableRef.value?.querySelector<HTMLElement>(`[data-vf-column-index="${columnIndex}"]`);
}

function resolvedSize(value: string, fallback: number) {
  const size = Number.parseFloat(value);

  return Number.isFinite(size) ? size : fallback;
}

function columnBounds(cell: HTMLElement) {
  const style = getComputedStyle(cell);
  const minWidth = Math.max(0, resolvedSize(style.minWidth, 0));
  const maxWidth = Math.max(minWidth, resolvedSize(style.maxWidth, Number.POSITIVE_INFINITY));

  return { minWidth, maxWidth };
}

function createResizeSession(columnIndex: number, startX = 0): ColumnResizeSession | undefined {
  const cell = columnCell(columnIndex);

  if (!cell) {
    return undefined;
  }

  const bounds = columnBounds(cell);
  const adjacentCell = columnCell(columnIndex + 1);

  if (!adjacentCell) {
    return undefined;
  }

  const adjacentBounds = columnBounds(adjacentCell);
  const columnWidths = renderedColumns.value.reduce<VfDataTableColumnWidths>(
    (widths, column, index) => {
      const currentCell = columnCell(index);
      const width = currentCell?.getBoundingClientRect().width ?? 0;

      if (width > 0) {
        widths[column.key] = `${Math.round(width)}px`;
      }

      return widths;
    },
    { ...currentColumnWidths.value },
  );

  return {
    columnIndex,
    startX,
    startWidth: cell.getBoundingClientRect().width,
    minWidth: bounds.minWidth,
    maxWidth: bounds.maxWidth,
    adjacentStartWidth: adjacentCell.getBoundingClientRect().width,
    adjacentMinWidth: adjacentBounds.minWidth,
    adjacentMaxWidth: adjacentBounds.maxWidth,
    direction: getComputedStyle(tableRef.value ?? cell).direction === 'rtl' ? -1 : 1,
    columnWidths,
    changed: false,
  };
}

function commitColumnWidths(columnWidths: VfDataTableColumnWidths) {
  const nextWidths = { ...columnWidths };

  internalColumnWidths.value = nextWidths;
  lastCommittedColumnWidths.value = nextWidths;
  emit('update:columnWidths', nextWidths);
}

function resizeColumn(session: ColumnResizeSession, rawDelta: number) {
  const delta = rawDelta * session.direction;
  // Auto table layout can initially resolve a column outside its declared
  // bounds. Keep zero as a valid delta so the first drag never jumps to a
  // constraint; movement toward the valid range remains possible.
  let minimumDelta = Math.min(0, session.minWidth - session.startWidth);
  let maximumDelta = Math.max(0, session.maxWidth - session.startWidth);

  minimumDelta = Math.max(minimumDelta, Math.min(0, session.adjacentStartWidth - session.adjacentMaxWidth));
  maximumDelta = Math.min(maximumDelta, Math.max(0, session.adjacentStartWidth - session.adjacentMinWidth));

  const clampedDelta = Math.min(Math.max(delta, minimumDelta), maximumDelta);
  const column = renderedColumns.value[session.columnIndex];

  if (!column) {
    return;
  }

  session.changed = true;
  const nextWidths: VfDataTableColumnWidths = {
    ...session.columnWidths,
    [column.key]: `${Math.round(session.startWidth + clampedDelta)}px`,
  };

  const adjacentColumn = renderedColumns.value[session.columnIndex + 1];

  if (adjacentColumn) {
    nextWidths[adjacentColumn.key] = `${Math.round(session.adjacentStartWidth - clampedDelta)}px`;
  }

  commitColumnWidths(nextWidths);
  scheduleColumnBoundaryGuideUpdate();
}

function stopColumnResize(event?: PointerEvent) {
  if (
    !resizeSession ||
    (event && resizeSession.pointerId !== undefined && event.pointerId !== resizeSession.pointerId)
  ) {
    return;
  }

  const completedSession = resizeSession;

  resizeSession = undefined;
  isResizing.value = false;
  resizingColumnIndex.value = undefined;
  window.removeEventListener('pointermove', onColumnPointerMove);
  window.removeEventListener('pointerup', stopColumnResize);
  window.removeEventListener('pointercancel', stopColumnResize);

  if (completedSession.changed) {
    emit('column-resize-end', { ...lastCommittedColumnWidths.value });
  }

  updateColumnBoundaryGuide();
}

function onColumnPointerMove(event: PointerEvent) {
  if (!resizeSession || (resizeSession.pointerId !== undefined && event.pointerId !== resizeSession.pointerId)) {
    return;
  }

  event.preventDefault();
  resizeColumn(resizeSession, event.clientX - resizeSession.startX);
}

function startColumnResize(event: PointerEvent, columnIndex: number) {
  if (event.button !== 0) {
    return;
  }

  const session = createResizeSession(columnIndex, event.clientX);

  if (!session) {
    return;
  }

  session.pointerId = event.pointerId;
  resizeSession = session;
  internalColumnWidths.value = { ...session.columnWidths };
  isResizing.value = true;
  resizingColumnIndex.value = columnIndex;
  updateColumnBoundaryGuide();
  window.addEventListener('pointermove', onColumnPointerMove);
  window.addEventListener('pointerup', stopColumnResize);
  window.addEventListener('pointercancel', stopColumnResize);
}

function measureColumnContentWidth(cells: HTMLElement[]) {
  const measurementTable = document.createElement('table');
  const measurementBody = document.createElement('tbody');

  measurementTable.className = tableRef.value?.className ?? '';
  measurementTable.setAttribute('aria-hidden', 'true');
  measurementTable.style.position = 'fixed';
  measurementTable.style.insetBlockStart = '-10000px';
  measurementTable.style.insetInlineStart = '-10000px';
  measurementTable.style.width = 'max-content';
  measurementTable.style.minWidth = '0';
  measurementTable.style.visibility = 'hidden';
  measurementTable.style.pointerEvents = 'none';

  cells.forEach((cell) => {
    const row = document.createElement('tr');
    const clone = cell.cloneNode(true) as HTMLElement;

    clone.querySelector('.vf-data-table__column-resizer')?.remove();
    clone.style.width = 'auto';
    clone.style.minWidth = '0';
    clone.style.maxWidth = 'none';
    clone.style.whiteSpace = 'nowrap';
    row.append(clone);
    measurementBody.append(row);
  });

  measurementTable.append(measurementBody);
  document.body.append(measurementTable);

  const measuredWidth = Math.max(measurementTable.getBoundingClientRect().width, measurementTable.scrollWidth);

  measurementTable.remove();

  return measuredWidth;
}

function autosizeColumn(columnIndex: number) {
  const session = createResizeSession(columnIndex);
  const table = tableRef.value;

  if (!session || !table) {
    return;
  }

  const cells = Array.from(table.querySelectorAll<HTMLElement>(`[data-vf-column-index="${columnIndex}"]`));
  const measuredWidth = measureColumnContentWidth(cells);
  const fallbackWidth = Math.max(...cells.map((cell) => cell.scrollWidth));
  const contentWidth = Math.max(measuredWidth || fallbackWidth, session.minWidth);

  resizeColumn(session, contentWidth - session.startWidth);
  emit('column-resize-end', { ...lastCommittedColumnWidths.value });
}

function resizeColumnWithKeyboard(event: KeyboardEvent, columnIndex: number) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return;
  }

  const session = createResizeSession(columnIndex);

  if (!session) {
    return;
  }

  event.preventDefault();
  const delta = event.key === 'ArrowRight' ? 8 : -8;

  resizeColumn(session, delta);
  emit('column-resize-end', { ...lastCommittedColumnWidths.value });
}

function clampPage(page: number) {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.min(Math.max(1, Math.trunc(page)), pageCount.value);
}

function setPage(page: number) {
  const nextPage = clampPage(page);

  internalPage.value = nextPage;
  emit('update:page', nextPage);
}

function setPageSize(value: string) {
  const nextPageSize = Number(value);

  if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
    return;
  }

  internalPageSize.value = nextPageSize;
  emit('update:pageSize', nextPageSize);
  setPage(1);
}

function updateSelectedRowKeys(selectedRowKeys: VfDataTableRowKey[]) {
  internalSelectedRowKeys.value = selectedRowKeys;
  emit('update:selectedRowKeys', selectedRowKeys);
}

function setRowSelected(row: VfDataTableRow, index: number, selected: boolean) {
  if (!isRowSelectable(row, index)) {
    return;
  }

  const key = selectionRowId(row, index);
  const nextKeys = selected
    ? [...currentSelectedRowKeys.value, key].filter((value, keyIndex, keys) => keys.indexOf(value) === keyIndex)
    : currentSelectedRowKeys.value.filter((selectedKey) => selectedKey !== key);

  updateSelectedRowKeys(nextKeys);
}

function setAllVisibleRowsSelected(selected: boolean) {
  const nextKeys = selected
    ? [...currentSelectedRowKeys.value, ...selectableVisibleRowKeys.value].filter(
        (value, keyIndex, keys) => keys.indexOf(value) === keyIndex,
      )
    : currentSelectedRowKeys.value.filter((key) => !selectableVisibleRowKeys.value.includes(key));

  updateSelectedRowKeys(nextKeys);
}

onUnmounted(() => {
  columnReorderAnimationGeneration++;
  cancelColumnReorderAnimations();

  if (columnBoundaryGuideFrame !== undefined) {
    cancelAnimationFrame(columnBoundaryGuideFrame);
  }

  if (resizeSession) {
    resizeSession = undefined;
    window.removeEventListener('pointermove', onColumnPointerMove);
    window.removeEventListener('pointerup', stopColumnResize);
    window.removeEventListener('pointercancel', stopColumnResize);
  }

  if (reorderSession) {
    endColumnReorder(false);
  }
});
</script>

<template>
  <div class="vf-table-wrap vf-data-table-wrap" v-bind="attrs">
    <div ref="scrollRef" class="vf-table-scroll vf-data-table-scroll">
      <table ref="tableRef" :class="classes">
        <caption v-if="props.caption || $slots.caption" class="vf-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>

        <thead class="vf-table__head">
          <tr>
            <th v-if="props.selectable" class="vf-data-table__selection-cell" scope="col">
              <VfCheckbox
                :model-value="allVisibleRowsSelected"
                :indeterminate="someVisibleRowsSelected"
                :disabled="selectableVisibleRowKeys.length === 0"
                :aria-label="resolvedLabels.selectAllRows"
                @update:model-value="setAllVisibleRowsSelected"
              />
            </th>
            <th
              v-for="(column, columnIndex) in renderedColumns"
              :key="column.key"
              :class="[
                'vf-data-table__header-cell',
                column.sortable && 'vf-data-table__header-cell--sortable',
                canReorderColumn(column) && 'vf-data-table__header-cell--reorderable',
                reorderingColumnKey === column.key && 'vf-data-table__header-cell--reordering',
                ...columnClasses(column),
              ]"
              :data-vf-column-index="columnIndex"
              :data-vf-column-key="column.key"
              :scope="column.scope ?? 'col'"
              :style="columnStyle(column)"
              :aria-sort="column.sortable ? columnAriaSort(column) : undefined"
              :tabindex="canReorderColumn(column) ? 0 : undefined"
              :aria-label="
                canReorderColumn(column)
                  ? resolvedLabels.reorderColumn(columnHeader(column), columnIndex + 1, renderedColumns.length)
                  : undefined
              "
              :aria-description="canReorderColumn(column) ? resolvedLabels.reorderColumnInstructions : undefined"
              :aria-keyshortcuts="canReorderColumn(column) ? 'ArrowLeft ArrowRight' : undefined"
              @click="sortColumnFromHeader(column)"
              @pointerdown="startColumnReorder($event, column)"
              @keydown="reorderColumnWithKeyboard($event, column)"
            >
              <span class="vf-data-table__header-content">
                <button
                  v-if="column.sortable"
                  class="vf-data-table__sort-button"
                  type="button"
                  :aria-label="columnSortLabel(column)"
                >
                  <span class="vf-data-table__sort-label">
                    <slot :name="`header-${column.key}`" :column="column">
                      {{ columnHeader(column) }}
                    </slot>
                  </span>
                  <VueIconify
                    class="vf-data-table__sort-icon"
                    :icon="
                      columnSortDirection(column) === 'asc'
                        ? icons.caretUp
                        : columnSortDirection(column) === 'desc'
                          ? icons.caretDown
                          : icons.sort
                    "
                    size="var(--vf-icon-size-sm)"
                    aria-hidden="true"
                  />
                  <span
                    v-if="props.multiSort && currentSort.length > 1 && columnSortIndex(column) >= 0"
                    class="vf-data-table__sort-priority"
                    aria-hidden="true"
                  >
                    {{ columnSortIndex(column) + 1 }}
                  </span>
                </button>
                <slot v-else :name="`header-${column.key}`" :column="column">
                  {{ columnHeader(column) }}
                </slot>
              </span>
              <span
                v-if="canResizeColumn(column, columnIndex)"
                :class="[
                  'vf-data-table__column-resizer',
                  resizingColumnIndex === columnIndex && 'vf-data-table__column-resizer--active',
                ]"
                role="separator"
                tabindex="0"
                aria-orientation="vertical"
                :aria-label="resolvedLabels.resizeColumn(columnHeader(column))"
                @pointerdown.stop.prevent="startColumnResize($event, columnIndex)"
                @click.stop
                @pointerenter="setHighlightedColumnBoundary(columnIndex)"
                @pointerleave="setHighlightedColumnBoundary()"
                @dblclick.stop.prevent="autosizeColumn(columnIndex)"
                @focus="setHighlightedColumnBoundary(columnIndex)"
                @blur="setHighlightedColumnBoundary()"
                @keydown="resizeColumnWithKeyboard($event, columnIndex)"
              />
            </th>
          </tr>
        </thead>

        <tbody class="vf-table__body">
          <template v-if="props.loading && props.loadingVariant === 'skeleton'">
            <tr v-for="row in skeletonRows" :key="`skeleton-${row}`" class="vf-data-table__skeleton-row">
              <td v-if="props.selectable" class="vf-data-table__selection-cell" />
              <td
                v-for="(column, columnIndex) in renderedColumns"
                :key="column.key"
                :class="['vf-data-table__cell', 'vf-data-table__skeleton-cell', ...columnClasses(column)]"
                :data-vf-column-index="columnIndex"
                :data-vf-column-key="column.key"
                :style="columnStyle(column)"
              >
                <VfSkeleton min-height="var(--vf-icon-size-md)" radius="var(--vf-radius-control)" />
              </td>
            </tr>
          </template>

          <tr v-else-if="props.error && !props.loading" class="vf-data-table__state-row">
            <td class="vf-data-table__state-cell" :colspan="stateColspan">
              <div class="vf-data-table__error" role="alert">
                <slot name="error">{{ resolvedLabels.error }}</slot>
              </div>
            </td>
          </tr>

          <template v-else-if="hasRows">
            <tr
              v-for="(row, rowIndex) in visibleRows"
              :key="rowId(row, rowIndex)"
              :aria-selected="
                props.selectable ? currentSelectedRowKeys.includes(selectionRowId(row, rowIndex)) : undefined
              "
            >
              <td v-if="props.selectable" class="vf-data-table__selection-cell">
                <VfCheckbox
                  :model-value="currentSelectedRowKeys.includes(selectionRowId(row, rowIndex))"
                  :disabled="!isRowSelectable(row, rowIndex)"
                  :aria-label="resolvedLabels.selectRow(rowIndex + 1)"
                  @update:model-value="setRowSelected(row, rowIndex, $event)"
                />
              </td>
              <td
                v-for="(column, columnIndex) in renderedColumns"
                :key="column.key"
                :class="['vf-data-table__cell', ...columnClasses(column)]"
                :data-vf-column-index="columnIndex"
                :data-vf-column-key="column.key"
                :style="columnStyle(column)"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :column="column"
                  :value="cellValue(row, column.key)"
                  :row-index="rowIndex"
                >
                  {{ cellValue(row, column.key) }}
                </slot>
              </td>
            </tr>
          </template>

          <tr v-else class="vf-data-table__state-row">
            <td class="vf-data-table__state-cell" :colspan="stateColspan">
              <slot name="empty">{{ resolvedLabels.empty }}</slot>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="$slots.footer" class="vf-table__foot">
          <slot name="footer" />
        </tfoot>
      </table>

      <span
        v-if="columnBoundaryGuideStyle"
        class="vf-data-table__column-boundary-guide"
        :style="columnBoundaryGuideStyle"
        aria-hidden="true"
      />

      <span class="vf-sr-only" aria-live="polite">{{ columnReorderAnnouncement }}</span>

      <div
        v-if="props.loading && props.loadingVariant === 'mask'"
        class="vf-data-table__loading-mask"
        role="status"
        :aria-label="resolvedLabels.loading"
      >
        <slot name="loading">
          <span class="vf-data-table__loading">
            <VfProgressSpinner
              class="vf-data-table__loading-spinner"
              :label="resolvedLabels.loading"
              size="var(--vf-data-table-loading-spinner-size)"
            />
          </span>
        </slot>
      </div>
    </div>

    <div v-if="props.pagination" class="vf-data-table__pagination" :aria-label="resolvedLabels.pagination">
      <span class="vf-data-table__pagination-summary">{{ paginationLabel }}</span>

      <div class="vf-data-table__page-size">
        <span class="vf-data-table__page-size-label">{{ resolvedLabels.rows }}</span>
        <VfSelect
          class="vf-data-table__page-size-select"
          :model-value="String(currentPageSize)"
          :options="pageSizeSelectOptions"
          size="sm"
          :aria-label="resolvedLabels.rowsPerPage"
          @update:model-value="setPageSize"
        />
      </div>

      <div class="vf-data-table__pagination-actions">
        <VfIconButton
          :icon="icons.chevronLeft"
          size="sm"
          variant="ghost"
          :aria-label="resolvedLabels.previousPage"
          :disabled="!canGoPrevious"
          @click="setPage(currentPage - 1)"
        />
        <span class="vf-data-table__pagination-page">
          {{ resolvedLabels.pageSummary(currentPage, pageCount) }}
        </span>
        <VfIconButton
          :icon="icons.chevronRight"
          size="sm"
          variant="ghost"
          :aria-label="resolvedLabels.nextPage"
          :disabled="!canGoNext"
          @click="setPage(currentPage + 1)"
        />
      </div>
    </div>
  </div>
</template>
