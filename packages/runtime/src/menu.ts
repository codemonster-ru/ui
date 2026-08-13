import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface MenuSelectDetail {
  value: string;
}

const itemSelector = '[data-cm-menu-item][role="menuitem"]';

function disabled(item: HTMLElement): boolean {
  return (
    (item instanceof item.ownerDocument.defaultView!.HTMLButtonElement && item.disabled) ||
    item.getAttribute('aria-disabled') === 'true'
  );
}

export class CmMenuController implements CmController {
  readonly #root: Element;
  #items: HTMLElement[] = [];

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#items = [...this.#root.querySelectorAll<HTMLElement>(itemSelector)];
    this.#synchronizeTabStops();
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#items = [];
  }

  readonly #handleClick = (event: Event): void => {
    const item = this.#itemFromEvent(event);
    if (!item) return;
    if (disabled(item)) {
      event.preventDefault();
      return;
    }
    const value = item.dataset.cmMenuValue;
    if (value) dispatchCmEvent<MenuSelectDetail>(this.#root, 'menu-select', { value });
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor)) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      dispatchCmEvent(this.#root, 'menu-close-request', {});
      return;
    }

    const item = this.#itemFromEvent(event);
    const enabled = this.#items.filter((candidate) => !disabled(candidate));
    const currentIndex = item ? enabled.indexOf(item) : -1;
    if (currentIndex < 0) return;

    const last = enabled.length - 1;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowDown'
            ? (currentIndex + 1) % enabled.length
            : event.key === 'ArrowUp'
              ? (currentIndex - 1 + enabled.length) % enabled.length
              : -1;
    if (nextIndex < 0) return;

    event.preventDefault();
    enabled[nextIndex]?.focus();
  };

  #itemFromEvent(event: Event): HTMLElement | null {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return null;
    const item = event.target.closest<HTMLElement>(itemSelector);
    return item && this.#root.contains(item) ? item : null;
  }

  #synchronizeTabStops(): void {
    let assigned = false;
    for (const item of this.#items) {
      const enabled = !disabled(item);
      item.tabIndex = enabled && !assigned ? 0 : -1;
      if (enabled) assigned = true;
    }
  }
}

export const createCmMenuController: CmControllerFactory = (element) => new CmMenuController(element);
