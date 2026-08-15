export interface CoreNavigationRecipeItem {
  value: string;
  label: string;
  kind?: 'item' | 'group';
  leadingIcon?: string;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  children?: CoreNavigationRecipeItem[];
}

export function hasNavigationDescendant(
  item: CoreNavigationRecipeItem,
  targetValue?: string,
): boolean {
  if (!targetValue || !item.children?.length) return false;
  return item.children.some(
    (child) => child.value === targetValue || hasNavigationDescendant(child, targetValue),
  );
}

export function navigationRel(item: CoreNavigationRecipeItem): string | undefined {
  return item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined);
}
