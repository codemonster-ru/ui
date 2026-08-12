import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmCheckboxController } from '../dist/index.js';

test('restores and releases the native indeterminate property', () => {
  const dom = new JSDOM(`
    <label class="cm-checkbox" data-cm-controller="checkbox" data-cm-checkbox-indeterminate="true">
      <input class="cm-checkbox__input" type="checkbox">
    </label>
  `);
  const root = dom.window.document.querySelector('.cm-checkbox');
  const input = dom.window.document.querySelector('input');
  const controller = new CmCheckboxController(root);

  controller.connect();
  assert.equal(input.indeterminate, true);

  controller.disconnect();
  assert.equal(input.indeterminate, false);
});

test('rejects roots without the contracted native control', () => {
  const dom = new JSDOM('<label class="cm-checkbox"></label>');
  assert.throws(() => new CmCheckboxController(dom.window.document.body.firstElementChild), /native checkbox/u);
});
