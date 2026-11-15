import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmDialogController,
  createCmDrawerController,
  createCmPopoverController,
  createCmTooltipController,
} from '../dist/index.js';

for (const [name, factory, html] of [
  ['dialog', createCmDialogController, modalHtml('dialog')],
  ['drawer', createCmDrawerController, modalHtml('drawer')],
]) {
  test(`${name} traps focus, closes on Escape, and reports state`, () => {
    const dom = new JSDOM(`<button id="opener">Open</button>${html}`);
    const root = dom.window.document.querySelector(`.cm-${name}`);
    const close = root.querySelector(`[data-cm-${name}-close]`);
    const action = root.querySelector('.action');
    const states = [];
    dom.window.document.querySelector('#opener').focus();
    root.addEventListener(`cm:${name}-open-change`, (event) => states.push(event.detail.open));
    new CmRuntime().register(name, factory).start(dom.window.document);

    root.dispatchEvent(new dom.window.CustomEvent(`cm:${name}-open-request`));
    assert.equal(root.open, true);
    assert.equal(dom.window.document.activeElement, close);
    action.focus();
    press(dom, action, 'Tab');
    assert.equal(dom.window.document.activeElement, close);
    press(dom, root, 'Escape');
    assert.equal(root.open, false);
    assert.equal(dom.window.document.activeElement.id, 'opener');
    assert.deepEqual(states, [true, false]);
  });
}

test('dialog ignores user dismissal while locked', () => {
  const dom = new JSDOM(
    modalHtml('dialog').replace(
      'data-cm-dialog-state="closed"',
      'data-cm-dialog-state="closed" data-cm-dialog-dismissible="false"',
    ),
  );
  const root = dom.window.document.querySelector('.cm-dialog');
  new CmRuntime().register('dialog', createCmDialogController).start(dom.window.document);
  root.dispatchEvent(new dom.window.CustomEvent('cm:dialog-open-request'));
  press(dom, root, 'Escape');
  root.querySelector('[data-cm-dialog-close]').click();
  assert.equal(root.open, true);
});

test('repeated open requests preserve the opener and current focus', (context) => {
  const dom = new JSDOM(`<button id="opener">Open</button>${modalHtml('dialog')}`);
  const { document, CustomEvent } = dom.window;
  const root = document.querySelector('dialog');
  const opener = document.querySelector('#opener');
  const action = root.querySelector('.action');
  const runtime = new CmRuntime().register('dialog', createCmDialogController);
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  runtime.start(document);

  opener.focus();
  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  action.focus();
  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  assert.equal(document.activeElement, action);

  root.dispatchEvent(new CustomEvent('cm:dialog-close-request'));
  assert.equal(document.activeElement, opener);
});

test('modal focus skips disabled, hidden, inert and negative-tabindex descendants', (context) => {
  const dom = new JSDOM(`
    <dialog data-cm-controller="dialog">
      <button data-cm-dialog-close autofocus disabled>Close</button>
      <div hidden><button autofocus>Hidden</button></div>
      <div inert><button data-autofocus>Inert</button></div>
      <input type="hidden">
      <button id="first">First</button>
      <fieldset disabled><button>Disabled by fieldset</button></fieldset>
      <button id="last">Last</button>
      <button tabindex="-1">Programmatic only</button>
      <div aria-hidden="true"><button>Hidden from assistive technology</button></div>
    </dialog>`);
  const { document, CustomEvent } = dom.window;
  const root = document.querySelector('dialog');
  const first = document.querySelector('#first');
  const last = document.querySelector('#last');
  const runtime = new CmRuntime().register('dialog', createCmDialogController);
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  runtime.start(document);

  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  assert.equal(document.activeElement, first);
  press(dom, first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last);
  press(dom, last, 'Tab');
  assert.equal(document.activeElement, first);
});

test('popover toggles, focuses panel content, and dismisses outside', () => {
  const dom = new JSDOM(`${popoverHtml()}<button id="outside">Outside</button>`);
  const root = dom.window.document.querySelector('.cm-popover');
  const trigger = root.querySelector('.cm-popover__trigger');
  const panel = root.querySelector('.cm-popover__panel');
  const action = panel.querySelector('button');
  const states = [];
  root.addEventListener('cm:popover-open-change', (event) => states.push(event.detail.open));
  new CmRuntime().register('popover', createCmPopoverController).start(dom.window.document);

  press(dom, trigger, 'ArrowDown');
  assert.equal(panel.hidden, false);
  assert.equal(dom.window.document.activeElement, action);
  dom.window.document.querySelector('#outside').click();
  assert.equal(panel.hidden, true);
  assert.deepEqual(states, [true, false]);
});

test('tooltip follows focus, blur, and Escape without moving focus', async () => {
  const dom = new JSDOM(tooltipHtml());
  const root = dom.window.document.querySelector('.cm-tooltip');
  const trigger = root.querySelector('.cm-tooltip__trigger');
  const content = root.querySelector('.cm-tooltip__content');
  new CmRuntime().register('tooltip', createCmTooltipController).start(dom.window.document);

  trigger.focus();
  await tick();
  assert.equal(content.hidden, false);
  press(dom, trigger, 'Escape');
  assert.equal(content.hidden, true);
  assert.equal(dom.window.document.activeElement, trigger);
  trigger.blur();
  await tick();
  assert.equal(content.hidden, true);
});

function modalHtml(name) {
  return `
    <dialog class="cm-${name}" data-cm-controller="${name}" data-cm-${name}-state="closed">
      <button data-cm-${name}-close>Close</button>
      <button class="action">Continue</button>
    </dialog>`;
}

function popoverHtml() {
  return `
    <div class="cm-popover" data-cm-controller="popover">
      <button class="cm-popover__trigger" aria-expanded="false">Help</button>
      <div class="cm-popover__panel" role="dialog" hidden><button>Learn more</button></div>
    </div>`;
}

function tooltipHtml() {
  return `
    <span class="cm-tooltip cm-tooltip--delay-none" data-cm-controller="tooltip">
      <button class="cm-tooltip__trigger">Save</button>
      <span class="cm-tooltip__content" role="tooltip" hidden>Save changes</span>
    </span>`;
}

function press(dom, target, key, options = {}) {
  target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...options }));
}

function tick() {
  return delay(0);
}
