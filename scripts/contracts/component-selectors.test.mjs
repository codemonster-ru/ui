import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const buttonContractDirectory = resolve(repositoryRoot, 'contracts/button');
const manifest = JSON.parse(readFileSync(resolve(buttonContractDirectory, 'manifest.json'), 'utf8'));
const buttonCss = readFileSync(resolve(repositoryRoot, 'packages/css/src/components/button.css'), 'utf8');
const cardContractDirectory = resolve(repositoryRoot, 'contracts/card');
const cardManifest = JSON.parse(readFileSync(resolve(cardContractDirectory, 'manifest.json'), 'utf8'));
const cardCss = readFileSync(resolve(repositoryRoot, 'packages/css/src/components/card.css'), 'utf8');

function componentClasses(slug) {
  const classes = new Set();
  const casesDirectory = resolve(repositoryRoot, `contracts/${slug}/cases`);

  for (const fileName of readdirSync(casesDirectory).filter((name) => name.endsWith('.html'))) {
    const html = readFileSync(resolve(casesDirectory, fileName), 'utf8');
    for (const [, classNames] of html.matchAll(/class="([^"]+)"/g)) {
      for (const className of classNames.split(/\s+/)) {
        if (className.startsWith(`cm-${slug}`)) classes.add(className);
      }
    }
  }

  return classes;
}

function cssClasses(slug) {
  const css = readFileSync(resolve(repositoryRoot, `packages/css/src/components/${slug}.css`), 'utf8');
  return new Set(
    [...css.matchAll(new RegExp(`\\.(cm-${slug}(?:--|__|-wrap)[a-z0-9-]*|cm-${slug})\\b`, 'g'))].map(
      (match) => match[1],
    ),
  );
}

function canonicalButtonClasses() {
  const classes = new Set();
  const casesDirectory = resolve(buttonContractDirectory, 'cases');

  for (const fileName of readdirSync(casesDirectory).filter((name) => name.endsWith('.html'))) {
    const html = readFileSync(resolve(casesDirectory, fileName), 'utf8');
    for (const [, classNames] of html.matchAll(/class="([^"]+)"/g)) {
      for (const className of classNames.split(/\s+/)) {
        if (className.startsWith('cm-button')) {
          classes.add(className);
        }
      }
    }
  }

  return classes;
}

test('keeps Button selectors aligned with its manifest and canonical HTML', () => {
  const approvedClasses = new Set([
    'cm-button',
    ...manifest.props.variant.values.map((value) => `cm-button--${value}`),
    ...manifest.props.size.values.map((value) => `cm-button--${value}`),
    'cm-button__label',
    'cm-button__leading',
    'cm-button__trailing',
    'cm-button__spinner',
  ]);
  const cssClasses = new Set(
    [...buttonCss.matchAll(/\.(cm-button(?:--|__)[a-z0-9-]+|cm-button)\b/g)].map((match) => match[1]),
  );
  const canonicalClasses = canonicalButtonClasses();

  assert.deepEqual(
    [...canonicalClasses].filter((name) => !approvedClasses.has(name)),
    [],
  );
  assert.deepEqual(
    [...cssClasses].filter((name) => !approvedClasses.has(name)),
    [],
  );
  for (const className of canonicalClasses) {
    assert.ok(cssClasses.has(className), `Canonical Button class has no CSS selector: ${className}`);
  }
});

test('preserves Button focus and disabled accessibility hooks', () => {
  assert.match(buttonCss, /\.cm-button:focus-visible[\s\S]*var\(--cm-color-focus-ring\)/);
  assert.match(buttonCss, /\.cm-button:disabled,/);
  assert.match(buttonCss, /\.cm-button\[aria-disabled='true'\]/);
  assert.match(buttonCss, /@media \(forced-colors: active\)[\s\S]*outline-color: Highlight;/);
  assert.match(buttonCss, /border-color: GrayText;/);
  assert.doesNotMatch(buttonCss, /pointer-events:\s*none/);
  assert.doesNotMatch(buttonCss, /cm-button--(?:disabled|loading)|data-cm-state/);
});

