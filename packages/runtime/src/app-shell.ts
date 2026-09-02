import { cmShellAttributes, toggleShellSidebar, type CmShellState } from './core/shell.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface AppShellStateChangeDetail {
  sidebarCollapsed: boolean;
}

/**
 * Collapses and expands an application shell's sidebar.
 *
 * Only the sidebar lives here. Measuring the sticky regions is `CmShellMetricsController`, which the
 * same element also names: the two are separate because a document layout needs the measurement and
 * has no sidebar, and pairing them would have forced one of the pair on a layout that cannot use it.
 */
export class CmAppShellController implements CmController {
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

  get #state(): CmShellState {
    return {
      mobileSidebarOpen: false,
      sidebarCollapsed: this.#root.getAttribute(cmShellAttributes.sidebarCollapsed) === 'true',
    };
  }

  readonly #handleClick = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    const origin = view && event.target instanceof view.Element ? event.target : null;
    const target = origin?.closest('[data-cm-sidebar-toggle]') ?? null;
    if (!target || !this.#root.contains(target)) return;

    const next = toggleShellSidebar(this.#state);
    this.#root.setAttribute(cmShellAttributes.sidebarCollapsed, String(next.sidebarCollapsed));

    const toggle = this.#root.querySelector('[data-cm-sidebar-toggle]');
    toggle?.setAttribute('aria-expanded', String(!next.sidebarCollapsed));

    dispatchCmEvent<AppShellStateChangeDetail>(this.#root, 'app-shell-state-change', {
      sidebarCollapsed: next.sidebarCollapsed,
    });
  };
}

export const createCmAppShellController: CmControllerFactory = (element) => new CmAppShellController(element);
