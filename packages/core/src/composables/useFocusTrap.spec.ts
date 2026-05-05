import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  it('loops focus inside the target container', async () => {
    mount(
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
  });
});
