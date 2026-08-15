// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreDialogRecipe from './CoreDialogRecipe.vue';

describe('CoreDialogRecipe', () => {
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

  function mountDialog(size: 'sm' | 'md' | 'lg' = 'md') {
    const open = ref(false);
    const app = createApp(
      defineComponent(
        () => () =>
          h('div', [
            h('button', { id: 'launcher', onClick: () => (open.value = true) }, 'Open dialog'),
            h(CoreDialogRecipe, {
              open: open.value,
              size,
              'onUpdate:open': (nextOpen: boolean) => (open.value = nextOpen),
            }),
          ]),
      ),
    );
    app.mount(host);

    return { app, open };
  }

  it('renders the frozen dialog structure with stable linked ids, size, dividers, and exact actions', async () => {
    const { app, open } = mountDialog('lg');
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;
    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();

    const dialog = host.querySelector<HTMLDialogElement>('#core-showcase-dialog-dialog')!;
    const title = host.querySelector('#core-showcase-dialog-title')!;
    expect(open.value).toBe(true);
    expect(dialog.open).toBe(true);
    expect(dialog.classList).toContain('cm-dialog--lg');
    expect(dialog.classList).toContain('cm-dialog--dividers');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.textContent).toBe('Dialog');
    expect(dialog.textContent).toContain('Dialog content.');
    expect(host.querySelectorAll('button[aria-label="Close dialog"]')).toHaveLength(2);
    expect(host.querySelector('.demo-application-dialog__close svg path')?.getAttribute('d')).toBe(
      'M5.75 5.75 18.25 18.25M18.25 5.75 5.75 18.25',
    );
    expect(host.querySelector('.demo-application-dialog__close svg path')?.getAttribute('stroke-width')).toBe('2');
    expect([...dialog.querySelectorAll('button')].map(({ textContent }) => textContent?.trim())).toEqual([
      '',
      '×',
      'Looks good',
      'Close',
    ]);
    expect(document.activeElement?.textContent).toBe('Looks good');
    expect(document.body.style.overflow).toBe('hidden');

    host.querySelector<HTMLButtonElement>('button[autofocus]')!.click();
    await nextTick();
    expect(open.value).toBe(false);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(launcher);
    expect(document.body.style.overflow).toBe('');
    app.unmount();
  });

  it('dismisses through backdrop, close SVG, Escape, and the secondary footer action', async () => {
    const { app, open } = mountDialog();
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;

    async function reopen(): Promise<HTMLDialogElement> {
      launcher.focus();
      launcher.click();
      await nextTick();
      await nextTick();
      return host.querySelector<HTMLDialogElement>('dialog')!;
    }

    let dialog = await reopen();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(launcher);

    await reopen();
    host.querySelector<HTMLButtonElement>('.demo-application-dialog__close')!.click();
    await nextTick();
    expect(open.value).toBe(false);

    dialog = await reopen();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(open.value).toBe(false);

    await reopen();
    const footerButtons = [...host.querySelectorAll<HTMLButtonElement>('.cm-dialog__footer button')];
    footerButtons[footerButtons.length - 1]!.click();
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.body.style.overflow).toBe('');
    app.unmount();
  });

  it('keeps the recipe route-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreDialogRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('id="core-showcase-dialog"');
    expect(source).toContain('<CmDialog');
    expect(source).toContain('<CmButton autofocus');
  });
});
