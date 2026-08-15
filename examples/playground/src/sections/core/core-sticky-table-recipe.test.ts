// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreStickyTableRecipe from './CoreStickyTableRecipe.vue';

describe('CoreStickyTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the exact frozen wrapper, scroller, native table, columns, and rows', async () => {
    const app = createApp(CoreStickyTableRecipe);
    app.mount(host);
    await nextTick();

    const wrapper = host.firstElementChild!;
    const scroller = wrapper.firstElementChild!;
    const table = scroller.firstElementChild!;
    expect(wrapper.className).toBe('core-sticky-table-recipe');
    expect(scroller.className).toBe('core-sticky-table-recipe__scroll');
    expect(table.tagName).toBe('TABLE');
    expect(table.className).toBe('core-sticky-table-recipe__table');
    expect([...host.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual(['Name', 'Status']);
    expect([...host.querySelectorAll('tbody tr')].map((row) => row.textContent?.trim())).toEqual([
      'CoreStable',
      'FormsReview',
      'NavigationStable',
      'OverlayTesting',
      'FeedbackPlanned',
      'SurfacesStable',
      'ProgressReview',
    ]);
    expect(host.querySelector('caption')).toBeNull();
    app.unmount();
  });

  it('supports the native optional caption without changing the fixed table body', async () => {
    const app = createApp(CoreStickyTableRecipe, { caption: 'Component status' });
    app.mount(host);
    await nextTick();
    expect(host.querySelector('caption')?.textContent?.trim()).toBe('Component status');
    expect(host.querySelectorAll('tbody tr')).toHaveLength(7);
    app.unmount();
  });

  it('owns the frozen vertical and horizontal scroll boundaries and sticky header geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyTableRecipe.vue'), 'utf8');
    expect(source).toContain('max-block-size: 13rem');
    expect(source).toMatch(/\.core-sticky-table-recipe\s*\{[\s\S]*?overflow: auto;/u);
    expect(source).toMatch(/\.core-sticky-table-recipe__scroll\s*\{[\s\S]*?overflow-x: auto;/u);
    expect(source).toContain('min-inline-size: 36rem');
    expect(source).toMatch(/\.core-sticky-table-recipe__head th\s*\{[\s\S]*?position: sticky;/u);
    expect(source).toContain('inset-block-start: 0');
  });

  it('keeps border and row separators on the same DOM owners as frozen VfTable', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyTableRecipe.vue'), 'utf8');
    expect(source).toMatch(/\.core-sticky-table-recipe\s*\{[\s\S]*?border: var\(--cm-border-width\)/u);
    expect(source).toContain('.core-sticky-table-recipe__body > tr + tr > td');
    expect(source).toContain('border-collapse: separate');
    expect(source).toContain('border-spacing: 0');
  });

  it('stays route-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreStickyTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('@codemonster-ru/vueforge-core');
    expect(source).not.toContain('cm-table');
    expect(source).toContain('--cm-');
  });

  it('owns the sole frozen sticky-table showcase boundary without the legacy component', () => {
    const showcase = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreShowcase.vue'), 'utf8');
    expect(showcase.match(/<CoreStickyTableRecipe\s*\/>/gu)).toHaveLength(1);
    expect(showcase).toContain("import CoreStickyTableRecipe from './CoreStickyTableRecipe.vue';");
    expect(showcase).not.toContain('VfLegacyTable');
    expect(showcase).toContain('VfTable · sticky header');
  });

  it('leaves no legacy VfTable wrapper overrides in route CSS', () => {
    const routeStyles = readFileSync(resolve(process.cwd(), 'src/sections/core/core-showcase.css'), 'utf8');
    expect(routeStyles).not.toContain('.vf-table-wrap');
    expect(routeStyles).not.toContain('demo-table-scroll-y');
    expect(routeStyles).not.toContain('demo-data-table-pinned');
  });
});
