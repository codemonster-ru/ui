<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, type CSSProperties, type PropType } from 'vue';
import { CmButton } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/button.css';

export type CoreResizableDataTableColumnKey = 'member' | 'role' | 'status' | 'tasks';
export type CoreResizableDataTableWidths = Partial<Record<CoreResizableDataTableColumnKey, string>>;

interface ResizeSession {
  adjacentKey: CoreResizableDataTableColumnKey;
  adjacentMinWidth: number;
  adjacentStartWidth: number;
  columnKey: CoreResizableDataTableColumnKey;
  columnMinWidth: number;
  columnStartWidth: number;
  changed: boolean;
  direction: 1 | -1;
  pointerId?: number;
  startX: number;
  widths: CoreResizableDataTableWidths;
}

const columns = [
  { key: 'member', header: 'Member', width: '35%', minWidth: 128, nowrap: false, align: 'start' },
  { key: 'role', header: 'Role', width: '25%', minWidth: 112, nowrap: false, align: 'start' },
  { key: 'status', header: 'Status', width: '25%', minWidth: 112, nowrap: true, align: 'start' },
  { key: 'tasks', header: 'Tasks', width: '15%', minWidth: 96, nowrap: true, align: 'end' },
] as const;
const rows = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline', tasks: 3 },
  { id: 6, member: 'Frank', role: 'Support', status: 'Available', tasks: 9 },
  { id: 7, member: 'Grace', role: 'Platform', status: 'Busy', tasks: 11 },
] as const;

const props = defineProps({
  widths: {
    type: Object as PropType<Readonly<CoreResizableDataTableWidths>>,
    default: () => ({}),
  },
});
const emit = defineEmits<{
  columnResizeEnd: [widths: CoreResizableDataTableWidths];
  'update:widths': [widths: CoreResizableDataTableWidths];
}>();
const tableRef = ref<HTMLTableElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const activeBoundary = ref<number>();
const guideStyle = ref<CSSProperties>();
let session: ResizeSession | undefined;
let lastWidths: CoreResizableDataTableWidths = {};

const hasCustomWidths = computed(() => Object.keys(props.widths).length > 0);

function columnStyle(column: (typeof columns)[number]): CSSProperties {
  return {
    minWidth: `${column.minWidth}px`,
    width: props.widths[column.key] ?? column.width,
  };
}

function measuredWidths(): CoreResizableDataTableWidths {
  return Object.fromEntries(
    columns.map((column) => {
      const header = tableRef.value?.querySelector<HTMLElement>(`th[data-core-resizable-column="${column.key}"]`);
      const measured = header?.getBoundingClientRect().width ?? 0;
      const fallback = tableRef.value ? tableRef.value.clientWidth * Number.parseFloat(column.width) * 0.01 : 0;
      return [column.key, `${Math.round(measured || fallback || column.minWidth)}px`];
    }),
  ) as CoreResizableDataTableWidths;
}

function widthNumber(widths: CoreResizableDataTableWidths, key: CoreResizableDataTableColumnKey): number {
  return Number.parseFloat(widths[key] ?? '0');
}

function createSession(index: number, startX = 0, pointerId?: number): ResizeSession | undefined {
  const column = columns[index];
  const adjacent = columns[index + 1];
  if (!column || !adjacent) return undefined;
  const widths = measuredWidths();
  const direction = getComputedStyle(tableRef.value ?? document.documentElement).direction === 'rtl' ? -1 : 1;
  return {
    adjacentKey: adjacent.key,
    adjacentMinWidth: adjacent.minWidth,
    adjacentStartWidth: widthNumber(widths, adjacent.key),
    columnKey: column.key,
    columnMinWidth: column.minWidth,
    columnStartWidth: widthNumber(widths, column.key),
    changed: false,
    direction,
    pointerId,
    startX,
    widths,
  };
}

