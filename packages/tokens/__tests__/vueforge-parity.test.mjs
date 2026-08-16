import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import {
  cmDarkThemePreset,
  cmLightThemePreset,
  cmThemeTokenSchema,
  serializeCmThemeTokensToCssVars,
} from '../dist/index.js';

const report = JSON.parse(await readFile(new URL('../parity/vueforge-2-token-parity.json', import.meta.url)));

function resolveCssValue(name, variables, seen = new Set()) {
  assert.equal(name in variables, true, `Computed variable source is missing ${name}.`);
  assert.equal(seen.has(name), false, `CSS variable cycle includes ${name}.`);
  const nextSeen = new Set(seen).add(name);
  const resolved = variables[name].replace(/var\((--cm-[a-z0-9-]+)\)/g, (_, reference) =>
    resolveCssValue(reference, variables, nextSeen),
  );
  const calculation = resolved.match(/^calc\(([-\d.]+)rem ([+-]) ([-\d.]+)rem\)$/);
  if (calculation) {
    const [, left, operator, right] = calculation;
    const value = operator === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
    return `${value}rem`;
  }
  return resolved;
}

test('matches the machine-readable VueForge 2 token parity report', () => {
  assert.equal(report.status, 'pass');
  assert.deepEqual(
    Object.fromEntries(Object.entries(cmThemeTokenSchema).map(([name, tokens]) => [name, tokens.length])),
    report.groups,
  );
  assert.equal(Object.keys(cmLightThemePreset.tokens).length, report.themePresets.light.tokenCount);
  assert.equal(Object.keys(cmDarkThemePreset.tokens).length, report.themePresets.dark.tokenCount);

  for (const [name, value] of Object.entries(report.aliases)) {
    assert.equal(cmLightThemePreset.tokens[name], value, `${name} alias drifted.`);
  }
});

test('resolves the reviewed aliases to the frozen browser values', () => {
  const cssVariables = serializeCmThemeTokensToCssVars(cmLightThemePreset.tokens);

  for (const [name, expected] of Object.entries(report.computedCssVariables)) {
    assert.equal(resolveCssValue(name, cssVariables), expected, `${name} drifted.`);
  }
});
