/**
 * Accordion disclosure rules, with no DOM and no framework.
 *
 * `multiple` decides whether opening one section closes the others, and a disabled section can
 * never be open. Both adapters used to apply those rules separately — the controller by reading
 * `aria-expanded` off the DOM, the Vue component by filtering its props.
 */

import { nextRovingIndex } from './roving.js';

export interface CmAccordionCoreItem {
  readonly disabled?: boolean;
  readonly id: string;
}

/**
 * Reduces a requested set of open sections to the ones actually allowed: known, enabled, in item
 * order, and capped at one unless `multiple`.
 */
export function resolveAccordionOpenItems(
  items: readonly CmAccordionCoreItem[],
  requested: readonly string[],
  multiple: boolean,
): string[] {
  const wanted = new Set(requested);
  const open = items.filter((item) => !item.disabled && wanted.has(item.id)).map(({ id }) => id);
  return multiple ? open : open.slice(0, 1);
}

/**
 * Resolves which sections are open after toggling `id`.
 *
 * Toggling a section closed always just closes it. Opening one adds it under `multiple` and
 * replaces the set otherwise. A disabled or unknown section leaves the set untouched.
 */
export function toggleAccordionItem(
  items: readonly CmAccordionCoreItem[],
  openItems: readonly string[],
  id: string,
  multiple: boolean,
): string[] {
  const item = items.find((candidate) => candidate.id === id);
  if (!item || item.disabled) {
    return resolveAccordionOpenItems(items, openItems, multiple);
  }

  if (openItems.includes(id)) {
    return resolveAccordionOpenItems(
      items,
      openItems.filter((openId) => openId !== id),
      multiple,
    );
  }

  return resolveAccordionOpenItems(items, multiple ? [...openItems, id] : [id], multiple);
}

/**
 * Resolves the section a vertical arrow, Home or End moves focus to, or `null` when the key does
 * not navigate. Disabled sections are skipped rather than focused and passed over.
 */
export function nextAccordionItem(items: readonly CmAccordionCoreItem[], current: string, key: string): string | null {
  const enabled = items.filter((item) => !item.disabled);
  const index = nextRovingIndex({
    count: enabled.length,
    current: enabled.findIndex((item) => item.id === current),
    key,
    orientation: 'vertical',
  });

  return index === null ? null : (enabled[index]?.id ?? null);
}
