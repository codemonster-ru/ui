import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmAccordionController } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractDirectory = resolve(packageDirectory, '../../contracts/accordion');
const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
  .filter((file) => file.endsWith('.scenario.json'))
  .sort();

for (const scenarioFile of scenarioFiles) {
  test(`passes progressive enhancement scenario ${scenarioFile}`, async () => {
    const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
    const basename = scenario.case.replace(/^accordion-/u, '');
    const html = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
    const dom = new JSDOM(html);
    const root = dom.window.document.querySelector('.cm-accordion');
    const events = new Map();
    root.addEventListener('cm:open-change', () => events.set('open-change', (events.get('open-change') ?? 0) + 1));
    new CmRuntime().register('accordion', createCmAccordionController).start(dom.window.document);

    for (const step of scenario.steps) {
      executeStep({ dom, events, root, step });
    }
  });
}

function executeStep({ dom, events, root, step }) {
  const target = resolveTarget(root, step.target);

  if (step.action === 'click') {
    target.click();
    return;
  }
  if (step.action === 'focus') {
    target.focus();
    return;
  }
  if (step.action === 'press') {
    target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }));
    if (step.key === 'Enter' || step.key === ' ') target.click();
    return;
  }
  if (step.expect === 'attribute') {
    assert.equal(target.getAttribute(step.name), step.value);
    return;
  }
  if (step.expect === 'visible') {
    assert.equal(!target.hidden, step.value);
    return;
  }
  if (step.expect === 'focus') {
    assert.equal(dom.window.document.activeElement === target, step.value);
    return;
  }
  if (step.expect === 'eventCount') {
    assert.equal(events.get(step.name) ?? 0, step.count);
    return;
  }

  assert.fail(`Unsupported Accordion scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(root, name) {
  if (name === 'root') return root;
  const index = name.endsWith('-first') ? 0 : 1;
  const selector = name.startsWith('trigger-') ? '.cm-accordion__trigger' : '.cm-accordion__panel';
  const target = root.querySelectorAll(selector)[index];
  assert.ok(target, `Missing scenario target ${name}.`);
  return target;
}
