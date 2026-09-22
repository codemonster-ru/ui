// The TypeScript half of the cross-language contract for VfMenuItem.
//
// packages/razor/tests/Support/MenuItemStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/menu/state-vectors.json' with { type: 'json' };
import {
  MENU_ITEM_FALLBACK_ICON,
  isMenuItemLink,
  resolveMenuItemClasses,
  resolveMenuItemIconName,
  type VfMenuItemToneName,
} from '../src/menu/state.js';
import { vfIcons } from '../src/icons/registry.js';

describe('shared menu state vectors', () => {
  it('covers exactly the three rules the PHP adapter restates, and nothing about rel or select', () => {
    // A `resolveMenuItemRel` would be the shared core restating VfLink's
    // derivation for a component that has none, and a `select` rule would be
    // it describing a Vue emit with no second implementation to agree with.
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['isMenuItemLink', 'resolveMenuItemClasses', 'resolveMenuItemIconName']);
    for (const group of [vectors.resolveMenuItemClasses, vectors.isMenuItemLink]) {
      for (const vector of group) {
        expect(Object.keys(vector)).not.toContain('rel');
        expect(Object.keys(vector)).not.toContain('target');
      }
    }
  });

  it('emits no modifier for the defaults and orders active before tone', () => {
    expect(resolveMenuItemClasses(false, 'default')).toEqual(['vf-menu__item']);
    expect(resolveMenuItemClasses(true, 'danger')).toEqual([
      'vf-menu__item',
      'vf-menu__item--active',
      'vf-menu__item--danger',
    ]);
  });

  it('writes no disabled modifier, because the reference has none', () => {
    // The disabled look is selected in CSS by
    // `:is(:disabled, [aria-disabled='true'])`, which is one rule covering a
    // disabled button and a disabled anchor. A `--disabled` class here would
    // be a new class no stylesheet uses.
    expect(resolveMenuItemClasses(false, 'default').join(' ')).not.toContain('disabled');
    expect(resolveMenuItemClasses(true, 'danger').join(' ')).not.toContain('disabled');
  });

  it('tests the destination for truthiness rather than definedness', () => {
    // The VfLink boundary. VfLink renders `<a href="">`; this renders a
    // button, and a migration that borrowed VfLink's rule would flip it.
    expect(isMenuItemLink('')).toBe(false);
    expect(isMenuItemLink(undefined)).toBe(false);
    expect(isMenuItemLink(null)).toBe(false);
    expect(isMenuItemLink('/docs')).toBe(true);
  });

  it('takes no disabled flag, because a disabled item with a destination is still an anchor', () => {
    expect(isMenuItemLink.length).toBe(1);
  });

  it('always resolves an icon name the registry holds', () => {
    expect(vfIcons[MENU_ITEM_FALLBACK_ICON]).toBeDefined();
    for (const name of ['pencil', 'chevronRight', 'no-such-glyph', '', 'MOON']) {
      expect(vfIcons[resolveMenuItemIconName(name)]).toBeDefined();
    }
  });

  it('resolves every glyph the registry holds from both its kebab and camel spellings', () => {
    // The rule has to accept what the public prop's type accepts: `IconName`
    // is the camel union and the icons package's `icons` map produces kebab.
    const toCamelCase = (name: string) =>
      name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase());

    for (const kebab of Object.keys(vfIcons)) {
      expect(resolveMenuItemIconName(kebab)).toBe(kebab);
      expect(resolveMenuItemIconName(toCamelCase(kebab))).toBe(kebab);
    }
  });

  it.each(vectors.resolveMenuItemClasses)('resolveMenuItemClasses($active, $tone) -> $expected', (vector) => {
    expect(resolveMenuItemClasses(vector.active, vector.tone as VfMenuItemToneName)).toEqual(vector.expected);
  });

  it.each(vectors.isMenuItemLink)('isMenuItemLink($href) -> $expected', (vector) => {
    expect(isMenuItemLink(vector.href)).toBe(vector.expected);
  });

  it.each(vectors.resolveMenuItemIconName)('resolveMenuItemIconName($icon) -> $expected', (vector) => {
    expect(resolveMenuItemIconName(vector.icon)).toBe(vector.expected);
  });
});
