import assert from 'node:assert/strict';
import test from 'node:test';
import { createShowcaseStateMatrix, validateShowcaseStateConfig } from './showcase-state-cases.mjs';

const visualConfig = {
  reference: { routes: ['core'] },
  themes: [
    { name: 'light', attribute: 'light' },
    { name: 'dark', attribute: 'dark' },
  ],
  viewports: [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
};

test('creates a deterministic state, theme, and viewport matrix', () => {
  const matrix = createShowcaseStateMatrix(
    {
      schemaVersion: 1,
      states: [
        { id: 'hover', route: 'core', selector: '.cm-button', pseudoClasses: ['hover'] },
        { id: 'reduced-motion', route: 'core', selector: '.cm-skeleton', media: 'reduce' },
      ],
    },
    visualConfig,
  );

  assert.equal(matrix.length, 8);
  assert.deepEqual(
    matrix.map(({ filename }) => filename),
    [
      'state--hover--light--mobile.png',
      'state--reduced-motion--light--mobile.png',
      'state--hover--dark--mobile.png',
      'state--reduced-motion--dark--mobile.png',
      'state--hover--light--desktop.png',
      'state--reduced-motion--light--desktop.png',
      'state--hover--dark--desktop.png',
      'state--reduced-motion--dark--desktop.png',
    ],
  );
  assert.equal(matrix[0].media, 'reduce');
  assert.equal(matrix[0].index, 0);
  assert.equal(matrix[0].padding, 24);
});

test('rejects ambiguous state definitions before browser capture', () => {
  const errors = validateShowcaseStateConfig(
    {
      schemaVersion: 1,
      states: [
        { id: 'hover', route: 'missing', selector: '', pseudoClasses: ['visited'] },
        {
          id: 'hover',
          route: 'core',
          selector: '.cm-button',
          index: -1,
          media: 'sometimes',
          padding: 300,
          assertReducedMotion: true,
        },
      ],
    },
    ['core'],
  );

  assert.ok(errors.includes('Duplicate showcase state id: hover.'));
  assert.ok(errors.includes('Showcase state hover uses unknown route: missing.'));
  assert.ok(errors.includes('Showcase state hover requires a non-empty selector.'));
  assert.ok(errors.includes('Showcase state hover uses unsupported pseudo-classes.'));
  assert.ok(errors.includes('Showcase state hover index must be a non-negative integer.'));
  assert.ok(errors.includes('Showcase state hover padding must be an integer between 0 and 256.'));
  assert.ok(errors.includes('Showcase state hover uses unsupported reduced-motion media value.'));
  assert.ok(errors.includes('Showcase state hover can assert reduced motion only with reduce media.'));
});
