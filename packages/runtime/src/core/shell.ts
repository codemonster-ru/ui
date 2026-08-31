/**
 * Page-shell state rules, with no DOM and no framework.
 *
 * A layout's state is small — a sidebar is collapsed or not, a mobile drawer is open or not — but
 * it has to cross a platform boundary that scoped slots cannot. The Vue layouts used to hand every
 * slot a scope object holding this state plus five functions to change it; PHP has no equivalent.
 * So the state is expressed as attributes on the layout root, both adapters render it, and a
 * runtime controller flips it. These functions decide what the attributes should say.
 */

export interface CmShellState {
  /** The desktop sidebar is narrowed to icons. */
  readonly sidebarCollapsed: boolean;
  /** The mobile drawer is showing. */
  readonly mobileSidebarOpen: boolean;
}

/** Attribute names the layout root carries, so adapters and the controller agree on one spelling. */
export const cmShellAttributes = Object.freeze({
  mobileSidebarOpen: 'data-cm-mobile-sidebar-open',
  sidebarCollapsed: 'data-cm-sidebar-collapsed',
});

/**
 * Resolves the label a mobile toggle should carry.
 *
 * The label names what pressing it will do, not the state it is in, which is the same rule the
 * password reveal follows.
 */
export function resolveMobileToggleLabel(
  open: boolean,
  labels: { readonly close: string; readonly open: string },
): string {
  return open ? labels.close : labels.open;
}

/**
 * Resolves the state after Escape.
 *
 * Escape closes the mobile drawer and leaves a collapsed sidebar alone: collapsing is a preference
 * a person set, while the drawer is a thing covering the page right now.
 */
export function shellEscapeState(state: CmShellState): CmShellState | null {
  if (!state.mobileSidebarOpen) {
    return null;
  }

  return { ...state, mobileSidebarOpen: false };
}

/** Resolves the state after toggling the desktop sidebar. */
export function toggleShellSidebar(state: CmShellState): CmShellState {
  return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
}

/** Resolves the state after toggling the mobile drawer. */
export function toggleShellMobileSidebar(state: CmShellState): CmShellState {
  return { ...state, mobileSidebarOpen: !state.mobileSidebarOpen };
}
