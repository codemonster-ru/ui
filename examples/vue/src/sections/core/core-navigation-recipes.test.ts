// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Each test mounts an isolated recipe app. */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreMenuBarRecipe from './CoreMenuBarRecipe.vue';
import CoreNavMenuRecipe from './CoreNavMenuRecipe.vue';
import type { CoreNavigationRecipeItem } from './core-navigation-recipes.types';

const items: CoreNavigationRecipeItem[] = [
  {
    value: 'docs',
    label: 'Docs',
    leadingIcon: 'folderOpen',
    children: [
      { value: 'start', label: 'Getting Started' },
      {
        value: 'guides',
        label: 'Guides',
        children: [
          { value: 'theme', label: 'Theming' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ],
      },
    ],
  },
  { value: 'pricing', label: 'Pricing' },
  { value: 'external', label: 'Storybook', href: 'https://storybook.js.org', target: '_blank' },
];

describe('Core navigation recipes', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  it('renders recursive controlled nav state, links, icons, wrapping, and compact geometry', async () => {
    let value = 'theme';
    const app = createApp(CoreNavMenuRecipe, {
      items,
      modelValue: value,
      variant: 'sidebar',
      compact: true,
      wrapLabels: true,
      ariaLabel: 'Documentation',
      'onUpdate:modelValue': (next: string) => (value = next),
    });
    app.mount(host);
    await nextTick();

    const nav = host.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Documentation');
    expect(nav.classList).toContain('core-nav-recipe--sidebar-compact');
    expect(nav.classList).toContain('core-nav-recipe--wrap-labels');
    expect(host.querySelectorAll('[aria-expanded="true"]')).toHaveLength(2);
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Theming');
    expect(host.querySelector('.core-nav-recipe__leading-icon')).not.toBeNull();

    const external = host.querySelector<HTMLAnchorElement>('a[href="https://storybook.js.org"]')!;
    expect(external.rel).toBe('noopener noreferrer');
    expect(external.target).toBe('_blank');
    external.click();
    await nextTick();
    expect(value).toBe('external');
    app.unmount();
  });

  it('supports native vertical keyboard navigation and disabled items', async () => {
    const app = createApp(CoreNavMenuRecipe, { items, modelValue: 'theme', variant: 'pills' });
    app.mount(host);
    await nextTick();
    const controls = [...host.querySelectorAll<HTMLElement>('.core-nav-recipe__item')];
    controls.forEach((control) => Object.defineProperty(control, 'offsetParent', { configurable: true, value: host }));
    const docs = controls.find((control) => control.textContent?.includes('Docs'))!;
    const start = controls.find((control) => control.textContent?.includes('Getting Started'))!;
    docs.focus();
    docs.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    expect(document.activeElement).toBe(start);
    expect(host.querySelector<HTMLButtonElement>('button:disabled')?.textContent).toContain('Disabled');
    app.unmount();
  });

  it('provides roving menubar navigation, nested open/close, selection, and focus restore', async () => {
    let value = 'pricing';
    const app = createApp(CoreMenuBarRecipe, {
      items,
      modelValue: value,
      variant: 'pills',
      'onUpdate:modelValue': (next: string) => (value = next),
    });
    app.mount(host);
    await nextTick();

    const menubar = host.querySelector('[role="menubar"]')!;
    const docs = host.querySelector<HTMLElement>('[data-core-menu-value="docs"]')!;
    expect(menubar).not.toBeNull();
    expect(docs.tabIndex).toBe(0);
    docs.focus();
    docs.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await nextTick();
    const start = host.querySelector<HTMLElement>('[data-core-menu-value="start"]')!;
    expect(docs.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(start);

    start.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await nextTick();
    const guides = host.querySelector<HTMLElement>('[data-core-menu-value="guides"]')!;
    expect(document.activeElement).toBe(guides);
    guides.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }));
    await nextTick();
    const theme = host.querySelector<HTMLButtonElement>('[data-core-menu-value="theme"]')!;
    expect(document.activeElement).toBe(theme);
    expect(host.querySelector<HTMLButtonElement>('[data-core-menu-value="disabled"]')?.tabIndex).toBe(-1);
    theme.click();
    await nextTick();
    expect(value).toBe('theme');
    expect(host.querySelector('.core-menu-bar-recipe__submenu')).toBeNull();

    docs.click();
    await nextTick();
    docs.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(host.querySelector('.core-menu-bar-recipe__submenu')).toBeNull();
    expect(document.activeElement).toBe(docs);

    docs.click();
    await nextTick();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(host.querySelector('.core-menu-bar-recipe__submenu')).toBeNull();
    app.unmount();
  });

  it('mirrors horizontal menubar keys in RTL and preserves external/disabled semantics', async () => {
    const app = createApp(CoreMenuBarRecipe, { items, modelValue: 'pricing' });
    app.mount(host);
    await nextTick();
    const nav = host.querySelector<HTMLElement>('nav')!;
    nav.style.direction = 'rtl';
    const docs = host.querySelector<HTMLElement>('[data-core-menu-value="docs"]')!;
    docs.focus();
    docs.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowLeft' }));
    await nextTick();
    expect(document.activeElement?.getAttribute('data-core-menu-value')).toBe('external');
    const external = host.querySelector<HTMLAnchorElement>('[data-core-menu-value="external"]')!;
    expect(external.rel).toBe('noopener noreferrer');
    app.unmount();
  });

  it('keeps the recipes application-owned and CM-only', () => {
    const files = [
      'CoreNavMenuRecipe.vue',
      'CoreNavMenuRecipeNode.vue',
      'CoreMenuBarRecipe.vue',
      'CoreMenuBarRecipeNode.vue',
      'core-navigation-recipes.css',
    ];
    const source = files
      .map((file) => readFileSync(resolve(process.cwd(), 'src/sections/core', file), 'utf8'))
      .join('\n');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('@codemonster-ru/vueforge-core');
    expect(source).toContain('--cm-');
  });
});