function resize(activeSession: ResizeSession, rawDelta: number): CoreResizableDataTableWidths {
  const delta = rawDelta * activeSession.direction;
  const minimumDelta = activeSession.columnMinWidth - activeSession.columnStartWidth;
  const maximumDelta = activeSession.adjacentStartWidth - activeSession.adjacentMinWidth;
  const clampedDelta = Math.min(Math.max(delta, minimumDelta), maximumDelta);
  const widths = {
    ...activeSession.widths,
    [activeSession.columnKey]: `${Math.round(activeSession.columnStartWidth + clampedDelta)}px`,
    [activeSession.adjacentKey]: `${Math.round(activeSession.adjacentStartWidth - clampedDelta)}px`,
  };
  activeSession.changed = true;
  lastWidths = widths;
  emit('update:widths', widths);
  void nextTick(updateGuide);
  return widths;
}

function updateGuide(): void {
  const index = activeBoundary.value;
  const scroll = scrollRef.value;
  const header =
    index === undefined ? undefined : tableRef.value?.querySelector<HTMLElement>(`thead th:nth-child(${index + 1})`);
  if (!scroll || !header) {
    guideStyle.value = undefined;
    return;
  }
  const headerRect = header.getBoundingClientRect();
  const scrollRect = scroll.getBoundingClientRect();
  const rtl = getComputedStyle(tableRef.value ?? header).direction === 'rtl';
  guideStyle.value = {
    insetInlineStart: `${(rtl ? headerRect.left : headerRect.right) - scrollRect.left + scroll.scrollLeft}px`,
    transform: rtl ? 'translateX(-100%)' : undefined,
  };
}

function setHighlightedBoundary(index?: number): void {
  if (session) return;
  activeBoundary.value = index;
  updateGuide();
}

function startResize(event: PointerEvent, index: number): void {
  if (event.button !== 0) return;
  const nextSession = createSession(index, event.clientX, event.pointerId);
  if (!nextSession) return;
  event.preventDefault();
  session = nextSession;
  activeBoundary.value = index;
  updateGuide();
  lastWidths = nextSession.widths;
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
}

function handlePointerMove(event: PointerEvent): void {
  if (!session || (session.pointerId !== undefined && event.pointerId !== session.pointerId)) return;
  event.preventDefault();
  resize(session, event.clientX - session.startX);
}

function stopResize(event?: PointerEvent): void {
  if (!session || (event && session.pointerId !== undefined && event.pointerId !== session.pointerId)) return;
  const completedWidths = lastWidths;
  const changed = session.changed;
  session = undefined;
  activeBoundary.value = undefined;
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', stopResize);
  window.removeEventListener('pointercancel', stopResize);
  if (changed) emit('columnResizeEnd', { ...completedWidths });
}

function resizeWithKeyboard(event: KeyboardEvent, index: number): void {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const keyboardSession = createSession(index);
  if (!keyboardSession) return;
  event.preventDefault();
  const widths = resize(keyboardSession, event.key === 'ArrowRight' ? 8 : -8);
  emit('columnResizeEnd', { ...widths });
}

function autosize(index: number): void {
  const autosizeSession = createSession(index);
  const column = columns[index];
  if (!autosizeSession || !column || !tableRef.value) return;
  const cells = [...tableRef.value.querySelectorAll<HTMLElement>(`[data-core-resizable-column="${column.key}"]`)];
  const contentWidth = Math.max(column.minWidth, ...cells.map((cell) => cell.scrollWidth));
  const widths = resize(autosizeSession, contentWidth - autosizeSession.columnStartWidth);
  emit('columnResizeEnd', { ...widths });
}

function resetWidths(): void {
  lastWidths = {};
  emit('update:widths', {});
  emit('columnResizeEnd', {});
}

onBeforeUnmount(() => stopResize());
</script>

