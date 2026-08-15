// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreDatePickerRecipe from './CoreDatePickerRecipe.vue';
import {
  addCoreDays,
  createCoreDateGrid,
  formatCoreDateDisplay,
  formatCoreDateLabel,
  formatCoreDateSelection,
  getCoreWeekBoundary,
  moveCoreDateByMonth,
  selectCoreDateRange,
  parseCoreDate,
  toggleCoreMultipleDate,
  type CoreDatePickerValue,
  type CoreDateSelectionMode,
} from './core-date-picker-recipe';

describe('CoreDatePickerRecipe date foundation', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    document.body.querySelectorAll('.core-date-picker-recipe__calendar').forEach((node) => node.remove());
  });

  function mountPicker(
    options: {
      clearable?: boolean;
      disabled?: boolean;
      invalid?: boolean;
      max?: string;
      min?: string;
      placeholder?: string;
      readonly?: boolean;
      selectionMode?: CoreDateSelectionMode;
      value?: CoreDatePickerValue;
    } = {},
  ) {
    const value = ref<CoreDatePickerValue>(options.value ?? '2026-07-30');
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreDatePickerRecipe, {
            id: 'release-date',
            modelValue: value.value,
            today: '2026-08-15',
            clearable: options.clearable,
            disabled: options.disabled,
            invalid: options.invalid,
            max: options.max,
            min: options.min,
            placeholder: options.placeholder,
            readonly: options.readonly,
            selectionMode: options.selectionMode,
            'aria-describedby': 'release-date-help',
            'onUpdate:modelValue': (next: CoreDatePickerValue) => (value.value = next),
          }),
      ),
    );
    app.mount(host);
    return { app, value };
  }

  it('parses, formats, moves, and grids local dates deterministically', () => {
    expect(parseCoreDate('2026-02-29')).toBeNull();
    expect(formatCoreDateDisplay('2026-07-30')).toBe('07/30/26');
    expect(formatCoreDateLabel('2026-07-30')).toBe('Thursday, July 30, 2026');
    expect(formatCoreDateSelection(['2026-07-15', '2026-07-30'], 'multiple')).toBe('07/15/26; 07/30/26');
    expect(formatCoreDateSelection(['2026-07-15', '2026-07-30'], 'range')).toBe('07/15/26 – 07/30/26');
    expect(addCoreDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(moveCoreDateByMonth('2026-01-31', 1)).toBe('2026-02-28');
    expect(getCoreWeekBoundary('2026-07-30', 'start')).toBe('2026-07-27');
    expect(getCoreWeekBoundary('2026-07-30', 'end')).toBe('2026-08-02');

    const cells = createCoreDateGrid({
      month: '2026-07-01',
      selected: '2026-07-30',
      today: '2026-08-15',
      min: '2026-07-10',
      max: '2026-08-01',
    });
    expect(cells).toHaveLength(35);
    expect(cells[0]).toMatchObject({ date: '2026-06-29', disabled: true, inCurrentMonth: false });
    expect(cells[cells.length - 1]).toMatchObject({
      date: '2026-08-02',
      disabled: true,
      inCurrentMonth: false,
    });
    expect(cells.find(({ date }) => date === '2026-07-30')).toMatchObject({ selected: true, today: false });
  });

  it('preserves multiple ordering while toggling dates', async () => {
    expect(toggleCoreMultipleDate(['2026-07-20', '2026-07-15'], '2026-07-20')).toEqual(['2026-07-15']);
    expect(toggleCoreMultipleDate(['2026-07-20', '2026-07-15'], '2026-07-30')).toEqual([
      '2026-07-20',
      '2026-07-15',
      '2026-07-30',
    ]);

    const { app, value } = mountPicker({
      clearable: true,
      selectionMode: 'multiple',
      value: ['2026-07-15', '2026-07-20'],
    });
    const trigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(trigger.textContent).toContain('07/15/26; 07/20/26');
    trigger.click();
    await nextTick();
    await nextTick();

    const selected = document.body.querySelector<HTMLButtonElement>('[data-date="2026-07-20"]')!;
    expect(selected.getAttribute('aria-selected')).toBe('true');
    selected.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
    await nextTick();
    expect(value.value).toEqual(['2026-07-15']);
    expect(document.body.querySelector('#release-date-calendar')).not.toBeNull();

    document.body.querySelector<HTMLButtonElement>('[data-date="2026-07-30"]')!.click();
    await nextTick();
    expect(value.value).toEqual(['2026-07-15', '2026-07-30']);
    expect(document.body.querySelector('#release-date-calendar')).not.toBeNull();

    host.querySelector<HTMLButtonElement>('[aria-label="Clear date"]')!.click();
    await nextTick();
    expect(value.value).toEqual([]);
    app.unmount();
  });

  it('starts, sorts, renders, and closes a completed range', async () => {
    expect(selectCoreDateRange(['2026-07-20', '2026-07-25'], '2026-07-15')).toEqual(['2026-07-15']);
    expect(selectCoreDateRange(['2026-07-20'], '2026-07-15')).toEqual(['2026-07-15', '2026-07-20']);

    const { app, value } = mountPicker({ selectionMode: 'range', value: ['2026-07-15', '2026-07-20'] });
    const trigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(trigger.textContent).toContain('07/15/26 – 07/20/26');
    trigger.click();
    await nextTick();
    await nextTick();

    expect(document.body.querySelector('[data-date="2026-07-15"]')?.className).toContain(
      'core-date-picker-recipe__day--range-start',
    );
    expect(document.body.querySelector('[data-date="2026-07-16"]')?.className).toContain(
      'core-date-picker-recipe__day--in-range',
    );
    expect(document.body.querySelector('[data-date="2026-07-20"]')?.className).toContain(
      'core-date-picker-recipe__day--range-end',
    );

    document.body.querySelector<HTMLButtonElement>('[data-date="2026-07-20"]')!.click();
    await nextTick();
    expect(value.value).toEqual(['2026-07-20']);
    expect(document.body.querySelector('#release-date-calendar')).not.toBeNull();

    document.body
      .querySelector<HTMLButtonElement>('[data-date="2026-07-15"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' }));
    await nextTick();
    expect(value.value).toEqual(['2026-07-15', '2026-07-20']);
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    app.unmount();
  });

  it('opens an accessible date grid and moves roving focus with frozen keyboard rules', async () => {
    const { app } = mountPicker();
    const trigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(trigger.textContent).toContain('07/30/26');
    expect(trigger.getAttribute('aria-describedby')).toBe('release-date-help');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }));
    await nextTick();
    await nextTick();

    const calendar = document.body.querySelector<HTMLElement>('#release-date-calendar')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(calendar.getAttribute('role')).toBe('dialog');
    expect(calendar.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
    expect(calendar.querySelectorAll('[role="gridcell"]')).toHaveLength(35);
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-07-30');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-07-31');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'PageDown' }),
    );
    await nextTick();
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-08-31');

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }));
    await nextTick();
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    app.unmount();
  });

  it('enforces constraints and emits a selected ordinary date', async () => {
    const { app, value } = mountPicker({ max: '2026-08-20', min: '2026-08-10', value: '2026-08-12' });
    host.querySelector<HTMLButtonElement>('#release-date')!.click();
    await nextTick();
    await nextTick();

    const calendar = document.body.querySelector<HTMLElement>('#release-date-calendar')!;
    expect(calendar.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')?.disabled).toBe(true);
    expect(calendar.querySelector<HTMLButtonElement>('[aria-label="Next month"]')?.disabled).toBe(true);
    expect(calendar.querySelector<HTMLButtonElement>('[data-date="2026-08-09"]')?.disabled).toBe(true);
    expect(calendar.querySelector<HTMLButtonElement>('[data-date="2026-08-21"]')?.disabled).toBe(true);

    calendar.querySelector<HTMLButtonElement>('[data-date="2026-08-18"]')!.click();
    await nextTick();
    expect(value.value).toBe('2026-08-18');
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    app.unmount();
  });

  it('clears without opening and preserves invalid, disabled, and readonly states', async () => {
    const clearMount = mountPicker({ clearable: true });
    host.querySelector<HTMLButtonElement>('[aria-label="Clear date"]')!.click();
    await nextTick();
    expect(clearMount.value.value).toBe('');
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    clearMount.app.unmount();

    const invalidMount = mountPicker({ invalid: true, placeholder: 'Invalid date', value: '' });
    const invalidTrigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(invalidTrigger.getAttribute('aria-invalid')).toBe('true');
    expect(invalidTrigger.textContent).toContain('Invalid date');
    invalidMount.app.unmount();

    const disabledMount = mountPicker({ disabled: true });
    const disabledTrigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(disabledTrigger.disabled).toBe(true);
    disabledTrigger.click();
    await nextTick();
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    disabledMount.app.unmount();

    const readonlyMount = mountPicker({ readonly: true });
    const readonlyTrigger = host.querySelector<HTMLButtonElement>('#release-date')!;
    expect(readonlyTrigger.getAttribute('aria-readonly')).toBe('true');
    readonlyTrigger.click();
    await nextTick();
    expect(document.body.querySelector('#release-date-calendar')).toBeNull();
    readonlyMount.app.unmount();
  });

  it('stays route-owned, finite, and CM-only', () => {
    const component = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreDatePickerRecipe.vue'), 'utf8');
    const helper = readFileSync(resolve(process.cwd(), 'src/sections/core/core-date-picker-recipe.ts'), 'utf8');
    expect(component).not.toContain('--vf-');
    expect(component).not.toContain('vueforge-core');
    expect(helper).not.toContain('vueforge-core');
    expect(component).not.toContain('showTime');
    expect(component).not.toContain('monthPicker');
    expect(component).not.toContain('yearPicker');
    expect(helper).toContain("export type CoreDateSelectionMode = 'multiple' | 'range' | 'single'");
    expect(component).toContain('today: { type: String, required: true }');
  });

  it('owns ordinary, multiple, and range showcase dates while leaving advanced modes at the legacy boundary', () => {
    const showcase = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreShowcase.vue'), 'utf8');

    expect(showcase.match(/<CoreDatePickerRecipe\b/gu)).toHaveLength(7);
    expect(showcase.match(/<VfDatePicker\b/gu)).toHaveLength(4);
    expect(showcase.match(/selection-mode="(?:multiple|range)"/gu)).toHaveLength(2);
    expect(showcase).toMatch(/<VfDatePicker[\s\S]*?show-time/gu);
    expect(showcase).toMatch(/<VfDatePicker[\s\S]*?month-picker/gu);
    expect(showcase).toMatch(/<VfDatePicker[\s\S]*?year-picker/gu);
    expect(showcase).toMatch(/<VfField[\s\S]*?<VfDatePicker/gu);
    expect(showcase.match(/today="2026-08-15"/gu)).toHaveLength(7);
  });
});
