// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Tests mount isolated controlled and provider hosts. */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreSelectRecipe, { coreSelectRecipeFieldContextKey, type CoreSelectRecipeOption } from './CoreSelectRecipe.vue';

const options: CoreSelectRecipeOption[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'disabled', label: 'Unavailable', disabled: true },
  { value: 'team', label: 'Team' },
];

describe('CoreSelectRecipe', () => {
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
    document.querySelectorAll('.core-select-recipe__menu').forEach((menu) => menu.remove());
    host.remove();
    vi.unstubAllGlobals();
  });

  it('renders frozen sizes, states, adornments, hidden form value, and clear action', async () => {
    const updates: string[] = [];
    const app = createApp(CoreSelectRecipe, {
      id: 'plan',
      // eslint-disable-next-line vue/component-definition-name-casing -- Forwarded native form name.
      name: 'plan',
      options,
      modelValue: 'pro',
      size: 'lg',
      invalid: true,
      leadingIcon: 'layers',
      trailingIcon: 'filter',
      clearable: true,
      placeholder: 'Plan',
      'onUpdate:modelValue': (value: string) => updates.push(value),
    });
    app.mount(host);
    await nextTick();

    const trigger = host.querySelector<HTMLButtonElement>('#plan')!;
    expect(trigger.textContent).toContain('Pro');
    expect(trigger.classList).toContain('core-select-recipe--lg');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelectorAll('.core-select-recipe__icon')).toHaveLength(2);
    expect(host.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('pro');
    host.querySelector<HTMLButtonElement>('[aria-label="Clear select"]')?.click();
    expect(updates).toEqual(['']);
    expect(document.activeElement).toBe(trigger);
    app.unmount();
  });

  it('opens a labelled listbox, skips disabled options, selects by keyboard, and restores focus', async () => {
    const updates: string[] = [];
    const app = createApp(CoreSelectRecipe, {
      id: 'keyboard-plan',
      options,
      modelValue: 'pro',
      placeholder: 'Plan',
      'onUpdate:modelValue': (value: string) => updates.push(value),
    });
    app.mount(host);
    await nextTick();
    const trigger = host.querySelector<HTMLButtonElement>('#keyboard-plan')!;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await nextTick();
    await Promise.resolve();

    const listbox = document.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(listbox.getAttribute('aria-labelledby')).toBe('keyboard-plan');
    expect(document.activeElement?.textContent).toBe('Pro');
    expect(listbox.querySelector<HTMLButtonElement>('button:disabled')?.textContent).toBe('Unavailable');

    listbox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    expect(document.activeElement?.textContent).toBe('Team');
    listbox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
    await nextTick();
    expect(updates).toEqual(['team']);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    app.unmount();
  });

  it('closes on Escape and outside click without stealing focus on outside dismissal', async () => {
    const app = createApp(CoreSelectRecipe, { options, modelValue: '', placeholder: 'Choose a plan' });
    app.mount(host);
    await nextTick();
    const trigger = host.querySelector<HTMLButtonElement>('.core-select-recipe')!;
    trigger.click();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await nextTick();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    outside.click();
    await nextTick();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(outside);
    outside.remove();
    app.unmount();
  });

  it('publishes floating support and filled/open state through the route-owned field context', async () => {
    const supported: boolean[] = [];
    const filled: boolean[] = [];
    const app = createApp(
      defineComponent({
        setup() {
          provide(coreSelectRecipeFieldContextKey, {
            labelPlacement: ref<'top' | 'floating'>('floating'),
            floatingVariant: ref<'in' | 'on' | 'over'>('over'),
            setFilled: (value) => filled.push(value),
            setFloatingSupported: (value) => supported.push(value),
          });
          return () => h(CoreSelectRecipe, { options, modelValue: '', placeholder: 'Plan', leadingIcon: 'layers' });
        },
      }),
    );
    app.mount(host);
    await nextTick();
    const wrapper = host.querySelector<HTMLElement>('.core-select-recipe-wrap')!;
    expect(wrapper.classList).toContain('core-select-recipe-wrap--floating-over');
    expect(wrapper.getAttribute('data-core-select-floating-supported')).toBe('true');
    expect(host.querySelector('.core-select-recipe__value')?.textContent).toBe('');
    host.querySelector<HTMLButtonElement>('.core-select-recipe')?.click();
    await nextTick();
    expect(filled[filled.length - 1]).toBe(true);
    app.unmount();
    expect(supported).toEqual([true, false]);
    expect(filled[filled.length - 1]).toBe(false);
  });

  it('stays application-owned and CM-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreSelectRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('@codemonster-ru/vueforge-core');
    expect(source).toContain('coreSelectRecipeFieldContextKey');
    expect(source).toContain('--cm-');
  });

  it('keeps eight non-floating selects and owns the floating select boundary', () => {
    const showcase = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreShowcase.vue'), 'utf8');
    expect(showcase.match(/<CoreSelectRecipe\b/gu)).toHaveLength(12);
    expect(showcase).not.toContain('<VfSelect');
    expect(showcase.match(/<CoreFloatingFieldRecipe\b/gu)).toHaveLength(12);
  });
});
