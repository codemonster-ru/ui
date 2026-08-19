// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LayoutsDrawer from './LayoutsDrawer.vue';

describe('LayoutsDrawer', () => {
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

  it('dismisses from the overlay and Escape and restores the opener focus', async () => {
    const open = ref(false);
    const app = createApp(
      defineComponent(
        () => () =>
          h('div', [
            h('button', { id: 'opener', onClick: () => (open.value = true) }, 'Open'),
            h(
              LayoutsDrawer,
              {
                open: open.value,
                title: 'Navigation',
                'onUpdate:open': (nextOpen: boolean) => (open.value = nextOpen),
              },
              { default: () => h('button', 'Destination') },
            ),
          ]),
      ),
    );
    app.mount(host);

    const opener = host.querySelector<HTMLButtonElement>('#opener');
    opener?.focus();
    opener?.click();
    await nextTick();
    await nextTick();

    const dialog = host.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('layouts-admin-drawer-title');
    expect(document.activeElement).toBe(dialog);
    expect(host.querySelector<HTMLButtonElement>('[aria-label="Close drawer"] svg')).not.toBeNull();

    host.querySelector<HTMLElement>('.layouts-drawer__overlay')?.click();
    await nextTick();
    await nextTick();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);

    opener?.click();
    await nextTick();
    await nextTick();
    host
      .querySelector<HTMLElement>('[role="dialog"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    await nextTick();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    app.unmount();
  });

  it('wraps keyboard focus within the open drawer', async () => {
    const app = createApp(
      defineComponent(
        () => () =>
          h(
            LayoutsDrawer,
            { open: true, title: 'Navigation' },
            {
              default: () => [h('button', { id: 'first-item' }, 'First'), h('button', { id: 'last-item' }, 'Last')],
            },
          ),
      ),
    );
    app.mount(host);
    await nextTick();
    await nextTick();

    const dialog = host.querySelector<HTMLElement>('[role="dialog"]');
    const closeButton = host.querySelector<HTMLButtonElement>('[aria-label="Close drawer"]');
    const lastItem = host.querySelector<HTMLButtonElement>('#last-item');

    lastItem?.focus();
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' }));
    expect(document.activeElement).toBe(closeButton);

    closeButton?.focus();
    dialog?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', shiftKey: true }),
    );
    expect(document.activeElement).toBe(lastItem);
    app.unmount();
  });
});
