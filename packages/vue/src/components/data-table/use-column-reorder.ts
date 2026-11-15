import { computed, nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import type { CmDataTableColumn, DataTableHeaderInteraction } from './data-table.types';
import type { VfDataTableLabels } from './historical-data-table.types';

interface ReorderOptions {
  columns: Readonly<Ref<readonly CmDataTableColumn[]>>;
  order: () => readonly string[] | null | undefined;
  defaultOrder?: readonly string[];
  visibleKeys: () => readonly string[] | null | undefined;
  enabled: () => boolean | undefined;
  labels: () => Partial<VfDataTableLabels>;
  commit: (order: string[]) => void;
}

const interactive =
  'a, button, input, select, textarea, [contenteditable], [tabindex], [role="button"], [role="separator"]';

function moveColumn(order: readonly string[], key: string, target: string, after: boolean): string[] {
  const next = order.filter((candidate) => candidate !== key);
  next.splice(next.indexOf(target) + Number(after), 0, key);
  return next;
}

function preserveFocus(header: HTMLTableCellElement): void {
  const owner = header.ownerDocument;
  if (owner.activeElement !== header) return;
  void nextTick(() => {
    if (header.isConnected && owner.activeElement === owner.body) header.focus({ preventScroll: true });
  });
}

export function useDataTableColumnReorder(options: ReorderOptions) {
  const localOrder = ref([...(options.defaultOrder ?? [])]);
  const committed = computed(() => {
    const columns = new Map(options.columns.value.map((column) => [column.key, column]));
    const keys = [...new Set([...(options.order() ?? localOrder.value), ...columns.keys()])].filter((key) =>
      columns.has(key),
    );
    return ['start', undefined, 'end'].flatMap((pin) => keys.filter((key) => columns.get(key)?.pinned === pin));
  });
  const preview = ref<string[]>();
  const movingKey = ref<string>();
  const announcement = ref('');
  let cancel: (() => void) | undefined;

  function commit(next: string[], column: CmDataTableColumn, visible: readonly CmDataTableColumn[]): void {
    if (next.every((key, index) => key === committed.value[index])) return;
    if (options.order() == null) localOrder.value = next;
    const visibleKeys = new Set(visible.map(({ key }) => key));
    const position = next.filter((key) => visibleKeys.has(key)).indexOf(column.key) + 1;
    announcement.value =
      options.labels().columnMoved?.(column.header, position, visible.length) ??
      `${column.header} column moved to position ${position} of ${visible.length}`;
    options.commit([...next]);
  }

  function keyboard(event: KeyboardEvent, column: CmDataTableColumn, visible: readonly CmDataTableColumn[]): void {
    if (cancel || event.target !== event.currentTarget || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))
      return;
    const header = event.currentTarget as HTMLTableCellElement;
    const peers = visible.filter(({ pinned }) => pinned === column.pinned);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const step = header.ownerDocument.defaultView?.getComputedStyle(header).direction === 'rtl' ? -delta : delta;
    const target = peers[peers.findIndex(({ key }) => key === column.key) + step];
    if (!target) return;
    event.preventDefault();
    commit(moveColumn(committed.value, column.key, target.key, step > 0), column, visible);
    preserveFocus(header);
  }

  function pointer(event: PointerEvent, column: CmDataTableColumn, visible: readonly CmDataTableColumn[]): void {
    if (cancel || event.button !== 0) return;
    const header = event.currentTarget as HTMLTableCellElement;
    const row = header.parentElement as HTMLTableRowElement;
    const view = header.ownerDocument.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element) || (target.closest(interactive) ?? header) !== header) return;
    const group = visible.filter(({ pinned }) => pinned === column.pinned).map(({ key }) => key);
    const peers = new Set(group);
    if (peers.size < 2) return;

    const { pointerId, clientX: startX, clientY: startY } = event;
    const rect = header.getBoundingClientRect();
    const centerOffset = rect.left + rect.width / 2 - startX;
    const rtl = view.getComputedStyle(header).direction === 'rtl';
    const original = committed.value;

    function move(event: PointerEvent): void {
      if (event.pointerId !== pointerId) return;
      if (!movingKey.value && Math.hypot(event.clientX - startX, event.clientY - startY) < 4) return;
      if (event.cancelable) event.preventDefault();
      movingKey.value = column.key;
      const center = event.clientX + centerOffset;
      const cells = Array.from(row.cells).filter((cell) => peers.has(cell.dataset.cmDataTableReorderColumn ?? ''));
      if (cells.length !== peers.size) return;
      const bounds = cells.map((cell) => cell.getBoundingClientRect());
      const insertion = bounds.slice(0, -1).filter((left, index) => {
        const right = bounds[index + 1];
        return rtl ? center < (left.left + right.right) / 2 : center > (left.right + right.left) / 2;
      }).length;
      const remaining = cells.filter((cell) => cell !== header);
      const target = remaining[Math.min(insertion, remaining.length - 1)]?.dataset.cmDataTableReorderColumn;
      if (!target) return;
      const order = preview.value ?? original;
      const next =
        insertion === group.indexOf(column.key)
          ? original
          : moveColumn(original, column.key, target, insertion === remaining.length);
      if (next.every((key, index) => key === order[index])) return;
      preview.value = next;
      preserveFocus(header);
    }

    function end(event: PointerEvent): void {
      if (event.pointerId !== pointerId) return;
      const next = preview.value;
      cleanup();
      if (event.type === 'pointerup' && next) commit(next, column, visible);
    }

    function escape(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cleanup();
    }

    function cleanup(): void {
      cancel = undefined;
      const hadPreview = Boolean(preview.value);
      preview.value = undefined;
      movingKey.value = undefined;
      if (hadPreview) preserveFocus(header);
      view?.removeEventListener('pointermove', move);
      view?.removeEventListener('pointerup', end);
      view?.removeEventListener('pointercancel', end);
      view?.removeEventListener('blur', cleanup);
      view?.removeEventListener('keydown', escape, true);
    }

    cancel = cleanup;
    view.addEventListener('pointermove', move, { passive: false });
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    view.addEventListener('blur', cleanup);
    view.addEventListener('keydown', escape, true);
  }

  const attrs: DataTableHeaderInteraction['attrs'] = (column, index, visible) => {
    const marker = { 'data-cm-data-table-reorder-column': column.key };
    if (column.reorderable === false) return marker;
    const position = index + 1;
    const labels = options.labels();
    return {
      ...marker,
      'data-cm-data-table-reordering': movingKey.value === column.key ? '' : undefined,
      tabindex: 0,
      'aria-label':
        labels.reorderColumn?.(column.header, position, visible.length) ??
        `${column.header}, column ${position} of ${visible.length}`,
      'aria-description': labels.reorderColumnInstructions ?? 'Drag to reorder, or use Left and Right Arrow keys.',
      'aria-keyshortcuts': 'ArrowLeft ArrowRight',
      onKeydown: (event) => keyboard(event, column, visible),
      onPointerdown: (event) => pointer(event, column, visible),
    };
  };

  watch([committed, options.visibleKeys, options.enabled], () => cancel?.(), { deep: true });
  onBeforeUnmount(() => cancel?.());

  return { order: computed(() => preview.value ?? committed.value), headerAttrs: attrs, announcement };
}
