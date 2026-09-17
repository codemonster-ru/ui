// The TypeScript half of the cross-language contract for VfBreadcrumbs.
//
// packages/razor/tests/Support/BreadcrumbsStateVectorsTest.php runs the same
// file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/breadcrumbs/state-vectors.json' with { type: 'json' };
import {
  isBreadcrumbLink,
  resolveBreadcrumbCurrentFlags,
  resolveBreadcrumbItemClasses,
} from '../src/breadcrumbs/state.js';
import { resolveLinkRel } from '../src/link/state.js';

describe('shared breadcrumbs state vectors', () => {
  it('covers every rule the PHP adapter restates, nothing about the router branch, and no object destination', () => {
    // Three rules. A `resolveBreadcrumbElement`, a `resolveBreadcrumbHref` or
    // anything that took a `to` would be the shared core describing Vue's
    // router handoff, which has no second implementation to agree with. The
    // rel rule is VfLink's and is not restated.
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['isBreadcrumbLink', 'resolveBreadcrumbCurrentFlags', 'resolveBreadcrumbItemClasses']);
    for (const vector of vectors.isBreadcrumbLink) {
      expect(Object.keys(vector)).not.toContain('to');
      expect(typeof vector.destination === 'string' || vector.destination === null).toBe(true);
    }
  });

  it('makes the last item current only when no item is flagged, and every flagged item current otherwise', () => {
    expect(resolveBreadcrumbCurrentFlags([undefined, undefined])).toEqual([false, true]);
    expect(resolveBreadcrumbCurrentFlags([undefined, true, undefined])).toEqual([false, true, false]);
    expect(resolveBreadcrumbCurrentFlags([true, true, undefined])).toEqual([true, true, false]);
    expect(resolveBreadcrumbCurrentFlags([])).toEqual([]);
  });

  it('tests the destination for truthiness, so an empty string is no destination and an object is one', () => {
    expect(isBreadcrumbLink(undefined, false, '')).toBe(false);
    expect(isBreadcrumbLink(undefined, false, '/docs')).toBe(true);
    // The object case is the Vue adapter's `to`; the rule sees only that it is truthy.
    expect(isBreadcrumbLink(undefined, false, { name: 'home' })).toBe(true);
    expect(isBreadcrumbLink(undefined, true, '/docs')).toBe(false);
    expect(isBreadcrumbLink(true, false, '/docs')).toBe(false);
  });

  it('reuses the link rel rule unchanged: only _blank derives, an explicit rel wins, an empty rel is not given', () => {
    // Pinned here so a breadcrumb-specific copy of the rule cannot drift from
    // the one the component actually imports.
    expect(resolveLinkRel(undefined, '_blank')).toBe('noopener noreferrer');
    expect(resolveLinkRel('nofollow', '_blank')).toBe('nofollow');
    expect(resolveLinkRel('', '_blank')).toBe('noopener noreferrer');
    expect(resolveLinkRel(undefined, '_self')).toBeUndefined();
  });

  it.each(vectors.resolveBreadcrumbCurrentFlags)('resolveBreadcrumbCurrentFlags($flags) -> $expected', (vector) => {
    expect(resolveBreadcrumbCurrentFlags(vector.flags)).toEqual(vector.expected);
  });

  it.each(vectors.isBreadcrumbLink)('isBreadcrumbLink($disabled, $current, $destination) -> $expected', (vector) => {
    expect(isBreadcrumbLink(vector.disabled, vector.current, vector.destination)).toBe(vector.expected);
  });

  it.each(vectors.resolveBreadcrumbItemClasses)('resolveBreadcrumbItemClasses($disabled) -> $expected', (vector) => {
    expect(resolveBreadcrumbItemClasses(vector.disabled)).toEqual(vector.expected);
  });
});
