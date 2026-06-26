<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import VfProgressSpinner from '@/components/progress-spinner/VfProgressSpinner.vue';
import VfSelect from '@/components/select/VfSelect.vue';
import VfSkeleton from '@/components/skeleton/VfSkeleton.vue';
import { cx } from '@/utils/classes';
import type {
  VfDataTableColumn,
  VfDataTableDensity,
  VfDataTableLoadingVariant,
  VfDataTablePaginationMode,
  VfDataTableRow,
} from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDataTableProps {
  columns: VfDataTableColumn[];
  rows?: VfDataTableRow[];
  rowKey?: string | ((row: VfDataTableRow, index: number) => string | number);
  caption?: string;
  density?: VfDataTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
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
  caption: undefined,
  density: 'default',
  striped: false,
  columnDividers: false,
  stickyHeader: false,
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
  'update:page': [page: number];
  'update:pageSize': [pageSize: number];
}>();

const attrs = useAttrs();
const internalPage = ref(props.defaultPage);
const internalPageSize = ref(props.defaultPageSize);

const classes = computed(() =>
  cx(
    'vf-table',
    'vf-data-table',
    props.density === 'compact' && 'vf-table--compact',
    props.striped && 'vf-table--striped',
    props.columnDividers && 'vf-table--column-dividers',
    props.stickyHeader && 'vf-table--sticky-header',
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
const stateColspan = computed(() => Math.max(props.columns.length, 1));
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

function rowId(row: VfDataTableRow, index: number): string | number {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index);
  }

  if (props.rowKey) {
    const value = cellValue(row, props.rowKey);

    return typeof value === 'string' || typeof value === 'number' ? value : index;
  }

  return index;
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
</script>

<template>
  <div class="vf-table-wrap vf-data-table-wrap" v-bind="attrs">
    <div class="vf-table-scroll vf-data-table-scroll">
      <table :class="classes">
        <caption v-if="props.caption || $slots.caption" class="vf-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>

        <thead class="vf-table__head">
          <tr>
            <th
              v-for="column in props.columns"
              :key="column.key"
              :class="['vf-data-table__header-cell', column.align && `vf-data-table__cell--${column.align}`]"
              :scope="column.scope ?? 'col'"
            >
              <slot :name="`header-${column.key}`" :column="column">
                {{ columnHeader(column) }}
              </slot>
            </th>
          </tr>
        </thead>

        <tbody class="vf-table__body">
          <template v-if="props.loading && props.loadingVariant === 'skeleton'">
            <tr v-for="row in skeletonRows" :key="`skeleton-${row}`" class="vf-data-table__skeleton-row">
              <td
                v-for="column in props.columns"
                :key="column.key"
                :class="[
                  'vf-data-table__cell',
                  'vf-data-table__skeleton-cell',
                  column.align && `vf-data-table__cell--${column.align}`,
                ]"
              >
                <VfSkeleton min-height="1rem" radius="var(--vf-radius-control)" />
              </td>
            </tr>
          </template>

          <template v-else-if="hasRows">
            <tr v-for="(row, rowIndex) in visibleRows" :key="rowId(row, rowIndex)">
              <td
                v-for="column in props.columns"
                :key="column.key"
                :class="['vf-data-table__cell', column.align && `vf-data-table__cell--${column.align}`]"
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

      <div
        v-if="props.loading && props.loadingVariant === 'mask'"
        class="vf-data-table__loading-mask"
        role="status"
        :aria-label="props.loadingText"
      >
        <slot name="loading">
          <span class="vf-data-table__loading">
            <VfProgressSpinner class="vf-data-table__loading-spinner" :label="props.loadingText" size="2rem" />
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
