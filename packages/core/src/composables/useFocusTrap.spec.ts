/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useFocusScopeBranch, useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  it('loops focus inside the target container', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const target = ref<HTMLElement | null>(null);
          const enabled = ref(true);

          useFocusTrap(target, { enabled });

          return () =>
            h('div', { ref: target, tabindex: -1 }, [
              h('button', { 'data-test': 'first' }, 'First'),
              h('button', { 'data-test': 'second' }, 'Second'),
            ]);
        },
      }),
      {
        attachTo: document.body,
      },
    );

    await nextTick();

    const buttons = document.body.querySelectorAll<HTMLButtonElement>('button');
    buttons[1].focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(buttons[0]);

    wrapper.unmount();
  });

  it('keeps teleported branches inside the active focus scope', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const target = ref<HTMLElement | null>(null);
          const branch = ref<HTMLElement | null>(null);
          const enabled = ref(true);

          useFocusTrap(target, { enabled });
          useFocusScopeBranch(branch, enabled);

          return () =>
            h('div', [
              h('div', { ref: target, tabindex: -1 }, [h('button', { 'data-test': 'first' }, 'First')]),
              h('div', { ref: branch }, [h('button', { 'data-test': 'branch' }, 'Branch')]),
            ]);
        },
      }),
      { attachTo: document.body },
    );

    await nextTick();
    const first = wrapper.get('[data-test="first"]').element as HTMLButtonElement;
    const branch = wrapper.get('[data-test="branch"]').element as HTMLButtonElement;

    branch.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(branch);

    wrapper.unmount();
  });
});
