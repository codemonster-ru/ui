import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';
import { toggleBranchValue, type CmTreeCoreItem } from './core/tree.js';

export interface NavMenuExpandedChangeDetail {
  expandedValues: string[];
}

const branchSelector = '[data-cm-nav-menu-branch]';

export class CmNavMenuController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
  }

  /**
   * Rebuilds the tree from the rendered markup. A collapsed branch stays in the DOM, which is what
   * makes this possible at all — the controller never has to know what it cannot see.
   */
  #tree(list: Element | null = this.#root.querySelector('.cm-nav-menu__list')): CmTreeCoreItem[] {
    if (!list) return [];

    return [...list.children]
      .filter((node): node is HTMLElement => node instanceof this.#root.ownerDocument.defaultView!.HTMLElement)
      .map((node) => {
        const branch = node.querySelector<HTMLElement>(':scope > [data-cm-nav-menu-branch]');
        const leaf = node.querySelector<HTMLElement>(':scope > [data-cm-nav-menu-value]');
        const nested = node.querySelector<HTMLElement>(':scope > .cm-nav-menu__collapse > .cm-nav-menu__list');
        return {
          children: nested ? this.#tree(nested) : [],
          value: branch?.dataset.cmNavMenuBranch ?? leaf?.dataset.cmNavMenuValue ?? '',
        };
      })
      .filter((item) => item.value !== '');
  }

  get #expanded(): string[] {
    return [...this.#root.querySelectorAll<HTMLElement>(branchSelector)]
      .filter((branch) => branch.getAttribute('aria-expanded') === 'true')
      .map((branch) => branch.dataset.cmNavMenuBranch ?? '');
  }

  readonly #handleClick = (event: Event): void => {
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(event.target instanceof Element_)) return;

    const branch = event.target.closest<HTMLElement>(branchSelector);
    if (!branch || !this.#root.contains(branch)) return;

    const value = branch.dataset.cmNavMenuBranch ?? '';
    const mode = this.#root.getAttribute('data-cm-nav-menu-expand-mode') === 'single' ? 'single' : 'multiple';
    const expanded = toggleBranchValue(this.#tree(), this.#expanded, value, mode);

    for (const candidate of this.#root.querySelectorAll<HTMLElement>(branchSelector)) {
      const open = expanded.includes(candidate.dataset.cmNavMenuBranch ?? '');
      candidate.setAttribute('aria-expanded', String(open));
      candidate.classList.toggle('cm-nav-menu__item--expanded', open);
      candidate.closest('.cm-nav-menu__node')?.classList.toggle('cm-nav-menu__node--expanded', open);
    }

    dispatchCmEvent<NavMenuExpandedChangeDetail>(this.#root, 'nav-menu-expanded-change', {
      expandedValues: expanded,
    });
  };
}

export const createCmNavMenuController: CmControllerFactory = (element) => new CmNavMenuController(element);
