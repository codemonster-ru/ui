import { cmFocusableSelector } from './core/disclosure.js';
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
  allowEscape?: () => boolean;
  allowNoCloseButton?: boolean;
}

export class CmModalController implements CmController {
  readonly #dialog: HTMLDialogElement;
  readonly #options: ModalControllerOptions;
  #isOpen = false;
  #returnFocus: HTMLElement | null = null;

  constructor(root: Element, options: ModalControllerOptions) {
    const DialogConstructor = root.ownerDocument.defaultView?.HTMLDialogElement;
    if (!DialogConstructor || !(root instanceof DialogConstructor)) {
      throw new TypeError('Modal controller requires a native dialog root.');
    }
    if (!options.allowNoCloseButton && !root.querySelector(options.closeSelector)) {
      throw new TypeError('Modal controller requires a close button.');
    }
    this.#dialog = root;
    this.#options = options;
  }

  connect(): void {
    const open = this.#dialog.open;
    if (open) this.#enterModal();
    this.#synchronize(open);
    this.#dialog.addEventListener('click', this.#handleClick);
    this.#dialog.addEventListener('keydown', this.#handleKeydown);
    this.#dialog.addEventListener('cancel', this.#handleCancel);
    this.#dialog.addEventListener('close', this.#handleClose);
    this.#dialog.addEventListener(`cm:${this.#options.eventName}-open-request`, this.#handleOpenRequest);
    this.#dialog.addEventListener(`cm:${this.#options.eventName}-close-request`, this.#handleCloseRequest);
    if (open) this.#focusInitial();
  }

  disconnect(): void {
    this.#dialog.removeEventListener('click', this.#handleClick);
    this.#dialog.removeEventListener('keydown', this.#handleKeydown);
    this.#dialog.removeEventListener('cancel', this.#handleCancel);
    this.#dialog.removeEventListener('close', this.#handleClose);
    this.#dialog.removeEventListener(`cm:${this.#options.eventName}-open-request`, this.#handleOpenRequest);
    this.#dialog.removeEventListener(`cm:${this.#options.eventName}-close-request`, this.#handleCloseRequest);
    this.#returnFocus = null;
  }

  setOpen(open: boolean, restoreFocus = true): void {
    if (open) {
      if (this.#dialog.open) return;
      const active = this.#dialog.ownerDocument.activeElement;
      this.#returnFocus = active instanceof this.#dialog.ownerDocument.defaultView!.HTMLElement ? active : null;
      this.#enterModal();
      this.#synchronize(true);
      this.#focusInitial();
    } else {
      if (!this.#dialog.open && !this.#isOpen) return;
      this.#isOpen = false;
      if (typeof this.#dialog.close === 'function' && this.#dialog.open) this.#dialog.close();
      this.#synchronize(false);
      if (restoreFocus && this.#returnFocus?.isConnected) this.#returnFocus.focus();
      this.#returnFocus = null;
    }
    dispatchCmEvent<ModalOpenChangeDetail>(this.#dialog, `${this.#options.eventName}-open-change`, { open });
  }

  readonly #handleClick = (event: Event): void => {
    const ElementConstructor = this.#dialog.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return;
    if (event.target.closest('dialog') !== this.#dialog) return;
    if (event.target.closest(this.#options.closeSelector) && this.#isDismissible()) this.setOpen(false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const view = this.#dialog.ownerDocument.defaultView;
    if (!view || !(event instanceof view.KeyboardEvent) || !(event.target instanceof view.Element)) return;
    if (!this.#dialog.open || event.target.closest('dialog') !== this.#dialog) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (this.#isDismissible() && this.#options.allowEscape?.() !== false) this.setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.#availableFocusCandidates(cmFocusableSelector).filter((element) => element.tabIndex >= 0);
    if (focusable.length === 0) {
      event.preventDefault();
      this.#dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
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
    if (this.#isDismissible() && this.#options.allowEscape?.() !== false) this.setOpen(false);
  };

  readonly #handleClose = (): void => {
    // Native close is queued and may arrive after the dialog has already reopened.
    if (!this.#dialog.open) this.setOpen(false);
  };

  readonly #handleOpenRequest = (): void => this.setOpen(true);
  readonly #handleCloseRequest = (): void => this.setOpen(false);

  #isDismissible(): boolean {
    return this.#dialog.getAttribute(`data-cm-${this.#options.eventName}-dismissible`) !== 'false';
  }

  #enterModal(): void {
    const dialog = this.#dialog;
    if (!dialog.isConnected || typeof dialog.showModal !== 'function' || dialog.matches(':modal')) return;

    // The server can render open markup, but only showModal enters the browser's modal stack.
    if (dialog.open) dialog.removeAttribute('open');
    dialog.showModal();
  }

  #focusInitial(): void {
    (
      this.#availableFocusCandidates('[autofocus]')[0] ??
      this.#availableFocusCandidates('[data-autofocus]')[0] ??
      this.#availableFocusCandidates(cmFocusableSelector).find((element) => element.tabIndex >= 0) ??
      this.#dialog
    ).focus();
  }

  #availableFocusCandidates(selector: string): HTMLElement[] {
    return [...this.#dialog.querySelectorAll<HTMLElement>(selector)].filter(
      (element) =>
        element.closest('dialog') === this.#dialog &&
        !element.matches(':disabled, input[type="hidden"]') &&
        !element.closest('[hidden], [inert], [aria-hidden="true"]'),
    );
  }

  #synchronize(open: boolean): void {
    this.#isOpen = open;
    this.#dialog.open = open;
    this.#dialog.dataset[this.#options.stateAttribute] = open ? 'open' : 'closed';
    this.#dialog.classList.toggle(this.#options.className, open);
  }
}
