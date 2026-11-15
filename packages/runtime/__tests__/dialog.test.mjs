import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmDialogController } from '@codemonster-ru/ui-runtime';

test('nested Vanilla dialogs own Escape, cancel, close buttons and focus', (context) => {
  const dom = new JSDOM(`
    <button id="opener">Open outer</button>
    <dialog data-cm-controller="dialog" id="outer" aria-label="Outer">
      <button id="outer-close" data-cm-dialog-close>Close outer</button>
      <button id="inner-opener" data-autofocus>Open inner</button>
      <dialog data-cm-controller="dialog" id="inner" aria-label="Inner" data-cm-dialog-close-on-escape="false">
        <button id="inner-close" data-cm-dialog-close autofocus>Close inner</button>
      </dialog>
    </dialog>`);
  const { document, CustomEvent, Event, KeyboardEvent } = dom.window;
  const runtime = new CmRuntime().register('dialog', createCmDialogController);
  runtime.start(document);
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  const closeInner = document.querySelector('#inner-close');
  const opener = document.querySelector('#opener');
  const openerInner = document.querySelector('#inner-opener');

  const requestOpen = (dialog) => dialog.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  const pressEscape = (target) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

  opener.focus();
  requestOpen(outer);
  assert.equal(document.activeElement, openerInner);
  requestOpen(inner);
  assert.equal(document.activeElement, closeInner);
  assert.equal(pressEscape(closeInner), false);
  assert.equal(inner.dispatchEvent(new Event('cancel', { cancelable: true })), false);
  assert.equal(inner.open, true);
  assert.equal(outer.open, true);

  closeInner.click();
  assert.equal(inner.open, false);
  assert.equal(outer.open, true);
  assert.equal(document.activeElement, openerInner);
  pressEscape(openerInner);
  assert.equal(outer.open, false);
  assert.equal(document.activeElement, opener);
});
