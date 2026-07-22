/* global process, console */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const stylesDir = join(root, 'src/styles');
const entriesDir = join(stylesDir, 'entries');
const componentsDir = join(stylesDir, 'components');
const transitionGuardPath = join(componentsDir, 'theme-transition-guard.css');
const accessibilityPreferencesPath = join(componentsDir, 'accessibility-preferences.css');

const groupedManifests = {
  'actions.css': ['button.css', 'icon-button.css', 'link.css'],
  'forms.css': [
    'field.css',
    'fieldset.css',
    'input.css',
    'textarea.css',
    'select.css',
    'checkbox.css',
    'radio.css',
    'switch.css',
  ],
  'surfaces.css': ['card.css', 'panel.css', 'table.css', 'data-table.css'],
  'feedback.css': ['badge.css', 'tag.css', 'progress-bar.css', 'progress-spinner.css', 'alert.css', 'divider.css'],
  'overlay.css': ['dialog.css', 'drawer.css', 'command-palette.css', 'dropdown.css', 'popover.css', 'tooltip.css'],
  'navigation.css': [
    'accordion.css',
    'breadcrumbs.css',
    'stepper.css',
    'menu-bar.css',
    'tabs.css',
    'nav-menu.css',
    'table-of-contents.css',
  ],
};

