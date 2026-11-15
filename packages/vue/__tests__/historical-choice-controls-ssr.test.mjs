import assert from 'node:assert/strict';
import test from 'node:test';
import { VfCheckbox, VfRadio } from '@codemonster-ru/ui-vue/historical';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';

async function render(component, props, slots) {
  return JSDOM.fragment(await renderToString(h(component, props, slots))).firstElementChild;
}

test('historical checkbox SSR renders the label slot and mixed state on one native input', async () => {
  const root = await render(VfCheckbox, { name: 'selection', required: true, indeterminate: true }, () => 'Select all');
  const input = root.querySelector('input');
  assert.equal(root.className, 'cm-checkbox cm-checkbox--md');
  assert.equal(root.querySelectorAll('input').length, 1);
  assert.equal(root.querySelector('.cm-checkbox__content')?.textContent, 'Select all');
  assert.equal(input.type, 'checkbox');
  assert.equal(input.name, 'selection');
  assert.equal(input.checked, false);
  assert.equal(input.required, true);
  assert.equal(input.getAttribute('aria-checked'), 'mixed');
});

test('historical radio SSR distinguishes an omitted model from a selected false value', async () => {
  const props = { name: 'setting', value: false, label: 'No' };
  const initial = await render(VfRadio, props);
  const selected = await render(VfRadio, { ...props, modelValue: false });
  assert.equal(initial.className, 'cm-radio cm-radio--md');
  assert.equal(initial.querySelector('.cm-radio__content')?.textContent, 'No');
  assert.equal(initial.querySelector('input')?.checked, false);
  assert.equal(selected.querySelector('input')?.checked, true);
  assert.equal(selected.querySelector('input')?.value, 'false');
});
