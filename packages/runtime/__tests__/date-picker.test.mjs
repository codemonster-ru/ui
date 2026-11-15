import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  calendarDateHasTime,
  calendarKeyTarget,
  calendarTimesForDay,
  calendarTimeValue,
  calendarYearRangeStart,
  formatDisplayDate,
  parseIsoDate,
} from '../dist/core/index.js';
import { CmRuntime, createCmDatePickerController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../contracts/date-picker/cases/default.html', import.meta.url), 'utf8');

test('calendar key targets clamp shorter months and follow the direction and start of the week', () => {
  assert.equal(calendarKeyTarget('2024-01-31', 'PageDown'), '2024-02-29');
  assert.equal(calendarKeyTarget('2026-08-13', 'Home', 1), '2026-08-10');
  assert.equal(calendarKeyTarget('2026-08-13', 'End', 1), '2026-08-16');
  assert.equal(calendarKeyTarget('2026-08-13', 'ArrowLeft', 1, true), '2026-08-14');
  assert.equal(calendarKeyTarget('2026-08-13', 'ArrowRight', 1, true), '2026-08-12');
  assert.equal(calendarKeyTarget('2026-08-13', 'Enter'), null);
  assert.equal(parseIsoDate('0099-02-01')?.getFullYear(), 99);
  assert.equal(calendarKeyTarget('0099-12-31', 'ArrowRight'), '0100-01-01');
  assert.equal(calendarYearRangeStart('2032', 2020), 2032);
});

test('localizes Vanilla grid labels, navigates one day tab stop, and commits an ISO form value', (context) => {
  const { window } = new JSDOM(`<form>${markup}<button type="button" id="outside">Other action</button></form>`, {
    pretendToBeVisual: true,
  });
  const { document } = window;
  const runtime = new CmRuntime().register('date-picker', createCmDatePickerController);
  context.after(() => {
    runtime.stop();
    window.close();
  });

  const root = document.querySelector('[data-cm-controller="date-picker"]');
  const trigger = root.querySelector('.cm-date-picker');
  const date = root.querySelector('input');
  date.value = '2026-08-13';
  Object.assign(trigger.dataset, {
    cmLocale: 'fr-FR',
    cmDisplayFormat: 'dd.MM.yyyy',
    cmFirstDayOfWeek: '1',
    cmMin: '2026-08-10',
  });
  const keydown = (target, key) => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
  const grid = root.querySelector('[role="grid"]');
  const changes = [];
  root.addEventListener('cm:date-picker-value-change', (event) => changes.push(event.detail.value));
  runtime.start(document);

  keydown(trigger, 'ArrowDown');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(grid.querySelector('[role="columnheader"]').textContent, 'lun.');
  const tabStop = () => grid.querySelector('[role="gridcell"][tabindex="0"]');
  assert.equal(grid.querySelectorAll('[role="gridcell"][tabindex="0"]').length, 1);
  assert.equal(tabStop().getAttribute('aria-label'), 'jeudi 13 août 2026');
  assert.equal(tabStop().getAttribute('aria-selected'), 'true');
  assert.equal(document.activeElement, tabStop());

  keydown(tabStop(), 'Home');
  assert.equal(tabStop().dataset.cmDatePickerValue, '2026-08-10');
  keydown(tabStop(), 'ArrowLeft');
  assert.equal(tabStop().dataset.cmDatePickerValue, '2026-08-10');
  keydown(tabStop(), 'PageDown');
  assert.equal(tabStop().dataset.cmDatePickerValue, '2026-09-10');
  tabStop().click();
  assert.deepEqual(changes, ['2026-09-10']);
  assert.equal(new window.FormData(document.querySelector('form')).get('launch_date'), '2026-09-10');
  assert.equal(root.querySelector('.cm-date-picker__value').textContent, '10.09.2026');
  assert.equal(document.activeElement, trigger);

  trigger.click();
  const outside = document.getElementById('outside');
  outside.focus();
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, outside);
  runtime.stop();
  trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('Vanilla range submits ordered values and retains the field name across runtime restarts', (context) => {
  const { window } = new JSDOM(`<form>${markup}</form>`, { pretendToBeVisual: true });
  const { document } = window;
  const runtime = new CmRuntime().register('date-picker', createCmDatePickerController);
  context.after(() => {
    runtime.stop();
    window.close();
  });
  const root = document.querySelector('[data-cm-controller="date-picker"]');
  const trigger = root.querySelector('.cm-date-picker');
  const form = document.querySelector('form');
  const currentValues = () => new window.FormData(form).getAll('launch_date');
  Object.assign(trigger.dataset, {
    cmDatePickerMode: 'range',
    cmDisplayFormat: 'dd.MM.yyyy',
    cmMin: '2026-08-01',
    cmMax: '2026-08-31',
  });
  const day = (value) => root.querySelector(`[data-cm-date-picker-value="${value}"]`);
  const changes = [];
  root.addEventListener('cm:date-picker-selection-change', (event) => changes.push(event.detail));

  runtime.start(document);
  assert.deepEqual(currentValues(), []);
  assert.equal(root.querySelector('[role="grid"]').getAttribute('aria-multiselectable'), 'true');
  runtime.stop();
  runtime.start(document);
  trigger.click();
  day('2026-08-20').click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(currentValues(), ['2026-08-20']);
  day('2026-08-13').click();
  assert.deepEqual(currentValues(), ['2026-08-13', '2026-08-20']);
  assert.deepEqual(changes, [
    { mode: 'range', values: ['2026-08-20'] },
    { mode: 'range', values: ['2026-08-13', '2026-08-20'] },
  ]);
  assert.equal(root.querySelector('.cm-date-picker__value').textContent, '13.08.2026 – 20.08.2026');
  assert.equal(document.activeElement, trigger);
  trigger.click();
  assert.equal(day('2026-08-14').getAttribute('aria-selected'), 'true');
  runtime.stop();
  trigger.disabled = true;
  runtime.start(document);
  assert.deepEqual(currentValues(), []);
});

test('resets authored Vanilla dates after a canceled reset, cleanup, and DOM reinsertion', async (context) => {
  const range = readFileSync(new URL('../../../contracts/date-picker/cases/range.html', import.meta.url), 'utf8');
  const { window } = new JSDOM(`<form id="dates"></form><form id="unrelated"></form>${range}`);
  const { document } = window;
  const runtime = new CmRuntime().register('date-picker', createCmDatePickerController);
  context.after(() => {
    runtime.stop();
    window.close();
  });
  const root = document.querySelector('[data-cm-controller="date-picker"]');
  const clear = root.querySelector('[data-cm-date-picker-clear]');
  const form = document.getElementById('dates');
  for (const input of root.querySelectorAll('input')) input.setAttribute('form', form.id);
  const currentValues = () => new window.FormData(form).getAll('release_window');
  const finishReset = () => new Promise((resolve) => window.setTimeout(resolve, 0));
  runtime.start(document);
  clear.click();
  assert.deepEqual(currentValues(), []);

  document.getElementById('unrelated').reset();
  form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  form.reset();
  await finishReset();
  assert.deepEqual(currentValues(), []);

  form.reset();
  runtime.stop();
  await finishReset();
  assert.deepEqual(currentValues(), []);

  runtime.start(document);
  root.remove();
  await finishReset();
  document.body.append(root);
  await finishReset();
  form.reset();
  await finishReset();
  assert.deepEqual(currentValues(), ['2026-08-13', '2026-08-20']);
  assert.equal(root.querySelector('.cm-date-picker__value').textContent, '08/13/26 – 08/20/26');
  assert.equal(clear.hidden, false);
});

for (const [name, id, initialLabel, selection, field] of [
  ['month', 'billing-month', '2026', '2027-08', 'billing_month'],
  ['year', 'license-year', '2020–2031', '2038', 'license_year'],
]) {
  test(`Vanilla navigates and submits a ${name} choice`, (context) => {
    const markup = readFileSync(new URL(`../../../contracts/date-picker/cases/${name}.html`, import.meta.url), 'utf8');
    const { window } = new JSDOM(`<form>${markup}</form>`);
    const { document } = window;
    const runtime = new CmRuntime().register('date-picker', createCmDatePickerController);
    context.after(() => {
      runtime.stop();
      window.close();
    });
    runtime.start(document);
    const trigger = document.getElementById(id);
    trigger.click();
    assert.equal(document.querySelector('[data-cm-date-picker-month]').textContent, initialLabel);
    assert.equal(document.querySelectorAll('[role="gridcell"]').length, 12);
    document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    assert.equal(document.activeElement.dataset.cmDatePickerValue, selection);
    document.activeElement.click();
    assert.equal(new window.FormData(document.querySelector('form')).get(field), selection);
    assert.equal(document.activeElement, trigger);
  });
}

test('aligns wall time to the configured minute step without converting timezone', () => {
  assert.equal(calendarTimeValue('2026-03-08T02:30'), 150);
  assert.equal(calendarTimeValue('2026-03-08T02:30Z'), null);
  assert.equal(formatDisplayDate('2026-03-08T02:30', 'en-US', 'yyyy-MM-dd HH:mm'), '2026-03-08 02:30');
  assert.deepEqual(
    calendarTimesForDay('2026-08-13', { min: '2026-08-13T09:25', max: '2026-08-13T09:55', minuteStep: 15 }),
    [570, 585],
  );
  assert.equal(
    calendarDateHasTime('2026-08-13', { min: '2026-08-13T09:31', max: '2026-08-13T09:44', minuteStep: 15 }),
    false,
  );
});

test('Vanilla time controls submit ISO wall time and keep time bounds after a date selection', (context) => {
  const markup = readFileSync(new URL('../../../contracts/date-picker/cases/time.html', import.meta.url), 'utf8');
  const { window } = new JSDOM(`<form>${markup}</form>`);
  const { document } = window;
  const runtime = new CmRuntime().register('date-picker', createCmDatePickerController);
  context.after(() => {
    runtime.stop();
    window.close();
  });
  runtime.start(document);
  const trigger = document.getElementById('release-time');
  trigger.click();
  const hour = document.querySelector('[data-cm-date-picker-hour]');
  const minute = document.querySelector('[data-cm-date-picker-minute]');
  assert.equal(hour.value, '9');
  assert.equal(minute.value, '30');
  assert.equal(hour.querySelector('option[value="8"]').disabled, true);
  assert.equal(minute.querySelector('option[value="0"]').disabled, true);

  const change = (select, value) => {
    select.value = value;
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const tenOClock = hour.querySelector('option[value="10"]');
  change(hour, '10');
  assert.equal(hour.querySelector('option[value="10"]'), tenOClock);
  change(minute, '45');
  const submitted = () => new window.FormData(document.querySelector('form')).get('release_time');
  assert.equal(submitted(), '2026-08-13T10:45');
  document.querySelector('[data-cm-date-picker-value="2026-08-14"]').click();
  assert.equal(minute.value, '30');
  assert.equal(submitted(), '2026-08-14T10:30');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(trigger.textContent.trim(), '14.08.2026 10:30');
});
