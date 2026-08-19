// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CorePaginationDataTableRecipe from './CorePaginationDataTableRecipe.vue';

describe('CorePaginationDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  function mountRecipe() {
    const app = createApp(CorePaginationDataTableRecipe);
    app.mount(host);
    return app;
  }

  it('renders frozen page seven rows, summary, selector, and page controls', async () => {
    const app = mountRecipe();
    await nextTick();

    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Member',
      'Status',
      'Tasks',
    ]);
    expect(
      [...host.querySelectorAll<HTMLTableRowElement>('tbody tr')].map((row) =>
        [...row.cells].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Member 19', 'Offline', '3'],
      ['Member 20', 'Available', '9'],
      ['Member 21', 'Busy', '11'],
    ]);
    expect(host.querySelector('.core-pagination-data-table-recipe__summary')?.textContent?.trim()).toBe(
      '19-21 of 42',
    );
    expect(host.querySelector<HTMLSelectElement>('[aria-label="Rows per page"]')?.value).toBe('3');
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('7');
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 7 of 14');
    expect([...host.querySelectorAll('.core-pagination-data-table-recipe__ellipsis')]).toHaveLength(2);
    app.unmount();
  });

  it('moves with page controls and preserves native button semantics', async () => {
    const app = mountRecipe();
    await nextTick();

    host.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')!.click();
    await nextTick();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('6');
    expect(host.querySelector('tbody tr')?.textContent).toContain('Member 16');

    host.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click();
    await nextTick();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('7');

    host.querySelector<HTMLButtonElement>('[aria-label="Go to page 8"]')!.click();
    await nextTick();
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 8 of 14');
    expect(host.querySelector('tbody tr')?.textContent).toContain('Member 22');
    app.unmount();
  });

  it('resets to page one when the native page-size selector changes', async () => {
    const app = mountRecipe();
    await nextTick();

    const select = host.querySelector<HTMLSelectElement>('[aria-label="Rows per page"]')!;
    select.value = '5';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();

    expect(host.querySelector('.core-pagination-data-table-recipe__summary')?.textContent?.trim()).toBe('1-5 of 42');
    expect(host.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 1 of 9');
    expect(host.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')?.disabled).toBe(true);
    app.unmount();
  });

  it('stays route-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CorePaginationDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('@codemonster-ru/ui-css/data-table.css');
    expect(source).toContain('<CmIconButton');
    expect(source).toContain('icons.chevronLeft');
    expect(source).toContain('icons.chevronRight');
    expect(source).toContain('.core-pagination-data-table-recipe__page-size-visual > :last-child');
    expect(source).not.toContain('.vf-icon-wrapper');
  });
});
