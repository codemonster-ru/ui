// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreDrawerRecipe, { type CoreDrawerPlacement } from './CoreDrawerRecipe.vue';

describe('CoreDrawerRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value() {
          this.setAttribute('open', '');
        },
      },
      close: {
        configurable: true,
        value() {
          this.removeAttribute('open');
        },
      },
    });
  });

  afterEach(() => {
    host.remove();
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  function mountDrawer(options: { fullscreen?: boolean; placement?: CoreDrawerPlacement } = {}) {
    const open = ref(false);
    const app = createApp(
      defineComponent(
        () => () =>
          h('div', [
            h('button', { id: 'launcher', onClick: () => (open.value = true) }, 'Open drawer'),
            h(CoreDrawerRecipe, {
              fullscreen: options.fullscreen,
              open: open.value,
              placement: options.placement,
              'onUpdate:open': (nextOpen: boolean) => (open.value = nextOpen),
            }),
          ]),
      ),
    );
    app.mount(host);

    return { app, open };
  }

  it.each([
    { expectedClass: 'cm-drawer--start', placement: 'left' },
    { expectedClass: 'cm-drawer--end', placement: 'right' },
  ] as const)(
    'maps supported $placement placement to canonical $expectedClass',
    async ({ expectedClass, placement }) => {
      const { app } = mountDrawer({ placement });
      host.querySelector<HTMLButtonElement>('#launcher')!.click();
      await nextTick();
      await nextTick();

      const drawer = host.querySelector<HTMLDialogElement>('#core-showcase-drawer-drawer')!;
      expect(drawer.open).toBe(true);
      expect(drawer.classList).toContain(expectedClass);
      expect(drawer.classList).toContain('cm-drawer--md');
      expect(drawer.classList).toContain('cm-drawer--dividers');
      expect(drawer.getAttribute('aria-labelledby')).toBe('core-showcase-drawer-title');
      expect(host.querySelector('#core-showcase-drawer-title')?.textContent).toBe('Drawer');
      app.unmount();
    },
  );

  it.each(['top', 'bottom'] as const)('owns frozen %s placement without a legacy component', async (placement) => {
    const { app } = mountDrawer({ placement });
    host.querySelector<HTMLButtonElement>('#launcher')!.click();
    await nextTick();
    await nextTick();

    const drawer = host.querySelector<HTMLDialogElement>('#core-showcase-drawer-drawer')!;
    expect(drawer.open).toBe(true);
    expect(drawer.classList).toContain(`demo-application-drawer--${placement}`);
    expect(drawer.classList).toContain('cm-drawer--md');
    expect(drawer.textContent).toContain('Drawer content.');
    expect(drawer.querySelector('input')?.placeholder).toBe('Search in drawer');
    app.unmount();
  });

  it('renders the frozen fullscreen-left content and exact actions', async () => {
    const { app, open } = mountDrawer({ fullscreen: true, placement: 'left' });
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;
    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();

    const drawer = host.querySelector<HTMLDialogElement>('#core-showcase-fullscreen-drawer-drawer')!;
    expect(drawer.classList).toContain('cm-drawer--start');
    expect(drawer.classList).toContain('cm-drawer--full');
    expect(drawer.textContent).toContain('Fullscreen Drawer');
    expect(drawer.textContent).toContain('Fullscreen drawer content.');
    expect(drawer.querySelector('input')?.placeholder).toBe('Search in fullscreen drawer');
    expect(drawer.querySelector('.demo-application-drawer__close svg path')?.getAttribute('d')).toBe(
      'M5.75 5.75 18.25 18.25M18.25 5.75 5.75 18.25',
    );
    expect(
      [...drawer.querySelectorAll('.cm-drawer__footer button')].map(({ textContent }) => textContent?.trim()),
    ).toEqual(['Apply', 'Close']);
    expect(document.activeElement?.textContent).toBe('Apply');
    expect(document.body.style.overflow).toBe('hidden');

    drawer.querySelector<HTMLButtonElement>('button[autofocus]')!.click();
    await nextTick();
    expect(open.value).toBe(false);
    expect(drawer.open).toBe(false);
    expect(document.activeElement).toBe(launcher);
    expect(document.body.style.overflow).toBe('');
    app.unmount();
  });

  it('dismisses only target backdrop clicks and restores scroll and launcher focus', async () => {
    const { app, open } = mountDrawer();
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;
    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();

    const drawer = host.querySelector<HTMLDialogElement>('dialog')!;
    drawer.querySelector<HTMLElement>('.cm-drawer__surface')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(open.value).toBe(true);

    drawer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(launcher);
    expect(document.body.style.overflow).toBe('');
    app.unmount();
  });

  it('dismisses a vertical drawer through Escape and restores scroll and launcher focus', async () => {
    const { app, open } = mountDrawer({ placement: 'top' });
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;
    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();

    const drawer = host.querySelector<HTMLDialogElement>('dialog')!;
    drawer.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(drawer.open).toBe(false);
    expect(document.activeElement).toBe(launcher);
    expect(document.body.style.overflow).toBe('');
    app.unmount();
  });

  it('keeps every placement route-owned and CM-only', () => {
    const placements: CoreDrawerPlacement[] = ['left', 'right', 'top', 'bottom'];
    expect(placements).toHaveLength(4);

    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreDrawerRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('demo-application-drawer--top');
    expect(source).toContain('demo-application-drawer--bottom');
    expect(source).toContain('inline-size: 100dvw');
    expect(source).toContain('<CmDrawer');
  });
});
