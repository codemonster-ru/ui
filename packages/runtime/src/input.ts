import { isInputClearVisible, resolveInputClearable, resolvePasswordReveal } from './core/input.js';
import type { CmController, CmControllerFactory } from './runtime.js';

const controlSelector = '[data-cm-input-control]';
const clearSelector = '[data-cm-input-clear]';
const passwordSelector = '[data-cm-input-password]';

export class CmInputController implements CmController {
  readonly #root: Element;
  readonly #input: HTMLInputElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #password: HTMLButtonElement | null;
  #resetTimer: number | undefined;

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
    if (this.#clear) this.#root.ownerDocument.addEventListener('reset', this.#handleReset);
    this.#synchronizeClear();
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#input.removeEventListener('input', this.#synchronizeClear);
    this.#root.ownerDocument.removeEventListener('reset', this.#handleReset);
    this.#cancelReset();
  }

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(target instanceof view.Element)) return;

    if (this.#clear && target.closest(clearSelector) === this.#clear) {
      const canClear = resolveInputClearable({
        clearable: !this.#clear.matches(':disabled'),
        disabled: this.#input.matches(':disabled'),
        readonly: this.#input.readOnly,
      });
      if (!canClear) return;
      this.#input.value = '';
      this.#input.dispatchEvent(new view.Event('input', { bubbles: true }));
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
    if (this.#clear) this.#clear.hidden = !isInputClearVisible(true, this.#input.value);
  };

  readonly #handleReset = (event: Event): void => {
    if (event.target !== this.#input.form) return;
    this.#cancelReset();
    // The reset event is sent before the browser restores the default value.
    this.#resetTimer = this.#root.ownerDocument.defaultView?.setTimeout(() => {
      this.#resetTimer = undefined;
      this.#synchronizeClear();
    });
  };

  #cancelReset(): void {
    if (this.#resetTimer === undefined) return;
    this.#root.ownerDocument.defaultView?.clearTimeout(this.#resetTimer);
    this.#resetTimer = undefined;
  }

  #togglePassword(): void {
    if (!this.#password) return;
    const selectionStart = this.#input.selectionStart;
    const selectionEnd = this.#input.selectionEnd;
    const reveal = resolvePasswordReveal(this.#input.type === 'password', {
      hide: this.#password.dataset.cmInputHidePasswordLabel ?? 'Hide password',
      show: this.#password.dataset.cmInputShowPasswordLabel ?? 'Show password',
    });
    this.#input.type = reveal.type;
    this.#password.setAttribute('aria-pressed', String(reveal.ariaPressed));
    this.#password.setAttribute('aria-label', reveal.label);
    this.#input.focus();
    if (selectionStart !== null && selectionEnd !== null) this.#input.setSelectionRange(selectionStart, selectionEnd);
  }
}

export const createCmInputController: CmControllerFactory = (element) => new CmInputController(element);
