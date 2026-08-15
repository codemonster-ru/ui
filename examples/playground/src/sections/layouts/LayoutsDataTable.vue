<script setup lang="ts">
import { computed, ref } from 'vue';
import { CmIconButton } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/data-table.css';
import './layouts-data-table.css';

interface LayoutsDataTableColumn {
  key: string;
  header: string;
  align?: 'start' | 'center' | 'end';
}

interface LayoutsDataTableRow {
  id: string | number;
  [key: string]: string | number;
}

const props = withDefaults(
  defineProps<{
    columns: LayoutsDataTableColumn[];
    rows: LayoutsDataTableRow[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
  }>(),
  {
    defaultPageSize: 5,
    pageSizeOptions: () => [5, 10],
  },
);

const currentPage = ref(1);
const pageSize = ref(props.defaultPageSize);
const pageCount = computed(() => Math.max(1, Math.ceil(props.rows.length / pageSize.value)));
const visibleRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return props.rows.slice(start, start + pageSize.value);
});
const firstVisibleRow = computed(() => (visibleRows.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0));
const lastVisibleRow = computed(() =>
  visibleRows.value.length ? firstVisibleRow.value + visibleRows.value.length - 1 : 0,
);

function setPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), pageCount.value);
}

function setPageSize(event: Event) {
  pageSize.value = Number((event.target as HTMLSelectElement).value);
  currentPage.value = 1;
}
</script>

<template>
  <div class="cm-data-table cm-data-table--column-dividers layouts-data-table">
    <div class="cm-data-table__scroll">
      <table class="cm-data-table__table">
        <thead class="cm-data-table__head">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="column.align && column.align !== 'start' && `cm-data-table__cell--${column.align}`"
              scope="col"
            >
              <span class="layouts-data-table__header-content">{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="cm-data-table__body">
          <tr v-for="row in visibleRows" :key="row.id">
            <td
              v-for="column in columns"
              :key="column.key"
              :class="column.align && column.align !== 'start' && `cm-data-table__cell--${column.align}`"
            >
              {{ row[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="cm-data-table__pagination layouts-data-table__pagination" aria-label="Table pagination">
      <span class="layouts-data-table__pagination-summary">
        {{ firstVisibleRow }}-{{ lastVisibleRow }} of {{ rows.length }}
      </span>

      <div class="layouts-data-table__page-size">
        <span>Rows</span>
        <span class="layouts-data-table__page-size-control">
          <select :value="pageSize" aria-label="Rows per page" @change="setPageSize">
            <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <span class="layouts-data-table__page-size-visual" aria-hidden="true">
            <span>{{ pageSize }}</span>
            <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-md)" />
          </span>
        </span>
      </div>

      <div class="layouts-data-table__pagination-actions">
        <CmIconButton
          label="Previous page"
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="setPage(currentPage - 1)"
        >
          <VueIconify :icon="icons.chevronLeft" size="var(--cm-icon-size-sm)" />
        </CmIconButton>

        <div class="layouts-data-table__pagination-pages">
          <button
            v-for="page in pageCount"
            :key="page"
            class="layouts-data-table__pagination-page"
            type="button"
            :aria-current="page === currentPage ? 'page' : undefined"
            :aria-label="page === currentPage ? `Page ${page} of ${pageCount}` : `Go to page ${page}`"
            @click="setPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <CmIconButton
          label="Next page"
          variant="ghost"
          size="sm"
          :disabled="currentPage === pageCount"
          @click="setPage(currentPage + 1)"
        >
          <VueIconify :icon="icons.chevronRight" size="var(--cm-icon-size-sm)" />
        </CmIconButton>
      </div>
    </nav>
  </div>
</template>
