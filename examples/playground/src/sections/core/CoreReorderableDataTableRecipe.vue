<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import '@codemonster-ru/ui-css/data-table.css';

export interface CoreReorderableDataTableRecipeColumn {
  key: string;
  header: string;
  align?: 'start' | 'center' | 'end';
}

export interface CoreReorderableDataTableRecipeRow {
  id: string | number;
  cells: Readonly<Record<string, string | number | null>>;
}

const props = withDefaults(
  defineProps<{
    columns: readonly CoreReorderableDataTableRecipeColumn[];
    rows: readonly CoreReorderableDataTableRecipeRow[];
    columnOrder?: readonly string[];
    caption?: string;
  }>(),
  {
    columnOrder: () => [],
    caption: 'Reorderable team roster',
  },
);

const emit = defineEmits<{
  'update:columnOrder': [order: string[]];
}>();

const tableRef = ref<HTMLTableElement | null>(null);
const previewOrder = ref<string[]>();
const movingColumnKey = ref('');
const announcement = ref('');

const declaredKeys = computed(() => props.columns.map(({ key }) => key));
const normalizedOrder = computed(() => normalizeOrder(props.columnOrder));
const renderedOrder = computed(() => previewOrder.value ?? normalizedOrder.value);
const columnsByKey = computed(() => new Map(props.columns.map((column) => [column.key, column])));
const renderedColumns = computed(() =>
  renderedOrder.value.flatMap((key) => {
    const column = columnsByKey.value.get(key);
    return column ? [column] : [];
  }),
);

interface ReorderSession {
  pointerId: number;
  columnKey: string;
  startX: number;
  startY: number;
  pointerToColumnCenterOffset: number;
  originalOrder: string[];
  previewOrder: string[];
  active: boolean;
  header: HTMLElement;
}

let reorderSession: ReorderSession | undefined;
let animationGeneration = 0;
const activeAnimations = new Set<Animation>();

function normalizeOrder(order: readonly string[]): string[] {
  const validKeys = new Set(declaredKeys.value);
  const normalized = order.filter((key, index) => validKeys.has(key) && order.indexOf(key) === index);
  const ordered = new Set(normalized);
  return [...normalized, ...declaredKeys.value.filter((key) => !ordered.has(key))];
}

