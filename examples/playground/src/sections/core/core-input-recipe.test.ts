// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreInputRecipe, { type CoreInputSize } from './CoreInputRecipe.vue';

describe('CoreInputRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  function mountInput(props: Record<string, unknown> = {}, slots: Record<string, () => ReturnType<typeof h>> = {}) {
    const value = ref(String(props.modelValue ?? ''));
    const onAction = vi.fn();
    const app = createApp(
      defineComponent(
        () => () =>
          h(
            CoreInputRecipe,
            {
              ...props,
              modelValue: value.value,
              onAction,
              'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
            },
            slots,
          ),
      ),
    );
    app.mount(host);

    return { app, onAction, value };
  }

  it.each(['sm', 'md', 'lg'] as const)('renders exact %s geometry and forwards native states', (size) => {
    const { app } = mountInput({
      'aria-describedby': 'input-help',
      disabled: size === 'sm',
      invalid: size === 'md',
      modelValue: `${size} value`,
      readonly: size === 'lg',
      required: true,
      size: size satisfies CoreInputSize,
    });

    const root = host.querySelector('.demo-application-input')!;
    const input = host.querySelector<HTMLInputElement>('input')!;
    expect(root.classList).toContain(`demo-application-input--${size}`);
    expect(input.classList).toContain(`cm-input--${size}`);
    expect(input.value).toBe(`${size} value`);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe('input-help');
    expect(input.disabled).toBe(size === 'sm');
    expect(input.getAttribute('aria-invalid')).toBe(size === 'md' ? 'true' : null);
    expect(input.readOnly).toBe(size === 'lg');
    app.unmount();
  });

  it('owns leading/trailing icons, clear and custom action geometry', async () => {
    const { app, onAction, value } = mountInput(
      {
        actionLabel: 'Open filters',
        clearable: true,
        leadingIcon: 'magnifyingGlass',
        modelValue: 'Search query',
        passwordReveal: true,
        trailingIcon: 'filter',
        type: 'password',
      },
      { action: () => h('svg', { 'data-test': 'custom-action', viewBox: '0 0 24 24' }) },
    );

    const root = host.querySelector('.demo-application-input')!;
    expect(root.classList).toContain('demo-application-input--leading');
    expect(root.classList).toContain('demo-application-input--trailing');
    expect(root.classList).toContain('demo-application-input--actions-3');
    expect(host.querySelectorAll('.demo-application-input__icon svg')).toHaveLength(2);
    expect(host.querySelector('[data-test="custom-action"]')).not.toBeNull();

    host.querySelector<HTMLButtonElement>('[aria-label="Open filters"]')!.click();
    expect(onAction).toHaveBeenCalledOnce();

    const input = host.querySelector<HTMLInputElement>('input')!;
    host.querySelector<HTMLButtonElement>('[aria-label="Clear input"]')!.click();
    await nextTick();
    expect(value.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(host.querySelector('[aria-label="Clear input"]')).toBeNull();
    app.unmount();
  });

  it('toggles password with exact eye icons while retaining selection and focus', async () => {
    const { app } = mountInput({ clearable: true, modelValue: 'secret-value', passwordReveal: true, type: 'password' });
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.focus();
    input.setSelectionRange(2, 7);

    const toggle = host.querySelector<HTMLButtonElement>('[aria-label="Show password"]')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('.demo-application-input')!.classList).toContain('demo-application-input--actions-2');
    toggle.click();
    await nextTick();

    expect(input.type).toBe('text');
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(7);
    expect(host.querySelector('[aria-label="Hide password"]')?.getAttribute('aria-pressed')).toBe('true');
    app.unmount();
  });

  it('supports floating field composition without depending on legacy field context', () => {
    const { app } = mountInput({ floating: true, id: 'floating-search', modelValue: 'Filled', placeholder: 'Search' });
    const root = host.querySelector('.demo-application-input')!;
    expect(root.classList).toContain('demo-application-input--floating');
    expect(root.getAttribute('data-cm-filled')).toBe('true');
    expect(host.querySelector('input')?.id).toBe('floating-search');
    app.unmount();
  });

  it('keeps the standalone recipe CM-only and covers the frozen action matrix', () => {
    const source = readFileSync(resolve(__dirname, 'CoreInputRecipe.vue'), 'utf8');
    expect(source).not.toMatch(/--vf-|vueforge-core|VfInput/u);
    expect(source).toContain('@codemonster-ru/ui-css/input.css');
    expect(source).toContain('demo-application-input--actions-3');
    expect(source).toContain("passwordVisible ? 'eyeSlash' : 'eye'");
    expect(source).toContain('<slot name="action" />');
  });
});
