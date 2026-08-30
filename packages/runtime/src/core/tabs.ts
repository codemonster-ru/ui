/**
 * Tab selection and roving-focus logic, with no DOM and no framework.
 *
 * Both adapters used to carry their own copy of this: `CmTabsController` walked the rendered
 * elements, and the Vue component walked its props. The two drifted apart in review more than once,
 * so the rules live here and each adapter only supplies the items it can see.
 */

import { nextRovingIndex } from './roving.js';

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
  const index = nextRovingIndex({
    count: enabled.length,
    current: enabled.findIndex((item) => item.value === current),
    direction,
    key,
    orientation: 'horizontal',
  });

  return index === null ? null : (enabled[index]?.value ?? null);
}
