/**
 * Stepper rules, with no DOM and no framework.
 *
 * The keyboard navigation is the roving primitive again — the fourth widget to use it, after Tabs,
 * Accordion and Menu. A stepper only differs in that its orientation is a prop rather than fixed,
 * which the primitive already takes.
 */

import { nextRovingIndex, type CmRovingOrientation } from './roving.js';

export interface CmStepperCoreItem {
  readonly disabled?: boolean;
  readonly value: string;
}

/**
 * Resolves the active step, falling back to the first enabled one.
 *
 * A step that is disabled or unknown cannot be active, which is what keeps a stepper usable when
 * its items change underneath it.
 */
export function resolveStepperValue(items: readonly CmStepperCoreItem[], requested: string | null): string | null {
  const enabled = items.filter((item) => !item.disabled);
  if (enabled.some((item) => item.value === requested)) {
    return requested;
  }

  return enabled[0]?.value ?? null;
}

/** Resolves the step a key moves to, or `null` when the key does not navigate. */
export function nextStepperValue(
  items: readonly CmStepperCoreItem[],
  current: string,
  key: string,
  orientation: CmRovingOrientation = 'horizontal',
): string | null {
  const enabled = items.filter((item) => !item.disabled);
  const index = nextRovingIndex({
    count: enabled.length,
    current: enabled.findIndex((item) => item.value === current),
    key,
    orientation,
  });

  return index === null ? null : (enabled[index]?.value ?? null);
}

/**
 * Resolves how far along the stepper its active step sits, as a factor from 0 to 1.
 *
 * A single-step stepper has no distance to travel, so it reports `null` rather than dividing by
 * zero — the caller omits the custom property instead of writing a meaningless one.
 */
export function resolveStepperProgress(items: readonly CmStepperCoreItem[], activeValue: string | null): number | null {
  if (items.length < 2) {
    return null;
  }

  const index = items.findIndex((item) => item.value === activeValue);
  return index < 0 ? null : index / (items.length - 1);
}

/** How a step reads relative to the active one. */
export type CmStepperStepState = 'complete' | 'current' | 'disabled' | 'upcoming';

/**
 * Resolves how a step reads.
 *
 * A disabled step is disabled whatever its position, because "complete" and "upcoming" describe
 * progress through steps a person can actually reach.
 */
export function resolveStepState(
  items: readonly CmStepperCoreItem[],
  activeValue: string | null,
  value: string,
): CmStepperStepState {
  const step = items.find((item) => item.value === value);
  if (!step || step.disabled) {
    return 'disabled';
  }

  const activeIndex = items.findIndex((item) => item.value === activeValue);
  const index = items.findIndex((item) => item.value === value);

  if (index === activeIndex) {
    return 'current';
  }

  return activeIndex >= 0 && index < activeIndex ? 'complete' : 'upcoming';
}
