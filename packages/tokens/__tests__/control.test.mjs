import assert from 'node:assert/strict';
import test from 'node:test';

import { cmControlTokenNames, cmControlTokens } from '../dist/index.js';

test('preserves the frozen VueForge control geometry under the cm namespace', () => {
  assert.deepEqual(Object.keys(cmControlTokens), [...cmControlTokenNames]);
  assert.equal(Object.isFrozen(cmControlTokens), true);
  assert.equal(Object.isFrozen(cmControlTokenNames), true);
  assert.deepEqual(cmControlTokens, {
    focusRingWidth: '3px',
    controlFontSizeSm: 'var(--cm-text-label-font-size)',
    controlFontSizeMd: 'var(--cm-text-body-font-size)',
    controlFontSizeLg: 'var(--cm-font-size-2xl)',
    controlLineHeight: 'var(--cm-text-label-line-height)',
    buttonPaddingSm: '0.25rem 0.5rem',
    buttonPaddingMd: '0.3125rem 0.75rem',
    buttonPaddingLg: '0.5rem 1rem',
    buttonGap: '0.5rem',
    fieldPaddingBlockSm: '0.25rem',
    fieldPaddingBlockMd: '0.3125rem',
    fieldPaddingBlockLg: '0.5rem',
    fieldPaddingInlineSm: '0.5rem',
    fieldPaddingInlineMd: '0.75rem',
    fieldPaddingInlineLg: '0.875rem',
    fieldPaddingSm: 'var(--cm-field-padding-block-sm) var(--cm-field-padding-inline-sm)',
    fieldPaddingMd: 'var(--cm-field-padding-block-md) var(--cm-field-padding-inline-md)',
    fieldPaddingLg: 'var(--cm-field-padding-block-lg) var(--cm-field-padding-inline-lg)',
  });
});

test('keeps every control alias inside the portable cm token graph', () => {
  for (const value of Object.values(cmControlTokens)) {
    assert.doesNotMatch(value, /--(?:vf|vueforge)-/);
  }
});
