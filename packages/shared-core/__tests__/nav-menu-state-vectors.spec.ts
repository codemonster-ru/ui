// The TypeScript half of the cross-language contract for VfNavMenu.
//
// packages/razor/tests/Support/NavMenuStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/nav-menu/state-vectors.json' with { type: 'json' };
import * as navMenu from '../src/nav-menu/state.js';
import {
  NAV_MENU_COLLAPSE_TRANSITION,
  resolveNavMenuAncestorValues,
  resolveNavMenuBranchClasses,
  resolveNavMenuCollapseClasses,
  resolveNavMenuCompact,
  resolveNavMenuGroupClasses,
  resolveNavMenuHasDescendant,
  resolveNavMenuIconClasses,
  resolveNavMenuIsBranch,
  resolveNavMenuIsLink,
  resolveNavMenuIsSimple,
  resolveNavMenuLeafClasses,
  resolveNavMenuMeasuredCompact,
  resolveNavMenuNodeClasses,
  resolveNavMenuRootClasses,
  resolveNavMenuShowsExternalIcon,
  resolveNavMenuSyncedExpandedValues,
  resolveNavMenuToggledExpandedValues,
  type VfNavMenuItemLike,
} from '../src/nav-menu/state.js';

const rules = Object.keys(vectors)
  .filter((key) => !key.startsWith('$') && key !== 'constants')
  .sort();

describe('shared nav menu state vectors', () => {
  it('covers every exported rule and names the server subset', () => {
    const exportedRules = Object.keys(navMenu)
      .filter((name) => typeof (navMenu as Record<string, unknown>)[name] === 'function')
      .sort();

    expect(rules).toEqual(exportedRules);
    expect(vectors.$serverRules).toEqual(rules.filter((rule) => !/Toggled|Measured/.test(rule)));
  });

  it('exports no focus, key, route, observer, timing or rel rule', () => {
    expect(
      Object.keys(navMenu).filter((name) =>
        /focus|key|route|router|href|observer|resize|frame|timer|duration|transitionEnd|listen|rel$/i.test(name),
      ),
    ).toEqual([]);
  });

  it('pins the inline transition the collapse hooks write', () => {
    expect({ NAV_MENU_COLLAPSE_TRANSITION }).toEqual(vectors.constants);
  });

  const items = (value: unknown) => value as VfNavMenuItemLike[];
  const item = (value: unknown) => value as VfNavMenuItemLike;

  it.each(vectors.resolveNavMenuIsBranch)('resolveNavMenuIsBranch %#', ({ item: entry, expected }) => {
    expect(resolveNavMenuIsBranch(item(entry))).toBe(expected);
  });

  it.each(vectors.resolveNavMenuIsLink)('resolveNavMenuIsLink %#', ({ item: entry, expected }) => {
    expect(resolveNavMenuIsLink(item(entry))).toBe(expected);
  });

  it.each(vectors.resolveNavMenuShowsExternalIcon)(
    'resolveNavMenuShowsExternalIcon %#',
    ({ item: entry, expected }) => {
      expect(resolveNavMenuShowsExternalIcon(item(entry))).toBe(expected);
    },
  );

  it.each(vectors.resolveNavMenuIsSimple)('resolveNavMenuIsSimple %#', ({ items: entries, expected }) => {
    expect(resolveNavMenuIsSimple(items(entries))).toBe(expected);
  });

  it.each(vectors.resolveNavMenuAncestorValues)('resolveNavMenuAncestorValues %#', (vector) => {
    const { items: entries, expected } = vector;
    expect(resolveNavMenuAncestorValues(items(entries), (vector as { value?: string }).value)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuHasDescendant)('resolveNavMenuHasDescendant %#', (vector) => {
    expect(resolveNavMenuHasDescendant(item(vector.item), (vector as { value?: string }).value)).toBe(vector.expected);
  });

  it.each(vectors.resolveNavMenuSyncedExpandedValues)('resolveNavMenuSyncedExpandedValues %#', (vector) => {
    expect(
      resolveNavMenuSyncedExpandedValues(items(vector.items), vector.expanded, (vector as { active?: string }).active),
    ).toEqual(vector.expected);
  });

  it.each(vectors.resolveNavMenuToggledExpandedValues)(
    'resolveNavMenuToggledExpandedValues %#',
    ({ items: entries, expanded, value, parentPath, expandMode, expected }) => {
      const before = [...expanded];
      expect(resolveNavMenuToggledExpandedValues(items(entries), expanded, value, parentPath, expandMode)).toEqual(
        expected,
      );
      // A new array every time: the caller's list is never edited in place.
      expect(expanded).toEqual(before);
    },
  );

  it.each(vectors.resolveNavMenuMeasuredCompact)('resolveNavMenuMeasuredCompact %#', ({ expected, ...input }) => {
    expect(resolveNavMenuMeasuredCompact(input)).toBe(expected);
  });

  it.each(vectors.resolveNavMenuCompact)('resolveNavMenuCompact %#', (vector) => {
    const { variant, measured, expected } = vector;
    expect(resolveNavMenuCompact({ variant, measured, compact: (vector as { compact?: boolean }).compact })).toBe(
      expected,
    );
  });

  it.each(vectors.resolveNavMenuRootClasses)('resolveNavMenuRootClasses %#', ({ expected, ...input }) => {
    expect(resolveNavMenuRootClasses(input)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuNodeClasses)('resolveNavMenuNodeClasses %#', ({ expected, ...input }) => {
    expect(resolveNavMenuNodeClasses(input)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuGroupClasses)('resolveNavMenuGroupClasses %#', ({ level, expected }) => {
    expect(resolveNavMenuGroupClasses(level)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuBranchClasses)('resolveNavMenuBranchClasses %#', ({ expected, ...input }) => {
    expect(resolveNavMenuBranchClasses(input)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuLeafClasses)('resolveNavMenuLeafClasses %#', ({ expected, ...input }) => {
    expect(resolveNavMenuLeafClasses(input)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuIconClasses)('resolveNavMenuIconClasses %#', ({ expanded, expected }) => {
    expect(resolveNavMenuIconClasses(expanded)).toEqual(expected);
  });

  it.each(vectors.resolveNavMenuCollapseClasses)('resolveNavMenuCollapseClasses %#', ({ level, expected }) => {
    expect(resolveNavMenuCollapseClasses(level)).toEqual(expected);
  });
});