function inlineCssImports(filePath, seen = new Set(), trace = []) {
  if (trace.includes(filePath)) {
    throw new Error(`Circular CSS import detected: ${[...trace, filePath].join(' -> ')}`);
  }

  if (seen.has(filePath)) {
    return '';
  }

  seen.add(filePath);

  return readFileSync(filePath, 'utf8').replace(/^@import\s+['"](.+?)['"];\s*$/gm, (_statement, importPath) =>
    importPath.startsWith('.')
      ? inlineCssImports(resolve(dirname(filePath), importPath), seen, [...trace, filePath])
      : `@import '${importPath}';`,
  );
}

function inlineCssFiles(filePaths) {
  const seen = new Set();
  return filePaths
    .map((filePath) => inlineCssImports(filePath, seen))
    .filter(Boolean)
    .join('\n');
}

function importsOf(source) {
  return [...source.matchAll(/^@import\s+['"](.+?)['"];\s*$/gm)].map((match) => match[1]);
}

function stripImportsAndComments(source) {
  return source
    .replace(/^@import\s+['"].+?['"];\s*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

let failures = 0;
const fail = (message) => {
  console.error(`[css-parity] ${message}`);
  failures += 1;
};

for (const [fileName, entryNames] of Object.entries(groupedManifests)) {
  const source = readFileSync(join(componentsDir, fileName), 'utf8');
  const expectedImports = entryNames.map((entryName) => `../entries/${entryName}`);

  if (stripImportsAndComments(source) !== '') {
    fail(`${fileName} must remain an import-only compatibility manifest.`);
  }

  if (JSON.stringify(importsOf(source)) !== JSON.stringify(expectedImports)) {
    fail(`${fileName} does not import the canonical entries in the expected order.`);
  }
}

const fullCss = inlineCssImports(join(stylesDir, 'components.css'));
const entryNames = readdirSync(entriesDir)
  .filter((fileName) => fileName.endsWith('.css'))
  .sort();

for (const fileName of entryNames) {
  const entryPath = join(entriesDir, fileName);
  const ownCss = stripImportsAndComments(readFileSync(entryPath, 'utf8'));

  if (ownCss.includes('{') && fullCss.split(ownCss).length - 1 !== 1) {
    fail(`${fileName} own CSS must occur exactly once in the full stylesheet.`);
  }

  const standaloneCss = inlineCssFiles([transitionGuardPath, accessibilityPreferencesPath, entryPath]);
  if ((standaloneCss.match(/:root\.vf-theme-transitioning :where\(\[class\^='vf-'\]/g) ?? []).length !== 1) {
    fail(`${fileName} standalone artifact must contain the theme transition guard exactly once.`);
  }
  if (standaloneCss.includes('@import')) {
    fail(`${fileName} standalone artifact contains an unresolved import.`);
  }
  for (const mediaQuery of ['@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) {
    if (!standaloneCss.includes(mediaQuery)) {
      fail(`${fileName} standalone artifact is missing ${mediaQuery}.`);
    }
  }
}

if ((fullCss.match(/:root\.vf-theme-transitioning :where\(\[class\^='vf-'\]/g) ?? []).length !== 1) {
  fail('Full stylesheet must contain the theme transition guard exactly once.');
}

if ((fullCss.match(/\.vf-horizontal-scroller \{/g) ?? []).length !== 1) {
  fail('Full stylesheet must contain the shared horizontal scroller exactly once.');
}

const stepperPath = join(entriesDir, 'stepper.css');
const stepperSource = readFileSync(stepperPath, 'utf8');
const stepperArtifact = inlineCssFiles([transitionGuardPath, stepperPath]);
if (!stepperSource.includes('.vf-stepper {')) {
  fail('Stepper entry is missing its own rules.');
}
for (const forbidden of ['../components/navigation.css', '../components/overlay-primitives.css']) {
  if (stepperSource.includes(forbidden)) {
    fail(`Stepper entry must not import ${forbidden}.`);
  }
}
for (const forbiddenSelector of ['.vf-nav-menu', '.vf-menu-bar', '.vf-tabs', '.vf-accordion']) {
  if (stepperArtifact.includes(forbiddenSelector)) {
    fail(`Stepper artifact contains unrelated ${forbiddenSelector} rules.`);
  }
}

for (const fileName of ['menu-bar.css', 'tabs.css']) {
  const source = readFileSync(join(entriesDir, fileName), 'utf8');
  if (!source.includes("@import '../components/horizontal-scroller.css';")) {
    fail(`${fileName} must import the shared horizontal scroller.`);
  }
  if (stripImportsAndComments(source).includes('.vf-horizontal-scroller {')) {
    fail(`${fileName} duplicates the shared horizontal scroller rules.`);
  }
}

const commandPaletteSource = readFileSync(join(entriesDir, 'command-palette.css'), 'utf8');
for (const viewportUnit of ['vh', 'dvh']) {
  const viewportBound =
    `calc(100${viewportUnit} - var(--vf-command-palette-offset-top) - var(--vf-overlay-viewport-padding))`;
  if (!commandPaletteSource.includes(viewportBound)) {
    fail(`Command Palette max-height must remain bounded by the ${viewportUnit} viewport.`);
  }
}

const requiredFullSnippets = [
  'display: block;\n  box-sizing: border-box;\n  width: 100%;',
  'var(--vf-field-floating-input-offset-inline-lg)',
  'var(--vf-field-floating-select-padding-adjustment-sm)',
  'var(--vf-field-floating-select-padding-adjustment-lg)',
  '.vf-dropdown__item.vf-select__option',
  'color: var(--vf-select-option-color);',
  'letter-spacing: var(--vf-nav-menu-group-label-letter-spacing);',
  'line-clamp: 3;',
  'line-clamp: 2;',
  '.vf-dialog__actions .vf-icon-button',
  '.vf-drawer__actions .vf-icon-button',
];
for (const snippet of requiredFullSnippets) {
  if (!fullCss.includes(snippet)) {
    fail(`Full stylesheet is missing reconciled contract: ${snippet}`);
  }
}

if (fullCss.includes('min-height: var(--vf-select-filter-min-height-sm)')) {
  fail('Full stylesheet still uses the legacy select-filter min-height as floating Select geometry.');
}

if (
  fullCss.includes("html:where([data-theme='dark'], [data-vf-theme='dark'])") ||
  fullCss.includes("html[data-vf-theme='dark']")
) {
  fail('Full stylesheet still contains a root-only dark-mode component selector.');
}

if (failures > 0) {
  process.exit(1);
}

console.log('[css-parity] full, component-entry, and composed artifact CSS contracts passed.');
