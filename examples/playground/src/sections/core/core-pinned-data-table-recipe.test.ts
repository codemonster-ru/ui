// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CorePinnedDataTableRecipe from './CorePinnedDataTableRecipe.vue';

describe('CorePinnedDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the frozen native table with five ordered columns and rows', async () => {
    const app = createApp(CorePinnedDataTableRecipe);
    app.mount(host);
    await nextTick();

    expect([...host.querySelectorAll('th')].map(({ textContent }) => textContent?.trim())).toEqual([
      'Member',
      'Role',
      'Status',
      'Tasks',
      'Actions',
    ]);
    expect([...host.querySelectorAll('th')].every((cell) => cell.scope === 'col')).toBe(true);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(
      [...host.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Alice', 'Design', 'Available', '12', 'Edit'],
      ['Bob', 'Platform', 'Busy', '8', 'Edit'],
      ['Carol', 'Product', 'Available', '15', 'Edit'],
      ['Diego', 'Design', 'Away', '5', 'Edit'],
      ['Eve', 'QA', 'Offline', '3', 'Edit'],
    ]);
    app.unmount();
  });

  it('pins the Member start edge and Actions end edge in every row', async () => {
    const app = createApp(CorePinnedDataTableRecipe);
    app.mount(host);
    await nextTick();

    const startCells = host.querySelectorAll('.demo-application-pinned-table__pinned--start');
    const endCells = host.querySelectorAll('.demo-application-pinned-table__pinned--end');
    expect(startCells).toHaveLength(6);
    expect(endCells).toHaveLength(6);
    expect([...startCells].every((cell) => cell.matches(':first-child'))).toBe(true);
    expect([...endCells].every((cell) => cell.matches(':last-child'))).toBe(true);
    expect(host.querySelector('th:nth-child(4)')?.classList).toContain('demo-application-pinned-table__tasks');
    expect(host.querySelector('tbody td:nth-child(4)')?.classList).toContain('demo-application-pinned-table__tasks');
    app.unmount();
  });

  it('keeps the horizontal viewport and Edit actions natively keyboard reachable', async () => {
    const app = createApp(CorePinnedDataTableRecipe);
    app.mount(host);
    await nextTick();

    const viewport = host.querySelector<HTMLElement>('.demo-application-pinned-table__scroll')!;
    expect(viewport.tabIndex).toBe(0);
    expect(viewport.getAttribute('aria-label')).toBe('Scrollable pinned team table');
    viewport.focus();
    expect(document.activeElement).toBe(viewport);

    const editButtons = [...host.querySelectorAll<HTMLButtonElement>('tbody button')];
    expect(editButtons).toHaveLength(5);
    expect(editButtons.every((button) => button.type === 'button')).toBe(true);
    editButtons[0]!.focus();
    editButtons[0]!.click();
    expect(document.activeElement).toBe(editButtons[0]);
    app.unmount();
  });

  it('owns exact CM-only overflow, stripe, divider, and logical pin geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CorePinnedDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).not.toContain('@keydown');
    expect(source).toContain('max-width: 32rem');
    expect(source).toContain('min-width: 49rem');
    expect(source).toContain('overflow-x: auto');
    expect(source).toContain('inset-inline-start: 0');
    expect(source).toContain('inset-inline-end: 0');
    expect(source).toContain('var(--cm-color-background-surface-hover) 35%');
    expect(source).toContain('border-inline-start');
    expect(source).toContain('<CmButton size="sm" variant="ghost">Edit</CmButton>');
  });
});
