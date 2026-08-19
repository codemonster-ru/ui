<script setup lang="ts">
defineProps<{
  caption?: string;
}>();

const rows = [
  { name: 'Core', status: 'Stable' },
  { name: 'Forms', status: 'Review' },
  { name: 'Navigation', status: 'Stable' },
  { name: 'Overlay', status: 'Testing' },
  { name: 'Feedback', status: 'Planned' },
  { name: 'Surfaces', status: 'Stable' },
  { name: 'Progress', status: 'Review' },
] as const;
</script>

<template>
  <div class="core-sticky-table-recipe">
    <div class="core-sticky-table-recipe__scroll">
      <table class="core-sticky-table-recipe__table">
        <caption v-if="caption" class="core-sticky-table-recipe__caption">
          {{
            caption
          }}
        </caption>
        <thead class="core-sticky-table-recipe__head">
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody class="core-sticky-table-recipe__body">
          <tr v-for="row in rows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.core-sticky-table-recipe {
  display: flex;
  inline-size: 100%;
  max-block-size: 13rem;
  min-inline-size: 0;
  overflow: auto;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.core-sticky-table-recipe__scroll {
  inline-size: 100%;
  overflow-x: auto;
}

.core-sticky-table-recipe__table {
  inline-size: 100%;
  min-inline-size: 36rem;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.core-sticky-table-recipe__caption {
  padding: var(--cm-field-padding-lg);
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
  text-align: start;
}

.core-sticky-table-recipe__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.core-sticky-table-recipe__head th {
  position: sticky;
  z-index: 1;
  inset-block-start: 0;
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.core-sticky-table-recipe__body > tr + tr > td {
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

@media (forced-colors: active) {
  .core-sticky-table-recipe,
  .core-sticky-table-recipe__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
