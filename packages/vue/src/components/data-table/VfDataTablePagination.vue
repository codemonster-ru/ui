<script setup lang="ts">
import { chevronLeft, chevronRight } from '@codemonster-ru/ui-icons/controls';
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import CmIconButton from '../icon-button/CmIconButton.vue';
import CmIcon from '../icon/CmIcon.vue';
import type { VfDataTableLabels } from './historical-data-table.types';

const props = defineProps<{
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalRows: number | null;
  renderedRowCount: number;
  labels: Partial<VfDataTableLabels>;
  rowsPerPageLabel?: string;
  previousPageLabel?: string;
  nextPageLabel?: string;
}>();
const emit = defineEmits<{ pageChange: [page: number]; pageSizeChange: [size: number] }>();

const items = computed<(number | 'start-ellipsis' | 'end-ellipsis')[]>(() => {
  const { page, pageCount: count } = props;
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', count];
  if (page >= count - 3) return [1, 'start-ellipsis', count - 4, count - 3, count - 2, count - 1, count];
  return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', count];
});

const summary = computed(() => {
  const { page, pageSize, renderedRowCount, totalRows, labels } = props;
  if (totalRows === null) return undefined;
  const first = renderedRowCount ? (page - 1) * pageSize + 1 : 0;
  const last = renderedRowCount ? Math.min(first + renderedRowCount - 1, totalRows) : 0;
  return (
    labels.paginationSummary?.(first, last, totalRows) ??
    (totalRows === 0 ? '0 rows' : `${first}-${last} of ${totalRows}`)
  );
});

function pageLabel(page: number): string {
  return page === props.page
    ? (props.labels.pageSummary?.(page, props.pageCount) ?? `Page ${page} of ${props.pageCount}`)
    : (props.labels.goToPage?.(page) ?? `Go to page ${page}`);
}

function changePage(page: number): void {
  if (page !== props.page) emit('pageChange', page);
}

function changeSize(event: Event): void {
  const select = event.currentTarget as HTMLSelectElement;
  const size = Number(select.value);
  select.value = String(props.pageSize);
  if (size !== props.pageSize && props.pageSizeOptions.includes(size)) emit('pageSizeChange', size);
}

const actions = useTemplateRef<HTMLDivElement>('actions');
watch(
  () => props.page,
  async () => {
    const group = actions.value;
    if (!group) return;
    const owner = group.ownerDocument;
    const focused = owner.activeElement;
    if (!focused || !group.contains(focused)) return;

    await nextTick();
    if (
      (owner.activeElement === focused || owner.activeElement === owner.body) &&
      (!focused.isConnected || focused.matches(':disabled'))
    ) {
      group.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
    }
  },
);
</script>

<template>
  <span v-if="summary !== undefined" class="cm-data-table__pagination-summary" aria-live="polite">{{ summary }}</span>
  <label v-if="props.pageSizeOptions.length" class="cm-data-table__page-size">
    <span>{{ props.labels.rows ?? 'Rows' }}</span>
    <select
      data-cm-data-table-page-size-control
      :aria-label="props.rowsPerPageLabel ?? props.labels.rowsPerPage ?? 'Rows per page'"
      @change="changeSize"
    >
      <option v-for="size in props.pageSizeOptions" :key="size" :value="size" :selected="size === props.pageSize">
        {{ size }}
      </option>
    </select>
  </label>
  <div ref="actions" class="cm-data-table__pagination-actions">
    <CmIconButton
      size="sm"
      :label="props.previousPageLabel ?? 'Previous page'"
      data-cm-data-table-page-action="previous"
      :disabled="props.page <= 1"
      @click="changePage(props.page - 1)"
    >
      <CmIcon :icon="chevronLeft" />
    </CmIconButton>
    <template v-for="item in items" :key="item">
      <span v-if="typeof item !== 'number'" class="cm-data-table__pagination-ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="cm-data-table__page-button cm-data-table__pagination-page"
        :aria-current="item === props.page ? 'page' : undefined"
        :aria-label="pageLabel(item)"
        @click="changePage(item)"
      >
        {{ item }}
      </button>
    </template>
    <CmIconButton
      size="sm"
      :label="props.nextPageLabel ?? 'Next page'"
      data-cm-data-table-page-action="next"
      :disabled="props.page >= props.pageCount"
      @click="changePage(props.page + 1)"
    >
      <CmIcon :icon="chevronRight" />
    </CmIconButton>
  </div>
</template>
