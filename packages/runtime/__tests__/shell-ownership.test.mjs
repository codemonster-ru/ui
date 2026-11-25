import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmAdminLayoutController,
  createCmAppShellController,
  createCmShellMetricsController,
} from '../dist/index.js';

function mount(context, markup) {
  const dom = new JSDOM(markup);
  const runtime = new CmRuntime()
    .register('app-shell', createCmAppShellController)
    .register('admin-layout', createCmAdminLayoutController);
  runtime.start(dom.window.document);
  context.after(() => {
    runtime.stop();
    dom.window.close();
  });
  return dom.window;
}

test('an authored nested AppShell owns its toggle and its aria-expanded state', (context) => {
  const { document } = mount(
    context,
    `
    <div id="outer" class="cm-app-shell" data-cm-controller="app-shell" data-cm-sidebar-collapsed="false">
      <div id="inner" class="cm-app-shell" data-cm-controller="app-shell" data-cm-sidebar-collapsed="false">
        <button id="inner-toggle" data-cm-sidebar-toggle aria-expanded="true">Toggle inner</button>
      </div>
      <button id="outer-toggle" data-cm-sidebar-toggle aria-expanded="true">Toggle outer</button>
    </div>
  `,
  );
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  const outerToggle = document.querySelector('#outer-toggle');
  const innerToggle = document.querySelector('#inner-toggle');
  const changes = [];
  outer.addEventListener('cm:app-shell-state-change', (event) => changes.push(event.target.id));

  innerToggle.click();
  assert.equal(outer.dataset.cmSidebarCollapsed, 'false');
  assert.equal(outerToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(inner.dataset.cmSidebarCollapsed, 'true');
  assert.equal(innerToggle.getAttribute('aria-expanded'), 'false');

  outerToggle.click();
  assert.equal(outer.dataset.cmSidebarCollapsed, 'true');
  assert.equal(outerToggle.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(changes, ['inner', 'outer']);
});

test('a nested AdminLayout handles its own mobile toggle and Escape independently', (context) => {
  const { document, KeyboardEvent } = mount(
    context,
    `
    <div id="outer" class="cm-admin-layout" data-cm-controller="admin-layout" data-cm-mobile-sidebar-open="true">
      <div id="inner" class="cm-admin-layout" data-cm-controller="admin-layout" data-cm-mobile-sidebar-open="false">
        <button id="inner-toggle" data-cm-mobile-sidebar-toggle aria-expanded="false">Toggle inner</button>
      </div>
      <button id="outer-toggle" data-cm-mobile-sidebar-toggle aria-expanded="true">Toggle outer</button>
    </div>
  `,
  );
  const outer = document.querySelector('#outer');
  const inner = document.querySelector('#inner');
  const outerToggle = document.querySelector('#outer-toggle');
  const innerToggle = document.querySelector('#inner-toggle');
  const escape = (target) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

  innerToggle.click();
  assert.equal(outer.dataset.cmMobileSidebarOpen, 'true');
  assert.equal(inner.dataset.cmMobileSidebarOpen, 'true');
  assert.equal(innerToggle.getAttribute('aria-expanded'), 'true');

  assert.equal(escape(innerToggle), false);
  assert.equal(inner.dataset.cmMobileSidebarOpen, 'false');
  assert.equal(innerToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(outer.dataset.cmMobileSidebarOpen, 'true');
  assert.equal(outerToggle.getAttribute('aria-expanded'), 'true');

  assert.equal(escape(outerToggle), false);
  assert.equal(outer.dataset.cmMobileSidebarOpen, 'false');
  assert.equal(outerToggle.getAttribute('aria-expanded'), 'false');
});

test('a nested AppShell desktop toggle stays inside its layout under an AdminLayout', (context) => {
  const { document } = mount(
    context,
    `<div id="outer" data-cm-controller="admin-layout" data-cm-sidebar-collapsed="false">
      <section id="inner" data-cm-controller="app-shell shell-metrics" data-cm-sidebar-collapsed="false">
        <button data-cm-sidebar-toggle aria-expanded="true">Toggle inner</button>
      </section>
    </div>`,
  );

  document.querySelector('button').click();
  assert.equal(document.querySelector('#inner').dataset.cmSidebarCollapsed, 'true');
  assert.equal(document.querySelector('#outer').dataset.cmSidebarCollapsed, 'false');
});

test('the canonical standalone AppShell still toggles through its authored control', (context) => {
  const markup = readFileSync(new URL('../../../contracts/app-shell/cases/collapsible.html', import.meta.url), 'utf8');
  const { document } = mount(context, markup);
  const shell = document.querySelector('.cm-app-shell');
  const toggle = shell.querySelector('[data-cm-sidebar-toggle]');

  toggle.click();
  assert.equal(shell.dataset.cmSidebarCollapsed, 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  toggle.click();
  assert.equal(shell.dataset.cmSidebarCollapsed, 'false');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});

test('shell measurements use visible direct regions and update when an observed region is revealed', (context) => {
  const { window } = new JSDOM(`
    <div id="shell">
      <header data-cm-sticky-header></header>
      <section><div data-cm-sticky-subheader></div></section>
      <div data-cm-sticky-subheader hidden></div>
    </div>`);
  const shell = window.document.querySelector('#shell');
  const header = shell.firstElementChild;
  const subheader = shell.lastElementChild;
  const observed = [];
  let notifyResize;
  window.ResizeObserver = class {
    constructor(callback) {
      notifyResize = callback;
    }
    observe(region) {
      observed.push(region);
    }
    disconnect() {}
  };
  subheader.getBoundingClientRect = () => ({ height: 40 });
  const controller = createCmShellMetricsController(shell);
  context.after(() => {
    controller.disconnect();
    window.close();
  });
  controller.connect();

  const offset = () => shell.style.getPropertyValue('--cm-sticky-top-offset');
  assert.deepEqual(observed, [header, subheader]);
  assert.equal(offset(), 'calc(var(--cm-layout-header-height) + 0px)');

  subheader.hidden = false;
  notifyResize();
  assert.equal(offset(), 'calc(var(--cm-layout-header-height) + 40px)');

  subheader.hidden = true;
  notifyResize();
  assert.equal(offset(), 'calc(var(--cm-layout-header-height) + 0px)');
});
