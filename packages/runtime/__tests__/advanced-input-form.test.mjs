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
