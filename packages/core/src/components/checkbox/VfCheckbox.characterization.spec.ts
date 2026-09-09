// Characterization of the historical VfCheckbox at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// Written before VfRadio and VfSwitch were looked at, and deliberately not
// shared with them: the three components look alike and are not alike. What
// this one does that neither of the others does is carry an explicit
// aria-checked on a native checkbox, and drive `indeterminate` - which is a DOM
// property, not an attribute, so it exists only after the component has
// touched the element.
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import VfCheckbox from './VfCheckbox.vue';

type CheckboxProps = InstanceType<typeof VfCheckbox>['$props'];

function mountCheckbox({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<CheckboxProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, string>;
} = {}) {
  return mount(VfCheckbox, { attachTo: document.body, props: props as CheckboxProps, attrs, slots });
}

describe('VfCheckbox characterization: structure', () => {
  it('renders a label as its root, not a wrapper div', () => {
    expect(mountCheckbox().element.tagName).toBe('LABEL');
  });

  it('renders a native checkbox input inside the label', () => {
    const input = mountCheckbox().get('input');

    expect(input.attributes('type')).toBe('checkbox');
    expect(input.classes()).toEqual(['vf-checkbox__input']);
  });

  it('renders an aria-hidden control with a mark', () => {
    const control = mountCheckbox().get('.vf-checkbox__control');

    expect(control.attributes('aria-hidden')).toBe('true');
    expect(control.find('.vf-checkbox__mark').exists()).toBe(true);
    expect(control.find('.vf-checkbox__indeterminate-mark').exists()).toBe(false);
  });

  it('renders no content element without a label or slot', () => {
    expect(mountCheckbox().find('.vf-checkbox__content').exists()).toBe(false);
  });

  it('renders the label prop as content', () => {
    expect(
      mountCheckbox({ props: { label: 'Ship it' } })
        .get('.vf-checkbox__content')
        .text(),
    ).toBe('Ship it');
  });

  it('prefers default slot content over the label prop', () => {
    const wrapper = mountCheckbox({ props: { label: 'From prop' }, slots: { default: 'From slot' } });

    expect(wrapper.get('.vf-checkbox__content').text()).toBe('From slot');
  });
});

describe('VfCheckbox characterization: classes', () => {
  it('always emits a size modifier, including at the default size', () => {
    // Unlike VfInput, VfButton and VfTextarea, where md emits nothing. Asserted
    // as-is: two conventions coexist in this library.
    expect(mountCheckbox().classes()).toEqual(['vf-checkbox', 'vf-checkbox--md']);
    expect(mountCheckbox({ props: { size: 'lg' } }).classes()).toContain('vf-checkbox--lg');
  });

  it('emits state modifiers in a fixed order', () => {
    const classes = mountCheckbox({
      props: { modelValue: true, indeterminate: true, invalid: true, disabled: true, size: 'sm' },
    }).classes();

    expect(classes).toEqual([
      'vf-checkbox',
      'vf-checkbox--sm',
      'vf-checkbox--checked',
      'vf-checkbox--indeterminate',
      'vf-checkbox--invalid',
      'vf-checkbox--disabled',
    ]);
  });

  it('puts a consumer class on the root label rather than the input', () => {
    const wrapper = mountCheckbox({ attrs: { class: 'consumer-checkbox' } });

    expect(wrapper.classes()).toContain('consumer-checkbox');
    expect(wrapper.get('input').classes()).toEqual(['vf-checkbox__input']);
  });

  it('puts a consumer style on the root label rather than the input', () => {
    const wrapper = mountCheckbox({ attrs: { style: 'margin: 4px' } });

    expect(wrapper.attributes('style')).toBe('margin: 4px;');
    expect(wrapper.get('input').attributes('style')).toBeUndefined();
  });
});

