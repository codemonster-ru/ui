// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreResizableDataTableRecipe, { type CoreResizableDataTableWidths } from './CoreResizableDataTableRecipe.vue';

describe('CoreResizableDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  function mountRecipe(initialWidths: CoreResizableDataTableWidths = {}) {
    const widths = ref<CoreResizableDataTableWidths>(initialWidths);
    const ended = ref<CoreResizableDataTableWidths[]>([]);
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreResizableDataTableRecipe, {
            widths: widths.value,
            'onUpdate:widths': (nextWidths: CoreResizableDataTableWidths) => (widths.value = nextWidths),
            onColumnResizeEnd: (nextWidths: CoreResizableDataTableWidths) => ended.value.push(nextWidths),
          }),
      ),
    );
    app.mount(host);
    return { app, ended, widths };
  }

  function setColumnGeometry(widths = [350, 250, 250, 150]): void {
    const headers = [...host.querySelectorAll<HTMLElement>('th')];
    headers.forEach((header, index) => {
      header.getBoundingClientRect = () =>
        ({
          bottom: 40,
          height: 40,
          left: widths.slice(0, index).reduce((sum, width) => sum + width, 0),
          right: widths.slice(0, index + 1).reduce((sum, width) => sum + width, 0),
          top: 0,
          width: widths[index] ?? 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
    });
  }

  it('renders exact starting widths, frozen rows, and three native separators', async () => {
    const { app } = mountRecipe();
    await nextTick();

    expect(host.querySelector('caption')?.textContent?.trim()).toBe('Resizable team roster');
    expect([...host.querySelectorAll('th')].map(({ textContent }) => textContent?.trim())).toEqual([
      'Member',
      'Role',
      'Status',
      'Tasks',
    ]);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(7);
    const handles = [...host.querySelectorAll<HTMLElement>('[role="separator"]')];
    expect(handles).toHaveLength(3);
    expect(
      handles.every((handle) => handle.tabIndex === 0 && handle.getAttribute('aria-orientation') === 'vertical'),
    ).toBe(true);
    expect(handles.map((handle) => handle.getAttribute('aria-label'))).toEqual([
      'Resize Member column',
      'Resize Role column',
      'Resize Status column',
    ]);
    expect(host.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(host.querySelector('table')?.classList).not.toContain('demo-application-resizable-table__table--fixed');
    app.unmount();
  });

  it('resizes adjacent columns by keyboard and resets controlled widths', async () => {
    const { app, ended, widths } = mountRecipe();
    await nextTick();
    setColumnGeometry();
    const handle = host.querySelector<HTMLElement>('[role="separator"]')!;
    handle.focus();
    handle.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();

    expect(widths.value).toEqual({ member: '358px', role: '242px', status: '250px', tasks: '150px' });
    expect(ended.value).toEqual([widths.value]);
    expect(document.activeElement).toBe(handle);
    expect(host.querySelector('table')?.classList).toContain('demo-application-resizable-table__table--fixed');
    const reset = host.querySelector<HTMLButtonElement>('button')!;
    expect(reset.disabled).toBe(false);
    reset.click();
    await nextTick();
    expect(widths.value).toEqual({});
    expect(reset.disabled).toBe(true);
    app.unmount();
  });

  it('preserves total width for pointer drag and double-click autosize', async () => {
    const { app, ended, widths } = mountRecipe();
    await nextTick();
    setColumnGeometry();
    const handle = host.querySelector<HTMLElement>('[role="separator"]')!;
    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 100 }));
    window.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120 }));
    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 120 }));
    await nextTick();
    expect(widths.value.member).toBe('370px');
    expect(widths.value.role).toBe('230px');
    expect(Number.parseFloat(widths.value.member!) + Number.parseFloat(widths.value.role!)).toBe(600);
    expect(ended.value).toHaveLength(1);

    setColumnGeometry();
    host.querySelectorAll<HTMLElement>('[data-core-resizable-column="member"]').forEach((cell) => {
      Object.defineProperty(cell, 'scrollWidth', { configurable: true, value: 420 });
    });
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    await nextTick();
    expect(widths.value.member).toBe('420px');
    expect(widths.value.role).toBe('180px');
    expect(ended.value).toHaveLength(2);
    app.unmount();
  });

  it('is route-owned with exact CM-only table, handle, and state geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreResizableDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('table-layout: fixed');
    expect(source).toContain('inset-inline-end: -0.375rem');
    expect(source).toContain("event.key === 'ArrowRight' ? 8 : -8");
    expect(source).toContain('@pointerdown="startResize($event, index)"');
    expect(source).toContain('@dblclick.prevent="autosize(index)"');
    expect(source).toContain('Reset widths');
  });
});
