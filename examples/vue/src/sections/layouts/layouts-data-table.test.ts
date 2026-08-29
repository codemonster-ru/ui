// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import LayoutsDataTable from './LayoutsDataTable.vue';

const columns = [
  { key: 'product', header: 'Product' },
  { key: 'available', header: 'Available', align: 'end' as const },
];
const rows = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  product: `Product ${index + 1}`,
  available: index + 10,
}));

describe('LayoutsDataTable', () => {
  let host: HTMLDivElement;

  function mountTable() {
    const app = createApp(LayoutsDataTable, {
      columns,
      rows,
      defaultPageSize: 5,
      pageSizeOptions: [5, 10],
    });
    app.mount(host);
    return app;
  }

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the frozen columns and paginates with numbered and icon controls', async () => {
    const app = mountTable();
    await nextTick();

    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual(['Product', 'Available']);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(host.querySelector('.layouts-data-table__pagination-summary')?.textContent?.trim()).toBe('1-5 of 7');
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
    expect(host.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')?.disabled).toBe(true);

    host.querySelector<HTMLButtonElement>('[aria-label="Go to page 2"]')?.click();
    await nextTick();
    expect([...host.querySelectorAll('tbody tr')].map((row) => row.textContent)).toEqual([
      expect.stringContaining('Product 6'),
      expect.stringContaining('Product 7'),
    ]);
    expect(host.querySelector('.layouts-data-table__pagination-summary')?.textContent?.trim()).toBe('6-7 of 7');
    expect(host.querySelector<HTMLButtonElement>('[aria-label="Next page"]')?.disabled).toBe(true);
    app.unmount();
  });

  it('resets the page after the rows selector changes', async () => {
    const app = mountTable();
    await nextTick();

    host.querySelector<HTMLButtonElement>('[aria-label="Go to page 2"]')?.click();
    await nextTick();

    const trigger = host.querySelector<HTMLButtonElement>('[role="combobox"]');
    expect(trigger?.getAttribute('aria-label')).toBe('Rows per page');
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(2);

    trigger?.click();
    await nextTick();
    host.querySelector<HTMLButtonElement>('[role="option"][data-cm-select-value="10"]')?.click();
    await nextTick();

    expect(host.querySelectorAll('tbody tr')).toHaveLength(7);
    expect(host.querySelector('.layouts-data-table__pagination-summary')?.textContent?.trim()).toBe('1-7 of 7');
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 1 of 1');
    app.unmount();
  });

  it('composes the shared select instead of drawing a replica over a native one', () => {
    const markup = readFileSync(resolve(process.cwd(), 'src/sections/layouts/LayoutsDataTable.vue'), 'utf8');
    const source = readFileSync(resolve(process.cwd(), 'src/sections/layouts/layouts-data-table.css'), 'utf8');

    expect(markup).toContain('<CmSelect');
    expect(markup).not.toContain('<select');
    expect(source).not.toContain('page-size-visual');
    expect(source).not.toContain('.vf-icon-wrapper');
  });
});
