// Proves the baseline comparison fails on the regressions it exists to catch.
// A green capture run means nothing if a missing case can shrink the
// denominator instead of failing the gate.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareCaptureSets, compareEnvironments } from './compare.mjs';

function capture(overrides = {}) {
  return {
    id: 'core-desktop-light',
    route: 'core',
    path: '/core',
    viewport: 'desktop',
    theme: 'light',
    cases: ['block:demo-forms', 'matrix:form-geometry-matrix'],
    caseCount: 2,
    componentCensus: { 'vf-input': 12, 'vf-button': 92 },
    layout: { scrollHeight: 21369, scrollWidth: 1440, clientWidth: 1440, theme: 'light', reducedMotion: true },
    fonts: { bodyProbeWidth: 257.38 },
    screenshot: { filename: 'core-desktop-light.png', bytes: 2639851, sha256: 'a'.repeat(64) },
    ...overrides,
  };
}

function set(captures) {
  return { captures };
}

test('identical capture sets report no differences', () => {
  assert.deepEqual(compareCaptureSets(set([capture()]), set([capture()])), []);
});

test('a missing capture fails instead of shrinking the denominator', () => {
  const differences = compareCaptureSets(set([capture(), capture({ id: 'colors-desktop-light' })]), set([capture()]));
  assert.deepEqual(differences, ['capture colors-desktop-light: missing in current']);
});

test('an unexpected capture fails', () => {
  const differences = compareCaptureSets(set([capture()]), set([capture(), capture({ id: 'extra-route' })]));
  assert.deepEqual(differences, ['capture extra-route: unexpected in current']);
});

test('a missing showcase case fails', () => {
  const differences = compareCaptureSets(
    set([capture()]),
    set([capture({ cases: ['block:demo-forms'], caseCount: 1 })]),
  );
  assert.ok(differences.includes('capture core-desktop-light: missing case matrix:form-geometry-matrix'));
});

test('an unexpected showcase case fails', () => {
  const differences = compareCaptureSets(
    set([capture()]),
    set([capture({ cases: [...capture().cases, 'block:demo-new'], caseCount: 3 })]),
  );
  assert.ok(differences.includes('capture core-desktop-light: unexpected case block:demo-new'));
});

test('a reordered case list fails', () => {
  const differences = compareCaptureSets(set([capture()]), set([capture({ cases: [...capture().cases].reverse() })]));
  assert.deepEqual(differences, ['capture core-desktop-light: case order changed']);
});

test('a component disappearing from the showcase fails', () => {
  const differences = compareCaptureSets(
    set([capture()]),
    set([capture({ componentCensus: { 'vf-input': 11, 'vf-button': 92 } })]),
  );
  assert.deepEqual(differences, ['capture core-desktop-light: component census vf-input 12 -> 11']);
});

test('a changed screenshot fails', () => {
  const differences = compareCaptureSets(
    set([capture()]),
    set([capture({ screenshot: { filename: 'core-desktop-light.png', bytes: 10, sha256: 'b'.repeat(64) } })]),
  );
  assert.equal(differences.length, 1);
  assert.match(differences[0], /screenshot differs/);
});

test('a dimension mismatch fails and is not tolerated', () => {
  const differences = compareCaptureSets(
    set([capture()]),
    set([capture({ layout: { ...capture().layout, scrollHeight: 21000 } })]),
  );
  assert.ok(differences.some((difference) => difference.includes('layout.scrollHeight 21369 -> 21000')));
});

test('a changed resolved font fails', () => {
  const differences = compareCaptureSets(set([capture()]), set([capture({ fonts: { bodyProbeWidth: 227.18 } })]));
  assert.deepEqual(differences, ['capture core-desktop-light: resolved fonts changed']);
});

test('environment drift is reported separately', () => {
  const differences = compareEnvironments(
    { browser: 'Chrome/152', locale: 'en-US' },
    { browser: 'Chrome/153', locale: 'en-US' },
  );
  assert.deepEqual(differences, ['environment.browser: "Chrome/152" -> "Chrome/153"']);
});
