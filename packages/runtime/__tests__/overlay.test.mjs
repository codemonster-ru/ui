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

test('promotes an initially open server-rendered drawer into the native modal stack', (context) => {
  const dom = new JSDOM(modalHtml('drawer').replace('<dialog', '<dialog open'));
  const { document } = dom.window;
  const root = document.querySelector('dialog');
  const matches = root.matches.bind(root);
  const runtime = new CmRuntime().register('drawer', createCmDrawerController);
  let shown = 0;
  root.matches = (selector) => (selector === ':modal' ? shown > 0 : matches(selector));
  root.showModal = () => {
    assert.equal(root.open, false, 'SSR open is a non-modal state until promoted');
    root.open = true;
    shown += 1;
  };
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  runtime.start(document);
  runtime.stop();
  runtime.start(document);

  assert.equal(shown, 1);
  assert.equal(root.open, true);
  assert.equal(root.dataset.cmDrawerState, 'open');
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

test('reports a native close once and ignores delayed close after reopening', (context) => {
  const dom = new JSDOM(`<button id="opener">Open</button>${modalHtml('dialog')}`);
  const { document, CustomEvent, Event } = dom.window;
  const root = document.querySelector('dialog');
  const opener = document.querySelector('#opener');
  const runtime = new CmRuntime().register('dialog', createCmDialogController);
  const states = [];
  root.addEventListener('cm:dialog-open-change', (event) => states.push(event.detail.open));
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  runtime.start(document);
  opener.focus();
  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));

  // Native close() and form method="dialog" clear open before dispatching close.
  root.open = false;
  root.dispatchEvent(new Event('close'));
  assert.equal(root.dataset.cmDialogState, 'closed');
  assert.equal(root.classList.contains('cm-dialog--open'), false);
  assert.equal(document.activeElement, opener);
  assert.deepEqual(states, [true, false]);

  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  root.dispatchEvent(new CustomEvent('cm:dialog-close-request'));
  root.dispatchEvent(new Event('close'));
  root.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
  root.dispatchEvent(new Event('close'));
  assert.equal(root.open, true);
  assert.equal(root.dataset.cmDialogState, 'open');
  assert.deepEqual(states, [true, false, true, false, true]);
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
  assert.notEqual(dom.window.document.activeElement, action);
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

test('tooltip enhances an authored link with a delayed portal and returns its panel on disconnect', async () => {
  const dom = new JSDOM(`
    <span class="cm-tooltip cm-tooltip--bottom cm-tooltip--delay-long" data-cm-controller="tooltip"
      data-cm-tooltip-open-delay="12" data-cm-tooltip-teleport-to="#target">
      <a class="cm-tooltip__trigger" data-cm-tooltip-custom-trigger aria-describedby="shortcut-tip" href="#shortcuts">
        Shortcuts
      </a>
      <span id="shortcut-tip" class="cm-tooltip__content" role="tooltip" hidden>Press ?</span>
    </span><aside id="target"></aside>
  `);
  const document = dom.window.document;
  const root = document.querySelector('.cm-tooltip');
  const trigger = root.querySelector('a');
  const content = root.querySelector('[role="tooltip"]');
  const target = document.getElementById('target');
  const runtime = new CmRuntime().register('tooltip', createCmTooltipController);
  runtime.start(document);

  trigger.focus();
  assert.equal(content.hidden, true);
  await delay(20);
  assert.equal(content.hidden, false);
  assert.equal(content.parentElement, target);
  assert.equal(content.hasAttribute('data-cm-tooltip-floating'), true);
  assert.equal(document.activeElement, trigger);

  root.dispatchEvent(new dom.window.Event('pointerenter'));
  trigger.blur();
  assert.equal(content.hidden, false);
  root.dispatchEvent(new dom.window.Event('pointerleave'));
  assert.equal(content.hidden, true);
  assert.equal(content.parentElement, root);

  trigger.focus();
  await delay(20);
  assert.equal(content.parentElement, target);
  runtime.stop();
  assert.equal(content.parentElement, root);
  assert.equal(content.hasAttribute('data-cm-tooltip-floating'), false);
});

test('keeps a closing tooltip at its portal until the current exit finishes', async (context) => {
  const dom = new JSDOM(
    tooltipHtml().replace('data-cm-controller=', 'data-cm-tooltip-teleport-to="body" data-cm-controller='),
  );
  const document = dom.window.document;
  const root = document.querySelector('.cm-tooltip');
  const trigger = root.querySelector('button');
  const content = root.querySelector('[role="tooltip"]');
  const runtime = new CmRuntime().register('tooltip', createCmTooltipController);
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  runtime.start(document);
  const first = Promise.withResolvers();
  const second = Promise.withResolvers();
  let finished = first.promise;
  let painted = true;
  content.getAnimations = () => [{ transitionProperty: 'display', finished }];
  content.getClientRects = () => (painted ? [{}] : []);

  trigger.focus();
  press(dom, trigger, 'Escape');
  assert.equal(content.hidden, true);
  assert.equal(content.parentElement, document.body);
  assert.equal(document.activeElement, trigger);

  root.dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(content.hidden, false);
  finished = second.promise;
  press(dom, trigger, 'Escape');
  first.reject(new Error('Exit canceled by reopening'));
  await first.promise.catch(() => {});
  assert.equal(content.parentElement, document.body);

  painted = false;
  second.resolve();
  await second.promise;
  assert.equal(content.parentElement, root);
  assert.equal(content.hasAttribute('data-cm-tooltip-floating'), false);
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
