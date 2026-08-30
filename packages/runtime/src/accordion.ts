import { nextAccordionItem, toggleAccordionItem } from './core/accordion.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface AccordionOpenChangeDetail {
  openItems: string[];
}

interface AccordionItem {
  id: string;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
}

const itemSelector = '[data-cm-accordion-item]';
const triggerSelector = '.cm-accordion__trigger';

function accordionItems(root: Element): AccordionItem[] {
  return [...root.querySelectorAll<HTMLElement>(itemSelector)].flatMap((item) => {
    const id = item.dataset.cmAccordionItem;
    const trigger = item.querySelector<HTMLButtonElement>(triggerSelector);
    const panelId = trigger?.getAttribute('aria-controls');
    const panel = panelId ? root.ownerDocument.getElementById(panelId) : null;

    if (!id || !trigger || !panel || !root.contains(panel)) {
      return [];
    }

    return [{ id, panel, trigger }];
  });
}

export class CmAccordionController implements CmController {
  readonly #root: Element;
  #items: AccordionItem[] = [];

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#items = accordionItems(this.#root);
    this.#synchronizePanels();
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#items = [];
  }

  readonly #handleClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof this.#root.ownerDocument.defaultView!.Element)) {
      return;
    }

    const trigger = target.closest<HTMLButtonElement>(triggerSelector);
    const item = this.#items.find((candidate) => candidate.trigger === trigger);
    if (!item || item.trigger.disabled) {
      return;
    }

    this.#toggle(item);
  };

  readonly #handleKeydown = (event: Event): void => {
    if (!(event instanceof this.#root.ownerDocument.defaultView!.KeyboardEvent)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof this.#root.ownerDocument.defaultView!.Element)) {
      return;
    }

    const trigger = target.closest<HTMLButtonElement>(triggerSelector);
    const current = this.#items.find((candidate) => candidate.trigger === trigger);
    if (!current) {
      return;
    }

    const nextId = nextAccordionItem(this.#coreItems, current.id, event.key);
    if (nextId === null) {
      return;
    }

    event.preventDefault();
    this.#items.find((candidate) => candidate.id === nextId)?.trigger.focus();
  };

  get #coreItems(): { disabled: boolean; id: string }[] {
    return this.#items.map(({ id, trigger }) => ({ disabled: trigger.disabled, id }));
  }

  get #openIds(): string[] {
    return this.#items.filter(({ trigger }) => trigger.getAttribute('aria-expanded') === 'true').map(({ id }) => id);
  }

  #synchronizePanels(): void {
    for (const { panel, trigger } of this.#items) {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }
  }

  #toggle(item: AccordionItem): void {
    const multiple = this.#root.getAttribute('data-cm-accordion-multiple') === 'true';
    const openItems = toggleAccordionItem(this.#coreItems, this.#openIds, item.id, multiple);

    for (const candidate of this.#items) {
      const open = openItems.includes(candidate.id);
      candidate.trigger.setAttribute('aria-expanded', String(open));
      candidate.panel.hidden = !open;
    }

    dispatchCmEvent<AccordionOpenChangeDetail>(this.#root, 'open-change', { openItems });
  }
}

export const createCmAccordionController: CmControllerFactory = (element) => new CmAccordionController(element);
