import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { captureCmModalFocus, cmModalReturnFocus, enterCmNativeModal } from '@codemonster-ru/ui-runtime/native-modal';

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

test('remembers a nested modal’s clicked opener even when the parent keeps focus', async (context) => {
  const { document, window } = createDocument(context);
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  outer.tabIndex = -1;
  outer.innerHTML = '<button><span>Open confirmation</span></button><input>';
  const button = outer.querySelector('button');
  const input = outer.querySelector('input');
  const click = () =>
    button.firstElementChild.dispatchEvent(new window.MouseEvent('click', { bubbles: true, detail: 1 }));
  context.after(enterCmNativeModal(outer));

  outer.focus();
  click();
  await Promise.resolve();
  assert.equal(cmModalReturnFocus(inner), button);
  assert.equal(cmModalReturnFocus(inner), outer);

  click();
  input.focus();
  assert.equal(cmModalReturnFocus(inner), input);

  outer.focus();
  click();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.equal(cmModalReturnFocus(inner), outer);
});

test('restores focus to the next row action, previous row action, or drawer when the opener is removed', (context) => {
  const { document } = createDocument(context);
  const drawer = document.querySelector('#outer');
  const confirmation = document.querySelector('#inner');
  drawer.className = 'cm-drawer';
  drawer.tabIndex = -1;
  drawer.innerHTML = `
    <ul>
      <li><button id="earlier">Edit older report</button></li>
      <li><button id="previous">Edit monthly report</button></li>
      <li><button id="opener">Delete draft</button></li>
      <li id="unavailable"><button disabled>Unavailable action</button></li>
      <li><button id="next">Edit annual report</button></li>
    </ul>
    <button>Save changes</button>
  `;
  const opener = drawer.querySelector('#opener');
  const next = drawer.querySelector('#next');
  const previous = drawer.querySelector('#previous');
  const earlier = drawer.querySelector('#earlier');
  opener.focus();
  const focus = captureCmModalFocus(confirmation);
  drawer.focus();
  focus.restore();
  assert.equal(document.activeElement, opener);

  opener.closest('li').remove();
  focus.restore();
  assert.equal(document.activeElement, next);

  const last = captureCmModalFocus(confirmation);
  next.closest('li').remove();
  last.restore();
  assert.equal(document.activeElement, previous);

  const withoutAction = captureCmModalFocus(confirmation);
  const remainingRow = drawer.querySelector('#unavailable');
  previous.closest('li').remove();
  earlier.closest('li').remove();
  withoutAction.restore();
  assert.equal(document.activeElement, remainingRow);
  assert.equal(remainingRow.tabIndex, -1);

  const onlyRow = captureCmModalFocus(confirmation);
  remainingRow.remove();
  onlyRow.restore();
  assert.equal(document.activeElement, drawer);
});

for (const replaceGroup of [false, true]) {
  test(`restores focus by row position when the ${replaceGroup ? 'whole list' : 'rows'} rerender`, (context) => {
    const { document } = createDocument(context);
    const drawer = document.querySelector('#outer');
    const confirmation = document.querySelector('#inner');
    drawer.className = 'cm-drawer';
    drawer.innerHTML = `
      <ul>
        <li><button id="previous">Edit previous draft</button></li>
        <li><button id="opener">Delete draft</button></li>
        <li><button id="next">Edit next draft</button></li>
      </ul>
    `;
    const group = drawer.querySelector('ul');
    const opener = group.querySelector('#opener');
    const oldNext = group.querySelector('#next');
    opener.focus();
    const focus = captureCmModalFocus(confirmation);
    const replacement = group.cloneNode(true);
    replacement.querySelector('#opener').closest('li').remove();

    if (replaceGroup) group.replaceWith(replacement);
    else group.replaceChildren(...replacement.children);
    assert.equal(oldNext.isConnected, false);
    focus.restore();
    assert.equal(document.activeElement, drawer.querySelector('#next'));

    const last = captureCmModalFocus(confirmation);
    const current = drawer.querySelector('ul');
    const rerendered = current.cloneNode(true);
    rerendered.querySelector('#next').closest('li').remove();
    current.replaceWith(rerendered);
    last.restore();
    assert.equal(document.activeElement, drawer.querySelector('#previous'));
  });
}

test('does not send focus to a different list when the opener’s list disappears', (context) => {
  const { document } = createDocument(context);
  const drawer = document.querySelector('#outer');
  const confirmation = document.querySelector('#inner');
  drawer.className = 'cm-drawer';
  drawer.tabIndex = -1;
  drawer.innerHTML =
    '<ul><li><button>Delete draft</button></li></ul><ul><li><button>Unrelated action</button></li></ul>';
  drawer.querySelector('button').focus();
  const focus = captureCmModalFocus(confirmation);
  drawer.querySelector('ul').remove();
  focus.restore();
  assert.equal(document.activeElement, drawer);
});

for (const identity of ['id', 'data-cm-data-table-row']) {
  test(`finds the next surviving original neighbor by ${identity} after sorting`, (context) => {
    const { document } = createDocument(context);
    const drawer = document.querySelector('#outer');
    const confirmation = document.querySelector('#inner');
    drawer.className = 'cm-drawer';
    drawer.innerHTML = `
      <ul>
        <li ${identity}="earlier"><button>Edit earlier draft</button></li>
        <li ${identity}="previous"><button>Edit previous draft</button></li>
        <li ${identity}="opener"><button>Delete draft</button></li>
        <li ${identity}="next"><button>Edit next draft</button></li>
        <li ${identity}="later"><button>Edit later draft</button></li>
      </ul>
    `;
    const group = drawer.querySelector('ul');
    group.querySelector(`[${identity}="opener"] button`).focus();
    const focus = captureCmModalFocus(confirmation);

    const replacement = group.cloneNode(true);
    replacement.querySelector(`[${identity}="opener"]`).remove();
    replacement.querySelector(`[${identity}="next"]`).remove();
    replacement.replaceChildren(...Array.from(replacement.children).reverse());
    group.replaceWith(replacement);

    focus.restore();
    assert.equal(document.activeElement, replacement.querySelector(`[${identity}="later"] button`));
  });
}

test('does not restore focus to an opener reused for a different row', (context) => {
  const { document } = createDocument(context);
  const drawer = document.querySelector('#outer');
  const confirmation = document.querySelector('#inner');
  drawer.className = 'cm-drawer';
  drawer.innerHTML = `
    <ul>
      <li id="previous"><button>Edit previous draft</button></li>
      <li id="opener"><button>Delete draft</button></li>
      <li id="next"><button>Edit next draft</button></li>
    </ul>
  `;
  const opener = drawer.querySelector('#opener button');
  opener.focus();
  const focus = captureCmModalFocus(confirmation);

  drawer.querySelector('#previous').remove();
  opener.parentElement.id = 'previous';
  drawer.querySelector('ul').prepend(drawer.querySelector('#next'));

  focus.restore();
  assert.equal(opener.isConnected, true);
  assert.equal(document.activeElement, drawer.querySelector('#next button'));
});
