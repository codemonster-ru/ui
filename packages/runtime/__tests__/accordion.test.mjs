import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmAccordionController } from '../dist/index.js';

test('toggles canonical Accordion items and reports semantic item ids', () => {
  const { dom, root, triggers, panels } = accordion();
  const events = [];
  root.addEventListener('cm:open-change', (event) => events.push(event.detail));
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);

  runtime.start(dom.window.document);
  triggers[0].click();
  triggers[1].click();

  assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
  assert.equal(panels[0].hidden, true);
  assert.equal(triggers[1].getAttribute('aria-expanded'), 'true');
  assert.equal(panels[1].hidden, false);
  assert.deepEqual(events, [{ openItems: ['account'] }, { openItems: ['billing'] }]);
});

test('keeps existing peers open in multiple mode', () => {
  const { dom, root, triggers, panels } = accordion('data-cm-accordion-multiple="true"');
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);

  runtime.start(dom.window.document);
  triggers[0].click();
  triggers[1].click();

  assert.deepEqual(
    triggers.map((trigger) => trigger.getAttribute('aria-expanded')),
    ['true', 'true'],
  );
  assert.deepEqual(
    panels.map((panel) => panel.hidden),
    [false, false],
  );
  assert.equal(root.getAttribute('data-cm-accordion-multiple'), 'true');
});

test('ignores disabled and malformed items and removes listeners on disconnect', () => {
  const { dom, root, triggers } = accordion();
  let changes = 0;
  triggers[1].disabled = true;
  root.insertAdjacentHTML('beforeend', '<section data-cm-accordion-item="broken"></section>');
  root.addEventListener('cm:open-change', () => changes++);
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);

  runtime.start(dom.window.document);
  triggers[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  runtime.stop();
  triggers[0].click();

  assert.equal(changes, 0);
  assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
});

test('synchronizes panel visibility before reporting a state change', () => {
  const { dom, root, triggers, panels } = accordion();
  panels[0].hidden = false;
  let panelWasVisibleDuringEvent = false;
  root.addEventListener('cm:open-change', () => {
    panelWasVisibleDuringEvent = !panels[0].hidden;
  });
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);

  runtime.start(dom.window.document);
  assert.equal(panels[0].hidden, true);
  triggers[0].click();

  assert.equal(triggers[0].getAttribute('aria-expanded'), 'true');
  assert.equal(panelWasVisibleDuringEvent, true);
});

test('moves focus cyclically among enabled triggers', () => {
  const { dom, triggers } = accordion();
  triggers[1].disabled = true;
  const third = dom.window.document.createElement('section');
  third.innerHTML = item('security');
  dom.window.document.querySelector('.cm-accordion').append(...third.children);
  const allTriggers = [...dom.window.document.querySelectorAll('.cm-accordion__trigger')];
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);
  runtime.start(dom.window.document);

  allTriggers[0].focus();
  press(dom, allTriggers[0], 'ArrowDown');
  assert.equal(dom.window.document.activeElement, allTriggers[2]);

  press(dom, allTriggers[2], 'ArrowDown');
  assert.equal(dom.window.document.activeElement, allTriggers[0]);

  press(dom, allTriggers[0], 'End');
  assert.equal(dom.window.document.activeElement, allTriggers[2]);

  press(dom, allTriggers[2], 'Home');
  assert.equal(dom.window.document.activeElement, allTriggers[0]);

  press(dom, allTriggers[0], 'ArrowUp');
  assert.equal(dom.window.document.activeElement, allTriggers[2]);
});

test('leaves activation keys and unrelated targets to native browser behavior', () => {
  const { dom, root, triggers } = accordion();
  const runtime = new CmRuntime().register('accordion', createCmAccordionController);
  runtime.start(dom.window.document);

  assert.equal(press(dom, triggers[0], 'Enter'), true);
  assert.equal(press(dom, triggers[0], ' '), true);
  assert.equal(press(dom, root, 'ArrowDown'), true);
  assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
});

function accordion(rootAttributes = '') {
  const dom = new JSDOM(`
    <div class="cm-accordion" data-cm-controller="accordion" ${rootAttributes}>
      ${item('account')}
      ${item('billing')}
    </div>
  `);
  const root = dom.window.document.querySelector('.cm-accordion');
  return {
    dom,
    root,
    triggers: [...root.querySelectorAll('.cm-accordion__trigger')],
    panels: [...root.querySelectorAll('.cm-accordion__panel')],
  };
}

function item(id) {
  return `
    <section data-cm-accordion-item="${id}">
      <button class="cm-accordion__trigger" aria-expanded="false" aria-controls="faq-${id}-panel">${id}</button>
      <div class="cm-accordion__panel" id="faq-${id}-panel" hidden></div>
    </section>
  `;
}

function press(dom, target, key) {
  return target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}
