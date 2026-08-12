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