test('keeps Card selectors aligned with its manifest and canonical HTML', () => {
  const approvedClasses = new Set([
    'cm-card',
    ...cardManifest.states.filter((state) => state !== 'default').map((state) => `cm-card--${state}`),
    'cm-card__header',
    'cm-card__title',
    'cm-card__body',
    'cm-card__footer',
  ]);
  const cssClasses = new Set(
    [...cardCss.matchAll(/\.(cm-card(?:--|__)[a-z0-9-]+|cm-card)\b/g)].map((match) => match[1]),
  );
  const canonicalClasses = new Set();

  for (const fileName of readdirSync(resolve(cardContractDirectory, 'cases')).filter((name) =>
    name.endsWith('.html'),
  )) {
    const html = readFileSync(resolve(cardContractDirectory, 'cases', fileName), 'utf8');
    for (const [, classNames] of html.matchAll(/class="([^"]+)"/g)) {
      for (const className of classNames.split(/\s+/)) {
        if (className.startsWith('cm-card')) canonicalClasses.add(className);
      }
    }
  }

  assert.deepEqual(
    [...canonicalClasses].filter((name) => !approvedClasses.has(name)),
    [],
  );
  assert.deepEqual(
    [...cssClasses].filter((name) => !approvedClasses.has(name)),
    [],
  );
  for (const className of canonicalClasses) {
    assert.ok(cssClasses.has(className), `Canonical Card class has no CSS selector: ${className}`);
  }
});

