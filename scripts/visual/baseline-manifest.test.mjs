import assert from 'node:assert/strict';
import test from 'node:test';
import { findBaselineManifestIssues } from './baseline-manifest.mjs';

const valid = {
  configuredRoutes: ['core'],
  files: ['core--light--desktop--01.png'],
  manifest: {
    routes: ['core'],
    screenshots: [{ filename: 'core--light--desktop--01.png', route: 'core' }],
  },
};

test('accepts a manifest that matches the config and the files on disk', () => {
  assert.deepEqual(findBaselineManifestIssues(valid), []);
});

test('reports a route the capture config no longer lists', () => {
  const issues = findBaselineManifestIssues({
    ...valid,
    manifest: {
      routes: ['core', 'colors'],
      screenshots: valid.manifest.screenshots,
    },
  });
  assert.equal(issues.some((issue) => issue.includes('colors')), true);
});

test('reports a configured route the baselines do not cover', () => {
  const issues = findBaselineManifestIssues({ ...valid, configuredRoutes: ['core', 'icons'] });
  assert.equal(issues.some((issue) => issue.includes('icons')), true);
});

test('reports a described screenshot that is missing from disk', () => {
  const issues = findBaselineManifestIssues({ ...valid, files: [] });
  assert.equal(issues.some((issue) => issue.includes('missing from the baseline directory')), true);
});

test('reports a file the manifest does not describe', () => {
  const issues = findBaselineManifestIssues({
    ...valid,
    files: [...valid.files, 'core--light--desktop--02.png'],
  });
  assert.equal(issues.some((issue) => issue.includes('does not describe')), true);
});

test('rejects a manifest without the arrays it must define', () => {
  assert.deepEqual(findBaselineManifestIssues({ configuredRoutes: [], files: [], manifest: {} }), [
    'Baseline manifest must define routes and screenshots arrays.',
  ]);
});
