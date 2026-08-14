import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmSelectController } from '../dist/index.js';

test('clears the native selection, reports change, and keeps focus', () => {
  const dom = new JSDOM(`
    <div class="cm-select-wrap" data-cm-controller="select">
      <select name="frequency" data-cm-select-control>
        <option value="" hidden></option>
        <option value="daily" selected>Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button type="button" data-cm-select-clear>×</button>
    </div>
  `);
  const select = dom.window.document.querySelector('select');
  const clear = dom.window.document.querySelector('button');
  const values = [];
  select.addEventListener('change', () => values.push(select.value));
  new CmRuntime().register('select', createCmSelectController).start(dom.window.document);

  select.value = 'weekly';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(clear.hidden, false);
  clear.click();
  assert.deepEqual(values, ['weekly', '']);
  assert.equal(clear.hidden, true);
  assert.equal(dom.window.document.activeElement, select);
  assert.equal(new dom.window.FormData(wrapInForm(dom, select)).get('frequency'), '');
});

function wrapInForm(dom, select) {
  const form = dom.window.document.createElement('form');
  form.append(select.closest('.cm-select-wrap'));
  return form;
}
