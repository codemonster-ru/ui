// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Tests mount isolated controlled recipe hosts. */

import { createApp, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreSelectableDataTableRecipe from './CoreSelectableDataTableRecipe.vue';

const columns = [
  { key: 'member', header: 'Member' },
  { key: 'status', header: 'Status' },
];
const rows = [
  { id: 1, cells: { member: 'Alice', status: 'Available' } },
  { id: 2, cells: { member: 'Bob', status: 'Busy' } },
  { id: 3, cells: { member: 'Eve', status: 'Offline' }, selectable: false },
];

describe('CoreSelectableDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders native selection semantics and disables the Offline row', async () => {
    const app = createApp(CoreSelectableDataTableRecipe, {
      id: 'selectable-roster',
      label: 'Selectable team roster',
      columns,
      rows,
      selectedRowIds: [1],
      striped: true,
      columnDividers: true,
    });
    app.mount(host);
    await nextTick();

    expect(host.querySelector('table')?.getAttribute('aria-label')).toBe('Selectable team roster');
    expect([...host.querySelectorAll('th')].map((cell) => cell.getAttribute('scope'))).toEqual([
      'col',
      'col',
      'col',
    ]);
    expect(host.querySelector('[data-core-selectable-data-table-row="1"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(host.querySelector('[data-core-selectable-data-table-row="2"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(host.querySelector<HTMLInputElement>('[aria-label="Select row 3"]')?.disabled).toBe(true);
    expect(host.querySelector<HTMLInputElement>('[aria-label="Select all rows"]')?.indeterminate).toBe(true);
    app.unmount();
  });

  it('emits controlled row selection in rendered order', async () => {
    const selectedRowIds = ref<Array<string | number>>([1]);
    const app = createApp({
      setup: () => () =>
        h(CoreSelectableDataTableRecipe, {
          id: 'controlled-roster',
          columns,
          rows,
          selectedRowIds: selectedRowIds.value,
          'onUpdate:selectedRowIds': (ids: Array<string | number>) => {
            selectedRowIds.value = ids;
          },
        }),
    });
    app.mount(host);
    await nextTick();

    host.querySelector<HTMLInputElement>('[aria-label="Select row 2"]')?.click();
    await nextTick();
    expect(selectedRowIds.value).toEqual([1, 2]);
    expect(host.querySelector('[data-core-selectable-data-table-row="2"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );

    host.querySelector<HTMLInputElement>('[aria-label="Select row 1"]')?.click();
    await nextTick();
    expect(selectedRowIds.value).toEqual([2]);
    app.unmount();
  });

  it('selects every eligible row and preserves a disabled selection', async () => {
    const selectedRowIds = ref<Array<string | number>>([3]);
    const app = createApp({
      setup: () => () =>
        h(CoreSelectableDataTableRecipe, {
          id: 'select-all-roster',
          columns,
          rows,
          selectedRowIds: selectedRowIds.value,
          'onUpdate:selectedRowIds': (ids: Array<string | number>) => {
            selectedRowIds.value = ids;
          },
        }),
    });
    app.mount(host);
    await nextTick();

    host.querySelector<HTMLInputElement>('[aria-label="Select all rows"]')?.click();
    await nextTick();
    expect(selectedRowIds.value).toEqual([1, 2, 3]);

    host.querySelector<HTMLInputElement>('[aria-label="Select all rows"]')?.click();
    await nextTick();
    expect(selectedRowIds.value).toEqual([3]);
    expect(host.querySelector<HTMLInputElement>('[aria-label="Select row 3"]')?.checked).toBe(true);
    app.unmount();
  });
});
