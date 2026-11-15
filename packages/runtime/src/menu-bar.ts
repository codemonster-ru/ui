import { menuBarKeyAction } from './core/menu-bar.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface MenuBarSelectDetail {
  value: string;
}

const branchSelector = '[data-cm-menu-bar-branch]';
const itemSelector = ':is([data-cm-menu-bar-branch], [data-cm-menu-bar-value])';
const topNodeSelector = '.cm-menu-bar__node--depth-0';

export class CmMenuBarController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('focusin', this.#handleFocusIn);
    this.#root.addEventListener('focusout', this.#handleFocusOut);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
    const top = this.#topLevelItems();
    this.#setTabStop(top.find((item) => item.tabIndex === 0) ?? top[0]);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('focusin', this.#handleFocusIn);
    this.#root.removeEventListener('focusout', this.#handleFocusOut);
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
      if (branch.closest('.cm-menu-bar') !== this.#root) continue;
      if (keep && (branch === keep || branch.closest('.cm-menu-bar__node')?.contains(keep))) continue;
      this.#setOpen(branch, false);
    }
  }

  #entriesOf(branch: HTMLElement): HTMLElement[] {
    return this.#entriesIn(this.#submenuOf(branch));
  }

  #entriesIn(list: Element | null | undefined): HTMLElement[] {
    return [
      ...(list?.querySelectorAll<HTMLElement>(`:scope > li > ${itemSelector}, :scope > li > [role="group"]`) ?? []),
    ].flatMap((item) =>
      item.matches('[role="group"]')
        ? this.#entriesIn(item)
        : item.matches(':disabled, [aria-disabled="true"]')
          ? []
          : [item],
    );
  }

  #setTabStop(item: HTMLElement | undefined): void {
    for (const candidate of this.#root.querySelectorAll<HTMLElement>(itemSelector)) {
      if (candidate.closest('.cm-menu-bar') === this.#root) candidate.tabIndex = candidate === item ? 0 : -1;
    }
  }

  #topEntry(item: HTMLElement): HTMLElement | null {
    return item.closest(topNodeSelector)?.querySelector<HTMLElement>(`:scope > ${itemSelector}`) ?? null;
  }

  #parentBranch(item: HTMLElement): HTMLElement | null {
    return (
      item.closest('.cm-menu-bar__submenu')?.parentElement?.querySelector<HTMLElement>(`:scope > ${branchSelector}`) ??
      null
    );
  }

  readonly #handleClick = (event: Event): void => {
    const item = this.#itemFrom(event);
    if (!item) return;

    if (item.dataset.cmMenuBarBranch !== undefined) {
      const open = item.getAttribute('aria-expanded') !== 'true';
      this.#closeOthers(open ? item : this.#parentBranch(item));
      if (open) this.#setOpen(item, true);
      return;
    }

    if (item === this.#root.ownerDocument.activeElement) this.#topEntry(item)?.focus();
    this.#closeOthers(null);
    for (const entry of this.#root.querySelectorAll<HTMLElement>('[data-cm-menu-bar-value]')) {
      if (entry.closest('.cm-menu-bar') !== this.#root) continue;
      entry.classList.toggle('cm-menu-bar__item--active', entry === item);
      if (entry === item) entry.setAttribute('aria-current', 'page');
      else entry.removeAttribute('aria-current');
    }
    dispatchCmEvent<MenuBarSelectDetail>(this.#root, 'menu-bar-select', {
      value: item.dataset.cmMenuBarValue ?? '',
    });
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_)) return;

    const item = this.#itemFrom(event);
    if (!item || event.defaultPrevented || (event.key === 'Escape' && !this.#hasOpenPath())) return;

    const node = item.closest('.cm-menu-bar__node');
    const isTopLevel = node?.matches(topNodeSelector) === true;
    const isBranch = item.dataset.cmMenuBarBranch !== undefined;
    const direction = item.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';

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
        this.#topEntry(item)?.focus();
        return;
      case 'collapse':
        this.#closeOthers(this.#parentBranch(item));
        return;
      case 'close-to-parent': {
        const parentBranch = this.#parentBranch(item);
        if (parentBranch) {
          this.#closeOthers(this.#parentBranch(parentBranch));
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
        const target = top[next];
        const open = this.#hasOpenPath() && target.matches(branchSelector);
        this.#closeOthers(open ? target : null);
        if (open) this.#setOpen(target, true);
        target.focus();
      }
    }
  }

  #topLevelItems(): HTMLElement[] {
    return this.#entriesIn(this.#root.firstElementChild);
  }

  #siblingsOf(item: HTMLElement): HTMLElement[] {
    return this.#entriesIn(item.closest('[role="menubar"], [role="menu"]'));
  }

  #hasOpenPath(): boolean {
    return Array.from(this.#root.querySelectorAll(`${branchSelector}[aria-expanded="true"]`)).some(
      (branch) => branch.closest('.cm-menu-bar') === this.#root,
    );
  }

  readonly #handleFocusIn = (event: Event): void => {
    const item = this.#itemFrom(event);
    if (item) this.#setTabStop(item);
  };

  readonly #handleFocusOut = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    if (
      !view ||
      !(event instanceof view.FocusEvent) ||
      (event.relatedTarget instanceof view.Node && this.#root.contains(event.relatedTarget))
    )
      return;
    const item = this.#itemFrom(event);
    this.#setTabStop((item && this.#topEntry(item)) ?? this.#topLevelItems()[0]);
    this.#closeOthers(null);
  };

  readonly #handleDocumentClick = (event: Event): void => {
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (!Node_ || !(event.target instanceof Node_) || this.#root.contains(event.target)) return;
    this.#closeOthers(null);
  };

  #itemFrom(event: Event): HTMLElement | null {
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(event.target instanceof Element_)) return null;
    const item = event.target.closest<HTMLElement>(itemSelector);
    return item?.closest('.cm-menu-bar') === this.#root && !item?.matches(':disabled, [aria-disabled="true"]')
      ? item
      : null;
  }
}

export const createCmMenuBarController: CmControllerFactory = (element) => new CmMenuBarController(element);