<template>
  <div class="demo-application-resizable-table-stack">
    <div class="demo-application-resizable-table__actions">
      <CmButton size="sm" variant="secondary" :disabled="!hasCustomWidths" @click="resetWidths">Reset widths</CmButton>
    </div>
    <p class="demo-application-resizable-table__description">
      Drag a divider to resize both adjacent columns without changing the table width. Reset restores the starting
      widths.
    </p>
    <div class="demo-application-resizable-table">
      <div ref="scrollRef" class="demo-application-resizable-table__scroll">
        <table
          ref="tableRef"
          class="demo-application-resizable-table__table"
          :class="hasCustomWidths && 'demo-application-resizable-table__table--fixed'"
        >
          <caption>
            Resizable team roster
          </caption>
          <thead>
            <tr>
              <th
                v-for="(column, index) in columns"
                :key="column.key"
                :data-core-resizable-column="column.key"
                :class="[
                  column.nowrap && 'demo-application-resizable-table__cell--nowrap',
                  column.align === 'end' && 'demo-application-resizable-table__cell--end',
                ]"
                :style="columnStyle(column)"
                scope="col"
              >
                <span>{{ column.header }}</span>
                <span
                  v-if="index < columns.length - 1"
                  class="demo-application-resizable-table__handle"
                  :class="activeBoundary === index && 'demo-application-resizable-table__handle--active'"
                  role="separator"
                  tabindex="0"
                  aria-orientation="vertical"
                  :aria-label="`Resize ${column.header} column`"
                  @pointerdown="startResize($event, index)"
                  @dblclick.prevent="autosize(index)"
                  @focus="setHighlightedBoundary(index)"
                  @blur="setHighlightedBoundary()"
                  @keydown="resizeWithKeyboard($event, index)"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" :data-core-resizable-row="row.id">
              <td
                v-for="column in columns"
                :key="column.key"
                :data-core-resizable-column="column.key"
                :class="[
                  column.nowrap && 'demo-application-resizable-table__cell--nowrap',
                  column.align === 'end' && 'demo-application-resizable-table__cell--end',
                ]"
                :style="columnStyle(column)"
              >
                {{ row[column.key] }}
              </td>
            </tr>
          </tbody>
        </table>
        <span
          v-if="activeBoundary !== undefined"
          class="demo-application-resizable-table__guide"
          :style="guideStyle"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-application-resizable-table-stack {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--cm-space-4);
}

.demo-application-resizable-table__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cm-space-2);
}

.demo-application-resizable-table__description {
  margin: 0;
  color: var(--cm-color-text-secondary);
  font-size: var(--cm-font-size-xl);
  line-height: var(--cm-line-height-normal);
}

.demo-application-resizable-table {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-divider);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.demo-application-resizable-table__scroll {
  position: relative;
  width: 100%;
  overflow-x: auto;
}

.demo-application-resizable-table__table {
  width: 100%;
  min-width: calc(var(--cm-space-16) * 9);
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.demo-application-resizable-table__table--fixed {
  table-layout: fixed;
}

.demo-application-resizable-table__table caption,
.demo-application-resizable-table__table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.demo-application-resizable-table__table caption {
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-resizable-table__table th {
  position: relative;
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.demo-application-resizable-table__table tbody tr + tr td {
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-resizable-table__table tbody tr:nth-child(even) td {
  background: color-mix(in srgb, var(--cm-color-background-surface) 65%, var(--cm-color-background-surface-hover) 35%);
}

.demo-application-resizable-table__table :where(th, td) + :where(th, td) {
  border-inline-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.demo-application-resizable-table__cell--nowrap {
  white-space: nowrap;
}

.demo-application-resizable-table__cell--end {
  text-align: end !important;
}

.demo-application-resizable-table__handle {
  position: absolute;
  z-index: 2;
  inset-block: 0;
  inset-inline-end: -0.375rem;
  width: 0.75rem;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
}

.demo-application-resizable-table__handle::before {
  position: absolute;
  inset-block: 0 var(--cm-border-width);
  inset-inline-start: 50%;
  width: var(--cm-border-width);
  background: transparent;
  content: '';
}

.demo-application-resizable-table__table th:hover > .demo-application-resizable-table__handle::before {
  background: color-mix(in srgb, var(--cm-color-interactive-primary-border) 45%, transparent);
}

/* stylelint-disable-next-line no-descending-specificity -- Direct handle interaction intentionally overrides header hover. */
.demo-application-resizable-table__handle:is(
    :hover,
    :focus-visible,
    .demo-application-resizable-table__handle--active
  )::before {
  background: transparent;
}

.demo-application-resizable-table__handle:focus-visible {
  outline: none;
}

.demo-application-resizable-table__guide {
  position: absolute;
  z-index: 2;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--cm-border-width);
  background: var(--cm-color-interactive-primary-border);
  pointer-events: none;
}

@media (forced-colors: active) {
  .demo-application-resizable-table,
  .demo-application-resizable-table__table :where(th, td) {
    border-color: CanvasText;
  }
}
</style>
