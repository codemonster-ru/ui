import { needsScrollEnhancement, resolveAnchorTargetId, resolveScrollTarget } from './core/table-of-contents.js';
import type { CmController, CmControllerFactory } from './runtime.js';

const linkSelector = 'a.cm-table-of-contents__link[href]';

export class CmTableOfContentsController implements CmController {
  readonly #root: Element;
  #initialScroll: number | undefined;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    const view = this.#root.ownerDocument.defaultView;
    if (view && this.#initialScroll === undefined && this.#findInitialTarget()) {
      this.#initialScroll = view.requestAnimationFrame(() => {
        this.#initialScroll = undefined;
        const target = this.#findInitialTarget();
        if (target) this.#scrollTo(target, false);
      });
    }
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#cancelInitialScroll();
  }

  get #smooth(): boolean {
    return this.#root.hasAttribute('data-cm-toc-smooth');
  }

  get #scrollOffset(): number {
    const value = Number(this.#root.getAttribute('data-cm-toc-scroll-offset'));
    return Number.isFinite(value) ? value : 0;
  }

  readonly #handleClick = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(event instanceof view.MouseEvent) || !(event.target instanceof view.Element)) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    if (!needsScrollEnhancement(this.#smooth, this.#scrollOffset)) return;

    const link = event.target.closest<HTMLAnchorElement>(linkSelector);
    if (!link || link.closest('.cm-table-of-contents') !== this.#root || link.hasAttribute('download')) return;
    if (link.target && link.target.toLowerCase() !== '_self') return;
    const href = link.getAttribute('href') ?? '';
    const id = resolveAnchorTargetId(href);
    const target = id ? this.#root.ownerDocument.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    this.#cancelInitialScroll();
    if (view.location.hash !== href) view.history.pushState(null, '', href);
    this.#scrollTo(target, true);
  };

  #findInitialTarget(): HTMLElement | null {
    if (!needsScrollEnhancement(this.#smooth, this.#scrollOffset)) return null;
    const id = resolveAnchorTargetId(this.#root.ownerDocument.defaultView?.location.hash ?? '');
    if (id === null) return null;
    const links = this.#root.querySelectorAll(linkSelector);
    if (![...links].some((link) => resolveAnchorTargetId(link.getAttribute('href') ?? '') === id)) return null;
    return this.#root.ownerDocument.getElementById(id);
  }

  #scrollTo(target: HTMLElement, focus: boolean): void {
    const view = this.#root.ownerDocument.defaultView;
    if (!view) return;
    const reduceMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (focus) target.focus({ preventScroll: true });
    view.scrollTo({
      top: resolveScrollTarget({
        targetTop: target.getBoundingClientRect().top,
        scrollY: view.scrollY,
        scrollOffset: this.#scrollOffset,
      }),
      behavior: reduceMotion ? 'instant' : this.#smooth ? 'smooth' : 'auto',
    });
  }

  #cancelInitialScroll(): void {
    if (this.#initialScroll === undefined) return;
    this.#root.ownerDocument.defaultView?.cancelAnimationFrame(this.#initialScroll);
    this.#initialScroll = undefined;
  }
}

export const createCmTableOfContentsController: CmControllerFactory = (element) =>
  new CmTableOfContentsController(element);
