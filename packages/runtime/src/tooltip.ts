import type { CmController, CmControllerFactory } from './runtime.js';

const delays = { none: 0, short: 300, long: 700 } as const;

export class CmTooltipController implements CmController {
  readonly #content: HTMLElement;
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #showTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>('.cm-tooltip__trigger');
    const content = root.querySelector<HTMLElement>('.cm-tooltip__content[role="tooltip"]');
    if (!trigger || !content) throw new TypeError('Tooltip controller requires a trigger and tooltip content.');
    this.#root = root;
    this.#trigger = trigger;
    this.#content = content;
  }

  connect(): void {
    this.#synchronize(!this.#content.hidden);
    this.#trigger.addEventListener('focus', this.#handleShow);
    this.#trigger.addEventListener('blur', this.#handleHide);
    this.#trigger.addEventListener('pointerenter', this.#handleShow);
    this.#trigger.addEventListener('pointerleave', this.#handleHide);
    this.#trigger.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#trigger.removeEventListener('focus', this.#handleShow);
    this.#trigger.removeEventListener('blur', this.#handleHide);
    this.#trigger.removeEventListener('pointerenter', this.#handleShow);
    this.#trigger.removeEventListener('pointerleave', this.#handleHide);
    this.#trigger.removeEventListener('keydown', this.#handleKeydown);
    this.#clearTimers();
  }

  readonly #handleShow = (): void => {
    this.#clearTimers();
    const delay = this.#root.classList.contains('cm-tooltip--delay-long')
      ? delays.long
      : this.#root.classList.contains('cm-tooltip--delay-none')
        ? delays.none
        : delays.short;
    this.#showTimer = setTimeout(() => this.#synchronize(true), delay);
  };

  readonly #handleHide = (): void => {
    this.#clearTimers();
    this.#hideTimer = setTimeout(() => this.#synchronize(false), 0);
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.#clearTimers();
    this.#synchronize(false);
  };

  #clearTimers(): void {
    if (this.#showTimer !== undefined) clearTimeout(this.#showTimer);
    if (this.#hideTimer !== undefined) clearTimeout(this.#hideTimer);
    this.#showTimer = undefined;
    this.#hideTimer = undefined;
  }

  #synchronize(visible: boolean): void {
    this.#content.hidden = !visible;
    this.#root.classList.toggle('cm-tooltip--visible', visible);
  }
}

export const createCmTooltipController: CmControllerFactory = (element) => new CmTooltipController(element);
