import { afterCmFloatingExit, attachCmAnchoredPosition } from './anchored-position.js';
import { cmFocusableSelector, popoverKeyAction, resolveDisclosureOpen } from './core/disclosure.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface PopoverOpenChangeDetail {
  open: boolean;
}

export class CmPopoverController implements CmController {
  readonly #panel: HTMLElement;
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  #stopPlacement?: () => void;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>('.cm-popover__trigger');
    const panel = root.querySelector<HTMLElement>('.cm-popover__panel[role="dialog"]');
    if (!trigger || !panel) throw new TypeError('Popover controller requires a trigger and dialog panel.');
    this.#root = root;
    this.#trigger = trigger;
    this.#panel = panel;
  }

  connect(): void {
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('cm:popover-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('cm:popover-close-request', this.#handleCloseRequest);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
    this.#releasePlacement();
  }

  setOpen(open: boolean, restoreFocus = false): void {
    const next = resolveDisclosureOpen(open, this.#trigger.disabled);
    const changed = this.#panel.hidden === next;
    this.#synchronize(next);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent<PopoverOpenChangeDetail>(this.#root, 'popover-open-change', { open: next });
  }

  readonly #handleClick = (event: Event): void => {
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (!Node_ || !(event.target instanceof Node_) || !this.#trigger.contains(event.target) || this.#trigger.disabled)
      return;
    const opens = this.#panel.hidden;
    this.setOpen(opens);
    if (opens && this.#root.getAttribute('data-cm-popover-focus-on-open') === 'true') this.#focusPanel();
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEventConstructor = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor) || event.defaultPrevented) return;
    const action = popoverKeyAction(event.key, {
      disabled: this.#trigger.disabled,
      onTrigger: event.target === this.#trigger,
      open: !this.#panel.hidden,
    });
    if (!action || (action.type === 'close' && this.#root.getAttribute('data-cm-popover-close-on-escape') === 'false'))
      return;

    event.preventDefault();
    if (action.type === 'close') {
      this.setOpen(false, action.restoreFocus);
      return;
    }
    this.setOpen(true);
    if (action.focus === 'first') this.#focusPanel();
  };

  readonly #handleCloseRequest = (): void => this.setOpen(false, true);

  readonly #handleDocumentClick = (event: Event): void => {
    if (this.#root.getAttribute('data-cm-popover-close-on-outside-click') === 'false') return;
    const NodeConstructor = this.#root.ownerDocument.defaultView?.Node;
    if (!NodeConstructor || !(event.target instanceof NodeConstructor) || this.#root.contains(event.target)) return;
    this.setOpen(false);
  };

  #focusPanel(): void {
    const candidates = [...this.#panel.querySelectorAll<HTMLElement>(cmFocusableSelector)].filter(
      (item) => !item.matches(':disabled') && !item.closest('[hidden], [inert]'),
    );
    const autofocus = candidates.find((item) => item.matches('[autofocus], [data-autofocus]'));
    (autofocus ?? candidates[0] ?? this.#panel).focus();
  }

  #synchronize(open: boolean): void {
    const closing = !open && !this.#panel.hidden;
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#panel.hidden = !open;
    this.#root.classList.toggle('cm-popover--open', open);
    if (open && !this.#stopPlacement) {
      const classes = this.#root.classList;
      const placement = classes.contains('cm-popover--top')
        ? 'top'
        : classes.contains('cm-popover--bottom-end')
          ? 'bottom-end'
          : 'bottom-start';
      this.#stopPlacement = attachCmAnchoredPosition(
        this.#trigger,
        this.#panel,
        placement,
        10,
        this.#panel.parentElement,
      );
    } else if (closing) afterCmFloatingExit(this.#panel, () => this.#releasePlacement());
  }

  #releasePlacement(): void {
    this.#stopPlacement?.();
    this.#stopPlacement = undefined;
  }
}

export const createCmPopoverController: CmControllerFactory = (element) => new CmPopoverController(element);
