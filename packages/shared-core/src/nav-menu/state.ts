// Shared, framework-neutral rules for VfNavMenu.
//
// Values in, values out. The Vue component and the Razor adapter (its PHP
// server half and its browser controller) both derive the tree's state from
// these, so the two cannot disagree about which branch is open, which item is
// current or which classes an item carries. What stays in each adapter is
// everything that is not a rule: the recursion that renders the tree, the
// clicks, the transition hooks, the ResizeObserver and the measurement it
// reads.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, quirks included:
//
//   - a branch is an item with non-empty children that is not a group; an item
//     with `children: []` is a leaf;
//   - the ancestry of a value is the path to its *first* match in document
//     order, group values included; a value at the top level has none;
//   - activation only ever adds to the expanded values - the union keeps the
//     previous ones first - and a toggle is the only way anything closes;
//   - closing a branch removes that value alone, so its descendants stay
//     expanded underneath it;
//   - in single mode, opening a branch first removes every sibling *branch*
//     and every branch below it, where the siblings are the children of the
//     same parent path. A sibling group is not a branch and is skipped whole,
//     branches inside it included. The opened branch's own descendants are
//     left alone;
//   - a link is selected by definedness: `href: ''` is a link;
//   - only the sidebar variant is ever compact. An explicit `compact` wins in
//     both directions; otherwise the sidebar is compact when it is measured no
//     wider than the breakpoint probe, and a probe with no width never says so.
//
// Deliberately absent: anything about focus, keys (the reference handles
// none), routes (`to` is handed to whatever is registered as `RouterLink` and
// is not a rule about navigation menus), the transition's timing and the
// observer. The rel of a link is VfLink's rule, resolveLinkRel, which the
// reference's node reproduces character for character.

export type VfNavMenuExpandModeName = 'multiple' | 'single';
export type VfNavMenuVariantName = 'default' | 'pills' | 'sidebar';

/** The structural shape of a VfNavMenuItem the rules read. */
export interface VfNavMenuItemLike {
  value: string;
  kind?: string;
  leadingIcon?: string;
  href?: string;
  to?: unknown;
  target?: string;
  disabled?: boolean;
  children?: VfNavMenuItemLike[];
}

/**
 * The inline transition the collapse's enter and leave hooks write, verbatim.
 * The durations are the theme's, resolved by the browser.
 */
export const NAV_MENU_COLLAPSE_TRANSITION =
  'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard), opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)';

/** Whether an item is a branch: non-empty children, and not a group. */
export function resolveNavMenuIsBranch(item: VfNavMenuItemLike): boolean {
  return item.kind !== 'group' && Boolean(item.children?.length);
}

/** Whether a leaf is a link: `href` or `to` defined, an empty string included. */
export function resolveNavMenuIsLink(item: VfNavMenuItemLike): boolean {
  return item.href !== undefined || item.to !== undefined;
}

/** Whether a link renders the external glyph: a link that opens in a new browsing context. */
export function resolveNavMenuShowsExternalIcon(item: VfNavMenuItemLike): boolean {
  return resolveNavMenuIsLink(item) && item.target === '_blank';
}

function hasFeature(items: VfNavMenuItemLike[], predicate: (item: VfNavMenuItemLike) => boolean): boolean {
  return items.some(
    (item) => predicate(item) || (item.children?.length ? hasFeature(item.children, predicate) : false),
  );
}

/** Whether the menu is "simple": no group and no leading icon anywhere in the tree. */
export function resolveNavMenuIsSimple(items: VfNavMenuItemLike[]): boolean {
  return !hasFeature(items, (item) => item.kind === 'group') && !hasFeature(items, (item) => Boolean(item.leadingIcon));
}

/**
 * The values on the path to the first item with `value`, outermost first,
 * group values included. Empty for an empty or unknown value and for a value
 * at the top level.
 */
export function resolveNavMenuAncestorValues(
  items: VfNavMenuItemLike[],
  value: string | undefined | null,
  parents: string[] = [],
): string[] {
  if (!value) return [];

  for (const item of items) {
    if (item.value === value) return parents;

    if (item.children?.length) {
      const result = resolveNavMenuAncestorValues(item.children, value, [...parents, item.value]);
      if (result.length) return result;
    }
  }

  return [];
}

/** Whether any descendant of `item`, at any depth, has `value`. */
export function resolveNavMenuHasDescendant(item: VfNavMenuItemLike, value: string | undefined | null): boolean {
  if (!value || !item.children?.length) return false;

  return item.children.some((child) => child.value === value || resolveNavMenuHasDescendant(child, value));
}

/**
 * The expanded values once `active` is activated: the current ones, then the
 * ancestry of `active`, without repeats. Nothing is removed.
 */
export function resolveNavMenuSyncedExpandedValues(
  items: VfNavMenuItemLike[],
  expanded: readonly string[],
  active: string | undefined | null,
): string[] {
  return Array.from(new Set([...expanded, ...resolveNavMenuAncestorValues(items, active)]));
}

function itemsAtPath(items: VfNavMenuItemLike[], path: readonly string[]): VfNavMenuItemLike[] {
  if (!path.length) return items;

  const [current, ...rest] = path;
  const match = items.find((item) => item.value === current);

  if (!match?.children?.length) return [];

  return itemsAtPath(match.children, rest);
}

