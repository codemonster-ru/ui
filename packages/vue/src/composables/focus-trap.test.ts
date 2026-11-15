import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { useFocusTrap } from './focus-trap';

function pressTab(shiftKey = false, target: EventTarget = document): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function createHarness(empty = false) {
  const outerEnabled = ref(true);
  const innerEnabled = ref(false);
  const showInner = ref(true);
  return {
    outerEnabled,
    innerEnabled,
    showInner,
    component: defineComponent({
      setup() {
        const outer = ref<HTMLElement | null>(null);
        const inner = ref<HTMLElement | null>(null);
        useFocusTrap(outer, { enabled: outerEnabled });
        useFocusTrap(inner, { enabled: () => innerEnabled.value });
        return () =>
          h('div', [
            h('button', { id: 'opener' }, 'Open'),
            h(
              'section',
              { id: 'outer', ref: outer, tabindex: -1 },
              empty
                ? []
                : [
                    h('button', { id: 'first' }, 'First'),
                    h('div', { hidden: true }, [h('button', 'Hidden ancestor')]),
                    h('button', { disabled: true }, 'Disabled'),
                    h('button', { tabindex: -1 }, 'Outside tab order'),
                    h('button', { id: 'last' }, 'Last'),
                  ],
            ),
            showInner.value
              ? h('section', { ref: inner, tabindex: -1 }, [h('button', { id: 'inner' }, 'Inner')])
              : null,
          ]);
      },
    }),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('useFocusTrap', () => {
  it('wraps both boundaries and returns Tab from outside without moving focus on activation', () => {
    const harness = createHarness();
    const wrapper = mount(harness.component, { attachTo: document.body });
    try {
      const first = wrapper.get<HTMLButtonElement>('#first').element;
      const last = wrapper.get<HTMLButtonElement>('#last').element;
      const opener = wrapper.get<HTMLButtonElement>('#opener').element;
      opener.focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);
      expect(pressTab().defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
      expect(pressTab().defaultPrevented).toBe(false);

      harness.outerEnabled.value = false;
      opener.focus();
      harness.outerEnabled.value = true;
      expect(document.activeElement).toBe(opener);
    } finally {
      wrapper.unmount();
    }
  });

  it('uses the latest active trap and resumes the previous one when the later content disappears', async () => {
    const harness = createHarness();
    const wrapper = mount(harness.component, { attachTo: document.body });
    try {
      harness.innerEnabled.value = true;
      wrapper.get<HTMLButtonElement>('#last').element.focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(wrapper.get('#inner').element);

      harness.showInner.value = false;
      await nextTick();
      wrapper.get<HTMLButtonElement>('#last').element.focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(wrapper.get('#first').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('falls back to the authored target and releases the document listener on disable and unmount', () => {
    const removed = vi.spyOn(document, 'removeEventListener');
    const { component, outerEnabled } = createHarness(true);
    const wrapper = mount(component, { attachTo: document.body });
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(wrapper.get('#outer').element);
    outerEnabled.value = false;
    expect(pressTab().defaultPrevented).toBe(false);
    expect(removed.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    outerEnabled.value = true;
    wrapper.unmount();
    expect(pressTab().defaultPrevented).toBe(false);
    expect(removed.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(2);
  });
});
