// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreSlotsDataTableRecipe from './CoreSlotsDataTableRecipe.vue';

describe('CoreSlotsDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the frozen rich rows with native table and linked column semantics', async () => {
    const app = createApp(CoreSlotsDataTableRecipe);
    app.mount(host);
    await nextTick();

    expect(host.querySelectorAll('table')).toHaveLength(1);
    expect(host.querySelectorAll('thead')).toHaveLength(1);
    expect(host.querySelectorAll('tbody')).toHaveLength(1);
    expect(host.querySelectorAll('tfoot')).toHaveLength(1);
    expect([...host.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Member',
      'Status',
      'Tasks open',
    ]);
    expect([...host.querySelectorAll('th')].every((cell) => cell.scope === 'col')).toBe(true);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(
      [...host.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Alice', 'Available', '12'],
      ['Bob', 'Busy', '8'],
      ['Carol', 'Available', '15'],
      ['Diego', 'Away', '5'],
      ['Eve', 'Offline', '3'],
    ]);
    app.unmount();
  });

  it('maps every status to its exact canonical badge tone', async () => {
    const app = createApp(CoreSlotsDataTableRecipe);
    app.mount(host);
    await nextTick();

    const badges = [...host.querySelectorAll<HTMLElement>('.cm-badge')];
    expect(badges.map(({ textContent }) => textContent?.trim())).toEqual([
      'Available',
      'Busy',
      'Available',
      'Away',
      'Offline',
    ]);
    expect(badges.map(({ className }) => className)).toEqual([
      expect.stringContaining('cm-badge--success'),
      expect.stringContaining('cm-badge--warning'),
      expect.stringContaining('cm-badge--success'),
      'cm-badge',
      'cm-badge',
    ]);
    app.unmount();
  });

  it('owns one valid footer row spanning the complete table geometry', async () => {
    const app = createApp(CoreSlotsDataTableRecipe);
    app.mount(host);
    await nextTick();

    expect(host.querySelectorAll('tfoot tr')).toHaveLength(1);
    const footerCell = host.querySelector<HTMLTableCellElement>('tfoot td');
    expect(footerCell?.colSpan).toBe(3);
    expect(footerCell?.textContent?.trim()).toBe('Total: 43 open tasks');
    expect(host.querySelector('th:last-child')?.classList).toContain('demo-application-slots-table__tasks');
    expect(host.querySelector('tbody td:last-child')?.classList).toContain('demo-application-slots-table__tasks');
    app.unmount();
  });

  it('is route-owned, CM-only, and uses canonical table geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreSlotsDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('<CmTable');
    expect(source).toContain('@codemonster-ru/ui-css/table.css');
    expect(source).toContain('gap: var(--cm-space-2)');
    expect(source).toContain('text-align: end');
  });
});
