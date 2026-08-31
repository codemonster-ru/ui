/**
 * Rules for menus that nest, with no DOM and no framework.
 *
 * NavMenu and MenuBar both hold a tree, both need the path to whatever is active, and both expand
 * branches — one in a sidebar, the other in a bar. The shapes differ; the arithmetic does not.
 */

export interface CmTreeCoreItem {
  readonly children?: readonly CmTreeCoreItem[];
  readonly disabled?: boolean;
  readonly value: string;
}

/** Whether an item is a branch rather than a leaf. */
export function isBranch(item: CmTreeCoreItem): boolean {
  return (item.children?.length ?? 0) > 0;
}

/**
 * Reports the values on the path to `target`, nearest ancestor last, or an empty list when the
 * target is absent. The target itself is not included: these are the branches that must be open
 * for it to be reachable.
 */
export function collectAncestorValues(
  items: readonly CmTreeCoreItem[],
  target: string | null,
  parents: readonly string[] = [],
): string[] {
  if (target === null) {
    return [];
  }

  for (const item of items) {
    if (item.value === target) {
      return [...parents];
    }

    if (item.children?.length) {
      const found = collectAncestorValues(item.children, target, [...parents, item.value]);
      if (found.length > 0 || item.children.some((child) => child.value === target)) {
        return found.length > 0 ? found : [...parents, item.value];
      }
    }
  }

  return [];
}

/** Every value in a subtree, including the branches inside it. */
export function collectBranchValues(items: readonly CmTreeCoreItem[]): string[] {
  return items.flatMap((item) => [item.value, ...collectBranchValues(item.children ?? [])]);
}

/** Finds the items sitting alongside `value`, which is where a single-open menu closes siblings. */
export function findSiblings(items: readonly CmTreeCoreItem[], value: string): readonly CmTreeCoreItem[] {
  if (items.some((item) => item.value === value)) {
    return items;
  }

  for (const item of items) {
    if (item.children?.length) {
      const siblings = findSiblings(item.children, value);
      if (siblings.length > 0) {
        return siblings;
      }
    }
  }

  return [];
}

/**
 * Resolves which branches are open after toggling one.
 *
 * Under `single` a branch closes its siblings and everything inside them, so one path stays open at
 * a time. Under `multiple` branches accumulate. Closing a branch closes only itself; its children
 * keep their state so reopening it returns to where the person left off.
 */
export function toggleBranchValue(
  items: readonly CmTreeCoreItem[],
  expanded: readonly string[],
  value: string,
  mode: 'multiple' | 'single' = 'multiple',
): string[] {
  if (expanded.includes(value)) {
    return expanded.filter((candidate) => candidate !== value);
  }

  if (mode !== 'single') {
    return [...expanded, value];
  }

  const siblingValues = new Set(
    findSiblings(items, value)
      .filter((item) => item.value !== value && isBranch(item))
      .flatMap((item) => collectBranchValues([item])),
  );

  return [...expanded.filter((candidate) => !siblingValues.has(candidate)), value];
}

/**
 * Resolves the branches that must be open for the active item to be visible, merged with what is
 * already open. An active item nobody can see is the failure this prevents.
 */
export function expandToActive(
  items: readonly CmTreeCoreItem[],
  expanded: readonly string[],
  activeValue: string | null,
): string[] {
  return [...new Set([...expanded, ...collectAncestorValues(items, activeValue)])];
}
