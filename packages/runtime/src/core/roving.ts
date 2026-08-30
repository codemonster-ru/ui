/**
 * Roving-index arithmetic shared by every widget with arrow-key navigation.
 *
 * Tabs move horizontally and swap their arrows under `rtl`; accordions move vertically and do not.
 * Both wrap around, both accept Home and End, and both had their own copy of this until it lived
 * here.
 */

export type CmRovingOrientation = 'horizontal' | 'vertical';
export type CmRovingDirection = 'ltr' | 'rtl';

export interface CmRovingOptions {
  /** How many items can be focused. */
  readonly count: number;
  /** Index of the focused item; a negative value means focus is elsewhere. */
  readonly current: number;
  /** Writing direction; only meaningful for horizontal navigation. */
  readonly direction?: CmRovingDirection;
  readonly key: string;
  readonly orientation?: CmRovingOrientation;
}

/**
 * Resolves the index a key moves focus to, or `null` when the key does not navigate, nothing can
 * be focused, or focus is not currently on a navigable item.
 */
export function nextRovingIndex({
  count,
  current,
  direction = 'ltr',
  key,
  orientation = 'horizontal',
}: CmRovingOptions): number | null {
  if (count <= 0 || current < 0 || current >= count) {
    return null;
  }

  const [forwardKey, backwardKey] =
    orientation === 'vertical'
      ? ['ArrowDown', 'ArrowUp']
      : direction === 'rtl'
        ? ['ArrowLeft', 'ArrowRight']
        : ['ArrowRight', 'ArrowLeft'];

  switch (key) {
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    case forwardKey:
      return (current + 1) % count;
    case backwardKey:
      return (current - 1 + count) % count;
    default:
      return null;
  }
}
