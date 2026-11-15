import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { calendarKeyTarget } from '../dist/core/index.js';
import { CmRuntime, createCmDatePickerController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../contracts/date-picker/cases/default.html', import.meta.url), 'utf8');

test('calendar key targets clamp shorter months and follow the direction and start of the week', () => {
  assert.equal(calendarKeyTarget('2024-01-31', 'PageDown'), '2024-02-29');
  assert.equal(calendarKeyTarget('2026-08-13', 'Home', 1), '2026-08-10');
  assert.equal(calendarKeyTarget('2026-08-13', 'End', 1), '2026-08-16');
  assert.equal(calendarKeyTarget('2026-08-13', 'ArrowLeft', 1, true), '2026-08-14');
  assert.equal(calendarKeyTarget('2026-08-13', 'ArrowRight', 1, true), '2026-08-12');
  assert.equal(calendarKeyTarget('2026-08-13', 'Enter'), null);
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
