import { commandPaletteKeyAction, normalizeCommandQuery } from './core/command-palette.js';
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
  readonly #empty: HTMLElement | null;
  readonly #input: HTMLInputElement;
  readonly #idle: HTMLElement | null;
  readonly #modal: CmModalController;
  readonly #options: HTMLElement[];
  readonly #root: Element;

  constructor(root: Element) {
    const input = root.querySelector<HTMLInputElement>('[data-cm-command-palette-input]');
    const empty = root.querySelector<HTMLElement>('.cm-command-palette__empty');
    const idle = root.querySelector<HTMLElement>('.cm-command-palette__idle');
    const options = [...root.querySelectorAll<HTMLElement>(optionSelector)];
    if (!input || (!empty && !root.querySelector('.cm-command-palette__results'))) {
      throw new TypeError(
        'CommandPalette controller requires an input and either an empty region or authored results.',
      );
    }
    this.#root = root;
    this.#input = input;
    this.#idle = idle;
    this.#empty = empty;
    this.#options = options;
    this.#modal = new CmModalController(root, {
      className: 'cm-command-palette--open',
      closeSelector: '[data-cm-command-palette-close]',
      eventName: 'command-palette',
      stateAttribute: 'cmCommandPaletteState',
      allowEscape: () => this.#root.getAttribute('data-cm-command-palette-close-on-escape') !== 'false',
    });
  }

  connect(): void {
    this.#modal.connect();
    this.#filter(this.#input.value);
    if (this.#empty) this.#input.setAttribute('aria-expanded', String((this.#root as HTMLDialogElement).open));
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('pointermove', this.#handlePointerMove);
    this.#root.addEventListener('cm:command-palette-open-change', this.#handleOpenChange);
  }

  disconnect(): void {
    this.#input.removeEventListener('input', this.#handleInput);
    this.#input.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('pointermove', this.#handlePointerMove);
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
    if (event.isComposing) return;
    const enabled = this.#enabledVisibleOptions();
    const activeIndex = enabled.findIndex((option) => option.getAttribute('aria-selected') === 'true');
    const action = commandPaletteKeyAction(event.key, { activeIndex, count: enabled.length });
    if (!action) {
      if (event.key === 'Enter') {
        event.preventDefault();
        dispatchCmEvent<CommandPaletteQueryChangeDetail>(this.#root, 'command-palette-submit', {
          query: this.#input.value,
        });
      }
      return;
    }

    event.preventDefault();
    if (action.type === 'commit') {
      const active = enabled[activeIndex];
      if (active) this.#select(active);
      return;
    }
    const next = enabled[action.index];
    if (next) this.#activate(next);
  };

  readonly #handleClick = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    if (
      view &&
      event instanceof view.MouseEvent &&
      event.target === this.#root &&
      this.#root.getAttribute('data-cm-command-palette-close-on-overlay-click') === 'true'
    ) {
      const { left, top, right, bottom } = this.#root.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom)
        this.#modal.setOpen(false);
      return;
    }
    const ElementConstructor = view?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return;
    const option = event.target.closest<HTMLElement>(optionSelector);
    if (option && this.#root.contains(option) && option.getAttribute('aria-disabled') !== 'true') this.#select(option);
  };

  readonly #handlePointerMove = (event: Event): void => {
    if (this.#root.getAttribute('data-cm-command-palette-auto-activate') !== 'false') return;
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return;
    const option = event.target.closest<HTMLElement>(optionSelector);
    if (option && this.#enabledVisibleOptions().includes(option)) this.#activate(option);
  };

  readonly #handleOpenChange = (event: Event): void => {
    const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
    if (this.#empty) this.#input.setAttribute('aria-expanded', String(open));
  };

  #filter(query: string): void {
    if (!this.#empty || this.#root.getAttribute('data-cm-command-palette-loading') === 'true') return;
    const filter = this.#root.getAttribute('data-cm-command-palette-filter') !== 'false';
    const needle = normalizeCommandQuery(query);
    let visibleCount = 0;
    for (const option of this.#options) {
      const haystack = `${option.textContent ?? ''} ${option.dataset.cmCommandKeywords ?? ''}`.toLocaleLowerCase();
      option.hidden = filter && needle !== '' && !haystack.includes(needle);
      if (!option.hidden) visibleCount += 1;
    }
    this.#empty.hidden = needle === '' || visibleCount > 0;
    if (this.#idle) this.#idle.hidden = needle !== '' || this.#options.length > 0;
    const active =
      this.#root.getAttribute('data-cm-command-palette-auto-activate') === 'false'
        ? undefined
        : this.#enabledVisibleOptions()[0];
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
    if (this.#root.getAttribute('data-cm-command-palette-close-on-select') !== 'false') this.#modal.setOpen(false);
  }
}

export const createCmCommandPaletteController: CmControllerFactory = (element) =>
  new CmCommandPaletteController(element);
