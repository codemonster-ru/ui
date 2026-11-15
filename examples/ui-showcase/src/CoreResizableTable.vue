<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmTable } from '@codemonster-ru/ui-vue';

defineProps<{
  columns: readonly { key: string; header: string }[];
  rows: readonly { id: string; cells: Readonly<Record<string, string | number>> }[];
}>();
const initial = [35, 25, 25, 15];
const widths = ref([...initial]);
let drag: { index: number; start: number; width: number; pointer: number; initial: number[] } | undefined;

function resize(index: number, delta: number, base = widths.value) {
  const left = base[index];
  const right = base[index + 1];
  const change = Math.min(right - 10, Math.max(10 - left, delta));
  const next = [...base];
  next[index] = left + change;
  next[index + 1] = right - change;
  widths.value = next;
}

function begin(index: number, event: PointerEvent) {
  if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return;
  const table = event.currentTarget.closest('table');
  if (!table) return;
  drag = {
    index,
    start: event.clientX,
    width: table.clientWidth,
    pointer: event.pointerId,
    initial: [...widths.value],
  };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function move(event: PointerEvent) {
  if (drag && event.pointerId === drag.pointer) {
    resize(drag.index, ((event.clientX - drag.start) / drag.width) * 100, drag.initial);
  }
}

function finish(event: PointerEvent) {
  if (event.pointerId === drag?.pointer) drag = undefined;
}
</script>

<template>
  <div class="core-matrix-cell core-matrix-wide">
    <h4>Table · resizable columns</h4>
    <CmButton
      size="sm"
      variant="secondary"
      :disabled="widths.every((width, index) => width === initial[index])"
      @click="widths = [...initial]"
    >
      Reset widths
    </CmButton>
    <p>Drag a divider or use its arrow keys to resize adjacent columns while keeping the table width fixed.</p>
    <CmTable class="core-resizable-table" caption="Resizable team roster" striped column-dividers>
      <template #header>
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="column.key"
            scope="col"
            :style="{ inlineSize: widths[index] + '%' }"
          >
            {{ column.header }}
            <button
              v-if="index < columns.length - 1"
              class="core-column-divider"
              type="button"
              :aria-label="'Resize ' + column.header + ' column'"
              @pointerdown="begin(index, $event)"
              @pointermove="move"
              @lostpointercapture="finish"
              @keydown.left.prevent="resize(index, -2)"
              @keydown.right.prevent="resize(index, 2)"
            />
          </th>
        </tr>
      </template>
      <tr v-for="row in rows" :key="row.id">
        <td v-for="column in columns" :key="column.key">{{ row.cells[column.key] }}</td>
      </tr>
    </CmTable>
  </div>
</template>
