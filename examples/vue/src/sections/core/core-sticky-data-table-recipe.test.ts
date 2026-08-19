// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreStickyDataTableRecipe from './CoreStickyDataTableRecipe.vue';

describe('CoreStickyDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the frozen DataTable wrapper, scroller, columns, and seven rows', async () => {
    const app = createApp(CoreStickyDataTableRecipe);
    app.mount(host);
    await nextTick();

    const wrapper = host.firstElementChild!;
    const scroller = wrapper.firstElementChild!;
    const table = scroller.firstElementChild!;
    expect(wrapper.className).toBe('core-sticky-data-table-recipe');
    expect(scroller.className).toBe('core-sticky-data-table-recipe__scroll');
    expect(table.tagName).toBe('TABLE');
    expect(table.className).toBe('core-sticky-data-table-recipe__table');
    expect([...host.querySelectorAll('thead th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Member',
      'Role',
      'Status',
    ]);
    expect(
      [...host.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Alice', 'Design', 'Available'],
      ['Bob', 'Platform', 'Busy'],
      ['Carol', 'Product', 'Available'],
      ['Diego', 'Design', 'Away'],
      ['Eve', 'QA', 'Offline'],
      ['Frank', 'Support', 'Available'],
      ['Grace', 'Platform', 'Busy'],
    ]);
    app.unmount();
  });

  it('keeps the header and body cell structure aligned by route-owned column metadata', async () => {
    const app = createApp(CoreStickyDataTableRecipe);
    app.mount(host);
    await nextTick();

    expect([...host.querySelectorAll('thead th')].map((cell) => cell.getAttribute('data-core-column-key'))).toEqual([
      'member',
      'role',
      'status',
    ]);
    expect(
      [...host.querySelectorAll('tbody tr:first-child td')].map((cell) => [
        cell.getAttribute('data-core-column-index'),
        cell.getAttribute('data-core-column-key'),
      ]),
    ).toEqual([
      ['0', 'member'],
      ['1', 'role'],
      ['2', 'status'],
    ]);
    expect(host.querySelectorAll('.core-sticky-data-table-recipe__header-content')).toHaveLength(3);
    app.unmount();
  });

  it('owns the frozen nested scroll boundaries, table minimum size, and sticky header', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyDataTableRecipe.vue'), 'utf8');
    expect(source).toMatch(
      /\.core-sticky-data-table-recipe\s*\{[\s\S]*?max-block-size: 13rem;[\s\S]*?overflow: auto;/u,
    );
    expect(source).toMatch(/\.core-sticky-data-table-recipe__scroll\s*\{[\s\S]*?overflow-x: auto;/u);
    expect(source).toMatch(/\.core-sticky-data-table-recipe__table\s*\{[\s\S]*?min-inline-size: 36rem;/u);
    expect(source).toMatch(/\.core-sticky-data-table-recipe__header-cell\s*\{[\s\S]*?position: sticky;/u);
    expect(source).toContain('inset-block-start: 0');
  });

  it('keeps frozen DataTable border, header-content, and row-separator owners', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyDataTableRecipe.vue'), 'utf8');
    expect(source).toMatch(/\.core-sticky-data-table-recipe\s*\{[\s\S]*?flex-direction: column;/u);
    expect(source).toMatch(/\.core-sticky-data-table-recipe__scroll\s*\{[\s\S]*?position: relative;/u);
    expect(source).toMatch(/\.core-sticky-data-table-recipe__header-content\s*\{[\s\S]*?display: inline-flex;/u);
    expect(source).toContain('.core-sticky-data-table-recipe__body > tr + tr > td');
    expect(source).toContain('border-collapse: separate');
    expect(source).toContain('border-spacing: 0');
  });

  it('stays standalone, route-owned, and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('@codemonster-ru/vueforge-core');
    expect(source).not.toContain('CoreStickyTableRecipe');
    expect(source).not.toContain('cm-data-table');
    expect(source).toContain('--cm-');
  });

  it('owns the sole frozen sticky-DataTable showcase boundary without the legacy runtime', () => {
    const showcase = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreShowcase.vue'), 'utf8');
    expect(showcase.match(/<CoreStickyDataTableRecipe\s*\/>/gu)).toHaveLength(1);
    expect(showcase).toContain("import CoreStickyDataTableRecipe from './CoreStickyDataTableRecipe.vue';");
    expect(showcase).not.toContain('<VfDataTable');
    expect(showcase).not.toMatch(/import\s*\{[^}]*\bVfDataTable\b[^}]*\}\s*from '@codemonster-ru\/vueforge-core'/su);
    expect(showcase).toContain('VfDataTable · sticky header');
  });
});
