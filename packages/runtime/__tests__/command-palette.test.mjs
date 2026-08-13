import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmCommandPaletteController } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractDirectory = resolve(packageDirectory, '../../contracts/command-palette');
const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
  .filter((file) => file.endsWith('.scenario.json'))
  .sort();

for (const scenarioFile of scenarioFiles) {
  test(`passes CommandPalette progressive enhancement scenario ${scenarioFile}`, async () => {
    const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
    const basename = scenario.case.replace(/^command-palette-/u, '');
    const html = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
    const dom = new JSDOM(`<button id="opener">Open</button>${html}`);
    const root = dom.window.document.querySelector('.cm-command-palette');
    const events = new Map();
    for (const name of [
      'cm:command-palette-open-change',
      'cm:command-palette-query-change',
      'cm:command-palette-select',
    ]) {
      root.addEventListener(name, () => events.set(name, (events.get(name) ?? 0) + 1));
    }
    new CmRuntime().register('command-palette', createCmCommandPaletteController).start(dom.window.document);

    for (const step of scenario.steps) executeStep({ dom, events, root, step });
  });
}

test('opens on request, focuses search, navigates enabled matches, and restores focus', () => {
  const dom = new JSDOM(`<button id="opener">Open</button>${paletteHtml()}`);
  const opener = dom.window.document.querySelector('#opener');
  const root = dom.window.document.querySelector('.cm-command-palette');
  const input = root.querySelector('[data-cm-command-palette-input]');
  const selected = [];
  opener.focus();
  root.addEventListener('cm:command-palette-select', (event) => selected.push(event.detail.value));
  new CmRuntime().register('command-palette', createCmCommandPaletteController).start(dom.window.document);

  root.dispatchEvent(new dom.window.CustomEvent('cm:command-palette-open-request'));
  assert.equal(dom.window.document.activeElement, input);
  press(dom, input, 'ArrowDown');
  assert.equal(input.getAttribute('aria-activedescendant'), 'commands-option-second');
  press(dom, input, 'Enter');
  assert.deepEqual(selected, ['second']);
  assert.equal(root.open, false);
  assert.equal(dom.window.document.activeElement, opener);
});

function executeStep({ dom, events, root, step }) {
  const target = resolveTarget(root, step.target);
  if (step.action === 'setValue') {
    target.value = step.value;
    target.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    return;
  }
  if (step.action === 'press') return press(dom, target, step.key);
  if (step.expect === 'visible') {
    const visible = target === root ? root.open : !target.hidden;
    return assert.equal(visible, step.value);
  }
  if (step.expect === 'attribute') return assert.equal(target.getAttribute(step.name), step.value);
  if (step.expect === 'eventCount') return assert.equal(events.get(step.name) ?? 0, step.count);
  assert.fail(`Unsupported CommandPalette scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(root, name) {
  if (name === 'root') return root;
  const selectors = {
    input: '[data-cm-command-palette-input]',
    'option-first': '[data-cm-command-palette-option]:first-child',
    'option-last': '[data-cm-command-palette-option]:last-child',
  };
  const target = root.querySelector(selectors[name]);
  assert.ok(target, `Missing CommandPalette scenario target ${name}.`);
  return target;
}

function press(dom, target, key) {
  target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}

function paletteHtml() {
  return `
    <dialog class="cm-command-palette" data-cm-controller="command-palette" data-cm-command-palette-state="closed">
      <button data-cm-command-palette-close>Close</button>
      <input data-cm-command-palette-input autofocus>
      <ul role="listbox">
        <li id="commands-option-first" role="option" aria-selected="true" data-cm-command-palette-option data-cm-command-value="first">First</li>
        <li id="commands-option-disabled" role="option" aria-selected="false" aria-disabled="true" data-cm-command-palette-option data-cm-command-value="disabled">Disabled</li>
        <li id="commands-option-second" role="option" aria-selected="false" data-cm-command-palette-option data-cm-command-value="second">Second</li>
      </ul>
      <p class="cm-command-palette__empty" hidden>Empty</p>
    </dialog>`;
}
