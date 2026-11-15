import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmDatePickerController, createCmSelectController } from '../dist/index.js';

const cases = [
  ['select', 'selected', 'status', 'draft', createCmSelectController],
  ['date-picker', 'value', 'review_date', '2026-08-13', createCmDatePickerController],
];

for (const [slug, basename, name, value, factory] of cases) {
  test(`${slug} excludes a disabled control but submits an enabled value`, (context) => {
    const path = `../../../contracts/${slug}/cases/${basename}.html`;
    const markup = readFileSync(new URL(path, import.meta.url), 'utf8');
    const { window } = new JSDOM(`<form>${markup}</form>`);
    const { document } = window;
    const form = document.querySelector('form');
    const input = document.querySelector('input[type="hidden"]');
    const trigger = document.querySelector('button[role="combobox"]');
    const runtime = new CmRuntime().register(slug, factory);
    context.after(() => {
      runtime.stop();
      window.close();
    });

    assert.equal(new window.FormData(form).get(name), value);
    trigger.disabled = true;
    runtime.start(document);

    assert.equal(input.disabled, true);
    assert.equal(new window.FormData(form).has(name), false);
    assert.equal(input.value, value);
  });
}

test('Select restores authored form defaults after reset without dispatching a value change', async (context) => {
  const markup = readFileSync(new URL('../../../contracts/select/cases/clearable.html', import.meta.url), 'utf8');
  const { window } = new JSDOM(`<form id="settings"></form>${markup}`);
  const { document } = window;
  const form = document.querySelector('form');
  const select = document.querySelector('[data-cm-controller="select"]');
  const input = select.querySelector('input[type="hidden"]');
  const clear = select.querySelector('[data-cm-select-clear]');
  const value = select.querySelector('.cm-select__value');
  const originalLabel = value.textContent;
  input.setAttribute('form', form.id);
  const runtime = new CmRuntime().register('select', createCmSelectController);
  const nextTask = () => new Promise((resolve) => window.setTimeout(resolve, 0));
  context.after(() => {
    runtime.stop();
    window.close();
  });

  const changes = [];
  select.addEventListener('cm:select-value-change', (event) => changes.push(event.detail.value));
  runtime.start(document);
  clear.click();
  assert.equal(new window.FormData(form).get(input.name), '');
  assert.equal(clear.hidden, true);

  window.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  form.reset();
  await nextTask();
  assert.equal(new window.FormData(form).get(input.name), '');

  form.reset();
  runtime.stop();
  await nextTask();
  assert.equal(new window.FormData(form).get(input.name), '');

  // Reinitializing the same markup must not replace the authored default with the cleared value.
  runtime.start(document);
  form.reset();
  window.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  form.reset();
  await nextTask();
  assert.equal(new window.FormData(form).get(input.name), 'weekly');
  assert.equal(value.textContent, originalLabel);
  assert.equal(clear.hidden, false);
  assert.equal(select.querySelector('[data-cm-select-value="weekly"]').getAttribute('aria-selected'), 'true');
  assert.deepEqual(changes, ['']);
});