function ordersMatch(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function columnElements(): HTMLElement[] {
  return [
    ...(tableRef.value?.querySelectorAll<HTMLElement>('[data-core-reorder-column], [data-core-reorder-cell]') ?? []),
  ];
}

function captureColumnPositions(): Map<HTMLElement, number> {
  return new Map(columnElements().map((element) => [element, element.getBoundingClientRect().left]));
}

function cancelColumnAnimations(): void {
  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations.clear();
}

function motionDurationMilliseconds(value: string, fallback: number): number {
  const duration = Number.parseFloat(value);
  if (!Number.isFinite(duration)) return fallback;
  return value.trim().endsWith('s') && !value.trim().endsWith('ms') ? duration * 1000 : duration;
}

function animateColumnOrder(previousPositions: Map<HTMLElement, number>): void {
  const generation = ++animationGeneration;
  void nextTick(() => {
    if (generation !== animationGeneration || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const elements = columnElements();
    if (elements.length > 200 || elements.every((element) => typeof element.animate !== 'function')) return;
    const tableStyle = getComputedStyle(tableRef.value ?? elements[0]!);
    const duration = motionDurationMilliseconds(tableStyle.getPropertyValue('--cm-motion-duration-fast'), 160);
    const easing = tableStyle.getPropertyValue('--cm-motion-ease-standard').trim() || 'ease';

    elements.forEach((element) => {
      const previousLeft = previousPositions.get(element);
      if (previousLeft === undefined || typeof element.animate !== 'function') return;
      const delta = previousLeft - element.getBoundingClientRect().left;
      if (Math.abs(delta) < 0.5) return;
      const animation = element.animate(
        [{ transform: `translateX(${delta}px)` }, { transform: 'translateX(0)' }],
        { duration, easing },
      );
      const removeAnimation = () => activeAnimations.delete(animation);
      animation.onfinish = removeAnimation;
      animation.oncancel = removeAnimation;
      activeAnimations.add(animation);
    });
  });
}

function commitOrder(order: readonly string[], movedKey: string): void {
  const normalized = normalizeOrder(order);
  if (ordersMatch(normalized, normalizedOrder.value)) return;
  emit('update:columnOrder', normalized);
  const column = columnsByKey.value.get(movedKey);
  announcement.value = `${column?.header ?? movedKey} column moved to position ${normalized.indexOf(movedKey) + 1} of ${normalized.length}`;
}

function moveColumnWithKeyboard(event: KeyboardEvent, key: string): void {
  if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const index = normalizedOrder.value.indexOf(key);
  const isRtl = getComputedStyle(tableRef.value ?? (event.currentTarget as HTMLElement)).direction === 'rtl';
  const visualDelta = event.key === 'ArrowRight' ? 1 : -1;
  const delta = isRtl ? -visualDelta : visualDelta;
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= normalizedOrder.value.length) return;

  event.preventDefault();
  const next = [...normalizedOrder.value];
  next.splice(index, 1);
  next.splice(targetIndex, 0, key);
  commitOrder(next, key);
}

function startColumnReorder(event: PointerEvent, key: string): void {
  if (reorderSession || event.button !== 0) return;
  const header = event.currentTarget as HTMLElement;
  const headerRect = header.getBoundingClientRect();
  reorderSession = {
    pointerId: event.pointerId,
    columnKey: key,
    startX: event.clientX,
    startY: event.clientY,
    pointerToColumnCenterOffset: headerRect.left + headerRect.width / 2 - event.clientX,
    originalOrder: [...normalizedOrder.value],
    previewOrder: [...normalizedOrder.value],
    active: false,
    header,
  };
  header.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', previewColumnReorder);
  window.addEventListener('pointerup', finishColumnReorder);
  window.addEventListener('pointercancel', cancelColumnReorder);
  window.addEventListener('keydown', cancelColumnReorderWithKeyboard);
}

function previewColumnReorder(event: PointerEvent): void {
  const session = reorderSession;
  if (!session || event.pointerId !== session.pointerId) return;
  if (!session.active) {
    if (Math.hypot(event.clientX - session.startX, event.clientY - session.startY) < 4) return;
    session.active = true;
    movingColumnKey.value = session.columnKey;
    previewOrder.value = [...session.previewOrder];
  }

  event.preventDefault();
  const headers = [...(tableRef.value?.querySelectorAll<HTMLElement>('[data-core-reorder-column]') ?? [])];
  const isRtl = getComputedStyle(tableRef.value ?? session.header).direction === 'rtl';
  const headerRects = session.previewOrder.map((key) => ({
    key,
    rect: headers.find((header) => header.dataset.coreReorderColumn === key)?.getBoundingClientRect(),
  }));
  if (headerRects.some(({ rect }) => !rect)) return;
  const draggedColumnCenter = event.clientX + session.pointerToColumnCenterOffset;
  const insertionIndex = headerRects.slice(0, -1).filter(({ rect }, index) => {
    const adjacentRect = headerRects[index + 1]?.rect;
    if (!rect || !adjacentRect) return false;
    const boundary = isRtl ? (rect.left + adjacentRect.right) / 2 : (rect.right + adjacentRect.left) / 2;
    return isRtl ? draggedColumnCenter < boundary : draggedColumnCenter > boundary;
  }).length;
  const remainingKeys = session.previewOrder.filter((key) => key !== session.columnKey);
  const next = [...remainingKeys];
  next.splice(insertionIndex, 0, session.columnKey);
  if (ordersMatch(next, session.previewOrder)) return;
  const previousPositions = captureColumnPositions();
  cancelColumnAnimations();
  session.previewOrder = next;
  previewOrder.value = [...next];
  animateColumnOrder(previousPositions);
}

function endColumnReorder(commit: boolean, event?: PointerEvent): void {
  const session = reorderSession;
  if (!session || (event && event.pointerId !== session.pointerId)) return;
  const previousPositions = session.active ? captureColumnPositions() : undefined;
  cancelColumnAnimations();
  reorderSession = undefined;
  previewOrder.value = undefined;
  movingColumnKey.value = '';
  window.removeEventListener('pointermove', previewColumnReorder);
  window.removeEventListener('pointerup', finishColumnReorder);
  window.removeEventListener('pointercancel', cancelColumnReorder);
  window.removeEventListener('keydown', cancelColumnReorderWithKeyboard);
  if (session.header.hasPointerCapture?.(session.pointerId)) session.header.releasePointerCapture(session.pointerId);
  if (commit && session.active && !ordersMatch(session.previewOrder, session.originalOrder)) {
    commitOrder(session.previewOrder, session.columnKey);
  }
  if (previousPositions) animateColumnOrder(previousPositions);
}

function finishColumnReorder(event: PointerEvent): void {
  endColumnReorder(true, event);
}

function cancelColumnReorder(event?: PointerEvent): void {
  endColumnReorder(false, event);
}

function cancelColumnReorderWithKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  endColumnReorder(false);
}

