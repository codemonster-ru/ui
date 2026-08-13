import { dispatchCmEvent } from './events.js';
import type { CmController } from './runtime.js';

export interface ModalOpenChangeDetail {
  open: boolean;
}

export interface ModalControllerOptions {
  className: string;
  closeSelector: string;
  eventName: string;
  stateAttribute: string;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export class CmModalController implements CmController {
  readonly #dialog: HTMLDialogElement;
  readonly #options: ModalControllerOptions;
  #returnFocus: HTMLElement | null = null;

  constructor(root: Element, options: ModalControllerOptions) {
    const DialogConstructor = root.ownerDocument.defaultView?.HTMLDialogElement;
    if (!DialogConstructor || !(root instanceof DialogConstructor)) {
      throw new TypeError('Modal controller requires a native dialog root.');
    }
    if (!root.querySelector(options.closeSelector)) {
      throw new TypeError('Modal controller requires a close button.');
    }
    this.#dialog = root;
    this.#options = options;
  }

  connect(): void {
    this.#synchronize(this.#dialog.open);
    this.#dialog.addEventListener('click', this.#handleClick);
    this.#dialog.addEventListener('keydown', this.#handleKeydown);
    this.#dialog.addEventListener('cancel', this.#handleCancel);
    this.#dialog.addEventListener(`cm:${this.#options.eventName}-open-request`, this.#handleOpenRequest);
    this.#dialog.addEventListener(`cm:${this.#options.eventName}-close-request`, this.#handleCloseRequest);
    if (this.#dialog.open) this.#focusInitial();
  }

  disconnect(): void {
    this.#dialog.removeEventListener('click', this.#handleClick);
    this.#dialog.removeEventListener('keydown', this.#handleKeydown);
    this.#dialog.removeEventListener('cancel', this.#handleCancel);
    this.#dialog.removeEventListener(`cm:${this.#options.eventName}-open-request`, this.#handleOpenRequest);
    this.#dialog.removeEventListener(`cm:${this.#options.eventName}-close-request`, this.#handleCloseRequest);
    this.#returnFocus = null;
  }

  setOpen(open: boolean, restoreFocus = true): void {
    const changed = this.#dialog.open !== open;
    if (open) {
      const active = this.#dialog.ownerDocument.activeElement;
      this.#returnFocus = active instanceof this.#dialog.ownerDocument.defaultView!.HTMLElement ? active : null;
      if (typeof this.#dialog.showModal === 'function' && !this.#dialog.open) this.#dialog.showModal();
      else this.#dialog.open = true;
      this.#synchronize(true);
      this.#focusInitial();
    } else {
      if (typeof this.#dialog.close === 'function' && this.#dialog.open) this.#dialog.close();
      else this.#dialog.open = false;
      this.#synchronize(false);
      if (restoreFocus && this.#returnFocus?.isConnected) this.#returnFocus.focus();
      this.#returnFocus = null;
    }
    if (changed) {
      dispatchCmEvent<ModalOpenChangeDetail>(this.#dialog, `${this.#options.eventName}-open-change`, { open });
    }
  }

  readonly #handleClick = (event: Event): void => {
    const ElementConstructor = this.#dialog.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return;
    if (event.target.closest(this.#options.closeSelector) && this.#isDismissible()) this.setOpen(false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#dialog.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.#isDismissible()) this.setOpen(false);
      return;
    }
    if (event.key !== 'Tab' || !this.#dialog.open) return;
    const focusable = [...this.#dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter(
      (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
    );
    if (focusable.length === 0) {
      event.preventDefault();
      this.#dialog.focus();
      return;
    }
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && this.#dialog.ownerDocument.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.#dialog.ownerDocument.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  readonly #handleCancel = (event: Event): void => {
    event.preventDefault();
    if (this.#isDismissible()) this.setOpen(false);
  };

  readonly #handleOpenRequest = (): void => this.setOpen(true);
  readonly #handleCloseRequest = (): void => this.setOpen(false);

  #isDismissible(): boolean {
    return this.#dialog.getAttribute(`data-cm-${this.#options.eventName}-dismissible`) !== 'false';
  }

  #focusInitial(): void {
    (
      this.#dialog.querySelector<HTMLElement>('[autofocus]') ??
      this.#dialog.querySelector<HTMLElement>(focusableSelector) ??
      this.#dialog
    ).focus();
  }

  #synchronize(open: boolean): void {
    this.#dialog.open = open;
    this.#dialog.dataset[this.#options.stateAttribute] = open ? 'open' : 'closed';
    this.#dialog.classList.toggle(this.#options.className, open);
  }
}
