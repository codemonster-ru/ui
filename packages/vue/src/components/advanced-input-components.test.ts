import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import CmCommandPalette from './command-palette/CmCommandPalette.vue';
import CmDatePicker from './date-picker/CmDatePicker.vue';
import CmSelect from './select/CmSelect.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Vue advanced input components', () => {
  it('binds Select to native change and form serialization', async () => {
    const wrapper = mount(CmSelect, {
      props: {
        modelValue: '',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ],
      },
      attrs: { name: 'frequency', 'aria-label': 'Frequency' },
    });
    const form = document.createElement('form');
    form.append(wrapper.element);
    await wrapper.get('select').setValue('weekly');
    expect(wrapper.emitted('update:modelValue')).toEqual([['weekly']]);
    expect(new FormData(form).get('frequency')).toBe('weekly');
  });

  it('clears Select through native change and preserves focus and submission', async () => {
    const wrapper = mount(CmSelect, {
      attachTo: document.body,
      props: {
        modelValue: 'weekly',
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
    const select = wrapper.get<HTMLSelectElement>('select');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('valueChange')).toEqual([['']]);
    expect(select.element).toBe(document.activeElement);
    expect(wrapper.get('button').attributes('hidden')).toBe('');
    expect(new FormData(form).get('frequency')).toBe('');
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
