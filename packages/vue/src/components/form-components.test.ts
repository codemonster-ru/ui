import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CmCheckbox from './checkbox/CmCheckbox.vue';
import CmRadio from './radio/CmRadio.vue';
import CmSwitch from './switch/CmSwitch.vue';
import CmTextarea from './textarea/CmTextarea.vue';

describe('Vue form controls', () => {
  it('forwards checkbox form attributes and emits its native checked state', async () => {
    const wrapper = mount(CmCheckbox, {
      attrs: { class: 'consumer', name: 'topics' },
      props: { label: 'Releases', modelValue: false, value: 'releases' },
    });

    expect(wrapper.classes()).toEqual(['cm-checkbox', 'cm-checkbox--md', 'consumer']);
    expect(wrapper.get('input').attributes()).toMatchObject({ name: 'topics', value: 'releases' });

    await wrapper.get('input').setValue(true);

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    expect(wrapper.emitted('change')).toHaveLength(1);
  });

  it('sets the native indeterminate property without inventing an ARIA state', () => {
    const wrapper = mount(CmCheckbox, { props: { indeterminate: true, label: 'All' } });
    const input = wrapper.get('input').element as HTMLInputElement;

    expect(input.indeterminate).toBe(true);
    expect(input.hasAttribute('aria-checked')).toBe(false);
  });

  it('maps a radio model to checked state and emits the selected value', async () => {
    const wrapper = mount(CmRadio, {
      attrs: { name: 'frequency' },
      props: { label: 'Daily', modelValue: 'weekly', value: 'daily' },
    });

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(false);
    await wrapper.get('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['daily']]);
  });

  it('emits the current native textarea value', async () => {
    const onInput = vi.fn();
    const onUpdate = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(CmTextarea, { modelValue: 'Before', onInput, 'onUpdate:modelValue': onUpdate }),
      }),
    );

    await wrapper.get('textarea').setValue('After');

    expect(onInput).toHaveBeenCalledOnce();
    expect((onInput.mock.calls[0]?.[0] as Event).type).toBe('input');
    expect(onUpdate).toHaveBeenCalledWith('After');
  });

  it('keeps switch role and aria state aligned with its boolean model', () => {
    const wrapper = mount(CmSwitch, { props: { label: 'Dark mode', modelValue: true } });

    expect(wrapper.get('input').attributes()).toMatchObject({
      role: 'switch',
      'aria-checked': 'true',
      checked: '',
    });
  });
});
