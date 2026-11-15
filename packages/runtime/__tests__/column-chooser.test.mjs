import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmColumnChooserController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../contracts/column-chooser/cases/default.html', import.meta.url), 'utf8');

function setup(context) {
  const { window } = new JSDOM(markup);
  const root = window.document.querySelector('.cm-column-chooser');
  const [all, name, owner, size] = root.querySelectorAll('input');
  const events = [];
  const checkedAtEvent = [];
  const runtime = new CmRuntime().register('column-chooser', createCmColumnChooserController);
  root.addEventListener('cm:column-chooser-visible-columns-change', (event) => {
    events.push(event.detail.visibleColumnKeys);
    checkedAtEvent.push(
      [...root.querySelectorAll('[data-cm-column-chooser-key]:checked')].map(
        (input) => input.dataset.cmColumnChooserKey,
      ),
    );
  });
  context.after(() => {
    runtime.stop();
    window.close();
  });
  return { all, checkedAtEvent, events, name, owner, root, runtime, size };
}

test('keeps required columns selected and reports checkboxes in declaration order', (context) => {
  const { all, checkedAtEvent, events, name, owner, root, runtime, size } = setup(context);
  runtime.start(root);
  runtime.start(root);

  owner.click();
  assert.equal(all.checked, false);
  assert.equal(all.indeterminate, true);
  size.click();
  assert.equal(all.indeterminate, false);
  name.click();
  assert.equal(name.checked, true);
  size.click();
  all.click();
  assert.equal(all.checked, true);
  assert.equal(all.indeterminate, false);
  all.click();
  assert.equal(name.checked, true);
  assert.equal(owner.checked, false);
  assert.equal(size.checked, false);

  assert.deepEqual(events, [['name', 'size'], ['name'], ['name', 'size'], ['name', 'owner', 'size'], ['name']]);
  assert.deepEqual(checkedAtEvent, events);
});

test('restores the checked and mixed states declared by server markup without dispatching changes', (context) => {
  const { all, events, name, owner, root, runtime } = setup(context);
  name.checked = false;
  owner.checked = false;
  root.querySelector('button').disabled = true;

  runtime.start(root);

  assert.equal(name.checked, true);
  assert.equal(owner.checked, false);
  assert.equal(owner.disabled, true);
  assert.equal(all.checked, false);
  assert.equal(all.indeterminate, true);
  assert.equal(all.disabled, true);
  assert.deepEqual(events, []);
});

test('disables the aggregate control when all columns are required and cleans up before restart', (context) => {
  const { all, events, owner, root, runtime, size } = setup(context);
  owner.setAttribute('data-cm-column-chooser-required', '');
  size.setAttribute('data-cm-column-chooser-required', '');
  runtime.start(root);
  assert.equal(all.checked, true);
  assert.equal(all.disabled, true);

  runtime.stop(root);
  owner.removeAttribute('data-cm-column-chooser-required');
  owner.disabled = false;
  owner.click();
  assert.deepEqual(events, []);

  runtime.start(root);
  assert.equal(all.disabled, false);
  owner.click();
  assert.deepEqual(events, [['name', 'owner', 'size']]);
});
