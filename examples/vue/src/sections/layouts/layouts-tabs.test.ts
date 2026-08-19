// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LayoutsTabs from './LayoutsTabs.vue';

describe('LayoutsTabs', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps one controlled panel and moves selection with roving keyboard focus', async () => {
    const value = ref('one');
    const items = [
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
      { label: 'Three', value: 'three' },
    ];
    const app = createApp(
      defineComponent(
        () => () =>
          h(
            LayoutsTabs,
            {
              items,
              modelValue: value.value,
              'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
            },
            { panel: ({ activeValue }: { activeValue: string }) => h('span', activeValue) },
          ),
      ),
    );

    app.mount(host);
    await nextTick();
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]?.focus();
    tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();

    expect(value.value).toBe('two');
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(tabs[1]?.getAttribute('aria-controls')).toBe(host.querySelector('[role="tabpanel"]')?.id);

    tabs[1]?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'End' }));
    await nextTick();
    expect(value.value).toBe('three');
    expect(document.activeElement).toBe(tabs[2]);
    app.unmount();
  });

  it('reverses horizontal movement in RTL and selects a fallback for dynamic items', async () => {
    host.dir = 'rtl';
    const value = ref('one');
    const items = ref([
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
      { label: 'Three', value: 'three' },
    ]);
    const app = createApp(
      defineComponent(
        () => () =>
          h(LayoutsTabs, {
            items: items.value,
            modelValue: value.value,
            'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
          }),
      ),
    );

    app.mount(host);
    await nextTick();
    const firstTab = host.querySelector<HTMLButtonElement>('[role="tab"]');
    firstTab?.focus();
    firstTab?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();
    expect(value.value).toBe('three');

    items.value = [{ label: 'Two', value: 'two' }];
    await nextTick();
    await nextTick();
    expect(value.value).toBe('two');
    expect(host.querySelector('[role="tab"]')?.getAttribute('aria-selected')).toBe('true');
    app.unmount();
  });
});
