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

  for (const fileName of readdirSync(resolve(cardContractDirectory, 'cases')).filter((name) => name.endsWith('.html'))) {
    const html = readFileSync(resolve(cardContractDirectory, 'cases', fileName), 'utf8');
    for (const [, classNames] of html.matchAll(/class="([^"]+)"/g)) {
      for (const className of classNames.split(/\s+/)) {
        if (className.startsWith('cm-card')) canonicalClasses.add(className);
      }
    }
  }

  assert.deepEqual([...canonicalClasses].filter((name) => !approvedClasses.has(name)), []);
  assert.deepEqual([...cssClasses].filter((name) => !approvedClasses.has(name)), []);
  for (const className of canonicalClasses) {
    assert.ok(cssClasses.has(className), `Canonical Card class has no CSS selector: ${className}`);
  }
});
