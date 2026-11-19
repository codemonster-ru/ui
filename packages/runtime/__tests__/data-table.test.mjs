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

test('pinned cells track measured header widths and release the authored table on stop', async (t) => {
  const html = await readFile(resolve(contractDirectory, 'cases/pinned.html'), 'utf8');
  const { window } = new JSDOM(html);
  const { document } = window;
  const name = document.querySelector('th[data-cm-data-table-column="name"]');
  const team = document.querySelector('td[data-cm-data-table-column="team"]');
  const table = document.querySelector('table');
  let scrollportWidth = 540;
  Object.defineProperty(table.parentElement, 'clientWidth', { get: () => scrollportWidth });
  for (const header of table.tHead.rows[0].cells) {
    Object.defineProperty(header, 'offsetWidth', { value: Number.parseFloat(header.style.inlineSize) });
  }
  let width = 88;
  name.getBoundingClientRect = () => ({ width });
  const offset = () => team.style.getPropertyValue('--cm-data-table-pin-offset');
  const runtime = new CmRuntime().register('data-table', createCmDataTableController);
  runtime.start(document);
  t.after(() => window.close());

  assert.equal(offset(), '88px');
  assert.equal(table.hasAttribute('data-cm-data-table-pins-ready'), true);
  assert.equal(table.hasAttribute('data-cm-data-table-pins-constrained'), false);
  scrollportWidth = 294;
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(table.hasAttribute('data-cm-data-table-pins-constrained'), true);
  scrollportWidth = 540;
  width = 96;
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(offset(), '96px');
  assert.equal(table.hasAttribute('data-cm-data-table-pins-constrained'), false);
  scrollportWidth = 294;
  window.dispatchEvent(new window.Event('resize'));
  runtime.stop();
  assert.equal(table.hasAttribute('data-cm-data-table-pins-constrained'), false);
  assert.equal(table.hasAttribute('data-cm-data-table-pins-ready'), false);
  assert.equal(offset(), '');
});

test('Vanilla keyboard resize preserves the paired width and reports the completed action', async () => {
  const html = await readFile(resolve(contractDirectory, 'cases/resizable.html'), 'utf8');
  const { window } = new JSDOM(html);
  const root = window.document.querySelector('.cm-data-table');
  const headers = [...root.querySelectorAll('th[data-cm-data-table-column]')];
  const handle = root.querySelector('[role="separator"]');
  for (const header of headers) {
    header.getBoundingClientRect = () => ({ width: Number.parseFloat(header.style.inlineSize) });
  }
  const changes = [];
  const ends = [];
  root.addEventListener('cm:data-table-column-widths-change', (event) => changes.push(event.detail.columnWidths));
  root.addEventListener('cm:data-table-column-resize-end', (event) => ends.push(event.detail.columnWidths));
  new CmRuntime().register('data-table', createCmDataTableController).start(window.document);
  handle.focus();
  assert.equal(handle.getAttribute('aria-valuenow'), '240');
  handle.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(handle.getAttribute('aria-valuenow'), '248');
  assert.equal(handle.getAttribute('aria-valuemin'), '96');
  assert.deepEqual(changes, [{ name: '248px', status: '328px' }]);
  assert.deepEqual(ends, changes);
  assert.equal(root.querySelector('td[data-cm-data-table-column="name"]').style.inlineSize, '248px');
  assert.equal(window.document.activeElement, handle);
});

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
      'cm:data-table-expansion-change',
    ]) {
      root.addEventListener(name, () => events.set(name, (events.get(name) ?? 0) + 1));
    }
    new CmRuntime().register('data-table', createCmDataTableController).start(dom.window.document);

    for (const step of scenario.steps) executeStep({ events, root, step });
  });
}

test('closing a detail row restores focus and leaves its named fields under the form owner', async (t) => {
  const html = await readFile(resolve(contractDirectory, 'cases/expansion.html'), 'utf8');
  const { window } = new JSDOM(`<form>${html}</form>`);
  const { document } = window;
  const root = document.getElementById('expanded-accounts');
  const panel = document.getElementById('expanded-accounts-expanded-atlas');
  const button = root.querySelector('[data-cm-data-table-expand]');
  const field = document.createElement('input');
  field.name = 'notes';
  field.value = 'Draft';
  panel.cells[0].append(field);
  const events = [];
  root.addEventListener('cm:data-table-expansion-change', (event) => events.push(event.detail));
  const runtime = new CmRuntime().register('data-table', createCmDataTableController);
  runtime.start(document);
  t.after(() => {
    runtime.stop();
    window.close();
  });

  field.focus();
  button.click();
  assert.equal(document.activeElement, button);
  assert.equal(panel.hidden, true);
  assert.equal(new window.FormData(document.querySelector('form')).get('notes'), 'Draft');
  field.disabled = true;
  assert.equal(new window.FormData(document.querySelector('form')).has('notes'), false);
  button.click();
  assert.equal(panel.hidden, false);
  assert.deepEqual(events, [
    { rowId: 'atlas', expanded: false },
    { rowId: 'atlas', expanded: true },
  ]);
});

