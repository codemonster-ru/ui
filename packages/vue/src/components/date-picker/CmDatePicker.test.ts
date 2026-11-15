import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import CmDatePicker from './CmDatePicker.vue';

async function finishFormReset(): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CmDatePicker', () => {
  it('renders the selected date through the component-owned trigger', () => {
    const wrapper = mount(CmDatePicker, {
      props: { id: 'launch-date', modelValue: '2026-08-13' },
      attrs: { name: 'launch_date' },
    });

    expect(wrapper.get('.cm-date-picker__value').text()).toBe('08/13/26');
    expect(wrapper.get('button.cm-date-picker').attributes('aria-haspopup')).toBe('dialog');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026-08-13');
    wrapper.unmount();
  });

  it('clears the value and restores focus to the trigger', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', modelValue: '2026-08-13', clearable: true, clearLabel: 'Remove launch date' },
    });
    const trigger = wrapper.get<HTMLButtonElement>('button.cm-date-picker');
    const clear = wrapper.get<HTMLButtonElement>('[data-cm-date-picker-clear]');

    expect(clear.attributes('aria-label')).toBe('Remove launch date');
    await clear.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('valueChange')).toEqual([['']]);
    expect(clear.attributes('hidden')).toBe('');
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('selects a day from the calendar and closes it', async () => {
    const wrapper = mount(CmDatePicker, { props: { id: 'launch-date', modelValue: '2026-08-13' } });
    await wrapper.get('button.cm-date-picker').trigger('click');

    expect(wrapper.get('.cm-date-picker__calendar').attributes('hidden')).toBeUndefined();
    await wrapper.get('[data-cm-date-picker-value="2026-08-20"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-20']]);
    expect(wrapper.get('.cm-date-picker__calendar').attributes('hidden')).toBe('');
    wrapper.unmount();
  });

  it('omits the clear action when the control is readonly', () => {
    const wrapper = mount(CmDatePicker, {
      props: { id: 'launch-date', modelValue: '2026-08-13', clearable: true, readonly: true },
    });

    expect(wrapper.find('[data-cm-date-picker-clear]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('localizes the calendar and display format while submitting the original ISO date', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: {
        id: 'launch-date',
        modelValue: '2026-08-13',
        firstDayOfWeek: 1,
        locale: 'fr-FR',
        displayFormat: 'dd.MM.yyyy',
        labels: { calendar: 'Date de lancement', previousMonth: 'Mois précédent' },
      },
      attrs: { name: 'launch_date' },
    });
    await wrapper.get('button.cm-date-picker').trigger('click');
    const grid = wrapper.get('[role="grid"]');
    expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('Date de lancement');
    expect(wrapper.get('.cm-date-picker__value').text()).toBe('13.08.2026');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026-08-13');
    expect(wrapper.get('[data-cm-date-picker-month]').text()).toBe('août 2026');
    expect(grid.get('[role="columnheader"]').text()).toBe('lun.');
    const selected = grid.get('[aria-selected="true"]');
    expect(selected.attributes('aria-label')).toBe('jeudi 13 août 2026');
    expect(document.activeElement).toBe(selected.element);
    wrapper.unmount();
  });

  it('moves the single day tab stop with arrows, week boundaries, and page keys', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', modelValue: '2026-08-13', firstDayOfWeek: 1, min: '2026-08-10', max: '2026-09-30' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    const activeDay = () => wrapper.get('[role="gridcell"][tabindex="0"]');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(activeDay().attributes('data-cm-date-picker-value')).toBe('2026-08-13');
    for (const [key, expected] of [
      ['Home', '2026-08-10'],
      ['ArrowLeft', '2026-08-10'],
      ['End', '2026-08-16'],
      ['PageDown', '2026-09-16'],
      ['ArrowUp', '2026-09-09'],
    ]) {
      await activeDay().trigger('keydown', { key });
      expect(activeDay().attributes('data-cm-date-picker-value')).toBe(expected);
      expect(document.activeElement).toBe(activeDay().element);
    }
    await activeDay().trigger('keydown', { key: 'Escape' });
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('closes on an outside action without taking focus from its target', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', modelValue: '2026-08-13' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    await trigger.trigger('click');
    outside.focus();
    outside.click();
    await wrapper.vm.$nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(outside);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('keeps multiple selection open, toggles dates, and submits each date under the same field name', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: { id: 'dates', multiple: true, modelValue: ['2026-08-13'], clearable: true },
      attrs: { name: 'dates' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    await trigger.trigger('click');
    const grid = wrapper.get('[role="grid"]');
    const selected = grid.get('[aria-selected="true"]');
    await selected.trigger('keydown', { key: 'ArrowRight' });
    const next = grid.get('[tabindex="0"]');
    expect(next.attributes('data-cm-date-picker-value')).toBe('2026-08-14');
    await next.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-13', '2026-08-14']]]);
    expect(grid.attributes('aria-multiselectable')).toBe('true');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(new FormData(form).getAll('dates')).toEqual(['2026-08-13', '2026-08-14']);
    await selected.trigger('click');
    expect(wrapper.emitted('valueChange')).toEqual([[['2026-08-13', '2026-08-14']], [['2026-08-14']]]);
    expect(new FormData(form).getAll('dates')).toEqual(['2026-08-14']);
    await wrapper.get('[data-cm-date-picker-clear]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([[]]);
    expect(new FormData(form).has('dates')).toBe(false);
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('commits an ordered range after the second date and exposes every date in the selected span', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: { id: 'dates', range: true, modelValue: [], min: '2026-08-01', max: '2026-08-31' },
      attrs: { name: 'dates' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    const day = (value: string) => wrapper.get(`[data-cm-date-picker-value="${value}"]`);
    await trigger.trigger('click');
    await day('2026-08-16').trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-16']]]);
    await day('2026-08-13').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-16']], [['2026-08-13', '2026-08-16']]]);
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger.element);
    expect(new FormData(form).getAll('dates')).toEqual(['2026-08-13', '2026-08-16']);

    await trigger.trigger('click');
    expect(day('2026-08-13').classes()).toContain('cm-date-picker__day--range-start');
    expect(day('2026-08-14').classes()).toContain('cm-date-picker__day--in-range');
    expect(day('2026-08-14').attributes('aria-selected')).toBe('true');
    expect(day('2026-08-16').classes()).toContain('cm-date-picker__day--range-end');
    await day('2026-08-20').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([['2026-08-20']]);
    expect(trigger.attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('restores the authored dates on an uncanceled reset of the associated form', async () => {
    const form = document.createElement('form');
    form.id = 'launch-form';
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', modelValue: '2026-08-13', clearable: true },
      attrs: { name: 'launch_date', form: form.id },
    });
    await wrapper.get('[data-cm-date-picker-clear]').trigger('click');
    expect(new FormData(form).get('launch_date')).toBe('');

    form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
    form.reset();
    await finishFormReset();
    expect(new FormData(form).get('launch_date')).toBe('');
    form.reset();
    await finishFormReset();
    expect(new FormData(form).get('launch_date')).toBe('2026-08-13');
    expect(wrapper.get('button.cm-date-picker').text()).toBe('08/13/26');
    wrapper.unmount();
  });

  it('requests a reset without replacing an authoritative model value', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: { id: 'release-window', range: true, modelValue: ['2026-08-13', '2026-08-20'] },
      attrs: { name: 'release_dates' },
    });
    await wrapper.setProps({ modelValue: ['2026-08-14', '2026-08-22'] });

    form.reset();
    await finishFormReset();
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-13', '2026-08-20']]]);
    expect(new FormData(form).getAll('release_dates')).toEqual(['2026-08-14', '2026-08-22']);

    await wrapper.setProps({ modelValue: ['2026-08-13', '2026-08-20'] });
    expect(new FormData(form).getAll('release_dates')).toEqual(['2026-08-13', '2026-08-20']);
    wrapper.unmount();
  });
});
