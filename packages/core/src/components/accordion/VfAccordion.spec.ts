import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfAccordion from './VfAccordion.vue';

describe('VfAccordion', () => {
  it('toggles content and aria state from trigger interaction', async () => {
    const wrapper = mount(VfAccordion, {
      props: {
        title: 'Details',
      },
      slots: {
        default: 'Accordion body',
      },
    });

    const trigger = wrapper.get('button');

    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(wrapper.text()).not.toContain('Accordion body');
    expect(wrapper.find('.vf-icon').exists()).toBe(true);

    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('Accordion body');

    await trigger.trigger('keydown', { key: 'Enter' });
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });
});
