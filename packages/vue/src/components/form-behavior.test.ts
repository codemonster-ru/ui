import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import CmCheckbox from './checkbox/CmCheckbox.vue';
import CmInput from './input/CmInput.vue';
import CmRadio from './radio/CmRadio.vue';
import CmSwitch from './switch/CmSwitch.vue';
import CmTextarea from './textarea/CmTextarea.vue';

const FormHarness = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('form', slots.default?.()),
});

describe('Vue native form behavior', () => {
  it('resets values and models of native fields without reporting application input or change', async () => {
    const title = ref('Original');
    const notes = ref('Notes');
    const checked = ref(true);
    const enabled = ref(false);
    const selected = ref('daily');
    const invalid = ref(false);
    const events: Event[] = [];
    const wrapper = mount(
      {
        setup: () => () =>
          h('form', [
            h(CmInput, {
              name: 'title',
              modelValue: title.value,
              invalid: invalid.value,
              'onUpdate:modelValue': (value: string) => (title.value = value),
              onInput: (event: Event) => events.push(event),
            }),
            h(CmTextarea, {
              name: 'notes',
              modelValue: notes.value,
              'onUpdate:modelValue': (value: string) => (notes.value = value),
            }),
            h(CmCheckbox, {
              name: 'checked',
              modelValue: checked.value,
              'onUpdate:modelValue': (value: boolean) => (checked.value = value),
            }),
            h(CmSwitch, {
              name: 'enabled',
              modelValue: enabled.value,
              'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
              onChange: (event: Event) => events.push(event),
            }),
            ...['daily', 'weekly'].map((value) =>
              h(CmRadio, {
                name: 'frequency',
                value,
                modelValue: selected.value,
                'onUpdate:modelValue': (next: string) => (selected.value = next),
              }),
            ),
          ]),
      },
      { attachTo: document.body },
    );
    try {
      const form = wrapper.get('form').element;
      await wrapper.get('input[name="title"]').setValue('Edited');
      await wrapper.get('textarea').setValue('Edited notes');
      await wrapper.get('input[name="checked"]').setValue(false);
      await wrapper.get('input[name="enabled"]').setValue(true);
      await wrapper.get('input[value="weekly"]').setValue(true);
      invalid.value = true;
      await nextTick();
      const eventCount = events.length;
      form.reset();
      expect(Object.fromEntries(new FormData(form))).toEqual({
        title: 'Original',
        notes: 'Notes',
        checked: 'on',
        frequency: 'daily',
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect([title.value, notes.value, checked.value, enabled.value, selected.value]).toEqual([
        'Original',
        'Notes',
        true,
        false,
        'daily',
      ]);
      expect(wrapper.get('input[name="enabled"]').attributes('aria-checked')).toBe('false');
      expect(events).toHaveLength(eventCount);
    } finally {
      wrapper.unmount();
    }
  });

  it('updates checkbox binding and successful form data after native activation', async () => {
    const selected = ref(false);
    const wrapper = mount(FormHarness, {
      slots: {
        default: () =>
          h(CmCheckbox, {
            modelValue: selected.value,
            'onUpdate:modelValue': (value: boolean) => (selected.value = value),
            name: 'updates',
            value: 'yes',
            label: 'Updates',
          }),
      },
    });

    await wrapper.get('input').setValue(true);

    expect(selected.value).toBe(true);
    expect(new FormData(wrapper.element as HTMLFormElement).get('updates')).toBe('yes');
  });

  it('keeps radio exclusivity in one string model and native form field', async () => {
    const selected = ref('daily');
    const option = (value: string) =>
      h(CmRadio, {
        modelValue: selected.value,
        'onUpdate:modelValue': (next: string) => (selected.value = next),
        name: 'frequency',
        value,
        label: value,
      });
    const wrapper = mount(FormHarness, { slots: { default: () => [option('daily'), option('weekly')] } });

    await wrapper.findAll('input')[1]?.setValue(true);

    expect(selected.value).toBe('weekly');
    expect(new FormData(wrapper.element as HTMLFormElement).get('frequency')).toBe('weekly');
  });

  it('uses textarea native required validity and current DOM submission value', async () => {
    const value = ref('');
    const wrapper = mount(FormHarness, {
      slots: {
        default: () =>
          h(CmTextarea, {
            modelValue: value.value,
            'onUpdate:modelValue': (next: string) => (value.value = next),
            name: 'notes',
            required: true,
            'aria-label': 'Notes',
          }),
      },
    });
    const textarea = wrapper.get('textarea');

    expect((textarea.element as HTMLTextAreaElement).checkValidity()).toBe(false);
    await textarea.setValue('Ready');

    expect((textarea.element as HTMLTextAreaElement).checkValidity()).toBe(true);
    expect(new FormData(wrapper.element as HTMLFormElement).get('notes')).toBe('Ready');
  });

  it('synchronizes switch binding, ARIA state, and submission', async () => {
    const enabled = ref(false);
    const wrapper = mount(FormHarness, {
      slots: {
        default: () =>
          h(CmSwitch, {
            modelValue: enabled.value,
            'onUpdate:modelValue': (value: boolean) => (enabled.value = value),
            name: 'theme',
            value: 'dark',
            label: 'Dark mode',
          }),
      },
    });

    await wrapper.get('input').setValue(true);

    expect(enabled.value).toBe(true);
    expect(wrapper.get('input').attributes('aria-checked')).toBe('true');
    expect(new FormData(wrapper.element as HTMLFormElement).get('theme')).toBe('dark');
  });
});
