import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectDeclaredControllers,
  collectImplementedControllers,
  factoryNameFor,
  findMissingControllers,
} from './controller-coverage.mjs';

test('reads the controllers canonical markup asks for', () => {
  const fixtures = ['<div data-cm-controller="nav-menu"></div>', '<nav data-cm-controller="menu-bar"></nav>'];
  assert.deepEqual([...collectDeclaredControllers(fixtures)].sort(), ['menu-bar', 'nav-menu']);
});

test('reads the factories the runtime exports', () => {
  const source = [
    "export { CmTabsController, createCmTabsController } from './tabs.js';",
    "export { CmMenuBarController, createCmMenuBarController } from './menu-bar.js';",
    "export type { TabsValueChangeDetail } from './tabs.js';",
  ].join('\n');
  assert.deepEqual([...collectImplementedControllers(source)].sort(), ['MenuBar', 'Tabs']);
});

test('a hyphenated controller names a PascalCase factory', () => {
  assert.equal(factoryNameFor('nav-menu'), 'createCmNavMenuController');
  assert.equal(factoryNameFor('tabs'), 'createCmTabsController');
  assert.equal(factoryNameFor('command-palette'), 'createCmCommandPaletteController');
});

test('reports a controller the markup names and the runtime does not provide', () => {
  const declared = new Set(['tabs', 'nav-menu']);
  assert.deepEqual(findMissingControllers(declared, new Set(['Tabs'])), ['nav-menu']);
  assert.deepEqual(findMissingControllers(declared, new Set(['Tabs', 'NavMenu'])), []);
});
