import { afterCmFloatingExit, attachCmAnchoredPosition } from './anchored-position.js';
import { selectClosedKeyAction, selectOpenKeyAction } from './core/select.js';
import { dispatchCmEvent } from './events.js';
import { observeFormReset } from './form-reset.js';
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
const authoredValues = new WeakMap<HTMLInputElement, string>();

export class CmSelectController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #listbox: HTMLElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #input: HTMLInputElement | null;
  #stopAutoUpdate: (() => void) | null = null;
  #stopReset: (() => void) | undefined;

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
    const input = this.#input;
    if (input) {
      if (this.#trigger.disabled) input.disabled = true;
      if (!authoredValues.has(input)) authoredValues.set(input, input.value);
      this.#stopReset ??= observeFormReset(input, () => {
        this.#renderValue(authoredValues.get(input) ?? '');
        this.#setOpen(false, this.#listbox.contains(input.ownerDocument.activeElement));
      });
    }
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
    this.#stopReset?.();
    this.#stopReset = undefined;
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
    if (this.#trigger.matches(':disabled') || !Element_ || !(target instanceof Element_)) return;

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
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(event instanceof view.KeyboardEvent) || event.defaultPrevented || this.#trigger.matches(':disabled'))
      return;
    const target = event.target;
    if (target !== this.#trigger && !(target instanceof view.Node && this.#listbox.contains(target))) return;

    const open = !this.#listbox.hidden;
    const options = this.#enabledOptions;

    if (!open) {
      const action = selectClosedKeyAction(event.key);
      if (!action || action.type !== 'open') return;
      event.preventDefault();
      this.#setOpen(true, false);
      const next =
        action.focus === 'last'
          ? options[options.length - 1]
          : (options.find((option) => option.getAttribute('aria-selected') === 'true') ?? options[0]);
      next?.focus();
      return;
    }

    const active = options.indexOf(this.#root.ownerDocument.activeElement as HTMLButtonElement);
    const action = selectOpenKeyAction(event.key, { activeIndex: active, count: options.length });
    if (!action) return;

    event.preventDefault();
    if (action.type === 'close') {
      this.#setOpen(false, true);
      return;
    }
    if (action.type === 'focus') {
      options[action.index]?.focus();
      return;
    }
    if (action.type === 'commit') {
      this.#commit(options[action.index]?.getAttribute('data-cm-select-value') ?? '');
      this.#setOpen(false, true);
    }
  };

  readonly #handleDocumentClick = (event: Event): void => {
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (!Node_ || !(event.target instanceof Node_) || this.#root.contains(event.target)) return;
    this.#setOpen(false, false);
  };

  #commit(value: string): void {
    this.#renderValue(value);
    dispatchCmEvent<SelectValueChangeDetail>(this.#root, 'select-value-change', { value });
    const view = this.#root.ownerDocument.defaultView;
    if (view) this.#trigger.dispatchEvent(new view.Event('change', { bubbles: true }));
  }

  #renderValue(value: string): void {
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
  }

  #setOpen(open: boolean, restoreFocus: boolean): void {
    if (this.#trigger.disabled) open = false;
    const changed = this.#listbox.hidden === open;
    this.#synchronize(open);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent(this.#root, 'select-open-change', { open });
  }

  #synchronize(open: boolean): void {
    const closing = !open && !this.#listbox.hidden;
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#listbox.hidden = !open;
    if (open) this.#holdPlacement();
    else if (closing) afterCmFloatingExit(this.#listbox, () => this.#releasePlacement());
  }

  #holdPlacement(): void {
    if (this.#stopAutoUpdate) return;
    const placement = this.#listbox.dataset.cmPlacement === 'bottom-end' ? 'bottom-end' : 'bottom-start';
    this.#stopAutoUpdate = attachCmAnchoredPosition(
      this.#trigger,
      this.#listbox,
      placement,
      2,
      this.#listbox.parentElement,
    );
  }

  #releasePlacement(): void {
    this.#stopAutoUpdate?.();
    this.#stopAutoUpdate = null;
  }
}

export const createCmSelectController: CmControllerFactory = (element) => new CmSelectController(element);
