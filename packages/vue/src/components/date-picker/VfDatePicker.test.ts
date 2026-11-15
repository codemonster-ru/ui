import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import VfDatePicker from './VfDatePicker.vue';

it('uses the active Intl locale, starts on Monday, and forwards a day selection as ISO', async () => {
  const form = document.createElement('form');
  document.body.append(form);
  const modelValue = ref('2026-08-13');
  const updateModel = (value: string | string[]): void => {
    if (typeof value === 'string') modelValue.value = value;
  };
  const harness = defineComponent({
    setup: () => () =>
      h(VfDatePicker, {
        modelValue: modelValue.value,
        name: 'launch_date',
        'aria-label': 'Launch date',
        'onUpdate:modelValue': updateModel,
      }),
  });
  const wrapper = mount(harness, { attachTo: form });
  try {
    const trigger = wrapper.get<HTMLButtonElement>('[role="combobox"]');
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const expected = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(2026, 7, 13));
    expect(trigger.text()).toBe(expected);
    expect(trigger.attributes('data-cm-locale')).toBe(locale);
    const calendar = document.getElementById(trigger.attributes('aria-controls') ?? '');
    expect(calendar).not.toBeNull();
    expect(calendar?.querySelector('[role="columnheader"]')?.textContent).toBe(
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 7, 10)),
    );

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(calendar?.parentElement).toBe(document.body);
    calendar?.querySelector<HTMLButtonElement>('[data-cm-date-picker-value="2026-08-14"]')?.click();
    await nextTick();
    expect(modelValue.value).toBe('2026-08-14');
    expect(new FormData(form).get('launch_date')).toBe('2026-08-14');
  } finally {
    wrapper.unmount();
    form.remove();
  }
});

it('preserves requested formatting, inline rendering and chronological ISO range updates', async () => {
  const wrapper = mount(VfDatePicker, {
    props: {
      id: 'test-range',
      modelValue: ['2026-08-13'],
      range: true,
      displayFormat: 'dd.MM.yyyy',
      firstDayOfWeek: 0,
      locale: ['en-GB'],
      teleportTo: false,
    },
  });
  const trigger = wrapper.get('[role="combobox"]');
  expect(trigger.attributes('id')).toBe('test-range');
  expect(trigger.text()).toBe('13.08.2026');
  expect(wrapper.get('[role="columnheader"]').text()).toBe('Sun');

  await trigger.trigger('click');
  expect(wrapper.get('[role="dialog"]').element.parentElement).toBe(wrapper.element);
  await wrapper.get('[data-cm-date-picker-value="2026-08-10"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-10', '2026-08-13']]]);
  wrapper.unmount();
});

it('keeps the displayed and submitted date until the host accepts a selection', async () => {
  const form = document.createElement('form');
  document.body.append(form);
  const wrapper = mount(VfDatePicker, {
    attachTo: form,
    attrs: { name: 'date' },
    props: { modelValue: '2026-08-13', displayFormat: 'yyyy-MM-dd', teleportTo: false },
  });
  try {
    const trigger = wrapper.get('[role="combobox"]');
    await trigger.trigger('click');
    await wrapper.get('[data-cm-date-picker-value="2026-08-14"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-14']]);
    expect(trigger.text()).toBe('2026-08-13');
    expect(new FormData(form).get('date')).toBe('2026-08-13');
    await wrapper.setProps({ modelValue: '2026-08-14' });
    expect(trigger.text()).toBe('2026-08-14');
    expect(new FormData(form).get('date')).toBe('2026-08-14');
  } finally {
    wrapper.unmount();
    form.remove();
  }
});
