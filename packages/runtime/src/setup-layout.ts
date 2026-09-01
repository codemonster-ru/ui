import { shouldEnterAdvance } from './core/shell.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

/**
 * Enter advances the workflow and Escape goes back, except where the focused control needs those
 * keys itself. The core decides that; this describes what has focus and dispatches the result.
 */
export class CmSetupLayoutController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('keydown', this.#handleKeydown);
  }

  readonly #handleKeydown = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(event instanceof view.KeyboardEvent)) return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      dispatchCmEvent(this.#root, 'setup-layout-back', {});
      return;
    }

    if (event.key !== 'Enter' || event.shiftKey) return;

    const target = event.target instanceof view.HTMLElement ? event.target : null;
    const advance = shouldEnterAdvance({
      editable: target?.isContentEditable === true,
      inputType: target instanceof view.HTMLInputElement ? target.type : undefined,
      interactive: Boolean(target?.closest('button,a,[role="button"],[role="link"]')),
      tagName: target?.tagName,
    });
    if (!advance) return;

    event.preventDefault();
    dispatchCmEvent(this.#root, 'setup-layout-next', {});
  };
}

export const createCmSetupLayoutController: CmControllerFactory = (element) => new CmSetupLayoutController(element);
