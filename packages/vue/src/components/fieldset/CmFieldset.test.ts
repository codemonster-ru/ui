import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CmFieldset from './CmFieldset.vue';

describe('CmFieldset', () => {
  it('renders a stable native fieldset and escaped fallback legend', () => {
    const wrapper = mount(CmFieldset, {
      props: { id: 'notifications', label: 'Notifications' },
      slots: { default: '<input name="email" type="checkbox">' },
    });

    expect(wrapper.element.tagName).toBe('FIELDSET');
    expect(wrapper.classes()).toEqual(['cm-fieldset']);
    expect(wrapper.attributes('id')).toBe('notifications');
    expect(wrapper.get('legend').text()).toBe('Notifications');
    expect(wrapper.find('[aria-describedby]').exists()).toBe(false);
    expect(wrapper.find('[aria-invalid]').exists()).toBe(false);
  });

  it('exposes deterministic invalid relationships to grouped controls', () => {
    const wrapper = mount(CmFieldset, {
      props: {
        id: 'contact-method',
        label: 'Contact method',
        description: 'Choose a method',
        error: 'Choose at least one method',
      },
      slots: {
        default: ({ describedBy, invalid }) =>
          h('input', {
            name: 'contact_method',
            'aria-describedby': describedBy,
            'aria-invalid': String(invalid),
          }),
      },
    });

    const describedBy = 'contact-method-description contact-method-error';
    expect(wrapper.classes()).toContain('cm-fieldset--invalid');
    expect(wrapper.attributes('aria-describedby')).toBe(describedBy);
    expect(wrapper.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(describedBy);
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('prefers trusted named content and protects owned root attributes', () => {
    const wrapper = mount(CmFieldset, {
      attrs: {
        id: 'consumer-id',
        class: ['consumer', 'cm-fieldset'],
        'aria-describedby': 'consumer-description',
        'aria-invalid': 'false',
        'data-test': 'fieldset',
      },
      props: { id: 'project-scope', label: 'Fallback', invalid: true },
      slots: {
        default: '<input name="project">',
        legend: '<strong>Project scope</strong>',
        description: '<span>Trusted description</span>',
      },
    });

    expect(wrapper.attributes('id')).toBe('project-scope');
    expect(wrapper.attributes('class')).toBe('cm-fieldset cm-fieldset--invalid consumer');
    expect(wrapper.attributes('aria-describedby')).toBe('project-scope-description');
    expect(wrapper.attributes('aria-invalid')).toBe('true');
    expect(wrapper.attributes('data-test')).toBe('fieldset');
    expect(wrapper.get('legend').html()).toContain('<strong>Project scope</strong>');
    expect(wrapper.get('.cm-fieldset__description').text()).toBe('Trusted description');
  });

  it.each([
    { id: '', label: 'Preferences' },
    { id: 'preferences', label: '  ' },
  ])('diagnoses blank stable identity %#', (props) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(CmFieldset, { props, slots: { default: '<input>' } });

    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
