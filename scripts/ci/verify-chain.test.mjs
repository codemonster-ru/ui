import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../package.json'), 'utf8'));

test('verifies the contract, accessibility, and visual fixture suites', () => {
  // These suites guard the canonical component cases. They ran outside the release chain once and
  // collected seventeen selector violations that nothing reported.
  const verify = manifest.scripts.verify;
  assert.match(verify, /npm run test:ui\b/u);

  const uiSuite = manifest.scripts['test:ui'];
  for (const required of ['check:ui-contracts', 'check:ui-accessibility', 'check:ui-visual-fixtures']) {
    assert.match(uiSuite, new RegExp(`npm run ${required.replace(':', ':')}\\b`, 'u'));
  }
});
