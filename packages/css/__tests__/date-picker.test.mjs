import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const datePicker = await readFile(new URL('../src/components/date-picker.css', import.meta.url), 'utf8');

test('styles the DatePicker clear action and wrapper focus state', () => {
  assert.match(datePicker, /\.cm-date-picker-wrap:focus-within/u);
  assert.match(datePicker, /\.cm-date-picker__clear\[hidden\]/u);
});
