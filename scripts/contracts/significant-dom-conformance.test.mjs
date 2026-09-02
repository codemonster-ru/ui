import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { compareSignificantDom } from './significant-dom.mjs';

// The PHP comparator runs these same cases in SignificantDomConformanceTest. Both must agree, or
// the Vue and Razor adapters are being judged against different notions of the same canonical DOM.
const { cases } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../contracts/significant-dom-conformance.json'), 'utf8'),
);

for (const testCase of cases) {
  test(`conformance: ${testCase.name}`, () => {
    assert.equal(
      compareSignificantDom(testCase.a, testCase.b, {
        normalizeGeneratedIds: testCase.normalizeGeneratedIds === true,
      }).equal,
      testCase.equal,
    );
  });
}
