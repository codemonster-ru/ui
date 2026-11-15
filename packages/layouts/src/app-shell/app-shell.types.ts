export type CmAppShellVariant = 'content' | 'sidebar-content' | 'sidebar-content-aside';

export interface CmAppShellProps {
  as?: string;
  layout?: CmAppShellVariant;
  fillViewport?: boolean;
  showSubheader?: boolean;
  showContentSubheader?: boolean;
  stickyHeader?: boolean;
  stickySidebar?: boolean;
  stickyAside?: boolean;
  sidebarAppearance?: 'default' | 'plain';
  asideAppearance?: 'default' | 'plain';
  contentAppearance?: 'default' | 'plain';
  contentPadded?: boolean;
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
}

export interface CmAppShellExposed {
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export interface CmAppShellScope extends CmAppShellExposed {
  isSidebarCollapsed: boolean;
}

export const cmAppShellVariants: readonly CmAppShellVariant[] = ['content', 'sidebar-content', 'sidebar-content-aside'];