onBeforeUnmount(() => {
  endColumnReorder(false);
  cancelColumnAnimations();
});
</script>

<template>
  <div
    :class="[
      'cm-data-table cm-data-table--striped cm-data-table--column-dividers core-reorderable-data-table-recipe',
      movingColumnKey && 'core-reorderable-data-table-recipe--moving',
    ]"
  >
    <div class="cm-data-table__scroll">
      <table ref="tableRef" class="cm-data-table__table">
        <caption class="cm-data-table__caption">
          {{ props.caption }}
        </caption>
        <thead class="cm-data-table__head">
          <tr>
            <th
              v-for="(column, index) in renderedColumns"
              :key="column.key"
              :class="[
                'core-reorderable-data-table-recipe__header',
                column.align && column.align !== 'start' && `cm-data-table__cell--${column.align}`,
                movingColumnKey === column.key && 'core-reorderable-data-table-recipe__header--moving',
              ]"
              :data-core-reorder-column="column.key"
              scope="col"
              tabindex="0"
              :aria-label="`${column.header}, column ${index + 1} of ${renderedColumns.length}`"
              aria-description="Drag to reorder, or use Left and Right Arrow keys."
              aria-keyshortcuts="ArrowLeft ArrowRight"
              @pointerdown="startColumnReorder($event, column.key)"
              @keydown="moveColumnWithKeyboard($event, column.key)"
            >
              <span class="core-reorderable-data-table-recipe__header-content">{{ column.header }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="cm-data-table__body">
          <tr v-for="row in props.rows" :key="row.id">
            <td
              v-for="column in renderedColumns"
              :key="column.key"
              :data-core-reorder-cell="column.key"
              :class="column.align && column.align !== 'start' && `cm-data-table__cell--${column.align}`"
            >
              {{ row.cells[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <span class="core-reorderable-data-table-recipe__announcement" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<style scoped>
.core-reorderable-data-table-recipe__header {
  position: relative;
  cursor: grab;
  touch-action: none;
}

.core-reorderable-data-table-recipe__header:focus-visible {
  z-index: 2;
  outline: var(--cm-focus-ring-width) solid var(--cm-color-interactive-primary-border);
  outline-offset: calc(-1 * var(--cm-focus-ring-width));
}

.core-reorderable-data-table-recipe--moving {
  cursor: grabbing;
  user-select: none;
}

.core-reorderable-data-table-recipe__header--moving {
  z-index: 2;
  outline: var(--cm-border-width) solid var(--cm-color-interactive-primary-border);
  outline-offset: calc(-1 * var(--cm-border-width));
  cursor: grabbing;
}

.core-reorderable-data-table-recipe__header-content {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-reorderable-data-table-recipe__announcement {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .core-reorderable-data-table-recipe,
  .core-reorderable-data-table-recipe * {
    transition-duration: 0.01ms !important;
  }
}
</style>