function branchValues(items: VfNavMenuItemLike[]): string[] {
  return items.flatMap((item) => {
    const descendants = item.children?.length ? branchValues(item.children) : [];

    return resolveNavMenuIsBranch(item) ? [item.value, ...descendants] : descendants;
  });
}

/**
 * The expanded values after the branch `value`, under `parentPath`, is
 * toggled. Closing removes `value` alone. Opening appends it; in single mode
 * it first removes every sibling branch and every branch below those
 * siblings - a sibling group is skipped whole.
 */
export function resolveNavMenuToggledExpandedValues(
  items: VfNavMenuItemLike[],
  expanded: readonly string[],
  value: string,
  parentPath: readonly string[],
  expandMode: VfNavMenuExpandModeName | string,
): string[] {
  if (expanded.includes(value)) {
    return expanded.filter((itemValue) => itemValue !== value);
  }

  let next = [...expanded];

  if (expandMode === 'single') {
    const siblingBranchValues = itemsAtPath(items, parentPath)
      .filter((item) => item.value !== value && resolveNavMenuIsBranch(item))
      .flatMap((item) => branchValues([item]));

    next = next.filter((itemValue) => !siblingBranchValues.includes(itemValue));
  }

  return [...next, value];
}

/**
 * Whether the measured sidebar is compact: only for the sidebar, only when the
 * probe has a width, and when the root is no wider than it.
 */
export function resolveNavMenuMeasuredCompact({
  variant,
  rootWidth,
  breakpointWidth,
}: {
  variant: VfNavMenuVariantName | string;
  rootWidth: number;
  breakpointWidth: number;
}): boolean {
  return variant === 'sidebar' && breakpointWidth > 0 && rootWidth <= breakpointWidth;
}

/** Whether the menu renders compact: the sidebar only, the explicit prop over the measurement. */
export function resolveNavMenuCompact({
  variant,
  compact,
  measured,
}: {
  variant: VfNavMenuVariantName | string;
  compact: boolean | undefined | null;
  measured: boolean;
}): boolean {
  return variant === 'sidebar' && (compact ?? measured);
}

/** The root's class list, in the order the reference emits it. */
export function resolveNavMenuRootClasses({
  variant,
  simple,
  compact,
}: {
  variant: VfNavMenuVariantName | string;
  simple: boolean;
  compact: boolean;
}): string[] {
  const classes = ['vf-nav-menu', `vf-nav-menu--${variant}`];

  if (simple) classes.push('vf-nav-menu--simple');
  if (compact) classes.push('vf-nav-menu--sidebar-compact');

  return classes;
}

/** The li's class list: the block, the level, then expanded, active and ancestor-active. */
export function resolveNavMenuNodeClasses({
  level,
  expanded,
  active,
  ancestorActive,
}: {
  level: number;
  expanded: boolean;
  active: boolean;
  ancestorActive: boolean;
}): string[] {
  const classes = ['vf-nav-menu__node', `vf-nav-menu__node--level-${level}`];

  if (expanded) classes.push('vf-nav-menu__node--expanded');
  if (active) classes.push('vf-nav-menu__node--active');
  if (ancestorActive) classes.push('vf-nav-menu__node--ancestor-active');

  return classes;
}

/** A group's class list. A group carries no state of its own; its li does. */
export function resolveNavMenuGroupClasses(level: number): string[] {
  return ['vf-nav-menu__group', `vf-nav-menu__group--level-${level}`];
}

/** A branch button's class list: never active, never disabled-modified. */
export function resolveNavMenuBranchClasses({
  level,
  hasLeadingIcon,
  ancestorActive,
  expanded,
}: {
  level: number;
  hasLeadingIcon: boolean;
  ancestorActive: boolean;
  expanded: boolean;
}): string[] {
  const classes = ['vf-nav-menu__item', 'vf-nav-menu__item--branch'];

  if (level === 0) classes.push('vf-nav-menu__item--top');
  if (!hasLeadingIcon) classes.push('vf-nav-menu__item--icon-offset');
  if (ancestorActive) classes.push('vf-nav-menu__item--ancestor-active');
  if (expanded) classes.push('vf-nav-menu__item--expanded');

  return classes;
}

/** A leaf's class list - link and button alike. */
export function resolveNavMenuLeafClasses({
  level,
  hasLeadingIcon,
  active,
  ancestorActive,
  disabled,
}: {
  level: number;
  hasLeadingIcon: boolean;
  active: boolean;
  ancestorActive: boolean;
  disabled: boolean;
}): string[] {
  const classes = ['vf-nav-menu__item'];

  if (level === 0) classes.push('vf-nav-menu__item--top');
  if (!hasLeadingIcon) classes.push('vf-nav-menu__item--icon-offset');
  if (active) classes.push('vf-nav-menu__item--active');
  if (ancestorActive) classes.push('vf-nav-menu__item--ancestor-active');
  if (disabled) classes.push('vf-nav-menu__item--disabled');

  return classes;
}

/** The branch chevron's class list. */
export function resolveNavMenuIconClasses(expanded: boolean): string[] {
  return expanded ? ['vf-nav-menu__icon', 'vf-nav-menu__icon--open'] : ['vf-nav-menu__icon'];
}

/** The collapse wrapper's class list. */
export function resolveNavMenuCollapseClasses(level: number): string[] {
  return ['vf-nav-menu__collapse', `vf-nav-menu__collapse--level-${level}`];
}
