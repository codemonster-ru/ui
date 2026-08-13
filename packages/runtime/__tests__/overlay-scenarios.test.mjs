import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmDialogController,
  createCmDrawerController,
  createCmPopoverController,
  createCmTooltipController,
} from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const factories = {
  dialog: createCmDialogController,
  drawer: createCmDrawerController,
  popover: createCmPopoverController,
  tooltip: createCmTooltipController,
};

for (const [slug, factory] of Object.entries(factories)) {
  const contractDirectory = resolve(packageDirectory, `../../contracts/${slug}`);
  const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
    .filter((file) => file.endsWith('.scenario.json'))
    .sort();

  for (const scenarioFile of scenarioFiles) {
    test(`passes ${slug} progressive enhancement scenario ${scenarioFile}`, async () => {
      const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
      const basename = scenario.case.replace(new RegExp(`^${slug}-`, 'u'), '');
      const html = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
      const dom = new JSDOM(`${html}<button id="outside">Outside</button>`);
      const root = dom.window.document.querySelector(`.cm-${slug}`);
      const events = new Map();
      for (const name of [`cm:${slug}-open-change`]) {
        root.addEventListener(name, () => events.set(name, (events.get(name) ?? 0) + 1));
      }
      new CmRuntime().register(slug, factory).start(dom.window.document);

      for (const step of scenario.steps) await executeStep({ dom, events, root, slug, step });
    });
  }
}

async function executeStep({ dom, events, root, slug, step }) {
  const target = resolveTarget(dom, root, slug, step.target);
  if (step.action === 'click') return target.click();
  if (step.action === 'focus') {
    target.focus();
    await delay(slug === 'tooltip' && root.classList.contains('cm-tooltip--delay-short') ? 310 : 0);
    return;
  }
  if (step.action === 'press') {
    target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }));
    return;
  }
  if (step.expect === 'attribute') return assert.equal(target.getAttribute(step.name), step.value);
  if (step.expect === 'visible') {
    const visible = target === root && (slug === 'dialog' || slug === 'drawer') ? root.open : !target.hidden;
    return assert.equal(visible, step.value);
  }
  if (step.expect === 'focus') return assert.equal(dom.window.document.activeElement === target, step.value);
  if (step.expect === 'eventCount') return assert.equal(events.get(step.name) ?? 0, step.count);
  assert.fail(`Unsupported overlay scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(dom, root, slug, name) {
  if (name === 'root') return root;
  if (name === 'outside') return dom.window.document.querySelector('#outside');
  const selectors = {
    close: `[data-cm-${slug}-close]`,
    panel: '.cm-popover__panel',
    tooltip: '.cm-tooltip__content',
    trigger: `.${slug === 'tooltip' ? 'cm-tooltip' : 'cm-popover'}__trigger`,
  };
  const target = root.querySelector(selectors[name]);
  assert.ok(target, `Missing ${slug} scenario target ${name}.`);
  return target;
}
