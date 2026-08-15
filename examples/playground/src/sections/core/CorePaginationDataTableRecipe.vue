<script setup lang="ts">
import { computed, ref } from 'vue';
import { CmIconButton } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/data-table.css';
import '@codemonster-ru/ui-css/icon-button.css';

const sourceRows = [
  { status: 'Available', tasks: 12 },
  { status: 'Busy', tasks: 8 },
  { status: 'Available', tasks: 15 },
  { status: 'Away', tasks: 5 },
  { status: 'Offline', tasks: 3 },
  { status: 'Available', tasks: 9 },
  { status: 'Busy', tasks: 11 },
] as const;
const rows = Array.from({ length: 42 }, (_, index) => ({
  id: index + 1,
  member: `Member ${index + 1}`,
  ...sourceRows[index % sourceRows.length],
}));
const pageSizeOptions = [3, 5, 10] as const;
const currentPage = ref(7);
const pageSize = ref(3);
const pageCount = computed(() => Math.max(1, Math.ceil(rows.length / pageSize.value)));
const visibleRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return rows.slice(start, start + pageSize.value);
});
const firstVisibleRow = computed(() =>
  visibleRows.value.length > 0 ? (currentPage.value - 1) * pageSize.value + 1 : 0,
);
const lastVisibleRow = computed(() =>
  visibleRows.value.length > 0 ? firstVisibleRow.value + visibleRows.value.length - 1 : 0,
);
const paginationItems = computed<Array<number | 'start-ellipsis' | 'end-ellipsis'>>(() => {
  const count = pageCount.value;
  const page = currentPage.value;

  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', count];
  if (page >= count - 3) return [1, 'start-ellipsis', count - 4, count - 3, count - 2, count - 1, count];
  return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', count];
});

function setPage(page: number): void {
  currentPage.value = Math.min(Math.max(1, Math.trunc(page)), pageCount.value);
}

function setPageSize(event: Event): void {
  const nextPageSize = Number((event.target as HTMLSelectElement).value);
  if (!pageSizeOptions.includes(nextPageSize as (typeof pageSizeOptions)[number])) return;
  pageSize.value = nextPageSize;
  currentPage.value = 1;
}
</script>

<template>
  <div id="core-pagination-data-table" class="cm-data-table core-pagination-data-table-recipe">
    <div class="cm-data-table__scroll">
      <table class="cm-data-table__table" aria-label="Paginated team metrics">
        <thead class="cm-data-table__head">
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Status</th>
            <th class="cm-data-table__cell--end" scope="col">Tasks</th>
          </tr>
        </thead>
        <tbody class="cm-data-table__body">
          <tr v-for="row in visibleRows" :key="row.id" :data-core-pagination-row="row.id">
            <td>{{ row.member }}</td>
            <td>{{ row.status }}</td>
            <td class="cm-data-table__cell--end">{{ row.tasks }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="cm-data-table__pagination core-pagination-data-table-recipe__pagination" aria-label="Table pagination">
      <span class="core-pagination-data-table-recipe__summary">
        {{ firstVisibleRow }}-{{ lastVisibleRow }} of {{ rows.length }}
      </span>

      <div class="core-pagination-data-table-recipe__page-size">
        <span>Rows</span>
        <span class="core-pagination-data-table-recipe__page-size-control">
          <select :value="pageSize" aria-label="Rows per page" @change="setPageSize">
            <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <span class="core-pagination-data-table-recipe__page-size-visual" aria-hidden="true">
            <span>{{ pageSize }}</span>
            <VueIconify
              :icon="icons.chevronDown"
              size="calc(var(--cm-icon-size-md) - var(--cm-border-width))"
            />
          </span>
        </span>
      </div>

      <div class="core-pagination-data-table-recipe__actions">
        <CmIconButton
          label="Previous page"
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="setPage(currentPage - 1)"
        >
          <VueIconify :icon="icons.chevronLeft" size="var(--cm-icon-size-sm)" />
        </CmIconButton>

        <div class="core-pagination-data-table-recipe__pages">
          <template v-for="item in paginationItems" :key="item">
            <span
              v-if="typeof item !== 'number'"
              class="core-pagination-data-table-recipe__ellipsis"
              aria-hidden="true"
            >
              …
            </span>
            <button
              v-else
              class="core-pagination-data-table-recipe__page"
              type="button"
              :aria-current="item === currentPage ? 'page' : undefined"
              :aria-label="item === currentPage ? `Page ${item} of ${pageCount}` : `Go to page ${item}`"
              @click="item !== currentPage && setPage(item)"
            >
              {{ item }}
            </button>
          </template>
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

<style scoped>
.core-pagination-data-table-recipe__summary {
  margin-inline-end: auto;
}

.core-pagination-data-table-recipe__page-size,
.core-pagination-data-table-recipe__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-pagination-data-table-recipe__page-size-control {
  position: relative;
  display: inline-flex;
  /* stylelint-disable-next-line number-max-precision -- Frozen selector width resolves to this browser subpixel. */
  inline-size: 3.0947265625rem;
}

.core-pagination-data-table-recipe__page-size-control select {
  position: absolute;
  inset: 0;
  z-index: 1;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
  cursor: pointer;
}

.core-pagination-data-table-recipe__page-size-visual {
  display: inline-flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  inline-size: 100%;
  min-block-size: var(--cm-control-height-sm);
  padding: var(--cm-space-1) var(--cm-space-2);
  gap: var(--cm-space-2);
  border: var(--cm-border-width) solid var(--cm-color-border-interactive);
  border-radius: var(--cm-radius-control);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-md);
  line-height: var(--cm-line-height-tight);
}

.core-pagination-data-table-recipe__page-size-visual > :last-child {
  color: var(--cm-color-icon-secondary);
}

.core-pagination-data-table-recipe__page-size-control:focus-within
  .core-pagination-data-table-recipe__page-size-visual {
  border-color: var(--cm-color-border-focus);
  box-shadow: 0 0 0 var(--cm-border-width-thick) var(--cm-color-focus-ring);
}

.core-pagination-data-table-recipe__pages {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-1);
}

.core-pagination-data-table-recipe__page,
.core-pagination-data-table-recipe__ellipsis {
  display: inline-grid;
  min-inline-size: var(--cm-control-height-sm);
  block-size: var(--cm-control-height-sm);
  place-items: center;
}

.core-pagination-data-table-recipe__page {
  padding-inline: var(--cm-space-2);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  background: transparent;
  color: var(--cm-color-text-primary);
  font: inherit;
  cursor: pointer;
}

.core-pagination-data-table-recipe__page:hover {
  background: var(--cm-color-background-surface-hover);
}

.core-pagination-data-table-recipe__page:active,
.core-pagination-data-table-recipe__page[aria-current='page'] {
  background: var(--cm-color-background-surface-active);
}

.core-pagination-data-table-recipe__page[aria-current='page'] {
  font-weight: var(--cm-font-weight-medium);
  cursor: default;
}

.core-pagination-data-table-recipe__page:focus-visible {
  outline: var(--cm-border-width-thick) solid var(--cm-color-interactive-primary-border);
  outline-offset: calc(-1 * var(--cm-border-width-thick));
}

@container (inline-size <= 30rem) {
  .core-pagination-data-table-recipe__actions {
    flex-basis: 100%;
    justify-content: space-between;
    min-inline-size: 0;
  }

  .core-pagination-data-table-recipe__pages {
    flex: 1;
    justify-content: center;
    min-inline-size: 0;
  }

  .core-pagination-data-table-recipe__page:not([aria-current='page']),
  .core-pagination-data-table-recipe__ellipsis {
    display: none;
  }
}
</style>
