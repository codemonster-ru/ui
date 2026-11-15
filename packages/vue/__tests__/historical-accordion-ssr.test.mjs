import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';
import { VfAccordion } from '@codemonster-ru/ui-vue/historical';

test('historical disclosures server-render separate labelled panels with the granted state', async () => {
  const response = await renderToString(
    h('main', [
      h(VfAccordion, { title: 'Open section', defaultOpen: true }, ({ open }) => (open ? 'Open content' : '')),
      h(VfAccordion, { title: 'Closed section', defaultOpen: true, open: false }, () => 'Closed content'),
    ]),
  );
  const { document } = new JSDOM(response).window;
  const [openTrigger, closedTrigger] = [...document.querySelectorAll('button')];
  const openPanel = document.getElementById(openTrigger.getAttribute('aria-controls'));
  const closedPanel = document.getElementById(closedTrigger.getAttribute('aria-controls'));
  assert.equal(openPanel.getAttribute('aria-labelledby'), openTrigger.id);
  assert.equal(closedPanel.getAttribute('aria-labelledby'), closedTrigger.id);
  assert.notEqual(openPanel.id, closedPanel.id);
  assert.equal(openPanel.textContent, 'Open content');
  assert.ok(openPanel.querySelector('.cm-accordion__collapse > .cm-accordion__clip > .cm-accordion__panel'));
  assert.equal(closedPanel.textContent, '');
  assert.equal(closedPanel.getAttribute('aria-hidden'), 'true');
  assert.ok(closedPanel.hasAttribute('inert'));
});
