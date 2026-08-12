import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmDropdownController,
  createCmMenuController,
  createCmTabsController,
} from '../dist/index.js';

test('selects tabs and skips disabled peers during keyboard navigation', () => {
  const dom = new JSDOM(tabsHtml());
  const root = dom.window.document.querySelector('.cm-tabs');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const changes = [];
  root.addEventListener('cm:tabs-value-change', (event) => changes.push(event.detail.value));
  new CmRuntime().register('tabs', createCmTabsController).start(dom.window.document);

  tabs[0].focus();
  press(dom, tabs[0], 'ArrowRight');

  assert.equal(dom.window.document.activeElement, tabs[2]);
  assert.deepEqual(
    tabs.map((tab) => tab.getAttribute('aria-selected')),
    ['false', 'false', 'true'],
  );
  assert.deepEqual(
    panels.map((panel) => panel.hidden),
    [true, true, false],
  );
  assert.deepEqual(changes, ['billing']);
});

test('moves menu focus, suppresses disabled links, and reports selection', () => {
  const dom = new JSDOM(menuHtml());
  const root = dom.window.document.querySelector('.cm-menu');
  const items = [...root.querySelectorAll('[data-cm-menu-item]')];
  const selected = [];
  root.addEventListener('cm:menu-select', (event) => selected.push(event.detail.value));
  new CmRuntime().register('menu', createCmMenuController).start(dom.window.document);

  items[0].focus();
  press(dom, items[0], 'ArrowDown');
  assert.equal(dom.window.document.activeElement, items[2]);
  items[1].click();
  items[2].click();
  assert.deepEqual(selected, ['details']);
});

test('opens a dropdown from keyboard and closes after menu selection', () => {
  const dom = new JSDOM(dropdownHtml());
  const root = dom.window.document.querySelector('.cm-dropdown');
  const trigger = root.querySelector('.cm-dropdown__trigger');
  const menu = root.querySelector('.cm-dropdown__menu');
  const first = menu.querySelector('[data-cm-menu-item]');
  const states = [];
  root.addEventListener('cm:dropdown-open-change', (event) => states.push(event.detail.open));
  new CmRuntime()
    .register('dropdown', createCmDropdownController)
    .register('menu', createCmMenuController)
    .start(dom.window.document);

  press(dom, trigger, 'ArrowDown');
  assert.equal(menu.hidden, false);
  assert.equal(dom.window.document.activeElement, first);
  first.click();
  assert.equal(menu.hidden, true);
  assert.equal(dom.window.document.activeElement, trigger);
  assert.deepEqual(states, [true, false]);
});

test('closes an open dropdown on outside click and releases listeners', () => {
  const dom = new JSDOM(`${dropdownHtml()}<button id="outside">Outside</button>`);
  const root = dom.window.document.querySelector('.cm-dropdown');
  const trigger = root.querySelector('.cm-dropdown__trigger');
  const menu = root.querySelector('.cm-dropdown__menu');
  const runtime = new CmRuntime().register('dropdown', createCmDropdownController);
  runtime.start(dom.window.document);

  trigger.click();
  dom.window.document.querySelector('#outside').click();
  assert.equal(menu.hidden, true);

  runtime.stop();
  trigger.click();
  assert.equal(menu.hidden, true);
});

function tabsHtml() {
  return `
    <div class="cm-tabs" data-cm-controller="tabs" data-cm-tabs-value="general">
      <div role="tablist">
        <button class="cm-tabs__tab" role="tab" aria-controls="settings-panel-general">General</button>
        <button class="cm-tabs__tab" role="tab" aria-controls="settings-panel-advanced" disabled>Advanced</button>
        <button class="cm-tabs__tab" role="tab" aria-controls="settings-panel-billing">Billing</button>
      </div>
      <div id="settings-panel-general" role="tabpanel"></div>
      <div id="settings-panel-advanced" role="tabpanel"></div>
      <div id="settings-panel-billing" role="tabpanel"></div>
    </div>`;
}

function menuHtml() {
  return `
    <div class="cm-menu" role="menu" data-cm-controller="menu">
      <button role="menuitem" data-cm-menu-item data-cm-menu-value="open">Open</button>
      <a role="menuitem" data-cm-menu-item data-cm-menu-value="disabled" aria-disabled="true">Disabled</a>
      <button role="menuitem" data-cm-menu-item data-cm-menu-value="details">Details</button>
    </div>`;
}

function dropdownHtml() {
  return `
    <div class="cm-dropdown" data-cm-controller="dropdown">
      <button class="cm-dropdown__trigger" aria-expanded="false">Actions</button>
      <div class="cm-dropdown__menu cm-menu" role="menu" data-cm-controller="menu" hidden>
        <button role="menuitem" data-cm-menu-item data-cm-menu-value="edit">Edit</button>
      </div>
    </div>`;
}

function press(dom, target, key) {
  target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}
