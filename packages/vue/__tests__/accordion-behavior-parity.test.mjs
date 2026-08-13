import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const browser = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, {
  Element: browser.window.Element,
  HTMLElement: browser.window.HTMLElement,
  Node: browser.window.Node,
  SVGElement: browser.window.SVGElement,
  document: browser.window.document,
  window: browser.window,
});

const { mount } = await import('@vue/test-utils');
const { nextTick } = await import('vue');
const { CmAccordion } = await import('../dist/index.js');
const { CmRuntime, createCmAccordionController } = await import('../../runtime/dist/index.js');
const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractDirectory = resolve(packageDirectory, '../../contracts/accordion');
const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
  .filter((file) => file.endsWith('.scenario.json'))
  .sort();

for (const scenarioFile of scenarioFiles) {
  test(`matches Vue and Razor state transitions for ${scenarioFile}`, async () => {
    const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
    const basename = scenario.case.replace(/^accordion-/u, '');
    const definition = JSON.parse(await readFile(resolve(contractDirectory, 'cases', `${basename}.case.json`), 'utf8'));
    const razorHtml = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
    const razorDom = new JSDOM(razorHtml);
    const razorRoot = razorDom.window.document.querySelector('.cm-accordion');
    const razorEvents = [];
    razorRoot.addEventListener('cm:open-change', (event) => razorEvents.push(event.detail));
    new CmRuntime().register('accordion', createCmAccordionController).start(razorDom.window.document);

    const vue = mount(CmAccordion, { attachTo: browser.window.document.body, props: definition.props });
    for (const step of scenario.steps.filter(({ action }) => action)) {
      activate(razorDom.window, resolveTarget(razorRoot, step.target), step);
      activate(browser.window, resolveTarget(vue.element, step.target), step);
      await nextTick();
      assert.deepEqual(snapshot(vue.element, vue.emitted('openChange') ?? []), snapshot(razorRoot, razorEvents));
    }

    vue.unmount();
    razorDom.window.close();
  });
}

function activate(targetWindow, target, step) {
  if (step.action === 'click') target.click();
  if (step.action === 'focus') target.focus();
  if (step.action === 'press') {
    target.dispatchEvent(new targetWindow.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }));
    if (step.key === 'Enter' || step.key === ' ') target.click();
  }
}

function snapshot(root, events) {
  const ownerDocument = root.ownerDocument;
  const triggers = [...root.querySelectorAll('.cm-accordion__trigger')];
  return {
    expanded: triggers.map((trigger) => trigger.getAttribute('aria-expanded')),
    hidden: [...root.querySelectorAll('.cm-accordion__panel')].map((panel) => panel.hidden),
    focused: triggers.indexOf(ownerDocument.activeElement),
    events: events.map((entry) => (Array.isArray(entry) ? entry[0] : entry)),
  };
}

function resolveTarget(root, name) {
  if (name === 'root') return root;
  const index = name.endsWith('-first') ? 0 : 1;
  const selector = name.startsWith('trigger-') ? '.cm-accordion__trigger' : '.cm-accordion__panel';
  const target = root.querySelectorAll(selector)[index];
  assert.ok(target, `Missing parity target ${name}.`);
  return target;
}
