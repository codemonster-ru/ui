import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface PopoverOpenChangeDetail {
  open: boolean;
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class CmPopoverController implements CmController {
  readonly #panel: HTMLElement;
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>('.cm-popover__trigger');
    const panel = root.querySelector<HTMLElement>('.cm-popover__panel[role="dialog"]');
    if (!trigger || !panel) throw new TypeError('Popover controller requires a trigger and dialog panel.');
    this.#root = root;
    this.#trigger = trigger;
    this.#panel = panel;
  }

  connect(): void {
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('cm:popover-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('cm:popover-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
  }

  setOpen(open: boolean, restoreFocus = false): void {
    if (this.#trigger.disabled) open = false;
    const changed = this.#panel.hidden === open;
    this.#synchronize(open);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent<PopoverOpenChangeDetail>(this.#root, 'popover-open-change', { open });
  }

  readonly #handleClick = (event: Event): void => {
    if (event.target === this.#trigger && !this.#trigger.disabled) this.setOpen(this.#panel.hidden);
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor)) return;
    if (event.key === 'Escape' && !this.#panel.hidden) {
      event.preventDefault();
      this.setOpen(false, true);
      return;
    }
    if (event.target !== this.#trigger || this.#trigger.disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setOpen(true);
      this.#panel.querySelector<HTMLElement>(focusableSelector)?.focus();
    }
  };

  readonly #handleCloseRequest = (): void => this.setOpen(false, true);

  readonly #handleDocumentClick = (event: Event): void => {
    const NodeConstructor = this.#root.ownerDocument.defaultView?.Node;
    if (!NodeConstructor || !(event.target instanceof NodeConstructor) || this.#root.contains(event.target)) return;
    this.setOpen(false);
  };

  #synchronize(open: boolean): void {
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#panel.hidden = !open;
    this.#root.classList.toggle('cm-popover--open', open);
  }
}

export const createCmPopoverController: CmControllerFactory = (element) => new CmPopoverController(element);
