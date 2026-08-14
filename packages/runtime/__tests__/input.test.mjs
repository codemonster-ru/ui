import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmInputController } from '../dist/index.js';

test('clears the native value, reports input, and keeps focus', () => {
  const { dom, input, clear } = inputFixture();
  const values = [];
  input.addEventListener('input', () => values.push(input.value));
  new CmRuntime().register('input', createCmInputController).start(dom.window.document);

  assert.equal(clear.hidden, false);
  input.value = 'changed';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(clear.hidden, false);
  clear.click();
  assert.deepEqual(values, ['changed', '']);
  assert.equal(clear.hidden, true);
  assert.equal(dom.window.document.activeElement, input);
});

test('toggles password visibility and localized state without changing the value or selection', () => {
  const { dom, input, password } = inputFixture();
  new CmRuntime().register('input', createCmInputController).start(dom.window.document);
  input.focus();
  input.setSelectionRange(1, 4);

  password.click();
  assert.equal(input.type, 'text');
  assert.equal(input.value, 'secret');
  assert.equal(password.getAttribute('aria-label'), 'Hide secret');
  assert.equal(password.getAttribute('aria-pressed'), 'true');
  assert.deepEqual([input.selectionStart, input.selectionEnd], [1, 4]);

  password.click();
  assert.equal(input.type, 'password');
  assert.equal(password.getAttribute('aria-label'), 'Show secret');
  assert.equal(password.getAttribute('aria-pressed'), 'false');
});

function inputFixture() {
  const dom = new JSDOM(`
    <div class="cm-input-wrap" data-cm-controller="input">
      <input type="password" value="secret" data-cm-input-control>
      <button type="button" data-cm-input-password data-cm-input-show-password-label="Show secret" data-cm-input-hide-password-label="Hide secret" aria-pressed="false"><span aria-hidden="true">◉</span></button>
      <button type="button" data-cm-input-clear>×</button>
    </div>
  `);
  return {
    dom,
    input: dom.window.document.querySelector('input'),
    password: dom.window.document.querySelector('[data-cm-input-password]'),
    clear: dom.window.document.querySelector('[data-cm-input-clear]'),
  };
}
