import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmDropdownController,
  createCmMenuController,
  createCmTabsController,
} from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const factories = {
  dropdown: [
    ['dropdown', createCmDropdownController],
    ['menu', createCmMenuController],
  ],
  menu: [['menu', createCmMenuController]],
  tabs: [['tabs', createCmTabsController]],
};

for (const [slug, registrations] of Object.entries(factories)) {
  const contractDirectory = resolve(packageDirectory, `../../contracts/${slug}`);
  const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
    .filter((file) => file.endsWith('.scenario.json'))
    .sort();

  for (const scenarioFile of scenarioFiles) {
    test(`passes ${slug} progressive enhancement scenario ${scenarioFile}`, async () => {
      const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
      const basename = scenario.case.replace(new RegExp(`^${slug}-`, 'u'), '');
      const html = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
      const dom = new JSDOM(html);
      const root = dom.window.document.querySelector(`.cm-${slug}`);
      const events = new Map();
      for (const name of ['cm:tabs-value-change', 'cm:menu-select', 'cm:dropdown-open-change']) {
        root.addEventListener(name, () => events.set(name, (events.get(name) ?? 0) + 1));
      }
      const runtime = new CmRuntime();
      registrations.forEach(([name, factory]) => runtime.register(name, factory));
      runtime.start(dom.window.document);

      for (const step of scenario.steps) executeStep({ dom, events, root, slug, step });
    });
  }
}

function executeStep({ dom, events, root, slug, step }) {
  const target = resolveTarget(root, slug, step.target);
  if (step.action === 'click') return target.click();
  if (step.action === 'focus') return target.focus();
  if (step.action === 'press') {
    target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }));
    if (step.key === 'Enter' || step.key === ' ') target.click();
    return;
  }
  if (step.expect === 'attribute') return assert.equal(target.getAttribute(step.name), step.value);
  if (step.expect === 'visible') return assert.equal(!target.hidden, step.value);
  if (step.expect === 'focus') return assert.equal(dom.window.document.activeElement === target, step.value);
  if (step.expect === 'eventCount') return assert.equal(events.get(step.name) ?? 0, step.count);
  assert.fail(`Unsupported navigation scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(root, slug, name) {
  if (name === 'root') return root;
  if (name === 'panel-second') {
    const panel = root.querySelectorAll('.cm-tabs__panel')[1];
    assert.ok(panel, `Missing ${slug} scenario target ${name}.`);
    return panel;
  }
  const selectors = {
    trigger: '.cm-dropdown__trigger',
    menu: '.cm-dropdown__menu',
    'tab-first': '.cm-tabs__tab:nth-of-type(1)',
    'tab-second': '.cm-tabs__tab:nth-of-type(2)',
    'tab-last': '.cm-tabs__tab:last-of-type',
    'item-first': '[data-cm-menu-item]:nth-child(1)',
    'item-active': '[data-cm-menu-item].cm-menu__item--active',
    'item-last': '[data-cm-menu-item]:last-child',
  };
  const target = root.querySelector(selectors[name]);
  assert.ok(target, `Missing ${slug} scenario target ${name}.`);
  return target;
}
