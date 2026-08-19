<script setup lang="ts">
import { CmButton, CmProgressSpinner, CmSkeleton } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/progress-spinner.css';
import '@codemonster-ru/ui-css/skeleton.css';

const props = withDefaults(
  defineProps<{
    variant: 'loading' | 'skeleton' | 'error';
    error?: boolean;
  }>(),
  { error: true },
);

const emit = defineEmits<{ retry: [] }>();

const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available' },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy' },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available' },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away' },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline' },
] as const;

const metricColumns = [
  { key: 'member', header: 'Member', align: 'start' },
  { key: 'status', header: 'Status', align: 'start' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
] as const;

const standardColumns = [
  { key: 'member', header: 'Member', align: 'start' },
  { key: 'role', header: 'Role', align: 'start' },
  { key: 'status', header: 'Status', align: 'start' },
] as const;
</script>

<template>
  <div class="demo-application-data-table-state" :aria-busy="props.variant === 'loading' || undefined">
    <div class="demo-application-data-table-state__scroll">
      <table class="demo-application-data-table-state__table">
        <thead>
          <tr>
            <th
              v-for="column in props.variant === 'skeleton' ? metricColumns : standardColumns"
              :key="column.key"
              scope="col"
              :class="column.align === 'end' && 'demo-application-data-table-state__cell--end'"
            >
              {{ column.header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="props.variant === 'skeleton'">
            <tr v-for="rowIndex in 4" :key="rowIndex">
              <td
                v-for="column in metricColumns"
                :key="column.key"
                :class="column.align === 'end' && 'demo-application-data-table-state__cell--end'"
              >
                <CmSkeleton
                  class="demo-application-data-table-state__skeleton"
                  min-height="1rem"
                  radius="control"
                />
              </td>
            </tr>
          </template>
          <tr v-else-if="props.variant === 'error' && props.error">
            <td class="demo-application-data-table-state__state-cell" colspan="3">
              <div class="demo-application-data-table-state__error demo-stack demo-stack--center" role="alert">
                <span>Could not load team members.</span>
                <div class="demo-inline">
                  <CmButton size="sm" variant="secondary" @click="emit('retry')">Try again</CmButton>
                </div>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr v-for="row in props.variant === 'error' ? rows.slice(0, 3) : rows" :key="row.id">
              <td>{{ row.member }}</td>
              <td>{{ row.role }}</td>
              <td>{{ row.status }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div
      v-if="props.variant === 'loading'"
      class="demo-application-data-table-state__loading-mask"
      role="status"
      aria-label="Loading..."
    >
      <span class="demo-application-data-table-state__loading">
        <CmProgressSpinner class="demo-application-data-table-state__spinner" label="Loading..." />
      </span>
    </div>
  </div>
</template>

<style scoped>
.demo-application-data-table-state {
  position: relative;
  display: flex;
  inline-size: 100%;
  min-inline-size: 0;
  flex-direction: column;
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.demo-application-data-table-state__scroll {
  inline-size: 100%;
  overflow-x: auto;
}

.demo-application-data-table-state__table {
  inline-size: 100%;
  min-inline-size: calc(var(--cm-space-16) * 9);
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.demo-application-data-table-state__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.demo-application-data-table-state__table th {
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-data-table-state__table tbody > tr + tr > td {
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-data-table-state__cell--end {
  text-align: end;
}

.demo-application-data-table-state__state-cell {
  color: var(--cm-color-text-secondary);
  text-align: center;
}

.demo-application-data-table-state__error {
  color: var(--cm-color-status-danger-subtle-foreground);
}

.demo-application-data-table-state__loading {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.demo-application-data-table-state__spinner {
  flex: none;
}

.demo-application-data-table-state__loading-mask {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--cm-field-padding-lg);
  color: var(--cm-color-text-primary);
  background: color-mix(in srgb, var(--cm-color-background-surface) 72%, transparent);
}

.demo-application-data-table-state__skeleton {
  max-inline-size: calc(var(--cm-space-16) * 3);
}

@media (forced-colors: active) {
  .demo-application-data-table-state,
  .demo-application-data-table-state__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