test('a nested detail table owns its own disclosures and selection', async (t) => {
  const html = await readFile(resolve(contractDirectory, 'cases/expansion.html'), 'utf8');
  const { window } = new JSDOM(html);
  const { document } = window;
  const outer = document.getElementById('expanded-accounts');
  const outerPanel = document.getElementById('expanded-accounts-expanded-atlas');
  outerPanel.cells[0].insertAdjacentHTML('beforeend', dataTableHtml());
  const inner = outerPanel.querySelector('.cm-data-table');
  inner
    .querySelector('tbody')
    .insertAdjacentHTML(
      'beforeend',
      '<tr id="nested-detail" class="cm-data-table__expanded-row" hidden><td>Details</td></tr>',
    );
  inner
    .querySelector('[data-cm-data-table-row="second"] td')
    .insertAdjacentHTML(
      'beforeend',
      '<button type="button" aria-controls="nested-detail" data-cm-data-table-expand>Toggle details</button>',
    );
  const innerButton = inner.querySelector('[data-cm-data-table-expand]');
  const outerButton = outer.querySelector('[data-cm-data-table-expand]');
  const events = [];
  outer.addEventListener('cm:data-table-expansion-change', (event) => events.push(event.target));
  const runtime = new CmRuntime().register('data-table', createCmDataTableController);
  runtime.start(document);
  t.after(() => {
    runtime.stop();
    window.close();
  });

  innerButton.click();
  assert.equal(document.getElementById('nested-detail').hidden, false);
  assert.equal(outerPanel.hidden, false);
  inner.querySelector('[data-cm-data-table-select-all]').click();
  assert.equal(inner.getAttribute('data-cm-data-table-selected-count'), '2');
  assert.equal(outer.getAttribute('data-cm-data-table-selected-count'), '1');

  outerButton.setAttribute('aria-controls', 'nested-detail');
  outerButton.click();
  assert.equal(document.getElementById('nested-detail').hidden, false);
  assert.deepEqual(events, [inner]);
});

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

test('preserves localized sort labels through the sort cycle', () => {
  const dom =
    new JSDOM(`<div class="cm-data-table" data-cm-controller="data-table" data-cm-data-table-sort-key="" data-cm-data-table-sort-direction="">
    <table class="cm-data-table__table"><thead><tr><th aria-sort="none"><button type="button" data-cm-data-table-sort="name" data-cm-data-table-sort-ascending-label-template="Сортировать {column} по возрастанию" data-cm-data-table-sort-descending-label-template="Сортировать {column} по убыванию" data-cm-data-table-clear-sort-label-template="Сбросить сортировку {column}">Имя<span class="cm-data-table__sort-indicator" aria-hidden="true"></span></button></th></tr></thead><tbody></tbody></table>
  </div>`);
  const root = dom.window.document.querySelector('.cm-data-table');
  const sort = root.querySelector('[data-cm-data-table-sort]');
  new CmRuntime().register('data-table', createCmDataTableController).start(root);

  assert.equal(sort.getAttribute('aria-label'), 'Сортировать Имя по возрастанию');
  sort.click();
  assert.equal(sort.getAttribute('aria-label'), 'Сортировать Имя по убыванию');
  sort.click();
  assert.equal(sort.getAttribute('aria-label'), 'Сбросить сортировку Имя');
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
  if (step.expect === 'visible') return assert.equal(target.closest('[hidden]') === null, step.value);
  if (step.expect === 'text') return assert.equal(target.textContent.trim(), step.value);
  if (step.expect === 'eventCount') return assert.equal(events.get(step.name) ?? 0, step.count);
  assert.fail(`Unsupported DataTable scenario step: ${JSON.stringify(step)}`);
}

function resolveTarget(root, name) {
  if (name === 'root') return root;
  const selectors = {
    'expand-first': '[data-cm-data-table-row="atlas"] [data-cm-data-table-expand]',
    'detail-first': '#expanded-accounts-expanded-atlas',
    'select-nova': '[data-cm-data-table-row="nova"] [data-cm-data-table-select-row]',
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
