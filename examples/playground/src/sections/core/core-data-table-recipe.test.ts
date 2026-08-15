// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Each test mounts the same route-local recipe with an isolated app. */

import { createApp, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreDataTableRecipe from './CoreDataTableRecipe.vue';

const columns = [
  { key: 'member', header: 'Member' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' as const },
];
const rows = [
  { id: 1, cells: { member: 'Alice', status: 'Available', tasks: 12 } },
  { id: 2, cells: { member: 'Bob', status: 'Busy', tasks: 8 } },
];

describe('CoreDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders frozen native table semantics and controlled density geometry', async () => {
    const app = createApp(CoreDataTableRecipe, {
      id: 'team-roster',
      caption: 'Team roster',
      columns,
      rows,
      density: 'compact',
      striped: true,
      columnDividers: true,
    });
    app.mount(host);
    await nextTick();

    const root = host.querySelector('#team-roster');
    expect(root?.classList.contains('core-data-table-recipe--compact')).toBe(true);
    expect(root?.classList.contains('core-data-table-recipe--striped')).toBe(true);
    expect(root?.classList.contains('core-data-table-recipe--column-dividers')).toBe(true);
    expect(host.querySelector('caption')?.textContent?.trim()).toBe('Team roster');
    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Member',
      'Status',
      'Tasks',
    ]);
    expect([...host.querySelectorAll('th')].every((cell) => cell.getAttribute('scope') === 'col')).toBe(true);
    expect(host.querySelector('[data-core-data-table-row="1"]')?.textContent).toContain('Alice');
    expect(host.querySelector('tbody td:last-child')?.classList.contains('core-data-table-recipe__cell--end')).toBe(
      true,
    );
    app.unmount();
  });

  it('reacts to controlled visible columns without rewriting row data', async () => {
    const visibleColumnKeys = ref<readonly string[]>(['member', 'tasks']);
    const app = createApp({
      setup: () => () =>
        h(CoreDataTableRecipe, {
          id: 'configurable-roster',
          columns,
          rows,
          visibleColumnKeys: visibleColumnKeys.value,
        }),
    });
    app.mount(host);
    await nextTick();

    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual(['Member', 'Tasks']);
    expect([...host.querySelectorAll('tbody tr')].map((row) => row.textContent)).toEqual([
      expect.stringContaining('Alice'),
      expect.stringContaining('Bob'),
    ]);

    visibleColumnKeys.value = ['member', 'status'];
    await nextTick();
    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual(['Member', 'Status']);
    expect(host.querySelector('tbody')?.textContent).not.toContain('12');
    app.unmount();
  });

  it('renders one accessible empty state spanning the visible columns', async () => {
    const app = createApp(CoreDataTableRecipe, {
      id: 'empty-roster',
      label: 'Empty team roster',
      columns,
      rows: [],
      visibleColumnKeys: ['member', 'status'],
      emptyText: 'No team members found',
    });
    app.mount(host);
    await nextTick();

    expect(host.querySelector('table')?.getAttribute('aria-label')).toBe('Empty team roster');
    expect(host.querySelectorAll('tbody tr')).toHaveLength(1);
    const state = host.querySelector('.core-data-table-recipe__state-cell');
    expect(state?.getAttribute('colspan')).toBe('2');
    expect(state?.textContent?.trim()).toBe('No team members found');
    app.unmount();
  });
});
