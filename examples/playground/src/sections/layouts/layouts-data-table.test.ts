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

  it('uses a native labelled rows selector and resets the page after resizing', async () => {
    const app = mountTable();
    await nextTick();

    host.querySelector<HTMLButtonElement>('[aria-label="Go to page 2"]')?.click();
    await nextTick();
    const select = host.querySelector<HTMLSelectElement>('[aria-label="Rows per page"]');
    expect(select?.options).toHaveLength(2);
    const pageSizeIcon = host.querySelector<HTMLElement>('.layouts-data-table__page-size-visual > :last-child');
    expect(pageSizeIcon).not.toBeNull();
    expect(pageSizeIcon?.querySelector<SVGElement>('svg')?.getAttribute('width')).toBe(
      'calc(var(--cm-icon-size-md) - var(--cm-border-width))',
    );
    if (select) {
      select.value = '10';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await nextTick();

    expect(host.querySelectorAll('tbody tr')).toHaveLength(7);
    expect(host.querySelector('.layouts-data-table__pagination-summary')?.textContent?.trim()).toBe('1-7 of 7');
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 1 of 1');
    app.unmount();
  });

  it('owns page-size icon color without a legacy wrapper selector', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/layouts/layouts-data-table.css'), 'utf8');
    expect(source).toContain('.layouts-data-table__page-size-visual > :last-child');
    expect(source).not.toContain('.vf-icon-wrapper');
  });
});
