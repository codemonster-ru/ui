import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { collectComponentCases } from './component-cases.mjs';

function createFixture() {
  return mkdtempSync(join(tmpdir(), 'codemonster-ui-contract-cases-'));
}

function writeCase(root, component, basename, data, html = '<button>Save</button>\n') {
  const casesDirectory = join(root, component, 'cases');
  mkdirSync(casesDirectory, { recursive: true });
  writeFileSync(join(casesDirectory, `${basename}.case.json`), `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(join(casesDirectory, `${basename}.html`), html);
}

test('collects a paired component case and canonical HTML', () => {
  const root = createFixture();
  try {
    writeCase(root, 'button', 'default', {
      schemaVersion: 1,
      id: 'button-default',
      props: {},
      slots: { default: 'Save' },
    });

    const result = collectComponentCases(root);
    assert.deepEqual(result.errors, []);
    assert.equal(result.cases.length, 1);
    assert.equal(result.cases[0].id, 'button-default');
    assert.equal(result.cases[0].canonicalHtml, '<button>Save</button>\n');
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('reports a missing canonical HTML pair', () => {
  const root = createFixture();
  try {
    const casesDirectory = join(root, 'button', 'cases');
    mkdirSync(casesDirectory, { recursive: true });
    writeFileSync(
      join(casesDirectory, 'default.case.json'),
      '{"schemaVersion":1,"id":"button-default","props":{},"slots":{}}\n',
    );

    const result = collectComponentCases(root);
    assert.deepEqual(result.errors, ['button/cases/default.case.json is missing its paired default.html.']);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('reports case identifiers that do not match their component and basename', () => {
  const root = createFixture();
  try {
    writeCase(root, 'button', 'loading', {
      schemaVersion: 1,
      id: 'button-busy',
      props: { loading: true },
      slots: { default: 'Save' },
    });

    const result = collectComponentCases(root);
    assert.deepEqual(result.errors, [
      'button/cases/loading.case.json id must be button-loading (received button-busy).',
    ]);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('reports empty canonical HTML', () => {
  const root = createFixture();
  try {
    writeCase(root, 'button', 'default', { schemaVersion: 1, id: 'button-default', props: {}, slots: {} }, '  \n');

    const result = collectComponentCases(root);
    assert.deepEqual(result.errors, ['button/cases/default.html must not be empty.']);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
