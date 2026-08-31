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

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
  }

  get #state(): CmShellState {
    return {
      mobileSidebarOpen: this.#root.getAttribute(cmShellAttributes.mobileSidebarOpen) === 'true',
      sidebarCollapsed: this.#root.getAttribute(cmShellAttributes.sidebarCollapsed) === 'true',
    };
  }

  #commit(next: CmShellState): void {
    this.#root.setAttribute(cmShellAttributes.sidebarCollapsed, String(next.sidebarCollapsed));
    this.#root.setAttribute(cmShellAttributes.mobileSidebarOpen, String(next.mobileSidebarOpen));

    const toggle = this.#root.querySelector<HTMLElement>('[data-cm-mobile-sidebar-toggle]');
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
    if (!Element_ || !(event.target instanceof Element_)) return;

    if (event.target.closest('[data-cm-sidebar-toggle]')) {
      this.#commit(toggleShellSidebar(this.#state));
      return;
    }

    if (
      event.target.closest('[data-cm-mobile-sidebar-toggle]') ||
      event.target.closest('[data-cm-mobile-sidebar-close]')
    ) {
      this.#commit(toggleShellMobileSidebar(this.#state));
    }
  };

  readonly #handleKeydown = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_) || event.key !== 'Escape') return;

    const next = shellEscapeState(this.#state);
    if (next === null) return;

    event.preventDefault();
    this.#commit(next);
  };
}

export const createCmAdminLayoutController: CmControllerFactory = (element) => new CmAdminLayoutController(element);
