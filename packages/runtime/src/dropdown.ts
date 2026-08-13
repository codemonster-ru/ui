import { dispatchCmEvent } from './events.js';
import type { MenuSelectDetail } from './menu.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface DropdownOpenChangeDetail {
  open: boolean;
}

const triggerSelector = '.cm-dropdown__trigger';
const menuSelector = '.cm-dropdown__menu[role="menu"]';
const enabledItemSelector = '[data-cm-menu-item][role="menuitem"]:not([disabled]):not([aria-disabled="true"])';

export class CmDropdownController implements CmController {
  readonly #menu: HTMLElement;
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>(triggerSelector);
    const menu = root.querySelector<HTMLElement>(menuSelector);
    if (!trigger || !menu) throw new TypeError('Dropdown controller requires a trigger and menu.');
    this.#root = root;
    this.#trigger = trigger;
    this.#menu = menu;
  }

  connect(): void {
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('cm:menu-select', this.#handleSelect);
    this.#root.addEventListener('cm:menu-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('cm:menu-select', this.#handleSelect);
    this.#root.removeEventListener('cm:menu-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
  }

  readonly #handleClick = (event: Event): void => {
    if (event.target === this.#trigger && !this.#trigger.disabled) this.#setOpen(this.#menu.hidden, false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor) || event.target !== this.#trigger) {
      return;
    }
    if (this.#trigger.disabled || !['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;

    event.preventDefault();
    const focusLast = event.key === 'ArrowUp';
    this.#setOpen(true, false);
    const items = [...this.#menu.querySelectorAll<HTMLElement>(enabledItemSelector)];
    (focusLast ? items[items.length - 1] : items[0])?.focus();
  };

  readonly #handleSelect = (event: Event): void => {
    const detail = (event as CustomEvent<MenuSelectDetail>).detail;
    if (!detail?.value) return;
    dispatchCmEvent(this.#root, 'dropdown-select', detail);
    this.#setOpen(false, true);
  };

  readonly #handleCloseRequest = (): void => {
    this.#setOpen(false, true);
  };

  readonly #handleDocumentClick = (event: Event): void => {
    const NodeConstructor = this.#root.ownerDocument.defaultView?.Node;
    if (!NodeConstructor || !(event.target instanceof NodeConstructor) || this.#root.contains(event.target)) return;
    this.#setOpen(false, false);
  };

  #setOpen(open: boolean, restoreFocus: boolean): void {
    if (this.#trigger.disabled) open = false;
    const changed = this.#menu.hidden === open;
    this.#synchronize(open);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent<DropdownOpenChangeDetail>(this.#root, 'dropdown-open-change', { open });
  }

  #synchronize(open: boolean): void {
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#menu.hidden = !open;
    this.#root.classList.toggle('cm-dropdown--open', open);
  }
}

export const createCmDropdownController: CmControllerFactory = (element) => new CmDropdownController(element);
