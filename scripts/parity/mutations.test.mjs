import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessMutation, MutationNotApplied, parityMutations, wrapperPresenceCases } from './mutations.mjs';

test('the blind-six proof requires all four corrupted attributes in every case, direction and theme', () => {
  const mutation = parityMutations.find((entry) => entry.id === 'blind-six-native-attributes');
  const failures = wrapperPresenceCases.flatMap((caseId) =>
    ['reference-vs-razor', 'current-vs-razor'].flatMap((direction) =>
      ['light', 'dark'].flatMap((theme) =>
        Object.entries(mutation.expect.details).flatMap(([dimension, details]) =>
          details.map((detail) => ({ caseId, direction, theme, dimension, detail })),
        ),
      ),
    ),
  );
  assert.equal(failures.length, 96);
  assert.deepEqual(assessMutation(mutation.expect, failures), []);
  assert.equal(assessMutation(mutation.expect, failures.slice(1)).length, 1);
  assert.equal(assessMutation(mutation.expect, [{ dimension: 'build.failed' }]).length, 96);
});

test('a stale mutation cannot be applied to a capture without its target', () => {
  const mutation = parityMutations.find((entry) => entry.id === 'blind-six-native-attributes');
  assert.throws(() => mutation.apply({ razor: { light: { extracted: {} } } }), MutationNotApplied);
});
