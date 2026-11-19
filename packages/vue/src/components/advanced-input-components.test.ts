import type { CmCalendarWeekday } from '@codemonster-ru/ui-runtime/core';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import { expectCmWarning } from '../internal/expect-warning';
import CmCommandPalette from './command-palette/CmCommandPalette.vue';
import CmDatePicker from './date-picker/CmDatePicker.vue';
import CmSelect from './select/CmSelect.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Vue advanced input components', () => {
  it('commits a Select choice and keeps it submittable', async () => {
    const wrapper = mount(CmSelect, {
      attachTo: document.body,
      props: {
        id: 'frequency',
        modelValue: '',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ],
      },
      attrs: { name: 'frequency', 'aria-label': 'Frequency' },
    });
    const form = document.createElement('form');
    document.body.append(form);
    form.append(wrapper.element);

    await wrapper.get('.cm-select').trigger('click');
    expect(wrapper.get('.cm-select__listbox').attributes('hidden')).toBeUndefined();
    await wrapper.findAll('.cm-select__option')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['weekly']]);
    expect(wrapper.emitted('valueChange')).toEqual([['weekly']]);
    expect(wrapper.get('.cm-select__value').text()).toBe('Weekly');
    expect(new FormData(form).get('frequency')).toBe('weekly');
    expect(wrapper.get('.cm-select__listbox').attributes('hidden')).toBe('');
    wrapper.unmount();
  });

  it.each(['select', 'date-picker'] as const)(
    'keeps %s trigger semantics when forwarding Vue attributes',
    async (kind) => {
      const form = document.createElement('form');
      document.body.append(form);
      const submissions: Event[] = [];
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submissions.push(event);
      });
      let clicks = 0;
      const props = { id: 'field', required: true };
      const attrs = {
        name: 'field',
        'aria-label': 'Project field',
        'aria-describedby': 'field-help',
        'data-analytics': 'pick',
        type: 'submit',
        '.type': 'submit',
        role: 'button',
        ariaHasPopup: 'menu',
        '^aria-haspopup': 'menu',
        'ARIA-CONTROLS': 'missing',
        'aria-expanded': 'true',
        'aria-invalid': 'true',
        'aria-required': 'false',
        'data-cm-filled': 'true',
        onClick: () => {
          clicks++;
        },
      };
      const forwardAttrs = ref(false);
      const wrapper = mount(
        {
          render() {
            const forwarded = forwardAttrs.value ? { ...props, ...attrs } : props;
            return kind === 'select'
              ? h(CmSelect, { ...forwarded, options: [{ value: 'daily', label: 'Daily' }] })
              : h(CmDatePicker, forwarded);
          },
        },
        { attachTo: form },
      );

      try {
        const trigger = wrapper.get<HTMLButtonElement>('button');
        const popup = wrapper.get(kind === 'select' ? '[role="listbox"]' : '[role="dialog"]');
        expect(trigger.attributes('aria-describedby')).toBeUndefined();
        forwardAttrs.value = true;
        await nextTick();
        expect(trigger.attributes()).toMatchObject({
          type: 'button',
          role: 'combobox',
          'aria-haspopup': kind === 'select' ? 'listbox' : 'dialog',
          'aria-controls': popup.attributes('id'),
          'aria-expanded': 'false',
          'aria-required': 'true',
          'aria-label': 'Project field',
          'aria-describedby': 'field-help',
          'data-analytics': 'pick',
        });
        expect(trigger.attributes('aria-invalid')).toBeUndefined();
        expect(trigger.attributes('data-cm-filled')).toBeUndefined();
        expect(new FormData(form).getAll('field')).toEqual(['']);

        trigger.element.click();
        await nextTick();
        expect(trigger.attributes('aria-expanded')).toBe('true');
        expect(popup.attributes('hidden')).toBeUndefined();
        expect(clicks).toBe(1);
        expect(submissions).toHaveLength(0);

        forwardAttrs.value = false;
        await nextTick();
        expect(trigger.attributes('aria-describedby')).toBeUndefined();
        expect(new FormData(form).has('field')).toBe(false);
      } finally {
        wrapper.unmount();
      }
    },
  );

  it('refuses a disabled Select option and keeps the listbox open', async () => {
    const wrapper = mount(CmSelect, {
      props: {
        id: 'status',
        modelValue: '',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived', disabled: true },
        ],
      },
    });
    await wrapper.get('.cm-select').trigger('click');
    await wrapper.findAll('.cm-select__option')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.get('.cm-select__listbox').attributes('hidden')).toBeUndefined();
  });

  it('clears a Select choice and restores the placeholder', async () => {
    const wrapper = mount(CmSelect, {
      attachTo: document.body,
      props: {
        id: 'frequency',
        modelValue: 'weekly',
        placeholder: 'Choose frequency',
        clearable: true,
        clearLabel: 'Clear frequency',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ],
      },
      attrs: { name: 'frequency', 'aria-label': 'Frequency' },
    });
    const form = document.createElement('form');
    document.body.append(form);
    form.append(wrapper.element);

    expect(wrapper.get('.cm-select__value').text()).toBe('Weekly');
    await wrapper.get('[data-cm-select-clear]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('valueChange')).toEqual([['']]);
    expect(wrapper.get('.cm-select__value').text()).toBe('Choose frequency');
    expect(new FormData(form).get('frequency')).toBe('');
    expect(wrapper.get('[data-cm-select-clear]').attributes('hidden')).toBe('');
    wrapper.unmount();
  });

  it('opens a Select from the keyboard and closes on Escape', async () => {
    const wrapper = mount(CmSelect, {
      attachTo: document.body,
      props: {
        id: 'frequency',
        modelValue: '',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ],
      },
    });

    await wrapper.get('.cm-select').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.get('.cm-select__listbox').attributes('hidden')).toBeUndefined();
    expect(wrapper.get('.cm-select').attributes('aria-expanded')).toBe('true');

    await wrapper.get('.cm-select__listbox').trigger('keydown', { key: 'Escape' });
    expect(wrapper.get('.cm-select__listbox').attributes('hidden')).toBe('');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('submits the DatePicker selection as an ISO form value', async () => {
    const wrapper = mount(CmDatePicker, {
      props: { id: 'date', modelValue: '' },
      attrs: { name: 'date', 'aria-label': 'Date' },
    });
    const form = document.createElement('form');
    form.append(wrapper.element);

    await wrapper.get('button.cm-date-picker').trigger('click');
    // An empty picker opens on the current month, so the assertion reads the day it actually offers.
    const day = wrapper.get('[data-cm-date-picker-value]:not(.cm-date-picker__day--outside)');
    const value = day.attributes('data-cm-date-picker-value');
    await day.trigger('click');

    expect(wrapper.emitted('valueChange')).toEqual([[value]]);
    expect(new FormData(form).get('date')).toBe(value);
  });

  it('keeps the DatePicker week-start metadata at its default for an invalid prop', () => {
    const wrapper = expectCmWarning('firstDayOfWeek', () =>
      mount(CmDatePicker, { props: { id: 'date', firstDayOfWeek: 7 as CmCalendarWeekday } }),
    );
    try {
      expect(wrapper.get('button.cm-date-picker').attributes('data-cm-first-day-of-week')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('filters CommandPalette and selects the active enabled command', async () => {
    const wrapper = mount(CmCommandPalette, {
      attachTo: document.body,
      props: {
        id: 'commands',
        title: 'Commands',
        open: true,
        commands: [
          { id: 'first', label: 'First' },
          { id: 'disabled', label: 'Disabled', disabled: true },
          { id: 'second', label: 'Second', keywords: 'next' },
        ],
      },
    });
    const input = wrapper.get<HTMLInputElement>('[role="combobox"]');
    await input.setValue('next');
    expect(wrapper.findAll('[role="option"]')[0].attributes('hidden')).toBe('');
    expect(input.attributes('aria-activedescendant')).toBe('commands-option-second');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('queryChange')).toEqual([['next']]);
    expect(wrapper.emitted('select')).toEqual([['second']]);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    wrapper.unmount();
  });

  it('wraps CommandPalette navigation around enabled visible commands', async () => {
    const wrapper = mount(CmCommandPalette, {
      props: {
        id: 'commands',
        title: 'Commands',
        commands: [
          { id: 'first', label: 'First' },
          { id: 'second', label: 'Second' },
        ],
      },
    });
    const input = wrapper.get('[role="combobox"]');
    await input.trigger('keydown', { key: 'ArrowUp' });
    expect(input.attributes('aria-activedescendant')).toBe('commands-option-second');
  });

  it('renders localized CommandPalette loading and idle states', async () => {
    const wrapper = mount(CmCommandPalette, {
      props: { id: 'commands', title: 'Commands', commands: [], idleText: 'Enter a query.' },
    });
    expect(wrapper.get('.cm-command-palette__idle').text()).toBe('Enter a query.');
    expect(wrapper.get('.cm-command-palette__idle').attributes('hidden')).toBeUndefined();
    await wrapper.setProps({ loading: true, loadingText: 'Loading…' });
    expect(wrapper.get('[role="status"]').text()).toBe('Loading…');
    expect(wrapper.get('[role="combobox"]').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[role="listbox"]').attributes('hidden')).toBe('');
  });
});
