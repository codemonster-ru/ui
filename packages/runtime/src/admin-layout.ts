import {
  cmShellAttributes,
  resolveMobileToggleLabel,
  shellEscapeState,
  toggleShellMobileSidebar,
  toggleShellSidebar,
  type CmShellState,
} from './core/shell.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';
import { CmShellMetricsController } from './shell-metrics.js';
import { belongsToShell, findShellControl } from './shell-ownership.js';

export interface AdminLayoutStateChangeDetail {
  mobileSidebarOpen: boolean;
  sidebarCollapsed: boolean;
}

/**
 * The layout root carries its state as attributes, so this controller reads them, asks the core
 * what the state becomes, and writes them back. Controls are marked rather than wired: an
 * application tags its own button and this listens for it.
 */
export class CmAdminLayoutController implements CmController {
  readonly #root: Element;
  readonly #metrics: CmShellMetricsController;

  constructor(root: Element) {
    this.#root = root;
    this.#metrics = new CmShellMetricsController(root);
  }

  connect(): void {
    this.#metrics.connect();
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#metrics.disconnect();
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
  }

  get #state(): CmShellState {
    return {
      mobileSidebarOpen: this.#root.getAttribute(cmShellAttributes.mobileSidebarOpen) === 'true',
      sidebarCollapsed: this.#root.getAttribute(cmShellAttributes.sidebarCollapsed) === 'true',
    };
  }

  #commit(next: CmShellState, restoreFocus = false): void {
    const toggle = findShellControl(this.#root, '[data-cm-mobile-sidebar-toggle]');
    if (this.#state.mobileSidebarOpen && !next.mobileSidebarOpen) {
      const drawer = this.#root.querySelector(':scope > .cm-admin-layout__aside');
      if (restoreFocus || drawer?.contains(this.#root.ownerDocument.activeElement))
        toggle?.focus({ preventScroll: true });
    }
    this.#root.setAttribute(cmShellAttributes.sidebarCollapsed, String(next.sidebarCollapsed));
    this.#root.setAttribute(cmShellAttributes.mobileSidebarOpen, String(next.mobileSidebarOpen));

    if (toggle) {
      toggle.setAttribute('aria-expanded', String(next.mobileSidebarOpen));
      const labels = {
        close: toggle.dataset.cmMobileSidebarCloseLabel ?? 'Close navigation',
        open: toggle.dataset.cmMobileSidebarOpenLabel ?? 'Open navigation',
      };
      toggle.setAttribute('aria-label', resolveMobileToggleLabel(next.mobileSidebarOpen, labels));
    }

    dispatchCmEvent<AdminLayoutStateChangeDetail>(this.#root, 'admin-layout-state-change', { ...next });
  }

  readonly #handleClick = (event: Event): void => {
    const Element_ = this.#root.ownerDocument.defaultView?.Element;
    if (!Element_ || !(event.target instanceof Element_) || event.defaultPrevented) return;
    if (!belongsToShell(this.#root, event.target)) return;
    const target = event.target.closest(
      '[data-cm-sidebar-toggle], [data-cm-mobile-sidebar-toggle], [data-cm-mobile-sidebar-close]',
    );
    if (!target || !belongsToShell(this.#root, target)) return;

    const state = this.#state;
    if (target.hasAttribute('data-cm-mobile-sidebar-close')) {
      this.#commit({ ...state, mobileSidebarOpen: false }, true);
    } else if (target.hasAttribute('data-cm-sidebar-toggle')) this.#commit(toggleShellSidebar(state));
    else {
      // Pointer activation does not focus buttons in all engines. Keep Escape scoped to this shell.
      target.closest<HTMLElement>('[data-cm-mobile-sidebar-toggle]')?.focus({ preventScroll: true });
      this.#commit(toggleShellMobileSidebar(state));
    }
  };

  readonly #handleKeydown = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    if (!view || !(event instanceof view.KeyboardEvent) || event.key !== 'Escape' || event.defaultPrevented) return;
    if (!(event.target instanceof view.Element) || !belongsToShell(this.#root, event.target)) return;

    const next = shellEscapeState(this.#state);
    if (next === null) return;

    event.preventDefault();
    this.#commit(next);
  };
}

export const createCmAdminLayoutController: CmControllerFactory = (element) => new CmAdminLayoutController(element);
