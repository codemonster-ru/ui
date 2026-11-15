import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it, vi } from 'vitest';
import VfDataTable from './VfDataTable.vue';

const header = (key: string) => `th[data-cm-data-table-reorder-column="${key}"]`;
const headers = 'th[data-cm-data-table-reorder-column]';

it('normalizes the full order and keeps keyboard reordering inside the logical pin group', async () => {
  const table = mount(VfDataTable, {
    attachTo: document.body,
    props: {
      columns: [
        { key: 'end', pinned: 'end' },
        { key: 'start-a', pinned: 'start' },
        { key: 'start-b', pinned: 'start' },
        { key: 'actions', reorderable: false },
        { key: 'name', sortable: true },
        { key: 'email' },
        { key: 'hidden' },
      ],
      rows: [{ name: 'Ada', email: 'a@example.test' }],
      visibleColumnKeys: ['actions', 'email', 'name', 'start-a', 'start-b', 'end'],
      defaultColumnOrder: ['email', 'removed', 'email', 'actions', 'name'],
      reorderableColumns: true,
      resizableColumns: true,
      labels: {
        reorderColumn: (label, position, count) => `${label} at ${position}/${count}`,
        reorderColumnInstructions: 'Reorder with the arrow keys.',
        columnMoved: (label, position, count) => `Moved ${label} to ${position}/${count}`,
      },
    },
  });

  try {
    const visible = () => table.findAll(headers).map((cell) => cell.attributes('data-cm-data-table-reorder-column'));
    expect(visible()).toEqual(['start-a', 'start-b', 'email', 'actions', 'name', 'end']);
    const email = table.get<HTMLTableCellElement>(header('email'));
    expect(email.attributes('aria-label')).toBe('email at 3/6');
    expect(email.attributes('aria-description')).toBe('Reorder with the arrow keys.');
    expect(table.get(header('actions')).attributes('tabindex')).toBeUndefined();
    email.element.focus();
    await email.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    const order = ['start-a', 'start-b', 'actions', 'email', 'name', 'hidden', 'end'];
    expect(visible()).toEqual(order.filter((key) => key !== 'hidden'));
    expect(table.emitted('update:columnOrder')).toEqual([[order]]);
    expect(table.emitted('column-reorder-end')).toEqual([[order]]);
    expect(table.get('.cm-data-table__reorder-status').text()).toBe('Moved email to 4/6');
    expect(document.activeElement).toBe(email.element);

    await email.trigger('keydown', { key: 'ArrowLeft' });
    await nextTick();
    expect(visible()).toEqual(['start-a', 'start-b', 'email', 'actions', 'name', 'end']);
    expect(document.activeElement).toBe(email.element);

    const first = table.get(header('start-a'));
    await first.trigger('keydown', { key: 'ArrowRight' });
    expect(visible().slice(0, 2)).toEqual(['start-b', 'start-a']);
    await first.trigger('keydown', { key: 'ArrowRight' });
    await table.get('button[data-cm-data-table-sort="name"]').trigger('keydown', { key: 'ArrowLeft' });
    expect(table.emitted('column-reorder-end')).toHaveLength(3);
    expect(table.emitted('column-resize-end')).toBeUndefined();
    expect(table.emitted('update:sort')).toBeUndefined();
  } finally {
    table.unmount();
  }
});

function pointer(target: EventTarget, type: string, clientX: number): void {
  const event = new MouseEvent(type, { cancelable: true, bubbles: true, button: 0, clientX });
  Object.defineProperty(event, 'pointerId', { value: 7 });
  target.dispatchEvent(event);
}

it('animates from the old cell positions and cancels pending motion when reordering is disabled', async () => {
  const table = mount(VfDataTable, {
    attachTo: document.body,
    props: { columns: [{ key: 'name' }, { key: 'email' }], rows: [{ name: 'Ada' }], reorderableColumns: true },
  });
  try {
    const active = { cancel: vi.fn() };
    const animate = vi.fn(() => active);
    const name = table.get<HTMLTableCellElement>(header('name'));
    vi.spyOn(name.element, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(name.element.cellIndex * 100, 0, 100, 30),
    );
    Object.defineProperty(name.element, 'animate', { value: animate });
    await name.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    expect(animate).toHaveBeenCalledWith([{ translate: '-100px' }, { translate: '0px' }], {
      duration: 220,
      easing: 'ease',
    });
    await table.setProps({ reorderableColumns: false });
    expect(active.cancel).toHaveBeenCalledOnce();
  } finally {
    table.unmount();
    vi.restoreAllMocks();
  }
});

it('previews pointer order, cancels without committing, and defers controlled acceptance to the host', async () => {
  const initialOrder = ['name', 'hidden', 'email', 'status'];
  const table = mount(VfDataTable, {
    props: {
      columns: [{ key: 'name', sortable: true }, { key: 'email' }, { key: 'status' }, { key: 'hidden' }],
      rows: [{ name: 'Ada', email: 'a@example.test', status: 'Ready' }],
      visibleColumnKeys: ['name', 'email', 'status'],
      columnOrder: initialOrder,
      reorderableColumns: true,
    },
  });

  try {
    const name = table.get(header('name')).element;
    const visible = () => table.findAll(headers).map((cell) => cell.text());
    for (const { element } of table.findAll<HTMLTableCellElement>(headers)) {
      vi.spyOn(element, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(element.cellIndex * 100, 0, 100, 30),
      );
    }

    pointer(table.get('button[data-cm-data-table-sort="name"]').element, 'pointerdown', 10);
    pointer(window, 'pointermove', 61);
    expect(visible()).toEqual(['name', 'email', 'status']);

    pointer(name, 'pointerdown', 10);
    pointer(window, 'pointermove', 20);
    pointer(window, 'pointerup', 20);
    expect(table.emitted('column-reorder-end')).toBeUndefined();

    pointer(name, 'pointerdown', 10);
    pointer(window, 'pointermove', 61);
    await nextTick();
    expect(visible()).toEqual(['email', 'name', 'status']);
    expect(table.emitted('column-reorder-end')).toBeUndefined();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(visible()).toEqual(['name', 'email', 'status']);
    expect(table.emitted('column-reorder-end')).toBeUndefined();

    pointer(name, 'pointerdown', 10);
    pointer(window, 'pointermove', 61);
    pointer(window, 'pointerup', 61);
    await nextTick();
    const next = ['hidden', 'email', 'name', 'status'];
    expect(table.emitted('column-reorder-end')).toEqual([[next]]);
    expect(table.emitted('update:columnOrder')).toEqual([[next]]);
    expect(visible()).toEqual(['name', 'email', 'status']);
    await table.setProps({ columnOrder: next });
    expect(visible()).toEqual(['email', 'name', 'status']);
    expect(table.emitted('update:sort')).toBeUndefined();
  } finally {
    table.unmount();
    vi.restoreAllMocks();
  }
});
