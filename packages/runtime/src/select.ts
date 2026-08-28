import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface SelectValueChangeDetail {
  value: string;
}

const triggerSelector = '.cm-select';
const listboxSelector = '.cm-select__listbox[role="listbox"]';
const clearSelector = '[data-cm-select-clear]';
const optionSelector = '.cm-select__option[role="option"]';
const enabledOptionSelector = `${optionSelector}:not([aria-disabled="true"]):not([disabled])`;
const valueSelector = '.cm-select__value';
const hiddenInputSelector = 'input[type="hidden"]';

export class CmSelectController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #listbox: HTMLElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #input: HTMLInputElement | null;
  #stopAutoUpdate: (() => void) | null = null;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>(triggerSelector);
    const listbox = root.querySelector<HTMLElement>(listboxSelector);
    if (!trigger || !listbox) throw new TypeError('Select controller requires a trigger and listbox.');
    this.#root = root;
    this.#trigger = trigger;
    this.#listbox = listbox;
    this.#clear = root.querySelector<HTMLButtonElement>(clearSelector);
    this.#input = root.querySelector<HTMLInputElement>(hiddenInputSelector);
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('mousedown', this.#handleMouseDown);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
    this.#releasePlacement();
  }

  get #options(): HTMLButtonElement[] {
    return [...this.#listbox.querySelectorAll<HTMLButtonElement>(optionSelector)];
  }

  get #enabledOptions(): HTMLButtonElement[] {
    return [...this.#listbox.querySelectorAll<HTMLButtonElement>(enabledOptionSelector)];
  }

  readonly #handleMouseDown = (event: Event): void => {
    const target = event.target;
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (Element_ && target instanceof Element_ && target.closest(clearSelector)) event.preventDefault();
  };

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(target instanceof Element_)) return;

    if (this.#clear && target.closest(clearSelector) === this.#clear) {
      this.#commit('');
      this.#setOpen(false, true);
      return;
    }

    const option = target.closest<HTMLButtonElement>(optionSelector);
    if (option && this.#listbox.contains(option)) {
      if (option.getAttribute('aria-disabled') === 'true' || option.disabled) return;
      this.#commit(option.getAttribute('data-cm-select-value') ?? '');
      this.#setOpen(false, true);
      return;
    }

    if (target.closest(triggerSelector) === this.#trigger && !this.#trigger.disabled) {
      this.#setOpen(this.#listbox.hidden, false);
    }
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_) || this.#trigger.disabled) return;

    const open = !this.#listbox.hidden;
    const options = this.#enabledOptions;

    if (!open) {
      if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      this.#setOpen(true, false);
      const next = event.key === 'ArrowUp' ? options[options.length - 1] : (this.#selectedOption() ?? options[0]);
      next?.focus();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.#setOpen(false, true);
      return;
    }

    const active = options.indexOf(this.#root.ownerDocument.activeElement as HTMLButtonElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const index = active === -1 ? 0 : (active + step + options.length) % options.length;
      options[index]?.focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? options[0] : options[options.length - 1])?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (active === -1) return;
      event.preventDefault();
      this.#commit(options[active].getAttribute('data-cm-select-value') ?? '');
      this.#setOpen(false, true);
    }
  };

  readonly #handleDocumentClick = (event: Event): void => {
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (!Node_ || !(event.target instanceof Node_) || this.#root.contains(event.target)) return;
    this.#setOpen(false, false);
  };

  #selectedOption(): HTMLButtonElement | null {
    return this.#options.find((option) => option.getAttribute('aria-selected') === 'true') ?? null;
  }

  #commit(value: string): void {
    if (this.#input) this.#input.value = value;

    let label = '';
    for (const option of this.#options) {
      const selected = option.getAttribute('data-cm-select-value') === value && value !== '';
      option.setAttribute('aria-selected', String(selected));
      option.classList.toggle('cm-select__option--selected', selected);
      if (selected) label = option.textContent?.trim() ?? '';
    }

    const valueElement = this.#trigger.querySelector<HTMLElement>(valueSelector);
    if (valueElement) valueElement.textContent = label || (this.#trigger.dataset.cmPlaceholder ?? '');
    if (value) this.#trigger.dataset.cmFilled = 'true';
    else delete this.#trigger.dataset.cmFilled;
    if (this.#clear) this.#clear.hidden = value === '';

    dispatchCmEvent<SelectValueChangeDetail>(this.#root, 'select-value-change', { value });
    const view = this.#root.ownerDocument.defaultView;
    if (view) this.#trigger.dispatchEvent(new view.Event('change', { bubbles: true }));
  }

  #setOpen(open: boolean, restoreFocus: boolean): void {
    if (this.#trigger.disabled) open = false;
    const changed = this.#listbox.hidden === open;
    this.#synchronize(open);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent(this.#root, 'select-open-change', { open });
  }

  #synchronize(open: boolean): void {
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#listbox.hidden = !open;
    if (open) this.#holdPlacement();
    else this.#releasePlacement();
  }

  #holdPlacement(): void {
    if (this.#stopAutoUpdate) return;
    const place = (): void => {
      void computePosition(this.#trigger, this.#listbox, {
        placement: 'bottom-start',
        middleware: [offset(2), flip(), shift()],
      }).then(({ x, y }) => {
        this.#listbox.style.insetInlineStart = `${x}px`;
        this.#listbox.style.insetBlockStart = `${y}px`;
      });
    };
    this.#stopAutoUpdate = autoUpdate(this.#trigger, place, this.#listbox);
    place();
  }

  #releasePlacement(): void {
    this.#stopAutoUpdate?.();
    this.#stopAutoUpdate = null;
    this.#listbox.style.removeProperty('inset-inline-start');
    this.#listbox.style.removeProperty('inset-block-start');
  }
}

export const createCmSelectController: CmControllerFactory = (element) => new CmSelectController(element);
