import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface GroupBoxCollapsedChangeDetail {
  collapsed: boolean;
}

export class CmGroupBoxController implements CmController {
  readonly #root: HTMLFieldSetElement;
  readonly #trigger: HTMLButtonElement;
  readonly #content: HTMLElement;

  constructor(root: Element) {
    const Fieldset = root.ownerDocument.defaultView?.HTMLFieldSetElement;
    const trigger = root.querySelector<HTMLButtonElement>(':scope > .cm-group-box__legend > .cm-group-box__trigger');
    const content = root.querySelector<HTMLElement>(':scope > .cm-group-box__content');
    if (!Fieldset || !(root instanceof Fieldset) || !trigger || !content) {
      throw new TypeError('GroupBox requires a fieldset with a legend trigger and a content region.');
    }
    this.#root = root;
    this.#trigger = trigger;
    this.#content = content;
  }

  connect(): void {
    this.#setCollapsed(this.#content.hidden);
    this.#trigger.addEventListener('click', this.#handleClick);
  }

  disconnect(): void {
    this.#trigger.removeEventListener('click', this.#handleClick);
  }

  readonly #handleClick = (): void => {
    if (this.#trigger.matches(':disabled')) return;
    const collapsed = !this.#content.hidden;
    this.#setCollapsed(collapsed);
    dispatchCmEvent<GroupBoxCollapsedChangeDetail>(this.#root, 'group-box-collapsed-change', { collapsed });
  };

  #setCollapsed(collapsed: boolean): void {
    this.#root.classList.toggle('cm-group-box--collapsed', collapsed);
    // A disabled fieldset omits its controls from validation and submission. The first legend
    // stays active, so the disclosure button still opens the group.
    this.#root.disabled = collapsed;
    this.#trigger.setAttribute('aria-expanded', String(!collapsed));
    this.#content.hidden = collapsed;
  }
}

export const createCmGroupBoxController: CmControllerFactory = (element) => new CmGroupBoxController(element);
