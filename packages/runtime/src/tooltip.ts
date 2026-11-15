import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
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
    this.#root.addEventListener('pointerenter', this.#handlePointerEnter);
    this.#root.addEventListener('pointerleave', this.#handlePointerLeave);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('focus', this.#handleFocus, true);
    this.#root.removeEventListener('blur', this.#handleBlur, true);
    this.#root.removeEventListener('pointerenter', this.#handlePointerEnter);
    this.#root.removeEventListener('pointerleave', this.#handlePointerLeave);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
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
    const view = this.#root.ownerDocument.defaultView;
    if (
      view &&
      event instanceof view.FocusEvent &&
      event.relatedTarget instanceof view.Node &&
      this.#root.contains(event.relatedTarget)
    )
      return;
    this.#focused = false;
    if (!this.#hovered) this.#close();
  };

  readonly #handlePointerEnter = (): void => {
    this.#hovered = true;
    this.#open();
  };

  readonly #handlePointerLeave = (): void => {
    this.#hovered = false;
    if (!this.#focused) this.#close();
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_) || event.key !== 'Escape') return;
    if (this.#content.hidden && this.#showTimer === undefined) return;
    event.preventDefault();
    event.stopPropagation();
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
    this.#content.hidden = !visible;
    this.#root.classList.toggle('cm-tooltip--visible', visible);
    if (visible) this.#holdFloating();
    else this.#releaseFloating();
  }

  #holdFloating(): void {
    const selector = this.#root.getAttribute('data-cm-tooltip-teleport-to');
    if (!selector || this.#stopFloating) return;

    const document = this.#root.ownerDocument;
    let target: Element | null;
    try {
      target = (selector === 'body' ? this.#root.closest('dialog[open]') : null) ?? document.querySelector(selector);
    } catch {
      return;
    }
    if (!target || this.#root.contains(target)) return;

    const trigger = this.#trigger;
    const content = this.#content;
    const side =
      (['bottom', 'start', 'end'] as const).find((value) => this.#root.classList.contains(`cm-tooltip--${value}`)) ??
      'top';
    const rtl = document.defaultView?.getComputedStyle(trigger).direction === 'rtl';
    const direction = side === 'start' ? (rtl ? 'right' : 'left') : side === 'end' ? (rtl ? 'left' : 'right') : side;
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
    const { left, top } = content.style;
    const origin = document.createComment('tooltip');
    content.before(origin);
    target.append(content);
    content.setAttribute('data-cm-tooltip-floating', '');

    let active = true;
    const place = (): void => {
      void computePosition(trigger, content, {
        placement: direction,
        strategy: 'fixed',
        middleware: [offset(10), flip({ placements: [direction, opposite[direction]] }), shift()],
      }).then(({ placement, x, y }) => {
        if (active) {
          content.setAttribute('data-cm-tooltip-floating', placement);
          content.style.left = `${x}px`;
          content.style.top = `${y}px`;
        }
      });
    };
    const stop = autoUpdate(trigger, place, content);
    this.#stopFloating = () => {
      active = false;
      stop();
      content.removeAttribute('data-cm-tooltip-floating');
      content.style.left = left;
      content.style.top = top;
      if (origin.parentNode) origin.replaceWith(content);
      else content.remove();
    };
    place();
  }

  #releaseFloating(): void {
    this.#stopFloating?.();
    this.#stopFloating = undefined;
  }
}

export const createCmTooltipController: CmControllerFactory = (element) => new CmTooltipController(element);
