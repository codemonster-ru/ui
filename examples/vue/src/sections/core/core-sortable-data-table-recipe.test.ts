// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreSortableDataTableRecipe, { type CoreSortableDataTableSort } from './CoreSortableDataTableRecipe.vue';

describe('CoreSortableDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  function mountRecipe(initialSort: readonly CoreSortableDataTableSort[] = []) {
    const sort = ref(initialSort);
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreSortableDataTableRecipe, {
            sort: sort.value,
            'onUpdate:sort': (nextSort: CoreSortableDataTableSort[]) => (sort.value = nextSort),
          }),
      ),
    );
    app.mount(host);
    return { app, sort };
  }

  function header(label: string): HTMLButtonElement {
    return [...host.querySelectorAll<HTMLButtonElement>('th button')].find((button) =>
      button.textContent?.trim().startsWith(label),
    )!;
  }

  function visibleMembers(): string[] {
    return [...host.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent?.trim() ?? '');
  }

  it('renders the frozen caption, page-size-three rows, and native pagination semantics', async () => {
    const { app } = mountRecipe();
    await nextTick();

    expect(host.querySelector('caption')?.textContent?.trim()).toBe('Sortable team workload');
    expect([...host.querySelectorAll('th')].map((cell) => cell.scope)).toEqual(['col', 'col', 'col', 'col']);
    expect(visibleMembers()).toEqual(['Alice', 'Bob', 'Carol']);
    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe('Table pagination');
    expect(host.querySelector('.demo-application-sortable-table__summary')?.textContent).toBe('1-3 of 7');
    expect(
      [...host.querySelectorAll('.demo-application-sortable-table__pages button')].map(({ textContent }) =>
        textContent?.trim(),
      ),
    ).toEqual(['1', '2', '3']);
    expect(host.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')?.disabled).toBe(true);
    expect(host.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')?.disabled).toBe(false);
    expect(host.querySelector('select')?.getAttribute('aria-label')).toBe('Rows per page');
    app.unmount();
  });

  it('cycles controlled multi-sort in stable priority order and resets client paging', async () => {
    const { app, sort } = mountRecipe();
    await nextTick();

    host.querySelector<HTMLButtonElement>('button[aria-label="Go to page 2"]')!.click();
    await nextTick();
    expect(visibleMembers()).toEqual(['Diego', 'Eve', 'Frank']);

    header('Tasks').click();
    await nextTick();
    expect(sort.value).toEqual([{ direction: 'asc', key: 'tasks' }]);
    expect(visibleMembers()).toEqual(['Eve', 'Diego', 'Bob']);
    expect(header('Tasks').getAttribute('aria-label')).toBe('Sort Tasks descending');
    expect(header('Tasks').closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');

    header('Role').click();
    await nextTick();
    expect(sort.value).toEqual([
      { direction: 'asc', key: 'tasks' },
      { direction: 'asc', key: 'role' },
    ]);
    expect(
      [...host.querySelectorAll('.demo-application-sortable-table__priority')].map(({ textContent }) =>
        textContent?.trim(),
      ),
    ).toEqual(['2', '1']);

    header('Tasks').click();
    await nextTick();
    expect(sort.value[0]).toEqual({ direction: 'desc', key: 'tasks' });
    expect(visibleMembers()).toEqual(['Carol', 'Alice', 'Grace']);

    header('Tasks').click();
    await nextTick();
    expect(sort.value).toEqual([{ direction: 'asc', key: 'role' }]);
    expect(host.querySelectorAll('.demo-application-sortable-table__priority')).toHaveLength(0);
    app.unmount();
  });

  it('uses native keyboard-capable controls and updates page size locally', async () => {
    const { app } = mountRecipe();
    await nextTick();

    const tasks = header('Tasks');
    tasks.focus();
    tasks.click();
    await nextTick();
    expect(document.activeElement).toBe(tasks);
    expect(tasks.type).toBe('button');

    const select = host.querySelector<HTMLSelectElement>('select')!;
    select.value = '5';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(visibleMembers()).toEqual(['Eve', 'Diego', 'Bob', 'Frank', 'Grace']);
    expect(host.querySelector('.demo-application-sortable-table__summary')?.textContent).toBe('1-5 of 7');
    expect(host.querySelectorAll('.demo-application-sortable-table__pages button')).toHaveLength(2);
    app.unmount();
  });

  it('is route-owned with exact CM-only table and pagination geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreSortableDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).not.toContain('@keydown');
    expect(source).toContain('border-collapse: separate');
    expect(source).toContain('container-type: inline-size');
    expect(source).toContain('var(--cm-field-padding-lg)');
    expect(source).toContain('<CmSelect');
    expect(source).toContain('<CmIconButton');
  });
});
