import { afterCmFloatingExit, observeCmAnchoredPosition, resolveCmAnchoredTarget } from './anchored-position.js';
import { resolveTooltipDelay } from './core/disclosure.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export class CmTooltipController implements CmController {
  readonly #content: HTMLElement;
  readonly #root: Element;
  readonly #trigger: HTMLElement;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hovered = false;
  #focused = false;
  #stopFloating: (() => void) | undefined;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLElement>('.cm-tooltip__trigger');
    const content = root.querySelector<HTMLElement>('.cm-tooltip__content[role="tooltip"]');
    if (!trigger || !content) throw new TypeError('Tooltip controller requires a trigger and tooltip content.');
    this.#root = root;
    this.#trigger = trigger;
    this.#content = content;
  }

  connect(): void {
    this.#synchronize(!this.#content.hidden);
    this.#root.addEventListener('focus', this.#handleFocus, true);
    this.#root.addEventListener('blur', this.#handleBlur, true);
    for (const element of [this.#root, this.#content]) {
      element.addEventListener('pointerenter', this.#handlePointerEnter);
      element.addEventListener('pointerleave', this.#handlePointerLeave);
    }
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('focus', this.#handleFocus, true);
    this.#root.removeEventListener('blur', this.#handleBlur, true);
    for (const element of [this.#root, this.#content]) {
      element.removeEventListener('pointerenter', this.#handlePointerEnter);
      element.removeEventListener('pointerleave', this.#handlePointerLeave);
    }
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.ownerDocument.removeEventListener('keydown', this.#handleKeydown, true);
    this.#clearTimer();
    this.#releaseFloating();
    this.#hovered = false;
    this.#focused = false;
  }

  readonly #handleFocus = (): void => {
    this.#focused = true;
    this.#open();
  };

  readonly #handleBlur = (event: Event): void => {
    const { relatedTarget } = event as FocusEvent;
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (Node_ && relatedTarget instanceof Node_ && this.#root.contains(relatedTarget)) return;
    this.#focused = false;
    if (!this.#hovered) this.#close();
  };

  readonly #handlePointerEnter = (): void => {
    if (this.#hovered) return;
    this.#hovered = true;
    this.#root.ownerDocument.addEventListener('keydown', this.#handleKeydown, true);
    this.#open();
  };

  readonly #handlePointerLeave = (event: Event): void => {
    const { relatedTarget } = event as PointerEvent;
    const Node_ = this.#root.ownerDocument.defaultView?.Node;
    if (
      Node_ &&
      relatedTarget instanceof Node_ &&
      (this.#root.contains(relatedTarget) || this.#content.contains(relatedTarget))
    )
      return;
    this.#hovered = false;
    this.#root.ownerDocument.removeEventListener('keydown', this.#handleKeydown, true);
    if (!this.#focused) this.#close();
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_) || event.key !== 'Escape' || event.isComposing) return;
    if (event.currentTarget === this.#root) {
      if (this.#content.hidden && this.#showTimer === undefined) return;
      event.preventDefault();
      event.stopPropagation();
    } else if (this.#content.hidden || event.composedPath().includes(this.#root)) return;
    this.#close();
  };

  #open(): void {
    if (!this.#content.hidden || this.#showTimer !== undefined) return;
    const classes = this.#root.classList;
    const named = classes.contains('cm-tooltip--delay-long')
      ? 'long'
      : classes.contains('cm-tooltip--delay-none')
        ? 'none'
        : 'short';
    const custom = this.#root.getAttribute('data-cm-tooltip-open-delay');
    const delay = resolveTooltipDelay(named, custom?.trim() ? Number(custom) : undefined);
    if (delay === 0) {
      this.#synchronize(true);
      return;
    }
    this.#showTimer = setTimeout(() => {
      this.#showTimer = undefined;
      this.#synchronize(true);
    }, delay);
  }

  #close(): void {
    this.#clearTimer();
    this.#synchronize(false);
  }

  #clearTimer(): void {
    if (this.#showTimer !== undefined) clearTimeout(this.#showTimer);
    this.#showTimer = undefined;
  }

  #synchronize(visible: boolean): void {
    const closing = !visible && !this.#content.hidden;
    this.#content.hidden = !visible;
    this.#root.classList.toggle('cm-tooltip--visible', visible);
    if (visible) this.#holdFloating();
    else if (closing) afterCmFloatingExit(this.#content, () => this.#releaseFloating());
  }

  #holdFloating(): void {
    if (this.#stopFloating) return;
    const target = resolveCmAnchoredTarget(this.#root, this.#root.getAttribute('data-cm-tooltip-teleport-to'));

    const document = this.#root.ownerDocument;
    const trigger = this.#trigger;
    const content = this.#content;
    const classes = this.#root.classList;
    const rtl = document.defaultView?.getComputedStyle(trigger).direction === 'rtl';
    let direction: 'bottom' | 'left' | 'right' | 'top' = 'top';
    if (classes.contains('cm-tooltip--bottom')) direction = 'bottom';
    else if (classes.contains('cm-tooltip--start')) direction = rtl ? 'right' : 'left';
    else if (classes.contains('cm-tooltip--end')) direction = rtl ? 'left' : 'right';
    const { left, top } = content.style;
    const attribute = target ? 'data-cm-tooltip-floating' : 'data-cm-tooltip-inline';
    const container = target ? null : content.parentElement;
    const origin = target ? document.createComment('tooltip') : null;
    if (target && origin) {
      content.before(origin);
      target.append(content);
      content.setAttribute(attribute, '');
    }

    const stop = observeCmAnchoredPosition(trigger, content, direction, 10, container, (style, placement) => {
      content.setAttribute(attribute, placement);
      content.style.left = style.left;
      content.style.top = style.top;
    });
    this.#stopFloating = () => {
      stop();
      content.removeAttribute(attribute);
      content.style.left = left;
      content.style.top = top;
      if (origin) {
        if (origin.parentNode) origin.replaceWith(content);
        else content.remove();
      }
    };
  }

  #releaseFloating(): void {
    this.#stopFloating?.();
    this.#stopFloating = undefined;
  }
}

export const createCmTooltipController: CmControllerFactory = (element) => new CmTooltipController(element);
