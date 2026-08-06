import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfGroupBox from './VfGroupBox.vue';

describe('VfGroupBox', () => {
  it('renders a title on the native fieldset border', () => {
    const wrapper = mount(VfGroupBox, {
      props: { title: 'Shipping address' },
      slots: { default: 'Group content' },
    });

    expect(wrapper.element.tagName).toBe('FIELDSET');
    expect(wrapper.classes()).toContain('vf-group-box--titled');
    expect(wrapper.get('legend').text()).toBe('Shipping address');
    expect(wrapper.text()).toContain('Group content');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('toggles uncontrolled content and exposes accessible state', async () => {
    const wrapper = mount(VfGroupBox, {
      props: { title: 'Details', collapsible: true },
      slots: { default: 'Group content' },
    });
    const trigger = wrapper.get('button');

    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('Group content');

    await trigger.trigger('click');

    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(wrapper.text()).not.toContain('Group content');
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]]);
    expect(wrapper.emitted('collapsedChange')).toEqual([[true]]);
  });

  it('supports controlled collapsed state without mutating rendered content', async () => {
    const wrapper = mount(VfGroupBox, {
      props: { title: 'Details', collapsible: true, collapsed: true },
      slots: { default: 'Group content' },
    });

    expect(wrapper.text()).not.toContain('Group content');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update:collapsed')).toEqual([[false]]);
    expect(wrapper.text()).not.toContain('Group content');

    await wrapper.setProps({ collapsed: false });
    expect(wrapper.text()).toContain('Group content');
  });

  it('does not toggle when disabled', async () => {
    const wrapper = mount(VfGroupBox, {
      props: { title: 'Details', collapsible: true, disabled: true },
      slots: { default: 'Group content' },
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Group content');
    expect(wrapper.emitted('update:collapsed')).toBeUndefined();
  });

  it('keeps content visible when collapse behavior is not enabled', () => {
    const wrapper = mount(VfGroupBox, {
      props: { title: 'Details', defaultCollapsed: true },
      slots: { default: 'Group content' },
    });

    expect(wrapper.text()).toContain('Group content');
  });
});
