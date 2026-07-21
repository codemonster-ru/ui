/* global process, console */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const files = {
  forms: join(root, 'src/styles/components/forms.css'),
  input: join(root, 'src/styles/entries/input.css'),
  select: join(root, 'src/styles/entries/select.css'),
  textarea: join(root, 'src/styles/entries/textarea.css'),
  checkbox: join(root, 'src/styles/entries/checkbox.css'),
  radio: join(root, 'src/styles/entries/radio.css'),
  switch: join(root, 'src/styles/entries/switch.css'),
  viteConfig: join(root, 'vite.config.ts'),
};

function inlineCssImports(filePath, seen = new Set()) {
  if (seen.has(filePath)) {
    return '';
  }

  seen.add(filePath);
  return readFileSync(filePath, 'utf8').replace(
    /^@import\s+['"](.+?)['"];\s*$/gm,
    (_statement, importPath) =>
      importPath.startsWith('.') ? inlineCssImports(resolve(dirname(filePath), importPath), seen) : _statement,
  );
}

const source = Object.fromEntries(
  Object.entries(files).map(([name, path]) => [name, name === 'forms' ? inlineCssImports(path) : readFileSync(path, 'utf8')]),
);

const checks = [
  {
    file: 'forms',
    label: 'textarea floating label follows field inline padding token',
    snippet: '--vf-field-floating-label-offset-inline: var(--vf-field-floating-control-offset-inline-lg);',
  },
  {
    file: 'textarea',
    label: 'standalone textarea floating label follows field inline padding token',
    snippet: '--vf-field-floating-label-offset-inline: var(--vf-field-floating-control-offset-inline-lg);',
  },
  {
    file: 'forms',
    label: 'select leading floating label accounts for icon and gap',
    snippet: 'var(--vf-field-adornment-offset-md) + var(--vf-field-icon-size) + var(--vf-button-gap)',
  },
  {
    file: 'select',
    label: 'standalone select leading floating label accounts for icon and gap',
    snippet: 'var(--vf-field-adornment-offset-md) + var(--vf-field-icon-size) + var(--vf-button-gap)',
  },
  {
    file: 'forms',
    label: 'select sm icon token is scoped to sm control',
    snippet: '.vf-select--sm {\n  --vf-field-icon-size: var(--vf-field-icon-size-sm);',
  },
  {
    file: 'forms',
    label: 'select lg icon token is scoped to lg control',
    snippet: '.vf-select--lg {\n  --vf-field-icon-size: var(--vf-field-icon-size-lg);',
  },
  {
    file: 'forms',
    label: 'select value aligns to icon box',
    snippet: '.vf-select__value {\n  display: inline-flex;\n  align-items: center;',
  },
  {
    file: 'forms',
    label: 'floating in select keeps inline contents vertically centered',
    snippet: '.vf-field--floating-in .vf-select--floating {\n  position: relative;\n  align-items: center;',
  },
  {
    file: 'forms',
    label: 'floating on control padding stays vertically centered',
    snippet:
      '.vf-field--floating-on {\n  --vf-field-floating-control-padding-top-sm: var(--vf-field-floating-on-control-padding-top-sm);',
  },
  {
    file: 'forms',
    label: 'floating select adornments are centered against control box',
    snippet:
      '.vf-field--floating-in .vf-select--floating .vf-select__icon--leading,\n.vf-field--floating-in .vf-select--floating .vf-select__icon--trailing',
  },
  {
    file: 'select',
    label: 'standalone floating in select keeps inline contents vertically centered',
    snippet: '.vf-field--floating-in .vf-select--floating {\n  position: relative;\n  align-items: center;',
  },
  {
    file: 'forms',
    label: 'floating sm select applies its dedicated padding adjustment',
    snippet:
      'padding-top: calc(var(--vf-field-floating-control-padding-top-sm) + var(--vf-field-floating-select-padding-adjustment-sm));',
  },
  {
    file: 'select',
    label: 'standalone floating sm select applies its dedicated padding adjustment',
    snippet:
      'padding-top: calc(var(--vf-field-floating-control-padding-top-sm) + var(--vf-field-floating-select-padding-adjustment-sm));',
  },
  {
    file: 'forms',
    label: 'floating lg select applies its dedicated padding adjustment',
    snippet:
      'var(--vf-field-floating-control-padding-bottom-lg) - var(--vf-field-floating-select-padding-adjustment-lg)',
  },
  {
    file: 'select',
    label: 'standalone floating lg select applies its dedicated padding adjustment',
    snippet:
      'var(--vf-field-floating-control-padding-bottom-lg) - var(--vf-field-floating-select-padding-adjustment-lg)',
  },
  {
    file: 'select',
    label: 'standalone floating select adornments are centered against control box',
    snippet:
      '.vf-field--floating-in .vf-select--floating .vf-select__icon--leading,\n.vf-field--floating-in .vf-select--floating .vf-select__icon--trailing',
  },
  {
    file: 'select',
    label: 'standalone select value aligns to icon box',
    snippet: '.vf-select__value {\n  display: inline-flex;\n  align-items: center;',
  },
  {
    file: 'forms',
    label: 'select nested icon wrapper inherits field icon size',
    snippet: '.vf-select__icon > .vf-icon-wrapper,\n.vf-select__icon > .vf-icon-wrapper > .vf-icon',
  },
  {
    file: 'select',
    label: 'standalone select nested icon wrapper inherits field icon size',
    snippet: '.vf-select__icon > .vf-icon-wrapper,\n.vf-select__icon > .vf-icon-wrapper > .vf-icon',
  },
  {
    file: 'forms',
    label: 'select options use the select option color token before state overrides',
    snippet: '.vf-dropdown__item.vf-select__option {\n  color: var(--vf-select-option-color);',
  },
  {
    file: 'select',
    label: 'standalone select options use the select option color token before state overrides',
    snippet: '.vf-dropdown__item.vf-select__option {\n  color: var(--vf-select-option-color);',
  },
  {
    file: 'forms',
    label: 'select clear button scales for sm controls',
    snippet:
      '.vf-select-wrap--sm .vf-select-wrap__clear.vf-icon-button {\n  width: var(--vf-field-clear-button-size-sm);',
  },
  {
    file: 'forms',
    label: 'select clear button scales for lg controls',
    snippet:
      '.vf-select-wrap--lg .vf-select-wrap__clear.vf-icon-button {\n  width: var(--vf-field-clear-button-size-lg);',
  },
  {
    file: 'input',
    label: 'standalone input sm adornment icon uses sm token',
    snippet:
      '.vf-input-wrap--sm .vf-input-wrap__icon--leading {\n  --vf-field-icon-size: var(--vf-field-icon-size-sm);',
  },
  {
    file: 'input',
    label: 'standalone input lg adornment icon uses lg token',
    snippet:
      '.vf-input-wrap--lg .vf-input-wrap__icon--leading {\n  --vf-field-icon-size: var(--vf-field-icon-size-lg);',
  },
  {
    file: 'forms',
    label: 'input trailing icon separates from password and clear actions',
    snippet: '.vf-input-wrap--with-trailing-password-and-clear .vf-input-wrap__icon--trailing-before-clear',
  },
  {
    file: 'input',
    label: 'standalone input trailing icon separates from password and clear actions',
    snippet: '.vf-input-wrap--with-trailing-password-and-clear .vf-input-wrap__icon--trailing-before-clear',
  },
  {
    file: 'forms',
    label: 'selection controls align against first text line',
    snippet: 'margin-block-start: var(--vf-selection-control-offset);',
  },
  {
    file: 'checkbox',
    label: 'standalone checkbox aligns against first text line',
    snippet: 'margin-block-start: var(--vf-selection-control-offset);',
  },
  {
    file: 'radio',
    label: 'standalone radio aligns against first text line',
    snippet: 'margin-block-start: var(--vf-selection-control-offset);',
  },
  {
    file: 'switch',
    label: 'standalone switch aligns against first text line',
    snippet: 'margin-block-start: var(--vf-selection-control-offset);',
  },
  {
    file: 'forms',
    label: 'checkbox mark scales down for sm',
    snippet: '.vf-checkbox--sm .vf-checkbox__mark',
  },
  {
    file: 'forms',
    label: 'checkbox uses compact gap for sm',
    snippet: '.vf-checkbox--sm {\n  --vf-selection-control-offset: var(--vf-checkbox-control-offset-sm);',
  },
  {
    file: 'forms',
    label: 'radio uses compact gap for sm',
    snippet: '.vf-radio--sm {\n  --vf-selection-control-offset: var(--vf-radio-control-offset-sm);',
  },
  {
    file: 'forms',
    label: 'switch uses compact gap for sm',
    snippet: '.vf-switch--sm',
  },
  {
    file: 'forms',
    label: 'checkbox mark scales up for lg',
    snippet: '.vf-checkbox--lg .vf-checkbox__mark',
  },
  {
    file: 'forms',
    label: 'radio dot scales down for sm',
    snippet: '.vf-radio--sm .vf-radio__dot',
  },
  {
    file: 'forms',
    label: 'radio dot scales up for lg',
    snippet: '.vf-radio--lg .vf-radio__dot',
  },
  {
    file: 'switch',
    label: 'standalone switch sm thumb icon scales',
    snippet:
      '.vf-switch--sm .vf-switch__control {\n  --vf-switch-thumb-icon-size: var(--vf-switch-thumb-icon-size-sm);',
  },
  {
    file: 'switch',
    label: 'standalone switch lg thumb icon scales',
    snippet:
      '.vf-switch--lg .vf-switch__control {\n  --vf-switch-thumb-icon-size: var(--vf-switch-thumb-icon-size-lg);',
  },
  {
    file: 'forms',
    label: 'inverse switch thumb has explicit contrast styling',
    snippet: '.vf-switch--thumb-contrast-inverse:not(.vf-switch--disabled) .vf-switch__thumb',
  },
  {
    file: 'switch',
    label: 'standalone inverse switch thumb has explicit contrast styling',
    snippet: '.vf-switch--thumb-contrast-inverse:not(.vf-switch--disabled) .vf-switch__thumb',
  },
  {
    file: 'viteConfig',
    label: 'field css export is built',
    snippet: "'field',",
  },
  {
    file: 'viteConfig',
    label: 'fieldset css export is built',
    snippet: "'fieldset',",
  },
];

let failures = 0;

for (const check of checks) {
  if (!source[check.file].includes(check.snippet)) {
    console.error(`[form-geometry] ${check.file}: missing ${check.label}`);
    failures += 1;
  }
}

for (const file of ['forms', 'select']) {
  if (source[file].includes('min-height: var(--vf-select-filter-min-height-sm)')) {
    console.error(`[form-geometry] ${file}: floating Select must not use the legacy filter min-height token`);
    failures += 1;
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log('[form-geometry] core form geometry contract passed.');
