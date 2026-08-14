import type { CmController, CmControllerFactory } from './runtime.js';

const controlSelector = '[data-cm-select-control]';
const clearSelector = '[data-cm-select-clear]';

export class CmSelectController implements CmController {
  readonly #root: Element;
  readonly #select: HTMLSelectElement;
  readonly #clear: HTMLButtonElement;

  constructor(root: Element) {
    const select = root.querySelector<HTMLSelectElement>(controlSelector);
    const clear = root.querySelector<HTMLButtonElement>(clearSelector);
    if (!select || !clear) throw new TypeError('Select controller requires a native select and clear action.');
    this.#root = root;
    this.#select = select;
    this.#clear = clear;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('mousedown', this.#handleMouseDown);
    this.#select.addEventListener('change', this.#synchronizeClear);
    this.#synchronizeClear();
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#select.removeEventListener('change', this.#synchronizeClear);
  }

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    if (
      !(target instanceof this.#root.ownerDocument.defaultView!.Element) ||
      target.closest(clearSelector) !== this.#clear
    )
      return;
    this.#select.value = '';
    this.#select.dispatchEvent(new this.#root.ownerDocument.defaultView!.Event('change', { bubbles: true }));
    this.#select.focus();
  };

  readonly #handleMouseDown = (event: Event): void => {
    const target = event.target;
    if (
      target instanceof this.#root.ownerDocument.defaultView!.Element &&
      target.closest(clearSelector) === this.#clear
    )
      event.preventDefault();
  };

  readonly #synchronizeClear = (): void => {
    this.#clear.hidden = this.#select.value === '';
  };
}

export const createCmSelectController: CmControllerFactory = (element) => new CmSelectController(element);
