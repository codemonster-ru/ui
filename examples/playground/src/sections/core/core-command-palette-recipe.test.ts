// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreCommandPaletteRecipe, {
  type CoreCommandPaletteRecipeItem,
} from './CoreCommandPaletteRecipe.vue';

const items: CoreCommandPaletteRecipeItem[] = [
  {
    title: 'Theme Provider',
    label: 'Theme Provider',
    section: 'Theming / Core',
    snippet: 'Handle system theme sync and manual theme switching.',
    type: 'Guide',
  },
  {
    title: 'VfDialog',
    label: 'VfDialog',
    section: 'Components / Overlay',
    snippet: 'Modal dialog with header, content, footer, and focus trap.',
    type: 'Component',
  },
];

describe('CoreCommandPaletteRecipe', () => {
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
    vi.restoreAllMocks();
  });

  function mountPalette(initialQuery = '') {
    const open = ref(false);
    const query = ref(initialQuery);
    const selected = ref<CoreCommandPaletteRecipeItem>();
    const app = createApp(
      defineComponent(
        () => () =>
          h('div', [
            h('button', { id: 'launcher', onClick: () => (open.value = true) }, 'Open search'),
            h(CoreCommandPaletteRecipe, {
              open: open.value,
              modelValue: query.value,
              items,
              'onUpdate:open': (next: boolean) => (open.value = next),
              'onUpdate:modelValue': (next: string) => (query.value = next),
              onSelect: (item: CoreCommandPaletteRecipeItem) => (selected.value = item),
            }),
          ]),
      ),
    );
    app.mount(host);
    return { app, open, query, selected };
  }

  it('filters rich rows, highlights matches, and exposes linked combobox semantics', async () => {
    const { app, query } = mountPalette();
    host.querySelector<HTMLButtonElement>('#launcher')!.click();
    await nextTick();
    await nextTick();

    const input = host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    expect(input).toBe(document.activeElement);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe('Start typing to search');

    input.value = 'theme';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(query.value).toBe('theme');
    expect(input.getAttribute('aria-controls')).toBe('core-command-palette-listbox');
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(host.querySelector('[role="option"]')?.textContent).toContain('Theme Provider');
    expect(host.querySelector('.core-command-palette-recipe__item-match')?.textContent?.toLowerCase()).toBe('theme');

    input.value = 'missing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe('Nothing found');
    app.unmount();
  });

  it('navigates results, selects with Enter, closes, and restores launcher focus', async () => {
    const { app, open, selected } = mountPalette('component');
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;
    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();

    const input = host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await nextTick();
    expect(input.getAttribute('aria-activedescendant')).toBe('core-command-palette-option-0');
    expect(host.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
    await nextTick();
    expect(selected.value?.title).toBe('VfDialog');
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(launcher);
    app.unmount();
  });

  it('dismisses with Escape and backdrop while preserving the frozen footer hints', async () => {
    const { app, open } = mountPalette('theme');
    const launcher = host.querySelector<HTMLButtonElement>('#launcher')!;

    launcher.focus();
    launcher.click();
    await nextTick();
    await nextTick();
    const dialog = host.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.getAttribute('aria-labelledby')).toBe('core-command-palette-title');
    expect(host.querySelector('[aria-label="Keyboard shortcuts"]')?.textContent).toContain('Navigate');
    expect(host.querySelector('[aria-label="Keyboard shortcuts"]')?.textContent).toContain('Select');
    expect(host.querySelector('[aria-label="Keyboard shortcuts"]')?.textContent).toContain('EscClose');

    dialog.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(launcher);

    launcher.click();
    await nextTick();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(launcher);
    app.unmount();
  });

  it('stays route-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreCommandPaletteRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('<CmDialog');
    expect(source).toContain('<CmInput');
  });
});
