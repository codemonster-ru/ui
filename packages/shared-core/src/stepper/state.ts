// Platform-independent rules for VfStepper.
//
// What is shared is, again, what is decided and not what is held. VfStepper
// owns a string selection that a user changes with a click or an arrow key,
// and the tempting extraction is that selection: a `SelectionState` or a
// `StepperMachine` with `select(value)`, `next()`, `previous()`, `first()` and
// a listener, which every adapter would then wrap. That would be the generic
// selection controller the M23 plan forbids, and it would be wrong on the
// merits for the same reason it was for the accordion: the Vue adapter's
// state is a ref inside the component, the Razor adapter's state is the
// server-rendered `aria-current` attribute its controller reads back, and a
// shared class would give both a second copy to keep in sync.
//
// So these rules are pure functions of props and a value:
//
//   - which content position and root classes the two props resolve to;
//   - which item is the fallback, and which value is active given the
//     controlled prop, the internal seed and the items;
//   - what state each step is in, in the reference's precedence;
//   - which custom properties the root writes, with the progress factor
//     serialised exactly as JavaScript serialises the division.
//
// Not here: the keyboard map, the wrap, the focus move, the event pair and
// the items watch. Those are behaviour bound to an event, an element and a
// clock, reproduced in each adapter's own code and pinned by the
// characterization suite, the Razor browser gate and the live parity stage.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The one field of an item every rule below reads, beside its value. */
export interface VfStepperItemLike {
  readonly value: string;
  readonly disabled?: boolean;
}

export type VfStepperOrientationName = 'horizontal' | 'vertical';
export type VfStepperContentPositionName = 'above' | 'below' | 'start' | 'end';
export type VfStepperStepStateName = 'disabled' | 'current' | 'complete' | 'upcoming';

/** One CSS declaration, as the name/value pair both adapters write. */
export type VfStepperDeclaration = readonly [property: string, value: string];

/**
 * The content position the two props resolve to.
 *
 * A vertical stepper knows `start` and everything else is `end`; a horizontal
 * one knows `above` and everything else is `below`. A position from the other
 * axis is not an error, it is the default - which is the reference's own
 * ternary, restated.
 */
export function resolveStepperContentPosition(
  orientation: VfStepperOrientationName,
  contentPosition: VfStepperContentPositionName | undefined,
): VfStepperContentPositionName {
  if (orientation === 'vertical') {
    return contentPosition === 'start' ? 'start' : 'end';
  }

  return contentPosition === 'above' ? 'above' : 'below';
}

/** The root's three canonical classes, in the order the reference emits them. */
export function resolveStepperClasses(
  orientation: VfStepperOrientationName,
  contentPosition: VfStepperContentPositionName | undefined,
): string[] {
  return [
    'vf-stepper',
    `vf-stepper--${orientation}`,
    `vf-stepper--content-${resolveStepperContentPosition(orientation, contentPosition)}`,
  ];
}

/** The value of the first enabled item, or undefined when there is none. */
export function resolveStepperFallbackValue(items: readonly VfStepperItemLike[]): string | undefined {
  return items.find((item) => !item.disabled)?.value;
}

/**
 * The active value: the controlled prop, else the internal seed, else the
 * fallback - each tested with `??`, so an empty string is a value and null
 * is an absence. An unknown value is kept as-is; it matches no item, and the
 * rules below say what that renders as. The seed itself is
 * `defaultValue ?? fallback`, which the Vue adapter takes once at mount and
 * the Razor adapter takes at render, so a server hands this rule the same
 * two inputs a mounted component holds.
 */
export function resolveStepperActiveValue(
  modelValue: string | null | undefined,
  internalValue: string | undefined,
  items: readonly VfStepperItemLike[],
): string | undefined {
  return modelValue ?? internalValue ?? resolveStepperFallbackValue(items);
}

/** The index of the first item carrying the active value, or -1. */
export function resolveStepperActiveIndex(
  items: readonly VfStepperItemLike[],
  activeValue: string | undefined,
): number {
  return items.findIndex((item) => item.value === activeValue);
}

/**
 * A step's state, in the reference's precedence: disabled first, then current
 * when the step's index is the active index, then complete when the active
 * index is found and the step is before it, then upcoming. Duplicate values
 * resolve to the first occurrence on both sides of the comparison, so two
 * items sharing a value share a state.
 */
export function resolveStepperStepState(
  items: readonly VfStepperItemLike[],
  activeValue: string | undefined,
  item: VfStepperItemLike,
): VfStepperStepStateName {
  if (item.disabled) {
    return 'disabled';
  }

  const activeIndex = resolveStepperActiveIndex(items, activeValue);
  const currentIndex = items.findIndex((entry) => entry.value === item.value);

  if (currentIndex === activeIndex) {
    return 'current';
  }

  if (activeIndex >= 0 && currentIndex < activeIndex) {
    return 'complete';
  }

  return 'upcoming';
}

/**
 * The progress factor as JavaScript writes it into the attribute.
 *
 * `String(n)`: the shortest digit string that round-trips, so `1 / 3` is
 * `0.3333333333333333` and `2 / 3` is `0.6666666666666666`, never rounded and
 * never padded. Stated as a rule so the PHP mirror has a vector file to agree
 * with: a server that wrote fourteen digits would move the vertical rail's
 * scale by a value the screenshot cannot see and the style comparison can.
 */
export function formatStepperProgressFactor(factor: number): string {
  return String(factor);
}

/**
 * The root's custom properties, in the order the reference writes them.
 *
 * The item count is always written. The progress factor is written only for
 * two or more items, as `index / (count - 1)` with an unknown active value
 * normalised to index 0 - which is also what an all-disabled or empty-valued
 * stepper writes.
 */
export function resolveStepperRootStyle(
  items: readonly VfStepperItemLike[],
  activeValue: string | undefined,
): VfStepperDeclaration[] {
  const count = items.length;
  const declarations: VfStepperDeclaration[] = [['--vf-stepper-item-count', `${count}`]];

  if (count <= 1) {
    return declarations;
  }

  const activeIndex = resolveStepperActiveIndex(items, activeValue);
  const normalizedActiveIndex = activeIndex < 0 ? 0 : activeIndex;
  declarations.push(['--vf-stepper-progress-factor', formatStepperProgressFactor(normalizedActiveIndex / (count - 1))]);

  return declarations;
}
