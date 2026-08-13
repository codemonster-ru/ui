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
    const enabledTriggers = this.#items
      .filter(({ trigger: candidate }) => !candidate.disabled)
      .map(({ trigger }) => trigger);
    const currentIndex = trigger ? enabledTriggers.indexOf(trigger) : -1;
    if (currentIndex < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const lastIndex = enabledTriggers.length - 1;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : event.key === 'ArrowDown'
            ? (currentIndex + 1) % enabledTriggers.length
            : (currentIndex - 1 + enabledTriggers.length) % enabledTriggers.length;
    enabledTriggers[nextIndex]?.focus();
  };

  #synchronizePanels(): void {
    for (const { panel, trigger } of this.#items) {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }
  }

  #toggle(item: AccordionItem): void {
    const opening = item.trigger.getAttribute('aria-expanded') !== 'true';
    const multiple = this.#root.getAttribute('data-cm-accordion-multiple') === 'true';

    for (const candidate of this.#items) {
      const open =
        candidate === item ? opening : multiple && candidate.trigger.getAttribute('aria-expanded') === 'true';
      candidate.trigger.setAttribute('aria-expanded', String(open));
      candidate.panel.hidden = !open;
    }

    dispatchCmEvent<AccordionOpenChangeDetail>(this.#root, 'open-change', {
      openItems: this.#items
        .filter(({ trigger }) => trigger.getAttribute('aria-expanded') === 'true')
        .map(({ id }) => id),
    });
  }
}

export const createCmAccordionController: CmControllerFactory = (element) => new CmAccordionController(element);
