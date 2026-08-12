import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmButton from './CmButton.vue';

describe('CmButton', () => {
  it('renders the contract defaults', () => {
    const wrapper = mount(CmButton, {
      slots: { default: 'Save' },
    });

    expect(wrapper.html()).toBe(
      '<button class="cm-button cm-button--primary cm-button--md" type="button"><span class="cm-button__label">Save</span></button>',
    );
  });

  it('renders variants, sizes, types, and disabled state', () => {
    const wrapper = mount(CmButton, {
      props: {
        variant: 'danger',
        size: 'lg',
        type: 'submit',
        disabled: true,
      },
    });

    expect(wrapper.classes()).toEqual(['cm-button', 'cm-button--danger', 'cm-button--lg']);
    expect(wrapper.attributes()).toMatchObject({ type: 'submit', disabled: '' });
  });

  it('merges classes and forwards safe root attributes', () => {
    const wrapper = mount(CmButton, {
      attrs: {
        class: ['consumer-button', { featured: true }],
        id: 'save',
        'data-testid': 'save-button',
      },
    });

    expect(wrapper.classes()).toEqual([
      'cm-button',
      'cm-button--primary',
      'cm-button--md',
      'consumer-button',
      'featured',
    ]);
    expect(wrapper.attributes()).toMatchObject({ id: 'save', 'data-testid': 'save-button' });
  });
});
