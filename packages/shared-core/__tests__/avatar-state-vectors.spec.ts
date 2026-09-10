// The TypeScript half of the cross-language contract for VfAvatar.
//
// packages/razor/tests/Support/AvatarStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/avatar/state-vectors.json' with { type: 'json' };
import { resolveAvatarBranch, resolveAvatarClasses } from '../src/avatar/state.js';

describe('shared avatar state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveAvatarBranch', 'resolveAvatarClasses']);
  });

  it('proves the fallback order is image, then label, then icon, then slot', () => {
    // Stated as one chain rather than four independent claims, because the
    // contract is the ordering and not the branches. Each line removes the
    // winner of the line above it.
    expect(resolveAvatarBranch({ image: '/a.png', label: 'MC', icon: 'user' })).toBe('image');
    expect(resolveAvatarBranch({ label: 'MC', icon: 'user' })).toBe('label');
    expect(resolveAvatarBranch({ icon: 'user' })).toBe('icon');
    expect(resolveAvatarBranch({})).toBe('slot');
  });

  it('proves both modifiers are suppressed at their default, by two different rules', () => {
    // The size compares against md, the shape against circle. They cannot be
    // folded into one "suppress the default" rule: square is not the value the
    // shape modifier is named after.
    expect(resolveAvatarClasses('md', 'square')).toEqual(['vf-avatar']);
    expect(resolveAvatarClasses('sm', 'circle')).toEqual(['vf-avatar', 'vf-avatar--sm', 'vf-avatar--circle']);
  });

  it('proves an empty string does not select its branch', () => {
    expect(resolveAvatarBranch({ image: '', label: 'MC' })).toBe('label');
    expect(resolveAvatarBranch({ image: '', label: '', icon: '' })).toBe('slot');
  });

  it.each(vectors.resolveAvatarClasses)('resolveAvatarClasses($size, $shape) -> $expected', (vector) => {
    expect(resolveAvatarClasses(vector.size, vector.shape)).toEqual(vector.expected);
  });

  it.each(vectors.resolveAvatarBranch)('resolveAvatarBranch($image, $label, $icon) -> $expected', (vector) => {
    expect(resolveAvatarBranch({ image: vector.image, label: vector.label, icon: vector.icon })).toBe(vector.expected);
  });
});
