import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeCmThemeTokensToCssVars } from '../dist/index.js';

test('serializes theme tokens into immutable CodeMonster CSS variables', () => {
  const tokens = {
    paletteNeutral0: 'oklch(100% 0 0)',
    fontSize2xl: '1.5rem',
    breakpoint2xl: '1536px',
  };

  const cssVars = serializeCmThemeTokensToCssVars(tokens);

  assert.deepEqual(cssVars, {
    '--cm-palette-neutral-0': 'oklch(100% 0 0)',
    '--cm-font-size-2xl': '1.5rem',
    '--cm-breakpoint-2xl': '1536px',
  });
  assert.equal(Object.isFrozen(cssVars), true);
  assert.deepEqual(tokens, {
    paletteNeutral0: 'oklch(100% 0 0)',
    fontSize2xl: '1.5rem',
    breakpoint2xl: '1536px',
  });
});

test('serializes empty theme overrides without adding defaults', () => {
  assert.deepEqual(serializeCmThemeTokensToCssVars({}), {});
});
