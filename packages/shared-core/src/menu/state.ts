// Platform-independent presentation rules for VfMenuItem.
//
// Three rules, and deliberately nothing else. VfMenu has no rule here at all:
// it is a `div.vf-menu[role=menu]` around a slot, and there is no decision in
// it to share - the one thing worth knowing about it, that a consumer `role`
// overrides its own because attrs are bound last, is a template-ordering fact
// that each adapter states in its own idiom.
//
// What is *not* here matters as much as what is:
//
//   - no rel rule. VfMenuItem writes `rel` exactly as given and derives
//     nothing for `target="_blank"`. VfLink's `resolveLinkRel` is a different
//     contract, and calling it here - or mirroring it in PHP - would add an
//     attribute the reference never writes. The absence is the rule;
//   - no click or select rule. `select` is a Vue emit with no server
//     analogue, and the disabled guard around it is three lines of framework
//     event handling, not a decision two platforms can share;
//   - no state machine. VfMenuItem holds no state: `active` is a prop that
//     produces a class, and clicking an item changes nothing about it.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.
import { vfIcons } from '../icons/registry.js';

export type VfMenuItemToneName = 'default' | 'danger';

/** The glyph an unresolvable icon name falls back to. See resolveMenuItemIconName. */
export const MENU_ITEM_FALLBACK_ICON = 'moon';

/**
 * The item's class list, in the order the reference emits it: the block, the
 * active modifier, the danger modifier.
 *
 * `default` emits no tone modifier rather than a `--default` class, and there
 * is no disabled modifier on either branch - the disabled look is selected in
 * CSS by `:is(:disabled, [aria-disabled='true'])`, which is what lets one
 * rule cover a disabled button and a disabled anchor at once.
 *
 * The consumer's own class is not this rule's business. It is merged by each
 * adapter, and it goes *before* these: VfMenuItem binds attrs first, so the
 * consumer's class is the earlier source. VfMenu and VfLink are the other way
 * round, and the three are not made to agree.
 */
export function resolveMenuItemClasses(
  active: boolean | undefined | null,
  tone: VfMenuItemToneName | undefined | null,
): string[] {
  const classes = ['vf-menu__item'];

  if (active) classes.push('vf-menu__item--active');
  if (tone === 'danger') classes.push('vf-menu__item--danger');

  return classes;
}

/**
 * Whether an item renders as an anchor rather than a button.
 *
 * The reference tests `v-if="props.href"` - truthiness, not definedness - so
 * `href=""` is no destination and renders the button branch. VfLink keeps
 * `href=""` on its anchor; this component does not, and the two must not be
 * made to agree. VfBreadcrumbs tests truthiness too but over `href || to` and
 * with `disabled` and `current` in the test; this one has none of those.
 *
 * `disabled` is deliberately absent from the signature: a disabled item with
 * a destination is still an anchor. Only its href is dropped.
 */
export function isMenuItemLink(href: string | undefined | null): boolean {
  return Boolean(href);
}

const toCamelCase = (name: string) =>
  name.includes('-') ? name.toLowerCase().replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase()) : name;

const toKebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * The glyph an icon name resolves to, including the fallback for a name no
 * glyph has.
 *
 * `icon` is typed `IconName | string` on the public component, so an
 * arbitrary string is part of the contract, and the Vue icon component
 * answers one with the `moon` glyph rather than throwing or rendering
 * nothing. The neutral registry's renderer throws instead, which is the right
 * behaviour for a component that names its own glyph and the wrong one for a
 * component whose glyph is a consumer's string - so the resolution happens
 * here, before the renderer, and only for this component.
 *
 * The normalisation is the Vue icon component's: a name with a dash is
 * lowercased and camelised before the lookup, so `chevron-right`,
 * `chevronRight` and `Chevron-Right` are one glyph. The registry is keyed in
 * kebab case, which is also what the icons package's `icons` map produces, so
 * the camelised name is converted back before the lookup. Returns a name the
 * registry holds, always.
 */
export function resolveMenuItemIconName(icon: string | undefined | null): string {
  if (!icon) return MENU_ITEM_FALLBACK_ICON;

  const name = toKebabCase(toCamelCase(icon));

  return name in vfIcons ? name : MENU_ITEM_FALLBACK_ICON;
}
