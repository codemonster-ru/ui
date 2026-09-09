// The TypeScript half of the cross-language contract for the M15 components.
//
// packages/razor/tests/Support/PresentationStateVectorsTest.php runs the same
// file against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/presentation/state-vectors.json' with { type: 'json' };
import {
  resolveBadgeClasses,
  resolveDividerClasses,
  resolveDividerRole,
  resolveTagClasses,
} from '../src/presentation/state.js';

describe('shared presentation state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveBadgeClasses', 'resolveDividerClasses', 'resolveDividerRole', 'resolveTagClasses']);
  });

  it('proves both toned spans express the default tone by absence', () => {
    // The one line of behaviour Badge and Tag genuinely share, and the reason
    // neither of them looks like the M14 checkable controls.
    expect(resolveBadgeClasses('neutral')).toEqual(['vf-badge']);
    expect(resolveTagClasses('neutral')).toEqual(['vf-tag']);
  });

  it('proves the divider does the opposite and always emits its modifier', () => {
    expect(resolveDividerClasses('horizontal')).toEqual(['vf-divider', 'vf-divider--horizontal']);
  });

  it('proves neither toned span can produce the other block', () => {
    // The substitution guard. If one resolver were ever implemented in terms of
    // the other, this is what notices before any parity run.
    for (const tone of ['neutral', 'primary', 'danger', 'contrast']) {
      expect(resolveBadgeClasses(tone).join(' ')).not.toContain('vf-tag');
      expect(resolveTagClasses(tone).join(' ')).not.toContain('vf-badge');
    }
  });

  it('proves the divider role is tied strictly to the vertical orientation', () => {
    expect(resolveDividerRole('horizontal')).toBeUndefined();
    expect(resolveDividerRole('vertical')).toBe('separator');
  });

  it.each(vectors.resolveBadgeClasses)('resolveBadgeClasses($tone) -> $expected', (vector) => {
    expect(resolveBadgeClasses(vector.tone)).toEqual(vector.expected);
  });

  it.each(vectors.resolveTagClasses)('resolveTagClasses($tone) -> $expected', (vector) => {
    expect(resolveTagClasses(vector.tone)).toEqual(vector.expected);
  });

  it.each(vectors.resolveDividerClasses)('resolveDividerClasses($orientation) -> $expected', (vector) => {
    expect(resolveDividerClasses(vector.orientation)).toEqual(vector.expected);
  });

  it.each(vectors.resolveDividerRole)('resolveDividerRole($orientation) -> $expected', (vector) => {
    // `null` in JSON is `undefined` in the rule: an absent role, not a role
    // whose value is the string "null".
    expect(resolveDividerRole(vector.orientation)).toBe(vector.expected ?? undefined);
  });
});
