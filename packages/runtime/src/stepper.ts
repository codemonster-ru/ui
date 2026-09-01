import { nextStepperValue, resolveStepState } from './core/stepper.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface StepperValueChangeDetail {
  value: string;
}

const triggerSelector = '[data-cm-stepper-value]';

export class CmStepperController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
  }

  /** The rendered markup is the state, so the items are read back out of it rather than stored. */
  get #items(): { disabled: boolean; value: string }[] {
    return [...this.#root.querySelectorAll<HTMLButtonElement>(triggerSelector)].map((trigger) => ({
      disabled: trigger.disabled,
      value: trigger.dataset.cmStepperValue ?? '',
    }));
  }

  get #activeValue(): string | null {
    return this.#root.querySelector<HTMLElement>('[aria-current="step"]')?.dataset.cmStepperValue ?? null;
  }

  #triggerFor(value: string): HTMLButtonElement | null {
    return this.#root.querySelector<HTMLButtonElement>(`[data-cm-stepper-value="${value}"]`);
  }

  #activate(value: string, focus: boolean): void {
    const items = this.#items;
    if (this.#activeValue === value) return;

    for (const item of items) {
      const trigger = this.#triggerFor(item.value);
      const node = trigger?.closest('.cm-stepper__item');
      if (!trigger || !node) continue;

      const state = resolveStepState(items, value, item.value);
      node.className = `cm-stepper__item cm-stepper__item--${state}`;
      trigger.classList.toggle('cm-stepper__trigger--current', state === 'current');
      if (state === 'current') trigger.setAttribute('aria-current', 'step');
      else trigger.removeAttribute('aria-current');
    }

    const index = items.findIndex((item) => item.value === value);
    if (items.length > 1 && index >= 0) {
      (this.#root as HTMLElement).style.setProperty('--cm-stepper-progress-factor', String(index / (items.length - 1)));
    }

    if (focus) this.#triggerFor(value)?.focus();
    dispatchCmEvent<StepperValueChangeDetail>(this.#root, 'stepper-value-change', { value });
  }

  readonly #handleClick = (event: Event): void => {
    const trigger = this.#triggerFrom(event);
    if (!trigger || trigger.disabled) return;
    this.#activate(trigger.dataset.cmStepperValue ?? '', false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_)) return;

    const trigger = this.#triggerFrom(event);
    if (!trigger) return;

    const orientation = this.#root.classList.contains('cm-stepper--vertical') ? 'vertical' : 'horizontal';
    const next = nextStepperValue(this.#items, trigger.dataset.cmStepperValue ?? '', event.key, orientation);
    if (next === null) return;

    event.preventDefault();
    this.#activate(next, true);
  };

  #triggerFrom(event: Event): HTMLButtonElement | null {
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(event.target instanceof Element_)) return null;
    const trigger = event.target.closest<HTMLButtonElement>(triggerSelector);
    return trigger && this.#root.contains(trigger) ? trigger : null;
  }
}

export const createCmStepperController: CmControllerFactory = (element) => new CmStepperController(element);
