import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import VfRadio from './VfRadio.vue';

it.each([false, 0, 'daily'])('keeps the historical %s option type in both emitted events', async (value) => {
  const events: [string, string | number | boolean][] = [];
  const wrapper = mount(VfRadio, {
    props: {
      value,
      label: 'Fallback',
      required: true,
      onChange: (selected: typeof value) => events.push(['change', selected]),
      'onUpdate:modelValue': (selected: typeof value) => events.push(['update', selected]),
    },
    attrs: { name: 'setting', id: 'option' },
    slots: { default: 'Option' },
  });
  const input = wrapper.get('input');
  expect(input.element.checked).toBe(false);
  expect(input.attributes()).toMatchObject({ name: 'setting', id: 'option', type: 'radio', value: String(value) });
  expect(input.element.required).toBe(true);
  expect(wrapper.classes()).toEqual(['cm-radio', 'cm-radio--md']);
  expect(wrapper.get('.cm-radio__content').text()).toBe('Option');

  await input.trigger('change');
  expect(events).toEqual([]);
  await input.setValue(true);
  expect(events).toEqual([
    ['update', value],
    ['change', value],
  ]);
  await wrapper.setProps({ modelValue: value, disabled: true });
  input.element.click();
  expect(events).toHaveLength(2);
});

it('derives checked state before stringifying the native radio value', async () => {
  const wrapper = mount(VfRadio, { props: { value: 1, modelValue: '1', label: 'Number' } });
  const input = wrapper.get('input').element;
  expect(input.value).toBe('1');
  expect(input.checked).toBe(false);
  expect(wrapper.get('.cm-radio__content').text()).toBe('Number');

  await wrapper.setProps({ modelValue: 1 });
  expect(input.checked).toBe(true);
});
