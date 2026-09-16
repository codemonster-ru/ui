// The TypeScript half of the cross-language contract for VfLink.
//
// packages/razor/tests/Support/LinkStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/link/state-vectors.json' with { type: 'json' };
import {
  resolveLinkClasses,
  resolveLinkRel,
  type VfLinkToneName,
  type VfLinkUnderlineName,
} from '../src/link/state.js';

describe('shared link state vectors', () => {
  it('covers every rule the PHP adapter restates, and nothing about the router branch', () => {
    // Two rules. A `resolveLinkElement`, a `resolveLinkHref` or anything that
    // took a `to` would be the shared core describing Vue's router handoff,
    // which has no second implementation to agree with.
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveLinkClasses', 'resolveLinkRel']);
    for (const vector of vectors.resolveLinkRel) {
      expect(Object.keys(vector).sort()).not.toContain('to');
    }
  });

  it('derives rel only for _blank and only when no rel is given', () => {
    expect(resolveLinkRel(undefined, '_blank')).toBe('noopener noreferrer');
    expect(resolveLinkRel(undefined, '_self')).toBeUndefined();
    expect(resolveLinkRel(undefined, undefined)).toBeUndefined();
  });

  it('lets an explicit rel win without merging', () => {
    expect(resolveLinkRel('nofollow', '_blank')).toBe('nofollow');
    expect(resolveLinkRel('nofollow', '_blank')).not.toContain('noopener');
  });

  it('treats an empty-string rel as not given', () => {
    expect(resolveLinkRel('', '_blank')).toBe('noopener noreferrer');
    expect(resolveLinkRel('', undefined)).toBeUndefined();
  });

  it('emits no modifier for the defaults and orders underline before tone', () => {
    expect(resolveLinkClasses('none', 'default')).toEqual(['vf-link']);
    expect(resolveLinkClasses('always', 'muted')).toEqual(['vf-link', 'vf-link--underline-always', 'vf-link--muted']);
  });

  it.each(vectors.resolveLinkClasses)('resolveLinkClasses($underline, $tone) -> $expected', (vector) => {
    expect(resolveLinkClasses(vector.underline as VfLinkUnderlineName, vector.tone as VfLinkToneName)).toEqual(
      vector.expected,
    );
  });

  it.each(vectors.resolveLinkRel)('resolveLinkRel($rel, $target) -> $expected', (vector) => {
    expect(resolveLinkRel(vector.rel, vector.target) ?? null).toBe(vector.expected);
  });
});
