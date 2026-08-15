// @vitest-environment jsdom

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LayoutsPasswordInput from './LayoutsPasswordInput.vue';

describe('LayoutsPasswordInput', () => {
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

  it('toggles the exact password icons and restores focus and selection', async () => {
    const app = createApp(LayoutsPasswordInput, { modelValue: 'secret' });
    app.mount(host);

    const input = host.querySelector<HTMLInputElement>('input');
    const toggle = host.querySelector<HTMLButtonElement>('button');
    expect(input?.type).toBe('password');
    expect(toggle?.ariaLabel).toBe('Show password');
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    const hiddenPasswordIcon = toggle?.innerHTML;

    input?.focus();
    input?.setSelectionRange(1, 4, 'forward');
    toggle?.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    toggle?.click();
    await nextTick();
    await nextTick();

    expect(input?.type).toBe('text');
    expect(toggle?.ariaLabel).toBe('Hide password');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(toggle?.innerHTML).not.toBe(hiddenPasswordIcon);
    expect(document.activeElement).toBe(input);
    expect([input?.selectionStart, input?.selectionEnd, input?.selectionDirection]).toEqual([1, 4, 'forward']);

    toggle?.click();
    await nextTick();
    expect(input?.type).toBe('password');
    expect(toggle?.ariaLabel).toBe('Show password');
    app.unmount();
  });

  it('forwards native input semantics and updates the controlled value', async () => {
    const value = ref('before');
    const app = createApp(
      defineComponent(
        () => () =>
          h(LayoutsPasswordInput, {
            id: 'database-password',
            modelValue: value.value,
            invalid: true,
            disabled: true,
            readonly: true,
            'aria-describedby': 'database-password-hint',
            'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
          }),
      ),
    );
    app.mount(host);
    await nextTick();

    const input = host.querySelector<HTMLInputElement>('input');
    expect(input?.id).toBe('database-password');
    expect(input?.disabled).toBe(true);
    expect(input?.readOnly).toBe(true);
    expect(input?.getAttribute('aria-describedby')).toBe('database-password-hint');
    expect(input?.getAttribute('aria-invalid')).toBe('true');

    if (input) {
      input.disabled = false;
      input.readOnly = false;
      input.value = 'after';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await nextTick();
    expect(value.value).toBe('after');
    app.unmount();
  });
});