for (const [slug, approved] of [
  [
    'accordion',
    ['cm-accordion', 'cm-accordion__item', 'cm-accordion__heading', 'cm-accordion__trigger', 'cm-accordion__panel'],
  ],
  [
    'field',
    [
      'cm-field',
      'cm-field--invalid',
      'cm-field__label',
      'cm-field__required',
      'cm-field__control',
      'cm-field__description',
      'cm-field__error',
    ],
  ],
  [
    'input',
    [
      'cm-input',
      'cm-input--sm',
      'cm-input--md',
      'cm-input--lg',
      'cm-input--invalid',
      'cm-input-wrap',
      'cm-input__leading',
      'cm-input__trailing',
      'cm-input__action',
    ],
  ],
  ['select', ['cm-select', 'cm-select--sm', 'cm-select--md', 'cm-select--lg', 'cm-select--invalid']],
  [
    'date-picker',
    ['cm-date-picker', 'cm-date-picker--sm', 'cm-date-picker--md', 'cm-date-picker--lg', 'cm-date-picker--invalid'],
  ],
  [
    'command-palette',
    [
      'cm-command-palette',
      'cm-command-palette--open',
      'cm-command-palette__surface',
      'cm-command-palette__header',
      'cm-command-palette__title',
      'cm-command-palette__close',
      'cm-command-palette__input',
      'cm-command-palette__list',
      'cm-command-palette__option',
      'cm-command-palette__option--active',
      'cm-command-palette__empty',
    ],
  ],
  ['link', ['cm-link', 'cm-link--underline-hover', 'cm-link--underline-always', 'cm-link--muted']],
  [
    'breadcrumbs',
    [
      'cm-breadcrumbs',
      'cm-breadcrumbs__list',
      'cm-breadcrumbs__item',
      'cm-breadcrumbs__link',
      'cm-breadcrumbs__current',
      'cm-breadcrumbs__current--disabled',
      'cm-breadcrumbs__separator',
    ],
  ],
  ['tabs', ['cm-tabs', 'cm-tabs__list', 'cm-tabs__tab', 'cm-tabs__panel']],
  ['menu', ['cm-menu', 'cm-menu__item', 'cm-menu__item--active', 'cm-menu__item--danger', 'cm-menu__item-label']],
  [
    'dropdown',
    ['cm-dropdown', 'cm-dropdown--bottom-end', 'cm-dropdown--open', 'cm-dropdown__trigger', 'cm-dropdown__menu'],
  ],
  [
    'dialog',
    [
      'cm-dialog',
      'cm-dialog--sm',
      'cm-dialog--md',
      'cm-dialog--lg',
      'cm-dialog--dividers',
      'cm-dialog--open',
      'cm-dialog__surface',
      'cm-dialog__header',
      'cm-dialog__actions',
      'cm-dialog__title',
      'cm-dialog__close',
      'cm-dialog__description',
      'cm-dialog__body',
      'cm-dialog__footer',
    ],
  ],
  [
    'drawer',
    [
      'cm-drawer',
      'cm-drawer--start',
      'cm-drawer--end',
      'cm-drawer--sm',
      'cm-drawer--md',
      'cm-drawer--lg',
      'cm-drawer--full',
      'cm-drawer--dividers',
      'cm-drawer--rounded',
      'cm-drawer--open',
      'cm-drawer__surface',
      'cm-drawer__header',
      'cm-drawer__actions',
      'cm-drawer__title',
      'cm-drawer__close',
      'cm-drawer__description',
      'cm-drawer__body',
      'cm-drawer__footer',
    ],
  ],
  [
    'popover',
    [
      'cm-popover',
      'cm-popover--top',
      'cm-popover--bottom-end',
      'cm-popover--open',
      'cm-popover__trigger',
      'cm-popover__panel',
    ],
  ],
  [
    'tooltip',
    [
      'cm-tooltip',
      'cm-tooltip--top',
      'cm-tooltip--bottom',
      'cm-tooltip--start',
      'cm-tooltip--end',
      'cm-tooltip--delay-short',
      'cm-tooltip--delay-none',
      'cm-tooltip--delay-long',
      'cm-tooltip--visible',
      'cm-tooltip__trigger',
      'cm-tooltip__content',
    ],
  ],
  [
    'checkbox',
    [
      'cm-checkbox',
      'cm-checkbox--sm',
      'cm-checkbox--md',
      'cm-checkbox--lg',
      'cm-checkbox--invalid',
      'cm-checkbox__input',
      'cm-checkbox__control',
      'cm-checkbox__mark',
      'cm-checkbox__content',
    ],
  ],
  [
    'radio',
    [
      'cm-radio',
      'cm-radio--sm',
      'cm-radio--md',
      'cm-radio--lg',
      'cm-radio--invalid',
      'cm-radio__input',
      'cm-radio__control',
      'cm-radio__mark',
      'cm-radio__content',
    ],
  ],
  ['textarea', ['cm-textarea', 'cm-textarea--sm', 'cm-textarea--md', 'cm-textarea--lg', 'cm-textarea--invalid']],
  [
    'switch',
    [
      'cm-switch',
      'cm-switch--sm',
      'cm-switch--md',
      'cm-switch--lg',
      'cm-switch--invalid',
      'cm-switch__input',
      'cm-switch__control',
      'cm-switch__thumb',
      'cm-switch__content',
    ],
  ],
  [
    'badge',
    [
      'cm-badge',
      'cm-badge--primary',
      'cm-badge--success',
      'cm-badge--info',
      'cm-badge--warning',
      'cm-badge--help',
      'cm-badge--danger',
      'cm-badge--contrast',
    ],
  ],
  [
    'alert',
    [
      'cm-alert',
      'cm-alert--neutral',
      'cm-alert--primary',
      'cm-alert--success',
      'cm-alert--warning',
      'cm-alert--help',
      'cm-alert--danger',
      'cm-alert--contrast',
      'cm-alert__icon',
      'cm-alert__content',
      'cm-alert__title',
      'cm-alert__body',
    ],
  ],
  [
    'avatar',
    ['cm-avatar', 'cm-avatar--sm', 'cm-avatar--lg', 'cm-avatar--circle', 'cm-avatar__image', 'cm-avatar__label'],
  ],
  ['divider', ['cm-divider', 'cm-divider--horizontal', 'cm-divider--vertical']],
  [
    'skeleton',
    [
      'cm-skeleton',
      'cm-skeleton--animated',
      'cm-skeleton--radius-control',
      'cm-skeleton--radius-surface',
      'cm-skeleton--radius-round',
    ],
  ],
  [
    'table',
    [
      'cm-table-wrap',
      'cm-table',
      'cm-table--compact',
      'cm-table--striped',
      'cm-table--column-dividers',
      'cm-table--sticky-header',
      'cm-table__scroll',
      'cm-table__caption',
      'cm-table__head',
      'cm-table__body',
      'cm-table__foot',
    ],
  ],
  [
    'data-table',
    [
      'cm-data-table',
      'cm-data-table--compact',
      'cm-data-table--striped',
      'cm-data-table--column-dividers',
      'cm-data-table--sticky-header',
      'cm-data-table__scroll',
      'cm-data-table__table',
      'cm-data-table__caption',
      'cm-data-table__head',
      'cm-data-table__body',
      'cm-data-table__selection',
      'cm-data-table__cell--center',
      'cm-data-table__cell--end',
      'cm-data-table__sort',
      'cm-data-table__sort-indicator',
      'cm-data-table__row--selected',
      'cm-data-table__state',
      'cm-data-table__pagination',
      'cm-data-table__page-size',
      'cm-data-table__page-button',
      'cm-data-table__page-summary',
      'cm-data-table__pagination-summary',
    ],
  ],
  [
    'container',
    [
      'cm-container',
      'cm-container--md',
      'cm-container--lg',
      'cm-container--xl',
      'cm-container--2xl',
      'cm-container--fluid',
    ],
  ],
  ['stack', ['cm-stack']],
  ['inline', ['cm-inline', 'cm-inline--nowrap']],
  ['section', ['cm-section', 'cm-section--surface']],
  ['grid', ['cm-grid']],
]) {
  test(`keeps ${slug} selectors aligned with canonical HTML`, () => {
    const allowed = new Set(approved);
    const canonical = componentClasses(slug);
    const styled = cssClasses(slug);

    assert.deepEqual(
      [...canonical].filter((name) => !allowed.has(name)),
      [],
    );
    assert.deepEqual(
      [...styled].filter((name) => !allowed.has(name)),
      [],
    );
    for (const className of canonical) {
      assert.ok(styled.has(className), `Canonical ${slug} class has no CSS selector: ${className}`);
    }
  });
}
