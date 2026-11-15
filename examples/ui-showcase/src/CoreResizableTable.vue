<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmDataTable, type CmDataTableColumnWidths } from '@codemonster-ru/ui-vue';

const props = defineProps<{
  columns: readonly { key: string; header: string }[];
  rows: readonly { id: string; cells: Readonly<Record<string, string | number>> }[];
}>();
const initial = Object.fromEntries(props.columns.map(({ key }, index) => [key, `${[35, 25, 25, 15][index]}%`]));
const widths = ref<CmDataTableColumnWidths>({ ...initial });
</script>

<template>
  <div class="core-matrix-cell core-matrix-wide">
    <h4>Table · resizable columns</h4>
    <CmButton
      size="sm"
      variant="secondary"
      :disabled="columns.every(({ key }) => widths[key] === initial[key])"
      @click="widths = { ...initial }"
    >
      Reset widths
    </CmButton>
    <p>Drag a divider, use its arrow keys, or double-click to fit its column.</p>
    <CmDataTable
      id="core-resizable-table"
      v-model:column-widths="widths"
      :columns="columns"
      :rows="rows"
      caption="Resizable team roster"
      striped
      column-dividers
      resizable-columns
    />
  </div>
</template>
