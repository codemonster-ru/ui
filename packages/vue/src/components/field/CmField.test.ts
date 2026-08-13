import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, expect, it } from 'vitest';

import CmField from './CmField.vue';

describe('CmField', () => {
  it('associates fallback label content with its control', () => {
    const wrapper = mount(CmField, {
      props: { controlId: 'email', label: 'Email' },
      slots: { default: '<input id="email">' },
    });

    expect(wrapper.classes()).toEqual(['cm-field']);
    expect(wrapper.get('label').attributes('for')).toBe('email');
    expect(wrapper.get('.cm-field__control input').attributes('id')).toBe('email');
    expect(wrapper.find('.cm-field__description').exists()).toBe(false);
  });

  it('exposes deterministic validation relationships to its scoped slot', () => {
    const wrapper = mount(CmField, {
      props: {
        controlId: 'name',
        label: 'Name',
        description: 'Public',
        error: 'Required',
        required: true,
      },
      slots: {
        default: ({ controlId, describedBy, invalid, required }) =>
          h('input', {
            id: controlId,
            'aria-describedby': describedBy,
            'aria-invalid': String(invalid),
            required,
          }),
      },
    });

    expect(wrapper.classes()).toContain('cm-field--invalid');
    expect(wrapper.get('.cm-field__required').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('name-description name-error');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('prefers named content and merges safe root attributes', () => {
    const wrapper = mount(CmField, {
      attrs: { class: ['consumer', 'cm-field'], 'data-test': 'field' },
      props: { controlId: 'project', label: 'Fallback', error: 'Fallback error' },
      slots: {
        default: '<input id="project">',
        label: '<strong>Project</strong>',
        error: '<span>Choose a project</span>',
      },
    });

    expect(wrapper.attributes('class')).toBe('cm-field cm-field--invalid consumer');
    expect(wrapper.attributes('data-test')).toBe('field');
    expect(wrapper.get('label').text()).toBe('Project');
    expect(wrapper.get('.cm-field__error').text()).toBe('Choose a project');
  });
});
