<script setup lang="ts">
import { computed, onUnmounted, ref, useAttrs } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import VfCheckbox from '@/components/checkbox/VfCheckbox.vue';
import VfProgressSpinner from '@/components/progress-spinner/VfProgressSpinner.vue';
import VfSelect from '@/components/select/VfSelect.vue';
import VfSkeleton from '@/components/skeleton/VfSkeleton.vue';
import { cx } from '@/utils/classes';
import type {
  VfDataTableColumn,
  VfDataTableColumnWidths,
  VfDataTableDensity,
  VfDataTableLoadingVariant,
  VfDataTablePaginationMode,
  VfDataTableRow,
  VfDataTableRowKey,
} from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDataTableProps {
  columns: VfDataTableColumn[];
  rows?: VfDataTableRow[];
  rowKey?: string | ((row: VfDataTableRow, index: number) => VfDataTableRowKey);
  selectable?: boolean;
  selectedRowKeys?: VfDataTableRowKey[];
  defaultSelectedRowKeys?: VfDataTableRowKey[];
  caption?: string;
  density?: VfDataTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
  visibleColumnKeys?: string[];
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
  emptyText?: string;
  loadingText?: string;
}

const props = withDefaults(defineProps<VfDataTableProps>(), {
  rows: () => [],
  rowKey: undefined,
  selectable: false,
  selectedRowKeys: undefined,
  defaultSelectedRowKeys: () => [],
  caption: undefined,
  density: 'default',
  striped: false,
  columnDividers: false,
  stickyHeader: false,
  visibleColumnKeys: undefined,
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
  emptyText: 'No data',
  loadingText: 'Loading...',
});

const emit = defineEmits<{
  'update:selectedRowKeys': [selectedRowKeys: VfDataTableRowKey[]];
  'update:page': [page: number];
  'update:pageSize': [pageSize: number];
  'update:columnWidths': [columnWidths: VfDataTableColumnWidths];
  'column-resize-end': [columnWidths: VfDataTableColumnWidths];
}>();

const attrs = useAttrs();
const internalPage = ref(props.defaultPage);
const internalPageSize = ref(props.defaultPageSize);
const internalSelectedRowKeys = ref<VfDataTableRowKey[]>([...props.defaultSelectedRowKeys]);
const internalColumnWidths = ref<VfDataTableColumnWidths>({ ...props.defaultColumnWidths });
const lastCommittedColumnWidths = ref<VfDataTableColumnWidths>({ ...props.defaultColumnWidths });
const tableRef = ref<HTMLTableElement>();
const scrollRef = ref<HTMLDivElement>();
const isResizing = ref(false);
const resizingColumnIndex = ref<number>();
const highlightedColumnBoundaryIndex = ref<number>();
const columnBoundaryGuideStyle = ref<Record<string, string>>();

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

let resizeSession: ColumnResizeSession | undefined;
let columnBoundaryGuideFrame: number | undefined;

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
    isResizing.value && 'vf-data-table--resizing',
  ),
);

