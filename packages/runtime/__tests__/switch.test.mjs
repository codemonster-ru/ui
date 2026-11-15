import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmSwitchController } from '../dist/index.js';

test('mirrors the native switch state through activation and reset, and disconnects', async () => {
  const { window } = new JSDOM(
    '<form><label data-cm-controller="switch"><input type="checkbox" class="cm-switch__input" role="switch"></label></form>',
  );
  try {
    const { document } = window;
    const input = document.querySelector('input');
    const runtime = new CmRuntime().register('switch', createCmSwitchController);
    runtime.start(document);
    assert.equal(input.getAttribute('aria-checked'), 'false');
    input.click();
    assert.equal(input.getAttribute('aria-checked'), 'true');
    input.form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    assert.equal(input.getAttribute('aria-checked'), 'false');
    runtime.stop(document);
    input.click();
    assert.equal(input.checked, true);
    assert.equal(input.getAttribute('aria-checked'), 'false');
  } finally {
    window.close();
  }
});

test('mirrors resets after the switch is associated with another form', async (context) => {
  const { window } = new JSDOM(`
    <form id="first"></form>
    <form id="second"></form>
    <label data-cm-controller="switch">
      <input type="checkbox" class="cm-switch__input" role="switch" form="first">
    </label>
  `);
  const { document } = window;
  const input = document.querySelector('input');
  const runtime = new CmRuntime().register('switch', createCmSwitchController);
  context.after(() => {
    runtime.stop();
    window.close();
  });
  runtime.start(document);

  input.setAttribute('form', 'second');
  input.click();
  input.form.reset();
  await new Promise((resolve) => window.setTimeout(resolve, 0));

  assert.equal(input.checked, false);
  assert.equal(input.getAttribute('aria-checked'), 'false');
});

test('mirrors native form reset within an explicitly enhanced shadow root', async (context) => {
  const { window } = new JSDOM('<div></div>');
  const root = window.document.querySelector('div').attachShadow({ mode: 'open' });
  root.innerHTML =
    '<form><label data-cm-controller="switch"><input class="cm-switch__input" type="checkbox" role="switch"></label></form>';
  const input = root.querySelector('input');
  const runtime = new CmRuntime().register('switch', createCmSwitchController);
  context.after(() => {
    runtime.stop();
    window.close();
  });
  runtime.start(root);

  input.click();
  assert.equal(input.getAttribute('aria-checked'), 'true');
  input.form.reset();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.equal(input.checked, false);
  assert.equal(input.getAttribute('aria-checked'), 'false');
});
