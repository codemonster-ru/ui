import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

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
    expect(wrapper.find('[data-cm-select-clear]').exists()).toBe(false);
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

  it('binds DatePicker to native input and ISO form values', async () => {
    const wrapper = mount(CmDatePicker, { props: { modelValue: '' }, attrs: { name: 'date', 'aria-label': 'Date' } });
    const form = document.createElement('form');
    form.append(wrapper.element);
    await wrapper.get('input').setValue('2026-08-13');
    expect(wrapper.emitted('valueChange')).toEqual([['2026-08-13']]);
    expect(new FormData(form).get('date')).toBe('2026-08-13');
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
