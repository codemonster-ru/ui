import { isMenuCloseKey, menuTabStopId, nextMenuItem } from './core/menu.js';
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

    if (isMenuCloseKey(event.key)) {
      event.preventDefault();
      dispatchCmEvent(this.#root, 'menu-close-request', {});
      return;
    }

    const item = this.#itemFromEvent(event);
    const currentId = item ? this.#idOf(item) : null;
    if (currentId === null) return;

    const nextId = nextMenuItem(this.#coreItems, currentId, event.key);
    if (nextId === null) return;

    event.preventDefault();
    this.#items.find((candidate) => this.#idOf(candidate) === nextId)?.focus();
  };

  #idOf(item: HTMLElement): string {
    return item.dataset.cmMenuValue ?? String(this.#items.indexOf(item));
  }

  get #coreItems(): { disabled: boolean; id: string }[] {
    return this.#items.map((item) => ({ disabled: disabled(item), id: this.#idOf(item) }));
  }

  #itemFromEvent(event: Event): HTMLElement | null {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return null;
    const item = event.target.closest<HTMLElement>(itemSelector);
    return item && this.#root.contains(item) ? item : null;
  }

  #synchronizeTabStops(): void {
    const tabStop = menuTabStopId(this.#coreItems);
    for (const item of this.#items) {
      item.tabIndex = this.#idOf(item) === tabStop ? 0 : -1;
    }
  }
}

export const createCmMenuController: CmControllerFactory = (element) => new CmMenuController(element);
