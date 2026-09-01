import { cmStickyOffsetProperties, shellStickyOffsets } from './core/shell.js';
import type { CmController, CmControllerFactory } from './runtime.js';

const headerSelector = '[data-cm-sticky-header]';
const subheaderSelector = '[data-cm-sticky-subheader]';

/**
 * Replaces a shell's declared sticky offsets with measured ones.
 *
 * The layout is already correct without this: the server publishes offsets that read from
 * `--cm-layout-header-height`, so the page sticks against the declared height whether or not
 * JavaScript ever arrives. This narrows that to the height the header actually has, which is what a
 * declared value cannot know when the content wraps to a second line.
 *
 * Where `ResizeObserver` is unavailable the regions are measured once on connect, which is still
 * better than the declaration and costs nothing to fall back to.
 */
export class CmShellMetricsController implements CmController {
  readonly #root: Element;
  #observer: ResizeObserver | null = null;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    const view = this.#root.ownerDocument.defaultView;

    if (view && typeof view.ResizeObserver === 'function') {
      this.#observer = new view.ResizeObserver(() => this.#apply());
      for (const region of this.#regions) {
        if (region) this.#observer.observe(region);
      }
    }

    this.#apply();
  }

  disconnect(): void {
    this.#observer?.disconnect();
    this.#observer = null;

    const view = this.#root.ownerDocument.defaultView;
    if (view && this.#root instanceof view.HTMLElement) {
      for (const property of Object.values(cmStickyOffsetProperties)) {
        this.#root.style.removeProperty(property);
      }
    }
  }

  get #regions(): readonly (HTMLElement | null)[] {
    return [
      this.#root.querySelector<HTMLElement>(headerSelector),
      this.#root.querySelector<HTMLElement>(subheaderSelector),
    ];
  }

  #apply(): void {
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(this.#root instanceof view.HTMLElement)) return;

    const [header, subheader] = this.#regions;
    const offsets = shellStickyOffsets({
      hasHeader: header !== null,
      hasSubheader: subheader !== null,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : undefined,
      subheaderHeight: subheader ? Math.round(subheader.getBoundingClientRect().height) : undefined,
    });

    for (const [property, value] of Object.entries(offsets)) {
      this.#root.style.setProperty(property, value);
    }
  }
}

export const createCmShellMetricsController: CmControllerFactory = (element) => new CmShellMetricsController(element);
