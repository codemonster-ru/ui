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
    this.#root.addEventListener('click', this.#handleClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
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
