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
  it('keeps the calendar portal inside an enclosing dialog and the named value inside its form', async () => {
    const dialog = document.createElement('dialog');
    dialog.open = true;
    const form = document.createElement('form');
    dialog.append(form);
    document.body.append(dialog);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: { id: 'launch-date', modelValue: '2026-08-13', placement: 'bottom-end', teleportTo: 'body' },
      attrs: { name: 'launch_date' },
    });

    const trigger = wrapper.get('button.cm-date-picker');
    const calendar = wrapper.get('.cm-date-picker__calendar').element;
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(calendar.parentElement).toBe(dialog);
    expect(trigger.attributes('aria-controls')).toBe(calendar.id);
    expect(trigger.attributes('data-cm-date-picker-placement')).toBe('bottom-end');
    expect(document.activeElement?.getAttribute('data-cm-date-picker-value')).toBe('2026-08-13');

    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await nextTick();
    expect(document.activeElement?.getAttribute('data-cm-date-picker-value')).toBe('2026-08-14');
    calendar.querySelector<HTMLButtonElement>('[tabindex="0"]')?.click();
    await nextTick();
    await nextTick();
    expect(new FormData(form).get('launch_date')).toBe('2026-08-14');
    expect(calendar.parentElement).toBe(wrapper.element);
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('can keep a custom portal inline and still closes on outside focus', async () => {
    const target = document.createElement('aside');
    const outside = document.createElement('button');
    document.body.append(target, outside);
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', teleportTo: target, disableTeleport: true },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    const calendar = wrapper.get('.cm-date-picker__calendar').element;
    await trigger.trigger('click');
    expect(calendar.parentElement).toBe(wrapper.element);

    await wrapper.setProps({ disableTeleport: false });
    expect(calendar.parentElement).toBe(target);
    outside.focus();
    await nextTick();
    expect(calendar.hasAttribute('hidden')).toBe(true);
    expect(calendar.parentElement).toBe(wrapper.element);
    expect(document.activeElement).toBe(outside);
    wrapper.unmount();
  });

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

  it('moves through month choices by year and submits an ISO month', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: {
        id: 'billing-month',
        monthPicker: true,
        modelValue: '2026-08',
        min: '2026-04',
        max: '2027-09',
      },
      attrs: { name: 'billing_month' },
    });
    await wrapper.get('button.cm-date-picker').trigger('click');
    expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(12);
    expect(wrapper.find('[role="columnheader"]').exists()).toBe(false);
    expect(wrapper.get('.cm-date-picker__month').text()).toBe('2026');
    expect(wrapper.get('[data-cm-date-picker-previous]').attributes('disabled')).toBe('');

    const active = () => wrapper.get('[role="gridcell"][tabindex="0"]');
    expect(active().attributes('aria-label')).toBe('August 2026');
    await active().trigger('keydown', { key: 'PageDown' });
    expect(active().attributes('aria-label')).toBe('August 2027');
    await active().trigger('keydown', { key: 'ArrowRight' });
    expect(active().attributes('data-cm-date-picker-value')).toBe('2027-09');
    await active().trigger('click');
    expect(new FormData(form).get('billing_month')).toBe('2027-09');
    expect(wrapper.emitted('update:modelValue')).toEqual([['2027-09']]);
    wrapper.unmount();
  });

  it('pages a bounded 12-year block and submits a chronological year range', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: { id: 'year-window', yearPicker: true, range: true, modelValue: ['2026'], min: '2020', max: '2035' },
      attrs: { name: 'year_window' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    await trigger.trigger('click');
    expect(wrapper.get('.cm-date-picker__month').text()).toBe('2020–2031');
    const next = wrapper.get('[data-cm-date-picker-next]');
    expect(next.attributes('aria-label')).toBe('Next decade');
    await next.trigger('click');
    expect(wrapper.get('.cm-date-picker__month').text()).toBe('2032–2043');
    const active = wrapper.get('[role="gridcell"][tabindex="0"]');
    expect(active.attributes('data-cm-date-picker-value')).toBe('2035');
    expect(wrapper.get('[data-cm-date-picker-value="2036"]').attributes('disabled')).toBe('');
    await active.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026', '2035']]]);
    expect(new FormData(form).getAll('year_window')).toEqual(['2026', '2035']);
    expect(trigger.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('preserves a timezone-free date and time and enforces minute steps and bounds', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const wrapper = mount(CmDatePicker, {
      attachTo: form,
      props: {
        id: 'release-time',
        modelValue: '2026-08-13T09:30',
        showTime: true,
        minuteStep: 15,
        min: '2026-08-13T09:15',
        max: '2026-08-14T10:30',
        displayFormat: 'dd.MM.yyyy HH:mm',
      },
      attrs: { name: 'release_time' },
    });
    const trigger = wrapper.get('button.cm-date-picker');
    await trigger.trigger('click');
    const hour = wrapper.get('[data-cm-date-picker-hour]');
    const minute = wrapper.get('[data-cm-date-picker-minute]');
    expect(wrapper.find('select').exists()).toBe(false);
    expect(hour.get('.cm-select__value').text()).toBe('09');
    expect(minute.get('.cm-select__value').text()).toBe('30');
    expect(hour.get('[data-cm-select-value="8"]').attributes('aria-disabled')).toBe('true');
    expect(minute.get('[data-cm-select-value="0"]').attributes('aria-disabled')).toBe('true');
    await hour.get('.cm-select').trigger('click');
    await hour.get('[data-cm-select-value="10"]').trigger('click');
    await minute.get('.cm-select').trigger('click');
    await minute.get('[data-cm-select-value="45"]').trigger('click');
    expect(new FormData(form).get('release_time')).toBe('2026-08-13T10:45');
    await wrapper.get('[data-cm-date-picker-value="2026-08-14"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['2026-08-14T10:30']);
    expect(minute.get('[data-cm-select-value="45"]').attributes('aria-disabled')).toBe('true');
    expect(new FormData(form).get('release_time')).toBe('2026-08-14T10:30');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.text()).toBe('14.08.2026 10:30');
    const minuteTrigger = minute.get('.cm-select');
    await minuteTrigger.trigger('click');
    await minuteTrigger.trigger('keydown', { key: 'Escape' });
    expect(minuteTrigger.attributes('aria-expanded')).toBe('false');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    await minuteTrigger.trigger('keydown', { key: 'Escape' });
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('changes only the active date and time in a multiple selection', async () => {
    const wrapper = mount(CmDatePicker, {
      props: {
        id: 'release-times',
        multiple: true,
        modelValue: ['2026-08-13T09:30', '2026-08-14T16:00'],
        showTime: true,
        minuteStep: 15,
      },
    });
    await wrapper.get('button.cm-date-picker').trigger('click');
    const minute = wrapper.get('[data-cm-date-picker-minute]');
    await minute.get('.cm-select').trigger('click');
    await minute.get('[data-cm-select-value="45"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-08-13T09:45', '2026-08-14T16:00']]]);
    await wrapper.get('[data-cm-date-picker-value="2026-08-13"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([['2026-08-14T16:00']]);
    wrapper.unmount();
  });

  it('focuses the nearest eligible day when the authored day has no aligned time', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: {
        id: 'release-time',
        modelValue: '2026-08-13T23:59',
        min: '2026-08-13T23:59',
        max: '2026-08-14T01:00',
        minuteStep: 60,
        showTime: true,
      },
    });
    await wrapper.get('button.cm-date-picker').trigger('click');
    expect(wrapper.get('[data-cm-date-picker-value="2026-08-13"]').attributes('disabled')).toBe('');
    const next = wrapper.get('[data-cm-date-picker-value="2026-08-14"]');
    expect(document.activeElement).toBe(next.element);
    await next.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-14T01:00']]);
    wrapper.unmount();
  });
});
