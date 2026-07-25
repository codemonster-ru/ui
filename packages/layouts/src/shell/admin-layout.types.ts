export interface VfAdminLayoutProps {
  as?: string;
  fillViewport?: boolean;
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  mobileSidebarOpen?: boolean;
  defaultMobileSidebarOpen?: boolean;
  mobileSidebarOpenLabel?: string;
  mobileSidebarCloseLabel?: string;
}

export interface VfAdminLayoutMobileToggleAttrs {
  'aria-label': string;
  'aria-controls': string;
  'aria-expanded': boolean;
}

export interface VfAdminLayoutExposed {
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

export interface VfAdminLayoutScope extends VfAdminLayoutExposed {
  isSidebarCollapsed: boolean;
  isSidebarCompact: boolean;
  isMobileSidebarOpen: boolean;
}

export interface VfAdminLayoutMobileSidebarScope {
  isMobileSidebarOpen: boolean;
  mobileToggleAttrs: VfAdminLayoutMobileToggleAttrs;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}
