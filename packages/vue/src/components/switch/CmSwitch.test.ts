import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmSwitch from './CmSwitch.vue';

describe('CmSwitch', () => {
  it('provides the current checked state to decorative thumb content', async () => {
    const wrapper = mount(CmSwitch, {
      props: { label: 'Dark mode', modelValue: false },
      slots: { thumb: ({ checked }: { checked: boolean }) => (checked ? 'on' : 'off') },
    });

    expect(wrapper.get('.cm-switch__thumb').text()).toBe('off');
    expect(wrapper.get('.cm-switch__control').attributes('aria-hidden')).toBe('true');

    await wrapper.setProps({ modelValue: true });

    expect(wrapper.get('.cm-switch__thumb').text()).toBe('on');
  });
});
