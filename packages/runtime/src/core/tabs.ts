/**
 * Tab selection and roving-focus logic, with no DOM and no framework.
 *
 * Both adapters used to carry their own copy of this: `CmTabsController` walked the rendered
 * elements, and the Vue component walked its props. The two drifted apart in review more than once,
 * so the rules live here and each adapter only supplies the items it can see.
 */

export interface CmTabsCoreItem {
  readonly disabled?: boolean;
  readonly value: string;
}

export type CmTabsDirection = 'ltr' | 'rtl';

/**
 * Resolves the tab that should be active.
 *
 * A requested value wins when it names an enabled tab; otherwise the first enabled tab does. With
 * no enabled tab at all the result is `null`, which the caller renders as "nothing selected"
 * rather than treating as an error.
 */
export function resolveTabsValue(
  items: readonly CmTabsCoreItem[],
  requested: string | null | undefined,
): string | null {
  const enabled = items.filter((item) => !item.disabled);
  const match = enabled.find((item) => item.value === requested);
  return match?.value ?? enabled[0]?.value ?? null;
}

/**
 * Resolves the tab a keyboard event moves focus to, or `null` when the key is not a navigation key.
 *
 * Arrow keys wrap around the enabled tabs and swap direction under `rtl`; Home and End jump to the
 * ends. Disabled tabs are skipped rather than focused and passed over.
 */
export function nextTabsValue(
  items: readonly CmTabsCoreItem[],
  current: string,
  key: string,
  direction: CmTabsDirection = 'ltr',
): string | null {
  const enabled = items.filter((item) => !item.disabled);
  if (enabled.length === 0) {
    return null;
  }

  const currentIndex = enabled.findIndex((item) => item.value === current);
  if (currentIndex < 0) {
    return null;
  }

  const forwardKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backwardKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const last = enabled.length - 1;

  const nextIndex =
    key === 'Home'
      ? 0
      : key === 'End'
        ? last
        : key === forwardKey
          ? (currentIndex + 1) % enabled.length
          : key === backwardKey
            ? (currentIndex - 1 + enabled.length) % enabled.length
            : -1;

  return nextIndex < 0 ? null : (enabled[nextIndex]?.value ?? null);
}