const totalRowCount = computed(() => Math.max(0, props.totalRows ?? props.rows.length));
const currentPageSize = computed(() => Math.max(1, props.pageSize ?? internalPageSize.value));
const pageCount = computed(() => Math.max(1, Math.ceil(totalRowCount.value / currentPageSize.value)));
const currentPage = computed(() => clampPage(props.page ?? internalPage.value));
const visibleRows = computed(() => {
  if (!props.pagination || props.paginationMode === 'manual') {
    return props.rows;
  }

  const start = (currentPage.value - 1) * currentPageSize.value;

  return props.rows.slice(start, start + currentPageSize.value);
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
  if (totalRowCount.value === 0) {
    return '0 rows';
  }

  return `${firstVisibleRow.value}-${lastVisibleRow.value} of ${totalRowCount.value}`;
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
const renderedColumns = computed(() => {
  if (props.visibleColumnKeys === undefined) {
    return props.columns;
  }

  const visibleColumnKeys = new Set(props.visibleColumnKeys);

  return props.columns.filter((column) => visibleColumnKeys.has(column.key));
});
const currentColumnWidths = computed(() => props.columnWidths ?? internalColumnWidths.value);
const renderedColumnWidths = computed(() =>
  isResizing.value ? internalColumnWidths.value : currentColumnWidths.value,
);
const visibleRowKeys = computed(() => visibleRows.value.map((row, index) => selectionRowId(row, index)));
const allVisibleRowsSelected = computed(
  () =>
    visibleRowKeys.value.length > 0 && visibleRowKeys.value.every((key) => currentSelectedRowKeys.value.includes(key)),
);
const someVisibleRowsSelected = computed(
  () => !allVisibleRowsSelected.value && visibleRowKeys.value.some((key) => currentSelectedRowKeys.value.includes(key)),
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
  const key = selectionRowId(row, index);
  const nextKeys = selected
    ? [...currentSelectedRowKeys.value, key].filter((value, keyIndex, keys) => keys.indexOf(value) === keyIndex)
    : currentSelectedRowKeys.value.filter((selectedKey) => selectedKey !== key);

  updateSelectedRowKeys(nextKeys);
}

function setAllVisibleRowsSelected(selected: boolean) {
  const nextKeys = selected
    ? [...currentSelectedRowKeys.value, ...visibleRowKeys.value].filter(
        (value, keyIndex, keys) => keys.indexOf(value) === keyIndex,
      )
    : currentSelectedRowKeys.value.filter((key) => !visibleRowKeys.value.includes(key));

  updateSelectedRowKeys(nextKeys);
}

onUnmounted(() => {
  if (columnBoundaryGuideFrame !== undefined) {
    cancelAnimationFrame(columnBoundaryGuideFrame);
  }

  if (resizeSession) {
    resizeSession = undefined;
    window.removeEventListener('pointermove', onColumnPointerMove);
    window.removeEventListener('pointerup', stopColumnResize);
    window.removeEventListener('pointercancel', stopColumnResize);
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
                :disabled="!hasRows"
                aria-label="Select all rows"
                @update:model-value="setAllVisibleRowsSelected"
              />
            </th>
            <th
              v-for="(column, columnIndex) in renderedColumns"
              :key="column.key"
              :class="['vf-data-table__header-cell', ...columnClasses(column)]"
              :data-vf-column-index="columnIndex"
              :scope="column.scope ?? 'col'"
              :style="columnStyle(column)"
            >
              <slot :name="`header-${column.key}`" :column="column">
                {{ columnHeader(column) }}
              </slot>
              <span
                v-if="canResizeColumn(column, columnIndex)"
                :class="[
                  'vf-data-table__column-resizer',
                  resizingColumnIndex === columnIndex && 'vf-data-table__column-resizer--active',
                ]"
                role="separator"
                tabindex="0"
                aria-orientation="vertical"
                :aria-label="`Resize ${columnHeader(column)} column`"
                @pointerdown.stop.prevent="startColumnResize($event, columnIndex)"
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
                :style="columnStyle(column)"
              >
                <VfSkeleton min-height="var(--vf-icon-size-md)" radius="var(--vf-radius-control)" />
              </td>
            </tr>
          </template>

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
                  :aria-label="`Select row ${rowIndex + 1}`"
                  @update:model-value="setRowSelected(row, rowIndex, $event)"
                />
              </td>
              <td
                v-for="(column, columnIndex) in renderedColumns"
                :key="column.key"
                :class="['vf-data-table__cell', ...columnClasses(column)]"
                :data-vf-column-index="columnIndex"
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
              <slot name="empty">{{ props.emptyText }}</slot>
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

      <div
        v-if="props.loading && props.loadingVariant === 'mask'"
        class="vf-data-table__loading-mask"
        role="status"
        :aria-label="props.loadingText"
      >
        <slot name="loading">
          <span class="vf-data-table__loading">
            <VfProgressSpinner
              class="vf-data-table__loading-spinner"
              :label="props.loadingText"
              size="var(--vf-data-table-loading-spinner-size)"
            />
          </span>
        </slot>
      </div>
    </div>

    <div v-if="props.pagination" class="vf-data-table__pagination" aria-label="Table pagination">
      <span class="vf-data-table__pagination-summary">{{ paginationLabel }}</span>

      <div class="vf-data-table__page-size">
        <span class="vf-data-table__page-size-label">Rows</span>
        <VfSelect
          class="vf-data-table__page-size-select"
          :model-value="String(currentPageSize)"
          :options="pageSizeSelectOptions"
          size="sm"
          aria-label="Rows per page"
          @update:model-value="setPageSize"
        />
      </div>

      <div class="vf-data-table__pagination-actions">
        <VfIconButton
          :icon="icons.chevronLeft"
          size="sm"
          variant="ghost"
          aria-label="Previous page"
          :disabled="!canGoPrevious"
          @click="setPage(currentPage - 1)"
        />
        <span class="vf-data-table__pagination-page">Page {{ currentPage }} of {{ pageCount }}</span>
        <VfIconButton
          :icon="icons.chevronRight"
          size="sm"
          variant="ghost"
          aria-label="Next page"
          :disabled="!canGoNext"
          @click="setPage(currentPage + 1)"
        />
      </div>
    </div>
  </div>
</template>
