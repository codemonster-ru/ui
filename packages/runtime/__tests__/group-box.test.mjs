import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmGroupBoxController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../contracts/group-box/cases/default.html', import.meta.url), 'utf8');

function setup(context) {
  const { window } = new JSDOM(`<form>${markup}</form>`);
  const form = window.document.querySelector('form');
  const root = form.querySelector('fieldset');
  const trigger = form.querySelector('button');
  const content = form.querySelector('.cm-group-box__content');
  const input = form.querySelector('input');
  const runtime = new CmRuntime().register('group-box', createCmGroupBoxController);
  const changes = [];
  form.addEventListener('cm:group-box-collapsed-change', (event) => changes.push(event.detail.collapsed));
  context.after(() => {
    runtime.stop();
    window.close();
  });
  return { changes, content, form, input, root, runtime, trigger, window };
}

test('hides the region and excludes collapsed fields while preserving the native trigger and values', (context) => {
  const { changes, content, form, input, root, runtime, trigger, window } = setup(context);
  runtime.start(root);
  runtime.start(root);
  assert.equal(new window.FormData(form).get('reference'), 'PO-123');

  trigger.click();
  assert.equal(content.hidden, true);
  assert.equal(trigger.matches(':disabled'), false);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(new window.FormData(form).has('reference'), false);
  input.value = '';
  assert.equal(form.checkValidity(), true);
  input.value = 'saved edit';

  trigger.click();
  assert.equal(content.hidden, false);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(new window.FormData(form).get('reference'), 'saved edit');
  assert.deepEqual(changes, [true, false]);
});

test('uses server-rendered collapsed state and reconnects after disposal', (context) => {
  const { changes, content, root, runtime, trigger } = setup(context);
  content.hidden = true;
  trigger.disabled = true;
  runtime.start(root);

  trigger.click();
  assert.equal(root.disabled, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(changes, []);

  runtime.stop(root);
  trigger.disabled = false;
  trigger.click();
  assert.equal(content.hidden, true);
  runtime.start(root);
  trigger.click();
  assert.equal(root.disabled, false);
  assert.equal(content.hidden, false);
  assert.deepEqual(changes, [false]);
});
