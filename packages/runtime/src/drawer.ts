import { CmModalController } from './modal.js';
import type { CmControllerFactory } from './runtime.js';

export class CmDrawerController extends CmModalController {
  readonly #root: Element;

  constructor(root: Element) {
    super(root, {
      className: 'cm-drawer--open',
      closeSelector: '[data-cm-drawer-close]',
      eventName: 'drawer',
      stateAttribute: 'cmDrawerState',
      allowEscape: () => root.getAttribute('data-cm-drawer-close-on-escape') !== 'false',
      allowNoCloseButton: root.getAttribute('data-cm-drawer-closable') === 'false',
    });
    this.#root = root;
  }

  override connect(): void {
    super.connect();
    this.#root.addEventListener('click', this.#handleBackdropClick);
  }

  override disconnect(): void {
    this.#root.removeEventListener('click', this.#handleBackdropClick);
    super.disconnect();
  }

  readonly #handleBackdropClick = (event: Event): void => {
    const MouseEvent_ = this.#root.ownerDocument.defaultView?.MouseEvent;
    if (
      !MouseEvent_ ||
      !(event instanceof MouseEvent_) ||
      event.target !== this.#root ||
      this.#root.getAttribute('data-cm-drawer-close-on-overlay-click') !== 'true' ||
      this.#root.getAttribute('data-cm-drawer-dismissible') === 'false'
    )
      return;
    const { left, top, right, bottom } = this.#root.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom)
      this.setOpen(false);
  };
}

export const createCmDrawerController: CmControllerFactory = (element) => new CmDrawerController(element);
