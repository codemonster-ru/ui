import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  CmRuntime,
  createCmAdminLayoutController,
  createCmMenuBarController,
  createCmNavMenuController,
  createCmSetupLayoutController,
  createCmStepperController,
} from '../dist/index.js';

// The canonical fixtures are what the Razor adapter renders, so enhancing those is the thing worth
// proving: the controller has to work against markup it did not create.
const contractsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../contracts');

function mount(slug, name, factory) {
  const html = readFileSync(resolve(contractsDirectory, slug, 'cases/default.html'), 'utf8');
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const runtime = new CmRuntime().register(name, factory);
  runtime.start(dom.window.document);
  return dom.window.document;
}

test('stepper activates a step that was clicked', () => {
  const document = mount('stepper', 'stepper', createCmStepperController);
  const account = document.querySelector('[data-cm-stepper-value="account"]');
  assert.equal(document.querySelector('[aria-current="step"]').dataset.cmStepperValue, 'billing');

  account.click();
  assert.equal(document.querySelector('[aria-current="step"]').dataset.cmStepperValue, 'account');
  assert.equal(account.closest('.cm-stepper__item').className, 'cm-stepper__item cm-stepper__item--current');
});

test('stepper leaves a disabled step alone', () => {
  const document = mount('stepper', 'stepper', createCmStepperController);
  document.querySelector('[data-cm-stepper-value="review"]').click();
  assert.equal(document.querySelector('[aria-current="step"]').dataset.cmStepperValue, 'billing');
});

test('nav menu collapses an open branch and reopens it', () => {
  const document = mount('nav-menu', 'nav-menu', createCmNavMenuController);
  const branch = document.querySelector('[data-cm-nav-menu-branch="projects"]');
  assert.equal(branch.getAttribute('aria-expanded'), 'true');

  branch.click();
  assert.equal(branch.getAttribute('aria-expanded'), 'false');
  assert.equal(branch.closest('.cm-nav-menu__node').classList.contains('cm-nav-menu__node--expanded'), false);

  branch.click();
  assert.equal(branch.getAttribute('aria-expanded'), 'true');
});

test('menu bar closes an open menu and opens another', () => {
  const document = mount('menu-bar', 'menu-bar', createCmMenuBarController);
  const file = document.querySelector('[data-cm-menu-bar-branch="file"]');
  const submenu = file.closest('.cm-menu-bar__node').querySelector(':scope > .cm-menu-bar__submenu');
  assert.equal(submenu.hidden, false);

  file.click();
  assert.equal(file.getAttribute('aria-expanded'), 'false');
  assert.equal(submenu.hidden, true);
});

test('admin layout toggles the drawer and updates the toggle label', () => {
  const document = mount('admin-layout', 'admin-layout', createCmAdminLayoutController);
  const root = document.querySelector('.cm-admin-layout');
  const toggle = document.querySelector('[data-cm-mobile-sidebar-toggle]');
  assert.equal(root.getAttribute('data-cm-mobile-sidebar-open'), 'false');

  toggle.click();
  assert.equal(root.getAttribute('data-cm-mobile-sidebar-open'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.getAttribute('aria-label'), 'Close navigation');
});

test('admin layout closes the drawer on escape and keeps the sidebar preference', () => {
  const document = mount('admin-layout', 'admin-layout', createCmAdminLayoutController);
  const root = document.querySelector('.cm-admin-layout');
  root.setAttribute('data-cm-sidebar-collapsed', 'true');
  document.querySelector('[data-cm-mobile-sidebar-toggle]').click();

  const escape = new document.defaultView.KeyboardEvent('keydown', { bubbles: true, key: 'Escape' });
  root.dispatchEvent(escape);

  assert.equal(root.getAttribute('data-cm-mobile-sidebar-open'), 'false');
  assert.equal(root.getAttribute('data-cm-sidebar-collapsed'), 'true');
});

test('setup layout advances on enter but not from a textarea', () => {
  const document = mount('setup-layout', 'setup-layout', createCmSetupLayoutController);
  const root = document.querySelector('.cm-setup-layout');
  const body = document.querySelector('.cm-setup-layout__body');
  let advanced = 0;
  root.addEventListener('cm:setup-layout-next', () => (advanced += 1));

  const press = (target) =>
    target.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));

  press(body);
  assert.equal(advanced, 1);

  const textarea = document.createElement('textarea');
  body.append(textarea);
  press(textarea);
  assert.equal(advanced, 1, 'a textarea keeps Enter for itself');
});
