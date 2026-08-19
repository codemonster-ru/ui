// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreTabsRecipe from './CoreTabsRecipe.vue';

const items = [
  { label: 'Overview', value: 'overview' },
  { label: 'API', value: 'api', disabled: true },
  { label: 'Status', value: 'status' },
  { label: 'Changelog', value: 'changelog' },
] as const;

describe('CoreTabsRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function press(tab: HTMLButtonElement, key: string) {
    tab.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
  }

  it('renders one controlled panel with linked native tab semantics', async () => {
    const value = ref('overview');
    const app = createApp(
      defineComponent(
        () => () =>
          h(
            CoreTabsRecipe,
            {
              items,
              modelValue: value.value,
              'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
            },
            { panel: ({ activeValue }: { activeValue: string }) => h('p', `Panel: ${activeValue}`) },
          ),
      ),
    );

    app.mount(host);
    await nextTick();

    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(host.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tabs.map(({ tabIndex }) => tabIndex)).toEqual([0, -1, -1, -1]);
    expect(tabs[1]?.disabled).toBe(true);
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(host.querySelector('[role="tabpanel"]')?.textContent).toBe('Panel: overview');
    expect(tabs[0]?.getAttribute('aria-controls')).toBe(host.querySelector('[role="tabpanel"]')?.id);
    expect(host.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe(tabs[0]?.id);

    tabs[2]?.click();
    await nextTick();
    expect(value.value).toBe('status');
    expect(tabs.map(({ tabIndex }) => tabIndex)).toEqual([-1, -1, 0, -1]);
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(host.querySelector('[role="tabpanel"]')?.textContent).toBe('Panel: status');

    tabs[1]?.click();
    await nextTick();
    expect(value.value).toBe('status');
    app.unmount();
  });

  it('supports every navigation key with wrapping and disabled-item skipping', async () => {
    const value = ref('overview');
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreTabsRecipe, {
            items,
            modelValue: value.value,
            'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
          }),
      ),
    );

    app.mount(host);
    await nextTick();
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    tabs[0]?.focus();
    press(tabs[0]!, 'ArrowRight');
    await nextTick();
    expect(value.value).toBe('status');
    expect(document.activeElement).toBe(tabs[2]);

    press(tabs[2]!, 'ArrowDown');
    await nextTick();
    expect(value.value).toBe('changelog');

    press(tabs[3]!, 'ArrowRight');
    await nextTick();
    expect(value.value).toBe('overview');

    press(tabs[0]!, 'ArrowLeft');
    await nextTick();
    expect(value.value).toBe('changelog');

    press(tabs[3]!, 'ArrowUp');
    await nextTick();
    expect(value.value).toBe('status');

    press(tabs[2]!, 'Home');
    await nextTick();
    expect(value.value).toBe('overview');

    press(tabs[0]!, 'End');
    await nextTick();
    expect(value.value).toBe('changelog');
    expect(document.activeElement).toBe(tabs[3]);
    app.unmount();
  });

  it('reverses horizontal navigation in RTL and keeps vertical navigation logical', async () => {
    host.dir = 'rtl';
    const value = ref('overview');
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreTabsRecipe, {
            items,
            modelValue: value.value,
            'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
          }),
      ),
    );

    app.mount(host);
    await nextTick();
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    press(tabs[0]!, 'ArrowRight');
    await nextTick();
    expect(value.value).toBe('changelog');

    press(tabs[3]!, 'ArrowLeft');
    await nextTick();
    expect(value.value).toBe('overview');

    press(tabs[0]!, 'ArrowDown');
    await nextTick();
    expect(value.value).toBe('status');
    app.unmount();
  });

  it('owns overflow controls, indicator geometry, and CM-token styling', async () => {
    const app = createApp(CoreTabsRecipe, { items, modelValue: 'overview' });
    app.mount(host);
    await nextTick();
    const viewport = host.querySelector<HTMLElement>('.demo-application-tabs__list-scroller');
    expect(viewport).not.toBeNull();
    Object.defineProperties(viewport!, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 400 },
    });
    const scrollTo = vi.fn();
    viewport!.scrollTo = scrollTo;
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    const rightControl = host.querySelector<HTMLButtonElement>('.demo-application-tabs__scroll-button--right');
    expect(rightControl?.disabled).toBe(false);
    expect(rightControl?.getAttribute('aria-hidden')).toBe('false');
    rightControl?.click();
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', left: 120 });
    expect(host.querySelector('.demo-application-tabs__baseline')).not.toBeNull();
    expect(host.querySelector('.demo-application-tabs__indicator')).not.toBeNull();

    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreTabsRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).toContain('background: var(--cm-color-selected-foreground)');
    expect(source).toContain('scrollbar-width: none');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    app.unmount();
  });
});
