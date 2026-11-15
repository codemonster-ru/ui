import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { connectConfirmDialog } from '../../../examples/vanilla/confirm-dialog-example.mjs';
import { CmRuntime, createCmDialogController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../examples/vanilla/confirm-dialog-example.html', import.meta.url), 'utf8');

function setup(context, archiveDraft) {
  const { window } = new JSDOM(markup);
  const { document } = window;
  const opener = document.querySelector('#archive-draft');
  const dialog = document.querySelector('#confirm-archive');
  const cancel = document.querySelector('#cancel-archive');
  const confirm = document.querySelector('#approve-archive');
  const close = document.querySelector('[data-cm-dialog-close]');
  const error = document.querySelector('#archive-error');
  const status = document.querySelector('#archive-status');
  const runtime = new CmRuntime().register('dialog', createCmDialogController);
  runtime.start(document);
  connectConfirmDialog(document, archiveDraft);
  context.after(() => {
    runtime.stop();
    window.close();
  });

  opener.focus();
  opener.click();
  assert.equal(dialog.open, true);
  assert.equal(document.activeElement, cancel);
  return { cancel, close, confirm, dialog, document, error, opener, status, window };
}

test('blocks duplicate confirmation and dismissal while pending, then returns focus on success', async (context) => {
  let calls = 0;
  let resolveArchive;
  const archive = new Promise((resolve) => {
    resolveArchive = resolve;
  });
  const { cancel, close, confirm, dialog, document, opener, status, window } = setup(context, () => {
    calls += 1;
    return archive;
  });

  confirm.click();
  confirm.click();
  cancel.click();
  close.click();
  dialog.click();
  dialog.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(calls, 1);
  assert.equal(dialog.getAttribute('aria-busy'), 'true');
  assert.equal(dialog.open, true);

  resolveArchive();
  await archive;
  assert.equal(dialog.getAttribute('aria-busy'), 'false');
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, opener);
  assert.equal(status.textContent, 'Draft archived.');
});

test('offers a retry after failure and closes safely when canceled', async (context) => {
  const { cancel, confirm, dialog, document, error, opener, status } = setup(context, async () => {
    throw new Error('Request failed');
  });
  confirm.click();
  await Promise.resolve();
  assert.equal(dialog.open, true);
  assert.equal(error.hidden, false);
  assert.equal(confirm.disabled, false);
  assert.equal(document.activeElement, confirm);

  cancel.click();
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, opener);
  assert.equal(status.textContent, 'Archive canceled.');
});
