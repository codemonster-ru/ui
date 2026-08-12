import { dispatchCmEvent } from './events.js';
import { CmModalController } from './modal.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface CommandPaletteQueryChangeDetail {
  query: string;
}
export interface CommandPaletteSelectDetail {
  value: string;
}

const optionSelector = '[data-cm-command-palette-option][role="option"]';

export class CmCommandPaletteController implements CmController {
  readonly #empty: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #modal: CmModalController;
  readonly #options: HTMLElement[];
  readonly #root: Element;

  constructor(root: Element) {
    const input = root.querySelector<HTMLInputElement>('[data-cm-command-palette-input]');
    const empty = root.querySelector<HTMLElement>('.cm-command-palette__empty');
    const options = [...root.querySelectorAll<HTMLElement>(optionSelector)];
    if (!input || !empty || options.length === 0) {
      throw new TypeError('CommandPalette controller requires an input, options, and empty region.');
    }
    this.#root = root;
    this.#input = input;
    this.#empty = empty;
    this.#options = options;
    this.#modal = new CmModalController(root, {
      className: 'cm-command-palette--open',
      closeSelector: '[data-cm-command-palette-close]',
      eventName: 'command-palette',
      stateAttribute: 'cmCommandPaletteState',
    });
  }

  connect(): void {
    this.#modal.connect();
    this.#filter(this.#input.value);
    this.#input.setAttribute('aria-expanded', String((this.#root as HTMLDialogElement).open));
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('cm:command-palette-open-change', this.#handleOpenChange);
  }

  disconnect(): void {
    this.#input.removeEventListener('input', this.#handleInput);
    this.#input.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('cm:command-palette-open-change', this.#handleOpenChange);
    this.#modal.disconnect();
  }

  readonly #handleInput = (): void => {
    this.#filter(this.#input.value);
    dispatchCmEvent<CommandPaletteQueryChangeDetail>(this.#root, 'command-palette-query-change', {
      query: this.#input.value,
    });
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    const enabled = this.#enabledVisibleOptions();
    if (event.key === 'Enter') {
      const active = enabled.find((option) => option.getAttribute('aria-selected') === 'true');
      if (!active) return;
      event.preventDefault();
      this.#select(active);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || enabled.length === 0) return;
    event.preventDefault();
    const current = enabled.findIndex((option) => option.getAttribute('aria-selected') === 'true');
    const last = enabled.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowDown'
            ? (Math.max(current, -1) + 1) % enabled.length
            : current <= 0
              ? last
              : current - 1;
    this.#activate(enabled[next]!);
  };

  readonly #handleClick = (event: Event): void => {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return;
    const option = event.target.closest<HTMLElement>(optionSelector);
    if (option && this.#root.contains(option) && option.getAttribute('aria-disabled') !== 'true') this.#select(option);
  };

  readonly #handleOpenChange = (event: Event): void => {
    const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
    this.#input.setAttribute('aria-expanded', String(open));
  };

  #filter(query: string): void {
    const needle = query.trim().toLocaleLowerCase();
    let visibleCount = 0;
    for (const option of this.#options) {
      const haystack = `${option.textContent ?? ''} ${option.dataset.cmCommandKeywords ?? ''}`.toLocaleLowerCase();
      option.hidden = needle !== '' && !haystack.includes(needle);
      if (!option.hidden) visibleCount += 1;
    }
    this.#empty.hidden = visibleCount > 0;
    const active = this.#enabledVisibleOptions()[0];
    if (active) this.#activate(active);
    else {
      this.#options.forEach((option) => this.#setActive(option, false));
      this.#input.removeAttribute('aria-activedescendant');
    }
  }

  #enabledVisibleOptions(): HTMLElement[] {
    return this.#options.filter((option) => !option.hidden && option.getAttribute('aria-disabled') !== 'true');
  }

  #activate(active: HTMLElement): void {
    this.#options.forEach((option) => this.#setActive(option, option === active));
    this.#input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView?.({ block: 'nearest' });
  }

  #setActive(option: HTMLElement, active: boolean): void {
    option.setAttribute('aria-selected', String(active));
    option.classList.toggle('cm-command-palette__option--active', active);
  }

  #select(option: HTMLElement): void {
    const value = option.dataset.cmCommandValue;
    if (!value) return;
    dispatchCmEvent<CommandPaletteSelectDetail>(this.#root, 'command-palette-select', { value });
    this.#modal.setOpen(false);
  }
}

export const createCmCommandPaletteController: CmControllerFactory = (element) =>
  new CmCommandPaletteController(element);
