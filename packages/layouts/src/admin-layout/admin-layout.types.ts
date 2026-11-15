export interface CmAdminLayoutProps {
  as?: string;
  id?: string;
  fillViewport?: boolean;
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  mobileSidebarOpen?: boolean;
  defaultMobileSidebarOpen?: boolean;
  mobileSidebarOpenLabel?: string;
  mobileSidebarCloseLabel?: string;
}

export interface CmAdminLayoutMobileToggleAttrs {
  'aria-label': string;
  'aria-controls': string;
  'aria-expanded': boolean;
}

export interface CmAdminLayoutExposed {
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

export interface CmAdminLayoutScope extends CmAdminLayoutExposed {
  isSidebarCollapsed: boolean;
  isSidebarCompact: boolean;
  isMobileSidebarOpen: boolean;
}

export interface CmAdminLayoutMobileSidebarScope extends Pick<
  CmAdminLayoutExposed,
  'closeMobileSidebar' | 'openMobileSidebar' | 'toggleMobileSidebar'
> {
  isMobileSidebarOpen: boolean;
  mobileToggleAttrs: CmAdminLayoutMobileToggleAttrs;
}
