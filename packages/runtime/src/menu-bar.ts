import { menuBarKeyAction } from './core/menu-bar.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface MenuBarSelectDetail {
  value: string;
}

const branchSelector = '[data-cm-menu-bar-branch]';
const itemSelector = '[data-cm-menu-bar-branch], [data-cm-menu-bar-value]';

export class CmMenuBarController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
  }

  #submenuOf(item: HTMLElement): HTMLElement | null {
    return item.closest('.cm-menu-bar__node')?.querySelector(':scope > .cm-menu-bar__submenu') ?? null;
  }

  #setOpen(branch: HTMLElement, open: boolean): void {
    const submenu = this.#submenuOf(branch);
    branch.setAttribute('aria-expanded', String(open));
    branch.classList.toggle('cm-menu-bar__item--open', open);
    branch.closest('.cm-menu-bar__node')?.classList.toggle('cm-menu-bar__node--open', open);
    if (submenu) submenu.hidden = !open;
  }

  /** A menu bar shows one path, so opening anywhere closes whatever is not on the way to it. */
  #closeOthers(keep: HTMLElement | null): void {
    for (const branch of this.#root.querySelectorAll<HTMLElement>(branchSelector)) {
      if (keep && (branch === keep || branch.closest('.cm-menu-bar__node')?.contains(keep))) continue;
      this.#setOpen(branch, false);
    }
  }

  #entriesOf(branch: HTMLElement): HTMLElement[] {
    const submenu = this.#submenuOf(branch);
    return submenu ? [...submenu.querySelectorAll<HTMLElement>(`:scope > li > ${itemSelector}`)] : [];
  }

  readonly #handleClick = (event: Event): void => {
    const item = this.#itemFrom(event);
    if (!item) return;

    if (item.dataset.cmMenuBarBranch !== undefined) {
      const open = item.getAttribute('aria-expanded') !== 'true';
      this.#closeOthers(open ? item : null);
      this.#setOpen(item, open);
      return;
    }

    this.#closeOthers(null);
    dispatchCmEvent<MenuBarSelectDetail>(this.#root, 'menu-bar-select', {
      value: item.dataset.cmMenuBarValue ?? '',
    });
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_)) return;

    const item = this.#itemFrom(event);
    if (!item) return;

    const node = item.closest('.cm-menu-bar__node');
    const isTopLevel = node?.classList.contains('cm-menu-bar__node--depth-0') === true;
    const isBranch = item.dataset.cmMenuBarBranch !== undefined;
    const direction = this.#root.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';

    const action = menuBarKeyAction(event.key, {
      direction,
      isBranch,
      isOpen: item.getAttribute('aria-expanded') === 'true',
      isTopLevel,
    });
    if (!action) return;

    event.preventDefault();
    this.#apply(action, item, isTopLevel);
  };

  #apply(action: ReturnType<typeof menuBarKeyAction> & object, item: HTMLElement, isTopLevel: boolean): void {
    const siblings = this.#siblingsOf(item);
    const index = siblings.indexOf(item);

    switch (action.type) {
      case 'close-all':
        this.#closeOthers(null);
        this.#topLevelItems()[0]?.focus();
        return;
      case 'collapse':
        this.#setOpen(item, false);
        return;
      case 'close-to-parent': {
        const parentBranch = item
          .closest('.cm-menu-bar__submenu')
          ?.closest('.cm-menu-bar__node')
          ?.querySelector<HTMLElement>(`:scope > ${branchSelector}`);
        if (parentBranch) {
          this.#setOpen(parentBranch, false);
          parentBranch.focus();
        }
        return;
      }
      case 'open': {
        this.#closeOthers(item);
        this.#setOpen(item, true);
        const entries = this.#entriesOf(item);
        (action.focus === 'last' ? entries[entries.length - 1] : entries[0])?.focus();
        return;
      }
      case 'focus-sibling': {
        if (siblings.length === 0) return;
        const next = (index + action.delta + siblings.length) % siblings.length;
        siblings[next]?.focus();
        return;
      }
      case 'focus-edge':
        (action.edge === 'first' ? siblings[0] : siblings[siblings.length - 1])?.focus();
        return;
      case 'move-top-level': {
        const top = this.#topLevelItems();
        const current = isTopLevel
          ? top.indexOf(item)
          : top.findIndex((entry) => entry.closest('.cm-menu-bar__node')?.contains(item));
        if (top.length === 0 || current < 0) return;
        const next = (current + action.delta + top.length) % top.length;
        this.#closeOthers(null);
        top[next]?.focus();
      }
    }
  }

  #topLevelItems(): HTMLElement[] {
    return [...this.#root.querySelectorAll<HTMLElement>(`.cm-menu-bar__node--depth-0 > ${itemSelector}`)];
  }

  #siblingsOf(item: HTMLElement): HTMLElement[] {
    const list = item.closest('li')?.parentElement;
    return list ? [...list.querySelectorAll<HTMLElement>(`:scope > li > ${itemSelector}`)] : [];
  }

  readonly #handleDocumentClick = (event: Event): void => {
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (!Node_ || !(event.target instanceof Node_) || this.#root.contains(event.target)) return;
    this.#closeOthers(null);
  };

  #itemFrom(event: Event): HTMLElement | null {
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(event.target instanceof Element_)) return null;
    const item = event.target.closest<HTMLElement>(itemSelector);
    return item && this.#root.contains(item) ? item : null;
  }
}

export const createCmMenuBarController: CmControllerFactory = (element) => new CmMenuBarController(element);
