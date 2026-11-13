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
    await Promise.resolve();
    assert.equal(input.getAttribute('aria-checked'), 'false');
    runtime.stop(document);
    input.click();
    assert.equal(input.checked, true);
    assert.equal(input.getAttribute('aria-checked'), 'false');
  } finally {
    window.close();
  }
});