describe('VfCheckbox characterization: checked and aria', () => {
  it('reflects the model onto the native checked state', () => {
    expect((mountCheckbox({ props: { modelValue: true } }).get('input').element as HTMLInputElement).checked).toBe(
      true,
    );
    expect((mountCheckbox().get('input').element as HTMLInputElement).checked).toBe(false);
  });

  it('carries an explicit aria-checked, which a native checkbox does not need', () => {
    // A quirk worth knowing: the element already exposes its checked state, so
    // this is redundant - but it is the contract, and it is where `mixed` lives.
    expect(mountCheckbox().get('input').attributes('aria-checked')).toBe('false');
    expect(
      mountCheckbox({ props: { modelValue: true } })
        .get('input')
        .attributes('aria-checked'),
    ).toBe('true');
  });

  it('reports mixed through aria-checked when indeterminate, whatever the model says', () => {
    expect(
      mountCheckbox({ props: { indeterminate: true, modelValue: true } })
        .get('input')
        .attributes('aria-checked'),
    ).toBe('mixed');
  });

  it('exposes aria-invalid only when invalid', () => {
    expect(
      mountCheckbox({ props: { invalid: true } })
        .get('input')
        .attributes('aria-invalid'),
    ).toBe('true');
    expect(mountCheckbox().get('input').attributes('aria-invalid')).toBeUndefined();
  });

  it('disables the input from its own prop', () => {
    expect(
      mountCheckbox({ props: { disabled: true } })
        .get('input')
        .attributes('disabled'),
    ).toBeDefined();
  });
});

describe('VfCheckbox characterization: indeterminate is a property, not an attribute', () => {
  it('sets the DOM property on mount rather than rendering an attribute', () => {
    const input = mountCheckbox({ props: { indeterminate: true } }).get('input');

    expect((input.element as HTMLInputElement).indeterminate).toBe(true);
    expect(input.attributes('indeterminate')).toBeUndefined();
  });

  it('follows a change of the prop', async () => {
    const wrapper = mountCheckbox({ props: { indeterminate: true } });
    await wrapper.setProps({ indeterminate: false });
    await nextTick();

    expect((wrapper.get('input').element as HTMLInputElement).indeterminate).toBe(false);
  });

  it('swaps the visible mark for the indeterminate one', () => {
    const wrapper = mountCheckbox({ props: { indeterminate: true } });

    expect(wrapper.find('.vf-checkbox__indeterminate-mark').exists()).toBe(true);
    expect(wrapper.find('.vf-checkbox__mark').exists()).toBe(false);
  });
});

describe('VfCheckbox characterization: attribute forwarding', () => {
  it('forwards everything except class and style onto the input', () => {
    const input = mountCheckbox({
      attrs: { id: 'ship', name: 'ship', value: 'yes', required: true, 'data-testid': 'ship' },
    }).get('input');

    expect(input.attributes('id')).toBe('ship');
    expect(input.attributes('name')).toBe('ship');
    expect(input.attributes('value')).toBe('yes');
    expect(input.attributes('required')).toBeDefined();
    expect(input.attributes('data-testid')).toBe('ship');
  });

  it('lets a consumer attribute override the component own binding', () => {
    // v-bind="inputAttrs" is written after :checked/:disabled/:aria-*, so the
    // consumer wins - the same precedence VfTextarea has.
    expect(
      mountCheckbox({ props: { invalid: true }, attrs: { 'aria-invalid': 'false' } })
        .get('input')
        .attributes('aria-invalid'),
    ).toBe('false');
  });
});

describe('VfCheckbox characterization: events', () => {
  it('emits both update:modelValue and change with the new boolean', async () => {
    const wrapper = mountCheckbox();
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = true;
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    expect(wrapper.emitted('change')).toEqual([[true]]);
  });

  it('emits false when unchecked', async () => {
    const wrapper = mountCheckbox({ props: { modelValue: true } });
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = false;
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('takes no part in field context, because it never asks for one', () => {
    // None of the three checkable controls integrates with VfField.
    expect(mountCheckbox().html()).not.toContain('vf-field');
  });
});
