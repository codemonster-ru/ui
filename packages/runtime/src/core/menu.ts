/**
 * Menu keyboard and roving-tab-stop rules, with no DOM and no framework.
 */

import { nextRovingIndex } from './roving.js';

export interface CmMenuCoreItem {
  readonly disabled?: boolean;
  readonly id: string;
}

/**
 * Resolves the item a vertical arrow, Home or End moves focus to, or `null` when the key does not
 * navigate. Disabled items are skipped rather than focused and passed over.
 */
export function nextMenuItem(items: readonly CmMenuCoreItem[], current: string, key: string): string | null {
  const enabled = items.filter((item) => !item.disabled);
  const index = nextRovingIndex({
    count: enabled.length,
    current: enabled.findIndex((item) => item.id === current),
    key,
    orientation: 'vertical',
  });

  return index === null ? null : (enabled[index]?.id ?? null);
}

/**
 * Reports whether a key asks the menu to close.
 *
 * A menu does not close itself — it tells whoever opened it, because a dropdown owns the panel a
 * menu merely lives inside.
 */
export function isMenuCloseKey(key: string): boolean {
  return key === 'Escape';
}

/**
 * Resolves which item carries the tab stop.
 *
 * A menu is one tab stop: the first enabled item takes `tabindex="0"` and the rest take `-1`, so
 * Tab enters and leaves the menu rather than walking through every entry.
 */
export function menuTabStopId(items: readonly CmMenuCoreItem[]): string | null {
  return items.find((item) => !item.disabled)?.id ?? null;
}
