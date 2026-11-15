import { nextTabsValue, resolveTabsValue } from './core/tabs.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface TabsValueChangeDetail {
  value: string;
}

interface TabEntry {
  tab: HTMLButtonElement;
  value: string;
}

const tabSelector = '.cm-tabs__tab[role="tab"]';

function panelFor(root: Element, tab: HTMLButtonElement): HTMLElement | null {
  const panelId = tab.getAttribute('aria-controls');
  const panel = panelId ? root.ownerDocument.getElementById(panelId) : null;
  return panel?.getAttribute('role') === 'tabpanel' && (root.contains(panel) || tab.hasAttribute('data-cm-tab-value'))
    ? panel
    : null;
}

function entries(root: Element): TabEntry[] {
  return [...root.querySelectorAll<HTMLButtonElement>(tabSelector)].flatMap((tab) => {
    const owner = tab.closest('[data-cm-controller~="tabs"]');
    if (owner && owner !== root) return [];
    const explicit = tab.dataset.cmTabValue;
    if (explicit) return [{ tab, value: explicit }];
    const value = panelFor(root, tab)?.id.match(/-panel-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/u)?.[1];
    return value ? [{ tab, value }] : [];
  });
}

export class CmTabsController implements CmController {
  readonly #root: Element;
  #entries: TabEntry[] = [];

  get #coreItems(): { disabled: boolean; value: string }[] {
    return this.#entries.map(({ tab, value }) => ({ disabled: tab.disabled, value }));
  }

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#entries = entries(this.#root);
    const active = resolveTabsValue(this.#coreItems, this.#root.getAttribute('data-cm-tabs-value'));
    if (active !== null) this.#synchronize(active);
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#entries = [];
  }

  readonly #handleClick = (event: Event): void => {
    const tab = this.#tabFromEvent(event);
    const entry = this.#entries.find((candidate) => candidate.tab === tab);
    if (entry && !entry.tab.disabled) this.#select(entry, false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor)) return;

    const tab = this.#tabFromEvent(event);
    const current = this.#entries.find((entry) => entry.tab === tab);
    if (!current) return;

    const direction =
      this.#root.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ??
      this.#root.ownerDocument.documentElement.getAttribute('dir')?.toLowerCase();
    const nextValue = nextTabsValue(this.#coreItems, current.value, event.key, direction === 'rtl' ? 'rtl' : 'ltr');
    if (nextValue === null) return;

    event.preventDefault();
    const next = this.#entries.find((entry) => entry.value === nextValue);
    if (next) this.#select(next, true);
  };

  #tabFromEvent(event: Event): HTMLButtonElement | null {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) return null;
    const tab = event.target.closest<HTMLButtonElement>(tabSelector);
    return tab && this.#root.contains(tab) ? tab : null;
  }

  #select(entry: TabEntry, focus: boolean): void {
    const changed = this.#root.getAttribute('data-cm-tabs-value') !== entry.value;
    this.#synchronize(entry.value);
    if (focus) entry.tab.focus();
    if (changed) dispatchCmEvent<TabsValueChangeDetail>(this.#root, 'tabs-value-change', { value: entry.value });
  }

  #synchronize(value: string): void {
    this.#root.setAttribute('data-cm-tabs-value', value);
    for (const entry of this.#entries) {
      const active = !entry.tab.disabled && entry.value === value;
      entry.tab.setAttribute('aria-selected', String(active));
      entry.tab.tabIndex = active ? 0 : -1;
      const panel = panelFor(this.#root, entry.tab);
      if (panel) panel.hidden = !active;
    }
  }
}

export const createCmTabsController: CmControllerFactory = (element) => new CmTabsController(element);
