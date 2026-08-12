import assert from 'node:assert/strict';
import test from 'node:test';

import { isDocumentationScriptLanguage } from './documentation-fences.mjs';

test('recognizes executable documentation fence languages exactly', () => {
  for (const language of ['ts', 'typescript', 'js', 'javascript', 'vue', 'bash', 'sh', 'shell']) {
    assert.equal(isDocumentationScriptLanguage(language), true);
  }

  for (const language of ['json', 'jsonc', 'text', 'css', 'html']) {
    assert.equal(isDocumentationScriptLanguage(language), false);
  }
});
