import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfField from '@/components/field/VfField.vue';
import VfFormLayout from './VfFormLayout.vue';

describe('VfFormLayout', () => {
  it('renders stacked fields by default', () => {
    const wrapper = mount(VfFormLayout, {
      slots: { default: '<div>Field</div>' },
    });

    expect(wrapper.classes()).toContain('vf-form-layout--stacked');
    expect(wrapper.text()).toBe('Field');
  });

  it('exposes horizontal layout and label width to field rows', () => {
    const wrapper = mount(VfFormLayout, {
      props: { mode: 'horizontal', labelWidth: '12rem' },
      slots: { default: () => h(VfField, { label: 'Name' }) },
    });

    expect(wrapper.classes()).toContain('vf-form-layout--horizontal');
    expect(wrapper.attributes('style')).toContain('--vf-form-layout-label-width: 12rem');
  });
});
