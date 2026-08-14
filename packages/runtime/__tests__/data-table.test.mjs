import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmDataTableController } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractDirectory = resolve(packageDirectory, '../../contracts/data-table');
const scenarioFiles = (await readdir(resolve(contractDirectory, 'behavior')))
  .filter((file) => file.endsWith('.scenario.json'))
  .sort();

for (const scenarioFile of scenarioFiles) {
  test(`passes DataTable progressive enhancement scenario ${scenarioFile}`, async () => {
    const scenario = JSON.parse(await readFile(resolve(contractDirectory, 'behavior', scenarioFile), 'utf8'));
    const basename = scenario.case.replace(/^data-table-/u, '');
    const html = await readFile(resolve(contractDirectory, 'cases', `${basename}.html`), 'utf8');
    const dom = new JSDOM(html);
    const root = dom.window.document.querySelector('.cm-data-table');
    const events = new Map();
    for (const name of [
      'cm:data-table-page-change',
      'cm:data-table-page-size-change',
      'cm:data-table-selection-change',
      'cm:data-table-sort-change',
    ]) {
      root.addEventListener(name, () => events.set(name, (events.get(name) ?? 0) + 1));
    }
    new CmRuntime().register('data-table', createCmDataTableController).start(dom.window.document);

    for (const step of scenario.steps) executeStep({ events, root, step });
  });
}

test('reports selected ids in rendered order and keeps select-all state synchronized', () => {
  const dom = new JSDOM(dataTableHtml());
  const root = dom.window.document.querySelector('.cm-data-table');
  const selectAll = root.querySelector('[data-cm-data-table-select-all]');
  const selections = [];
  root.addEventListener('cm:data-table-selection-change', (event) => selections.push(event.detail.selectedRowIds));
  new CmRuntime().register('data-table', createCmDataTableController).start(root);

  selectAll.click();
  assert.deepEqual(selections, [['first', 'second']]);
  assert.equal(root.getAttribute('data-cm-data-table-selected-count'), '2');
  assert.equal(selectAll.checked, true);
});

function executeStep({ events, root, step }) {
  const target = resolveTarget(root, step.target);
  if (step.action === 'setValue') {
    target.value = step.value;
    target.dispatchEvent(new root.ownerDocument.defaultView.Event('change', { bubbles: true }));
    return;
  }
  if (step.action === 'click') return target.click();
  if (step.expect === 'attribute') return assert.equal(target.getAttribute(step.name), step.value);
  if (step.expect === 'text') return assert.equal(target.textContent.trim(), step.value);
  if (step.expect === 'eventCount') return assert.equal(events.get(step.name) ?? 0, step.count);
  assert.fail(`Unsupported DataTable scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(root, name) {
  if (name === 'root') return root;
  const selectors = {
    'header-first': 'th[aria-sort]',
    'page-next': '[data-cm-data-table-page-action="next"]',
    'page-size': '[data-cm-data-table-page-size-control]',
    'page-summary': '.cm-data-table__page-summary',
    'pagination-summary': '.cm-data-table__pagination-summary',
    'select-first': 'tbody tr:first-child [data-cm-data-table-select-row]',
    'select-last': 'tbody tr:last-child [data-cm-data-table-select-row]',
    'sort-first': '[data-cm-data-table-sort]',
  };
  const target = root.querySelector(selectors[name]);
  assert.ok(target, `Missing DataTable scenario target ${name}.`);
  return target;
}

function dataTableHtml() {
  return `<div class="cm-data-table" data-cm-controller="data-table" data-cm-data-table-sort-key="" data-cm-data-table-sort-direction="" data-cm-data-table-page="1" data-cm-data-table-page-count="1" data-cm-data-table-selected-count="0">
    <table class="cm-data-table__table"><thead><tr><th><input type="checkbox" data-cm-data-table-select-all></th></tr></thead>
    <tbody><tr data-cm-data-table-row="first"><td><input type="checkbox" value="first" data-cm-data-table-select-row></td></tr><tr data-cm-data-table-row="second"><td><input type="checkbox" value="second" data-cm-data-table-select-row></td></tr></tbody></table>
  </div>`;
}
