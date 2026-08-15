// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreReorderableDataTableRecipe, {
  type CoreReorderableDataTableRecipeColumn,
  type CoreReorderableDataTableRecipeRow,
} from './CoreReorderableDataTableRecipe.vue';

const columns: CoreReorderableDataTableRecipeColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
];
const rows: CoreReorderableDataTableRecipeRow[] = [
  { id: 1, cells: { member: 'Alice', role: 'Design', status: 'Available', tasks: 12 } },
  { id: 2, cells: { member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 } },
];

describe('CoreReorderableDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  function mountControlled() {
    const order = ref<string[]>([]);
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreReorderableDataTableRecipe, {
            columns,
            rows,
            columnOrder: order.value,
            'onUpdate:columnOrder': (next: string[]) => (order.value = next),
          }),
      ),
    );
    app.mount(host);
    return { app, order };
  }

  function headerTexts(): string[] {
    return [...host.querySelectorAll('th')].map((header) => header.textContent?.trim() ?? '');
  }

  it('renders the frozen caption, native table geometry, configurable columns, and rows', async () => {
    const { app } = mountControlled();
    await nextTick();

    expect(host.querySelector('caption')?.textContent?.trim()).toBe('Reorderable team roster');
    expect(host.querySelector('.cm-data-table--striped.cm-data-table--column-dividers')).not.toBeNull();
    expect(headerTexts()).toEqual(['Member', 'Role', 'Status', 'Tasks']);
    expect([...host.querySelectorAll('th')].every((header) => header.getAttribute('scope') === 'col')).toBe(true);
    expect([...host.querySelectorAll('th')].map((header) => header.getAttribute('tabindex'))).toEqual([
      '0',
      '0',
      '0',
      '0',
    ]);
    expect([...host.querySelectorAll('tbody tr:first-child td')].map((cell) => cell.textContent?.trim())).toEqual([
      'Alice',
      'Design',
      'Available',
      '12',
    ]);
    expect(host.querySelector('[data-core-reorder-cell="tasks"]')?.classList).toContain('cm-data-table__cell--end');
    app.unmount();
  });

  it('reorders with arrow keys, announces the move, and resets through controlled empty order', async () => {
    const { app, order } = mountControlled();
    await nextTick();

    const member = host.querySelector<HTMLElement>('[data-core-reorder-column="member"]')!;
    member.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();
    expect(order.value).toEqual(['role', 'member', 'status', 'tasks']);
    expect(headerTexts()).toEqual(['Role', 'Member', 'Status', 'Tasks']);
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe('Member column moved to position 2 of 4');
    expect(host.querySelector('[data-core-reorder-column="member"]')?.getAttribute('aria-label')).toBe(
      'Member, column 2 of 4',
    );

    order.value = [];
    await nextTick();
    expect(headerTexts()).toEqual(['Member', 'Role', 'Status', 'Tasks']);
    app.unmount();
  });

  it('reverses keyboard direction in RTL', async () => {
    const { app, order } = mountControlled();
    host.dir = 'rtl';
    await nextTick();
    host.querySelector('table')!.style.direction = 'rtl';

    const role = host.querySelector<HTMLElement>('[data-core-reorder-column="role"]')!;
    role.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();
    expect(order.value).toEqual(['role', 'member', 'status', 'tasks']);
    app.unmount();
  });

  it('previews and commits pointer drag order, while Escape cancels an active drag', async () => {
    const { app, order } = mountControlled();
    await nextTick();
    const headers = [...host.querySelectorAll<HTMLElement>('[data-core-reorder-column]')];
    headers.forEach((header, index) => {
      vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
        x: index * 100,
        y: 0,
        left: index * 100,
        right: index * 100 + 100,
        top: 0,
        bottom: 40,
        width: 100,
        height: 40,
        toJSON: () => ({}),
      });
    });

    const pointerEvent = (type: string, properties: Record<string, number>) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value });
      return event;
    };

    headers[0]!.dispatchEvent(pointerEvent('pointerdown', { button: 0, clientX: 50, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 260, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(pointerEvent('pointerup', { clientX: 260, clientY: 10, pointerId: 1 }));
    await nextTick();
    expect(order.value).toEqual(['role', 'status', 'member', 'tasks']);

    const movedMember = host.querySelector<HTMLElement>('[data-core-reorder-column="member"]')!;
    movedMember.dispatchEvent(pointerEvent('pointerdown', { button: 0, clientX: 250, clientY: 10, pointerId: 2 }));
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 60, clientY: 10, pointerId: 2 }));
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(order.value).toEqual(['role', 'status', 'member', 'tasks']);
    app.unmount();
  });

  it('stays route-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreReorderableDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('@codemonster-ru/ui-css/data-table.css');
    expect(source).toContain('aria-description="Drag to reorder, or use Left and Right Arrow keys."');
  });
});
