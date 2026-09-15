// Browser enhancement for the server-rendered VfStepper.
//
// The second Razor controller that owns a state change, and a different shape
// from the accordion's: it owns several native buttons, moves a string
// selection between them, keeps every item in the DOM, and moves focus
// between the buttons it owns. What is reproduced, handler for handler:
//
//   - a click on an enabled, non-current trigger selects it. Enter and Space
//     are *not* handled: the trigger is a native button, the browser
//     synthesises the click, and the click handler is the only activation
//     path - exactly the reference, and the opposite of the accordion;
//   - ArrowRight/ArrowLeft on a horizontal stepper, ArrowDown/ArrowUp on a
//     vertical one, Home and End are handled on keydown with preventDefault:
//     the target is found among the *enabled* triggers relative to the one
//     that received the key, wrapping, and is both selected and focused. A
//     key from the other axis is ignored and its default is not prevented;
//   - selecting rewrites the four halves of the state together: aria-current
//     and the trigger's own modifier move to the new trigger, every item's
//     state modifier is recomputed through the shared rule, and the root's
//     progress factor is rewritten through the shared rule - so the same
//     serialisation the server wrote is what the browser writes;
//   - each selection dispatches one bubbling `vf-stepper:change` event on the
//     root with `{ value }`, the host's equivalent of the reference's
//     `change` emit (the reference emits update:modelValue first, then
//     change; the Razor host has no v-model to write back, so one event
//     carries the value).
//
// What is deliberately *not* reproduced: the reference's focusStepByValue
// queries the whole document for `[data-vf-stepper-value]`, so two Vue
// steppers sharing a value send the second's keyboard focus into the first.
// This controller focuses within its own root. Reproducing the quirk would
// mean writing a document-global lookup on purpose to weaken the instance
// isolation every other line here maintains; the difference is recorded in
// the parity policy as a framework-specific historical quirk, kept out of the
// catalog by construction (sibling cases use distinct values), and pinned on
// the Vue side by the characterization suite.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker; a Vue-rendered
// stepper on the same page is invisible to it, and a copied `.vf-stepper`
// class without the marker is too. Each root owns exactly its own triggers -
// found through its own list, never through the document.
//
// There is no state object. The current value is whichever trigger carries
// aria-current, read on every gesture; the items are the triggers in
// document order with their native disabled attribute; the orientation is the
// root's modifier class. The server decides the initial state, the DOM
// carries it, and this file has no second copy to disagree with.
//
// Decisions the two adapters share come from @codemonster-ru/vueforge-shared-core.
import { resolveStepperRootStyle, resolveStepperStepState } from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="stepper"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-stepper-enhanced';
const CHANGE_EVENT = 'vf-stepper:change';
const STATES = ['disabled', 'current', 'complete', 'upcoming'] as const;

interface StepperParts {
  root: HTMLElement;
  list: HTMLElement;
}

interface Step {
  item: HTMLElement;
  trigger: HTMLButtonElement;
  value: string;
  disabled: boolean;
}

/** The steps as the DOM holds them now: one per list item, in order. */
function readSteps(list: HTMLElement): Step[] {
  const steps: Step[] = [];
  for (const item of list.querySelectorAll<HTMLElement>(':scope > li.vf-stepper__item')) {
    const trigger = item.querySelector<HTMLButtonElement>(':scope > button.vf-stepper__trigger');
    if (!trigger) continue;
    steps.push({
      item,
      trigger,
      value: trigger.getAttribute('data-vf-stepper-value') ?? '',
      disabled: trigger.disabled,
    });
  }
  return steps;
}

function findParts(root: HTMLElement): StepperParts | null {
  const list = root.querySelector<HTMLElement>(':scope > ol.vf-stepper__list');
  return list ? { root, list } : null;
}

function enhanceRoot(root: HTMLElement): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) {
    return;
  }

  const parts = findParts(root);
  if (!parts) {
    return;
  }

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const { list } = parts;

  const activeValue = (): string | undefined =>
    readSteps(list).find((step) => step.trigger.getAttribute('aria-current') === 'step')?.value;

  /** Paints the state for `value` onto every item, trigger and the root, through the shared rules. */
  const paint = (steps: Step[], value: string): void => {
    const items = steps.map((step) => ({ value: step.value, disabled: step.disabled }));
    for (const step of steps) {
      const state = resolveStepperStepState(items, value, { value: step.value, disabled: step.disabled });
      for (const name of STATES) step.item.classList.remove(`vf-stepper__item--${name}`);
      step.item.classList.add(`vf-stepper__item--${state}`);
      step.trigger.classList.toggle('vf-stepper__trigger--current', state === 'current');
      if (state === 'current') {
        step.trigger.setAttribute('aria-current', 'step');
      } else {
        step.trigger.removeAttribute('aria-current');
      }
    }
    for (const [property, declaration] of resolveStepperRootStyle(items, value)) {
      root.style.setProperty(property, declaration);
    }
  };

  /** The reference's activateStep: a disabled or current step is a no-op; otherwise state, then the event. */
  const activate = (step: Step): void => {
    const steps = readSteps(list);
    if (step.disabled || step.value === activeValue()) return;
    paint(steps, step.value);
    root.dispatchEvent(new CustomEvent(CHANGE_EVENT, { bubbles: true, detail: { value: step.value } }));
  };

  const handleKeydown = (event: KeyboardEvent, current: Step): void => {
    const enabled = readSteps(list).filter((step) => !step.disabled);
    const index = enabled.findIndex((step) => step.value === current.value);
    if (index === -1) return;

    const vertical = root.classList.contains('vf-stepper--vertical');
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const previousKey = vertical ? 'ArrowUp' : 'ArrowLeft';

    let target: Step | undefined;
    if (event.key === nextKey) {
      target = enabled[(index + 1) % enabled.length];
    } else if (event.key === previousKey) {
      target = enabled[(index - 1 + enabled.length) % enabled.length];
    } else if (event.key === 'Home') {
      target = enabled[0];
    } else if (event.key === 'End') {
      target = enabled[enabled.length - 1];
    }
    if (!target) return;

    event.preventDefault();
    activate(target);
    // Within this root, by value - see the file comment for why not the document.
    target.trigger.focus();
  };

  // Listeners on the list, resolving the trigger per event, so a step the
  // host adds or removes later is still its own root's. Click and keydown
  // only: Enter and Space reach the click handler through the browser.
  list.addEventListener('click', (event) => {
    const step = stepFor(event.target);
    if (step) activate(step);
  });
  list.addEventListener('keydown', (event) => {
    const step = stepFor(event.target);
    if (step) handleKeydown(event, step);
  });

  function stepFor(target: EventTarget | null): Step | undefined {
    if (!(target instanceof Element)) return undefined;
    const trigger = target.closest('button.vf-stepper__trigger');
    if (!trigger || trigger.closest('ol.vf-stepper__list') !== list) return undefined;
    return readSteps(list).find((step) => step.trigger === trigger);
  }
}

/**
 * Enhances every Razor-owned stepper inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots.
 */
export function enhanceVueForgeSteppers(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element);
  }
}
