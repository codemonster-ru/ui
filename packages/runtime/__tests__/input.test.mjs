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

test('honors readonly and disabled native input state before clearing', () => {
  const { dom, input, clear } = inputFixture();
  const runtime = new CmRuntime().register('input', createCmInputController);
  runtime.start(dom.window.document);

  input.readOnly = true;
  clear.click();
  assert.equal(input.value, 'secret');
  input.readOnly = false;
  input.disabled = true;
  clear.click();
  assert.equal(input.value, 'secret');

  runtime.stop();
  dom.window.close();
});

test('updates the clear affordance after native reset and stops observing on disposal', async () => {
  const { dom, input, clear } = inputFixture();
  const form = input.form;
  const runtime = new CmRuntime().register('input', createCmInputController);
  runtime.start(dom.window.document);
  const reset = async () => {
    form.reset();
    await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
  };

  clear.click();
  assert.equal(input.value, '');
  assert.equal(clear.hidden, true);
  await reset();
  assert.equal(input.value, 'secret');
  assert.equal(clear.hidden, false);

  clear.click();
  runtime.stop();
  await reset();
  assert.equal(clear.hidden, true);
  runtime.start(dom.window.document);
  assert.equal(clear.hidden, false);

  runtime.stop();
  dom.window.close();
});

function inputFixture() {
  const dom = new JSDOM(`
    <form>
      <div class="cm-input-wrap" data-cm-controller="input">
        <input type="password" value="secret" data-cm-input-control>
        <button type="button" data-cm-input-password data-cm-input-show-password-label="Show secret" data-cm-input-hide-password-label="Hide secret" aria-pressed="false"><span aria-hidden="true">◉</span></button>
        <button type="button" data-cm-input-clear>×</button>
      </div>
    </form>
  `);
  return {
    dom,
    input: dom.window.document.querySelector('input'),
    password: dom.window.document.querySelector('[data-cm-input-password]'),
    clear: dom.window.document.querySelector('[data-cm-input-clear]'),
  };
}
