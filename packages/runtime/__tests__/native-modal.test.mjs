import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { enterCmNativeModal } from '@codemonster-ru/ui-runtime/native-modal';

function createDocument(context, clientWidth = 785) {
  const dom = new JSDOM('<dialog id="outer" open></dialog><dialog id="inner"></dialog>');
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;
  Object.defineProperty(root, 'clientWidth', { value: clientWidth });
  window.innerWidth = 800;
  window.scrollX = 12;
  window.scrollY = 120;
  context.after(() => dom.window.close());
  for (const dialog of document.querySelectorAll('dialog')) {
    const matches = dialog.matches.bind(dialog);
    dialog.matches = (selector) => (selector === ':modal' ? dialog.hasAttribute('data-top-layer') : matches(selector));
    dialog.showModal = () => {
      assert.equal(dialog.open, false);
      dialog.open = true;
      dialog.setAttribute('data-top-layer', '');
    };
  }
  return { document, root, window };
}

test('retains classic scrollbar space and restores the original scroll after the last modal', (context) => {
  const { document, root, window } = createDocument(context);
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  const scrollCalls = [];
  window.scrollTo = (options) => scrollCalls.push(options);

  const releaseOuter = enterCmNativeModal(outer);
  assert.equal(root.dataset.cmModalScroll, 'gutter');
  assert.ok(outer.matches(':modal'));
  const releaseInner = enterCmNativeModal(inner);
  window.scrollY = 260;
  releaseInner();
  releaseInner();
  assert.equal(root.dataset.cmModalScroll, 'gutter');
  assert.equal(scrollCalls.length, 0);

  releaseOuter();
  assert.equal(root.hasAttribute('data-cm-modal-scroll'), false);
  assert.deepEqual(scrollCalls, [{ left: 12, top: 120, behavior: 'instant' }]);
});

test('does not add a gutter and reuses the existing lease when a native dialog reopens', (context) => {
  const { document, root } = createDocument(context, 800);
  const dialog = document.querySelector('#outer');
  const release = enterCmNativeModal(dialog);
  assert.equal(root.dataset.cmModalScroll, 'locked');
  dialog.open = false;
  dialog.removeAttribute('data-top-layer');
  assert.equal(enterCmNativeModal(dialog, release), release);
  assert.ok(dialog.matches(':modal'));
  release();
  assert.equal(root.hasAttribute('data-cm-modal-scroll'), false);
});

test('can relinquish the document lease while keeping a dialog in the native modal stack', (context) => {
  const { document, root } = createDocument(context);
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  const initialLease = enterCmNativeModal(outer);

  inner.setAttribute('data-cm-modal-unlocked', '');
  assert.equal(enterCmNativeModal(inner), undefined);
  assert.equal(root.dataset.cmModalScroll, 'gutter');
  outer.setAttribute('data-cm-modal-unlocked', '');
  assert.equal(enterCmNativeModal(outer, initialLease), undefined);
  assert.equal(root.hasAttribute('data-cm-modal-scroll'), false);
  assert.ok(outer.matches(':modal'));
  assert.ok(inner.matches(':modal'));

  inner.removeAttribute('data-cm-modal-unlocked');
  const resumed = enterCmNativeModal(inner);
  assert.equal(root.dataset.cmModalScroll, 'gutter');
  resumed();
  assert.equal(root.hasAttribute('data-cm-modal-scroll'), false);
});

test('releases the document lock when the native modal cannot enter the top layer', (context) => {
  const { document, root } = createDocument(context);
  const dialog = document.querySelector('#outer');
  dialog.showModal = () => {
    throw new Error('Failed to open');
  };
  assert.throws(() => enterCmNativeModal(dialog), /Failed to open/u);
  assert.equal(root.hasAttribute('data-cm-modal-scroll'), false);
});
