/* global process, console */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const entriesDir = join(process.cwd(), 'src/styles/entries');

const ownBases = {
  'accordion.css': ['accordion', 'icon'],
  'alert.css': ['alert'],
  'badge.css': ['badge'],
  'breadcrumbs.css': ['breadcrumbs'],
  'button.css': ['button'],
  'card.css': ['card'],
  'checkbox.css': ['checkbox'],
  'command-palette.css': ['command-palette', 'command-palette-transition'],
  'data-table.css': ['data-table', 'data-table-wrap', 'data-table-scroll'],
  'dialog.css': ['dialog', 'dialog-transition'],
  'divider.css': ['divider'],
  'drawer.css': ['drawer', 'drawer-transition'],
  'dropdown.css': ['dropdown', 'floating', 'floating-transition'],
  'field.css': ['field'],
  'fieldset.css': ['fieldset'],
  'icon-button.css': ['icon-button'],
  'input.css': ['input', 'input-wrap'],
  'link.css': ['link'],
  'menu-bar.css': ['menu-bar', 'horizontal-scroller', 'floating-transition'],
  'nav-menu.css': ['nav-menu'],
  'panel.css': ['panel'],
  'popover.css': ['popover', 'floating', 'floating-transition'],
  'radio.css': ['radio'],
  'select.css': ['select', 'select-wrap'],
  'skeleton.css': ['skeleton'],
  'skeleton-gate.css': ['skeleton-gate'],
  'switch.css': ['switch', 'icon', 'icon-wrapper'],
  'table.css': ['table', 'table-wrap', 'table-scroll'],
  'table-of-contents.css': ['table-of-contents'],
  'tabs.css': ['tabs', 'horizontal-scroller'],
  'tag.css': ['tag'],
  'textarea.css': ['textarea'],
  'theme-switch.css': ['theme-switch'],
  'tooltip.css': ['tooltip', 'floating', 'floating-transition'],
};

const explicitDeps = {
  'command-palette.css': ['./icon-button.css'],
  'data-table.css': ['./table.css', './icon-button.css', './progress-spinner.css', './select.css', './skeleton.css'],
  'dialog.css': ['./icon-button.css'],
  'drawer.css': ['./icon-button.css'],
  'input.css': ['./field.css', './icon-button.css'],
  'select.css': ['./field.css', './icon-button.css', './dropdown.css'],
  'textarea.css': ['./field.css'],
  'theme-switch.css': ['./button.css', './switch.css'],
};

const globallyAllowed = new Set(['icon', 'icon-wrapper']);
const requiredSelectors = {
  'command-palette.css': ['.vf-command-palette-transition-enter-from'],
  'dialog.css': ['.vf-dialog-transition-enter-from'],
  'drawer.css': ['.vf-drawer-transition-enter-from'],
  'dropdown.css': ['.vf-floating-transition-enter-from.vf-dropdown__menu'],
  'menu-bar.css': ['.vf-floating-transition-enter-from.vf-menu-bar__submenu'],
  'popover.css': ['.vf-floating-transition-enter-from.vf-popover__content'],
  'tooltip.css': ['.vf-floating-transition-enter-from.vf-tooltip__content'],
};
const baseOf = (token) =>
  token.replace(/-transition-(?:enter|leave)-(?:active|from|to)$/, '-transition').split(/--|__/)[0];

let failures = 0;

for (const fileName of readdirSync(entriesDir)
  .filter((name) => name.endsWith('.css'))
  .sort()) {
  const absPath = join(entriesDir, fileName);
  const css = readFileSync(absPath, 'utf8');

  const foundImports = [...css.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const expectedImports = explicitDeps[fileName] ?? [];

  for (const expected of expectedImports) {
    if (!foundImports.includes(expected)) {
      console.error(`[css-contract] Missing import in ${fileName}: expected ${expected}`);
      failures += 1;
    }
  }

  for (const expected of requiredSelectors[fileName] ?? []) {
    if (!css.includes(expected)) {
      console.error(`[css-contract] Missing selector in ${fileName}: expected ${expected}`);
      failures += 1;
    }
  }

  const allowed = new Set([...(ownBases[fileName] ?? [basename(fileName, '.css')]), ...globallyAllowed]);
  for (const expected of expectedImports) {
    allowed.add(basename(expected, '.css'));
  }

  const classBases = new Set([...css.matchAll(/\.vf-([a-z0-9-]+)/g)].map((m) => baseOf(m[1])));

  for (const classBase of classBases) {
    if (!allowed.has(classBase)) {
      console.error(`[css-contract] Unexpected cross selector in ${fileName}: .vf-${classBase}*`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log('[css-contract] core component CSS dependency contract passed.');
