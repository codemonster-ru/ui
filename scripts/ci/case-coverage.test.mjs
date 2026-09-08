// The shared case catalogs cannot quietly shrink.
//
// Every parity claim is "the three targets agree on every shared case", which
// says nothing at all if the shared cases can be deleted. Dropping four cases
// from contracts/icon-button/cases.json leaves both showcases rendering the
// same shorter list, the parity gate comparing fewer cases and passing, and
// every other gate green: coverage erosion is invisible by construction.
//
// VfInput has partial cover by accident - its divergence registry names six
// case ids, so deleting those breaks the policy - but VfIconButton has no
// approvals at all, so nothing pinned its catalog.
//
// These assertions are asymmetric on purpose. Adding cases is always fine;
// removing one has to be a deliberate edit here, where a reviewer sees the
// coverage claim it breaks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { activationCoverageViolations } from './case-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = (path) => JSON.parse(readFileSync(resolve(repositoryRoot, path), 'utf8'));

const iconButton = catalog('contracts/icon-button/cases.json');
const input = catalog('contracts/input/cases.json');

const iconButtonCases = iconButton.cases;
const valuesOf = (prop) => new Set(iconButtonCases.map((entry) => entry.props[prop]).filter(Boolean));

test('the icon button catalog exercises every documented variant', () => {
  const documented = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'ghost'];
  const covered = valuesOf('variant');

  for (const variant of documented) {
    assert.ok(covered.has(variant), `no shared case renders the ${variant} variant`);
  }
});

test('the icon button catalog exercises every documented size, including the default', () => {
  const covered = valuesOf('size');

  for (const size of ['sm', 'md', 'lg']) {
    assert.ok(covered.has(size), `no shared case renders the ${size} size`);
  }

  // md is the default and emits no modifier, so a case that omits size entirely
  // is what proves the default path, not the case that names it.
  assert.ok(
    iconButtonCases.some((entry) => entry.props.size === undefined),
    'no shared case leaves size unset, so the default is never compared',
  );
});

test('the icon button catalog exercises the attribute contract', () => {
  const attrs = iconButtonCases.flatMap((entry) => Object.keys(entry.attrs));

  for (const attribute of ['aria-label', 'aria-pressed', 'disabled', 'class', 'style', 'id', 'title', 'data-testid']) {
    assert.ok(attrs.includes(attribute), `no shared case forwards ${attribute}`);
  }

  assert.ok(
    iconButtonCases.some((entry) => entry.props.type === 'submit'),
    'no shared case overrides the rendered type',
  );
});

// The activation rules live in case-coverage.mjs so the erosion tests can run
// them against a deliberately damaged catalog. Here they run against the real
// one, which is the claim CI actually needs to hold.
test('the icon button catalog proves every activation outcome it claims to cover', () => {
  assert.deepEqual(
    activationCoverageViolations(iconButtonCases),
    [],
    'the icon button activation coverage eroded',
  );
});

test('the icon button catalog uses glyphs beyond the ones VfInput needed', () => {
  const glyphs = new Set(iconButtonCases.map((entry) => entry.props.icon));
  const beyondInput = [...glyphs].filter((name) => !['xmark', 'eye', 'eye-slash'].includes(name));

  // The migration claim in one assertion: the registry serves components whose
  // icons nobody extracted for them.
  assert.ok(beyondInput.length >= 3, `only ${beyondInput.length} glyph(s) outside the VfInput closure`);
});

test('neither catalog loses cases without this file being edited', () => {
  // Floors, not equalities: adding cases is always fine.
  assert.ok(iconButtonCases.length >= 29, `the icon button catalog fell to ${iconButtonCases.length} cases`);
  assert.ok(input.cases.length >= 51, `the input catalog fell to ${input.cases.length} cases`);
});

test('every case id is unique and namespaced to its component', () => {
  for (const [component, entries] of [
    ['icon-button', iconButtonCases],
    ['input', input.cases],
  ]) {
    const ids = entries.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length, `${component} has duplicate case ids`);
    assert.deepEqual(
      ids.filter((id) => !id.startsWith(`${component}/`)),
      [],
      `${component} has case ids outside its namespace`,
    );
  }
});
