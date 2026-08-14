import type { CmController, CmControllerFactory } from './runtime.js';

const controlSelector = '[data-cm-input-control]';
const clearSelector = '[data-cm-input-clear]';
const passwordSelector = '[data-cm-input-password]';

export class CmInputController implements CmController {
  readonly #root: Element;
  readonly #input: HTMLInputElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #password: HTMLButtonElement | null;

  constructor(root: Element) {
    const input = root.querySelector<HTMLInputElement>(controlSelector);
    if (!input) throw new TypeError('Input controller requires one native input control.');
    this.#root = root;
    this.#input = input;
    this.#clear = root.querySelector<HTMLButtonElement>(clearSelector);
    this.#password = root.querySelector<HTMLButtonElement>(passwordSelector);
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('mousedown', this.#handleMouseDown);
    this.#input.addEventListener('input', this.#synchronizeClear);
    this.#synchronizeClear();
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#input.removeEventListener('input', this.#synchronizeClear);
  }

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof this.#root.ownerDocument.defaultView!.Element)) return;

    if (this.#clear && target.closest(clearSelector) === this.#clear) {
      this.#input.value = '';
      this.#input.dispatchEvent(new this.#root.ownerDocument.defaultView!.Event('input', { bubbles: true }));
      this.#input.focus();
      return;
    }

    if (this.#password && target.closest(passwordSelector) === this.#password) this.#togglePassword();
  };

  readonly #handleMouseDown = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof this.#root.ownerDocument.defaultView!.Element)) return;
    if (
      (this.#clear && target.closest(clearSelector) === this.#clear) ||
      (this.#password && target.closest(passwordSelector) === this.#password)
    ) {
      event.preventDefault();
    }
  };

  readonly #synchronizeClear = (): void => {
    if (this.#clear) this.#clear.hidden = this.#input.value.length === 0;
  };

  #togglePassword(): void {
    if (!this.#password) return;
    const selectionStart = this.#input.selectionStart;
    const selectionEnd = this.#input.selectionEnd;
    const visible = this.#input.type === 'password';
    this.#input.type = visible ? 'text' : 'password';
    this.#password.setAttribute('aria-pressed', String(visible));
    this.#password.setAttribute(
      'aria-label',
      visible
        ? (this.#password.dataset.cmInputHidePasswordLabel ?? 'Hide password')
        : (this.#password.dataset.cmInputShowPasswordLabel ?? 'Show password'),
    );
    this.#input.focus();
    if (selectionStart !== null && selectionEnd !== null) this.#input.setSelectionRange(selectionStart, selectionEnd);
  }
}

export const createCmInputController: CmControllerFactory = (element) => new CmInputController(element);
