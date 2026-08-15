// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import LayoutsNavMenu from './LayoutsNavMenu.vue';

const items = [
  { value: 'dashboard', label: 'Dashboard', leadingIcon: 'grid' },
  {
    value: 'commerce',
    label: 'Commerce',
    leadingIcon: 'file',
    children: [
      { value: 'catalog', label: 'Catalog' },
      { value: 'warehouse', label: 'Warehouse' },
    ],
  },
  { value: 'settings', label: 'Settings', leadingIcon: 'gear' },
];

describe('LayoutsNavMenu', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('expands the active hierarchy and keeps controlled selection semantics', async () => {
    const value = ref('warehouse');
    const selectedValues: string[] = [];
    const app = createApp(
      defineComponent(
        () => () =>
          h(LayoutsNavMenu, {
            items,
            modelValue: value.value,
            variant: 'sidebar',
            ariaLabel: 'Admin navigation',
            'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
            onSelect: (item: { value: string }) => selectedValues.push(item.value),
          }),
      ),
    );
    app.mount(host);
    await nextTick();

    const branch = host.querySelector<HTMLButtonElement>('[aria-expanded]');
    expect(host.querySelector('nav')?.ariaLabel).toBe('Admin navigation');
    expect(branch?.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Warehouse');

    const dashboard = [...host.querySelectorAll<HTMLButtonElement>('.layouts-nav__item')].find((item) =>
      item.textContent?.includes('Dashboard'),
    );
    dashboard?.click();
    await nextTick();
    expect(value.value).toBe('dashboard');
    expect(selectedValues).toEqual(['dashboard']);
    expect(dashboard?.getAttribute('aria-current')).toBe('page');
    app.unmount();
  });

  it('supports compact geometry plus native branch and arrow-key navigation', async () => {
    const app = createApp(LayoutsNavMenu, {
      items,
      modelValue: 'warehouse',
      variant: 'sidebar',
      compact: true,
    });
    app.mount(host);
    await nextTick();

    const nav = host.querySelector<HTMLElement>('nav');
    const controls = [...host.querySelectorAll<HTMLButtonElement>('.layouts-nav__item')];
    expect(nav?.classList.contains('layouts-nav--sidebar-compact')).toBe(true);

    Object.defineProperty(controls[0], 'offsetParent', { configurable: true, value: host });
    Object.defineProperty(controls[1], 'offsetParent', { configurable: true, value: host });
    Object.defineProperty(controls[controls.length - 1] as HTMLButtonElement, 'offsetParent', {
      configurable: true,
      value: host,
    });
    controls[0]?.focus();
    controls[0]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    expect(document.activeElement).toBe(controls[1]);

    controls[1]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowLeft' }));
    await nextTick();
    expect(controls[1]?.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.layouts-nav__collapse')?.getAttribute('aria-hidden')).toBe('true');
    app.unmount();
  });
});
