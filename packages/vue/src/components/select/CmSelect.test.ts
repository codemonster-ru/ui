import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { expect, it } from 'vitest';

import CmSelect from './CmSelect.vue';

it('submits to the associated external form and resets only after an uncanceled reset', async () => {
  const form = document.createElement('form');
  form.id = 'frequency-form';
  document.body.append(form);
  const value = ref('daily');
  const changed: string[] = [];
  const wrapper = mount(
    {
      setup: () => () =>
        h(CmSelect, {
          id: 'frequency',
          name: 'frequency',
          form: form.id,
          modelValue: value.value,
          'onUpdate:modelValue': (next: string) => (value.value = next),
          onValueChange: (next: string) => changed.push(next),
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ],
        }),
    },
    { attachTo: document.body },
  );
  try {
    expect(new FormData(form).get('frequency')).toBe('daily');
    const trigger = wrapper.get('#frequency');
    await trigger.trigger('click');
    await wrapper.get('[data-cm-select-value="weekly"]').trigger('click');
    expect(new FormData(form).get('frequency')).toBe('weekly');

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(wrapper.get('[data-cm-select-value="weekly"]').element);
    form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(value.value).toBe('weekly');
    expect(trigger.attributes('aria-expanded')).toBe('true');

    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(value.value).toBe('daily');
    expect(trigger.text()).toBe('Daily');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger.element);
    expect(new FormData(form).get('frequency')).toBe('daily');
    expect(changed).toEqual(['weekly']);
  } finally {
    wrapper.unmount();
    form.remove();
  }
});

it('keeps the listbox inline when the portal destination is invalid or belongs to the select', async () => {
  const wrapper = mount(CmSelect, {
    attachTo: document.body,
    props: { id: 'fallback', options: [{ value: 'daily', label: 'Daily' }], teleportTo: '[' },
  });
  try {
    await wrapper.get('[role="combobox"]').trigger('click');
    const listbox = wrapper.get('#fallback-listbox');
    expect(listbox.element.parentElement).toBe(wrapper.element);
    await wrapper.setProps({ teleportTo: '#fallback-listbox' });
    expect(wrapper.get('#fallback-listbox').element).toBe(listbox.element);
  } finally {
    wrapper.unmount();
  }
});

it('positions an open portal in the containing dialog and retains keyboard ownership', async () => {
  const dialog = document.createElement('dialog');
  dialog.open = true;
  document.body.append(dialog);
  const wrapper = mount(CmSelect, {
    attachTo: dialog,
    props: {
      id: 'frequency',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly', disabled: true },
        { value: 'monthly', label: 'Monthly' },
      ],
      teleportTo: 'body',
    },
  });

  try {
    await nextTick();
    const trigger = wrapper.get<HTMLButtonElement>('#frequency');
    const listbox = dialog.querySelector<HTMLElement>('#frequency-listbox');
    expect(listbox?.parentElement).toBe(dialog);
    await trigger.trigger('click');
    expect(listbox?.hidden).toBe(false);
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Monthly');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(listbox?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
  } finally {
    wrapper.unmount();
    expect(dialog.querySelector('[role=listbox]')).toBeNull();
    dialog.remove();
  }
});
