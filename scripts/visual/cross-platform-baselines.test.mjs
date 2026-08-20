import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import {
  createCrossPlatformBaselineMatrix,
  readCrossPlatformBaselineManifest,
  validateCrossPlatformBaselineManifest,
} from './cross-platform-baselines.mjs';
import { readVisualConfig } from './code-monster-ui-fixtures.mjs';

const config = {
  schemaVersion: 2,
  reference: {
    commit: 'fd793696f50d3be0fcd3788f0f8f751c63869963',
    routes: ['core'],
  },
  themes: [{ name: 'light', attribute: 'light' }],
  viewports: [{ name: 'desktop', width: 1280, height: 800 }],
  stylesheets: ['/assets/ui.css'],
};
const componentCases = [
  {
    canonicalHtml: '<button class="cm-button">Save</button>\n',
    data: {},
    id: 'button-default',
  },
];
const manifest = {
  schemaVersion: 1,
  platforms: ['vue', 'razor'],
  caseIds: ['button-default'],
};

test('routes Vue and Razor fixtures to one immutable reviewed baseline', () => {
  const fixtures = createCrossPlatformBaselineMatrix(componentCases, config, manifest);

  assert.deepEqual(
    fixtures.map(({ platform, snapshotPath }) => [platform, snapshotPath]),
    [
      ['vue', 'vue/button-default--light--desktop.png'],
      ['razor', 'razor/button-default--light--desktop.png'],
    ],
  );
  assert.equal(fixtures[0].baselineId, fixtures[1].baselineId);
  assert.equal(fixtures[0].document, fixtures[1].document);
  assert.equal(fixtures[0].baselineId, `${config.reference.commit}/button-default--light--desktop`);
});

test('rejects missing adapters, duplicate cases, and unknown cases', () => {
  assert.ok(
    validateCrossPlatformBaselineManifest({ ...manifest, platforms: ['vue'] }, componentCases).includes(
      'Cross-platform baseline manifest must include razor.',
    ),
  );
  assert.ok(
    validateCrossPlatformBaselineManifest(
      { ...manifest, caseIds: ['button-default', 'button-default'] },
      componentCases,
    ).includes('Duplicate cross-platform baseline caseIds value: button-default.'),
  );
  assert.ok(
    validateCrossPlatformBaselineManifest({ ...manifest, caseIds: ['button-missing'] }, componentCases).includes(
      'Cross-platform baseline references unknown case button-missing.',
    ),
  );
});

test('builds the reviewed repository first slice for both adapters', () => {
  const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
  const collected = collectComponentCases(contractsDirectory);
  const fixtures = createCrossPlatformBaselineMatrix(
    collected.cases,
    readVisualConfig(resolve(contractsDirectory, 'visual.config.json')),
    readCrossPlatformBaselineManifest(resolve(contractsDirectory, 'cross-platform-visual-baselines.json')),
  );

  assert.deepEqual(collected.errors, []);
  assert.equal(fixtures.length, 96);
  assert.deepEqual(
    new Set(fixtures.map(({ caseId }) => caseId)),
    new Set([
      'alert-danger-icon',
      'avatar-label',
      'badge-danger',
      'button-default',
      'card-title',
      'divider-horizontal',
      'link-default',
      'field-help-error',
      'input-enhanced',
      'accordion-rich-content',
      'select-clearable',
      'date-picker-clearable',
    ]),
  );
  assert.deepEqual(new Set(fixtures.map(({ platform }) => platform)), new Set(['vue', 'razor']));
  assert.equal(new Set(fixtures.map(({ baselineId }) => baselineId)).size, 48);
});
