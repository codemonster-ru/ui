/**
 * Page layouts for CodeMonster UI.
 *
 * A layout composes components into a page shell: regions, their geometry, and the state deciding
 * whether a region is shown. That is a different job from a component, which is why it is a
 * different package — see docs/architecture/layout-line-ownership.md.
 *
 * Layout state is expressed as `data-cm-*` attributes for shared styles and exposed to Vue
 * consumers through scoped slots. State rules shared by both platforms live in
 * `@codemonster-ru/ui-runtime/core`.
 */

export { default as CmAdminShell, default as VfAdminShell } from './admin-shell/CmAdminShell.vue';
export type { CmAdminShellProps } from './admin-shell/admin-shell.types';
export { default as CmAppShell, default as VfAppShell } from './app-shell/CmAppShell.vue';
export type {
  CmAppShellExposed,
  CmAppShellProps,
  CmAppShellScope,
  CmAppShellVariant,
} from './app-shell/app-shell.types';
export { default as CmDocumentLayout, default as VfDocumentLayout } from './document-layout/CmDocumentLayout.vue';
export type { CmDocumentLayoutProps, CmDocumentLayoutVariant } from './document-layout/document-layout.types';
export { default as CmAdminLayout, default as VfAdminLayout } from './admin-layout/CmAdminLayout.vue';
export type {
  CmAdminLayoutExposed,
  CmAdminLayoutMobileSidebarScope,
  CmAdminLayoutMobileToggleAttrs,
  CmAdminLayoutProps,
  CmAdminLayoutScope,
  CmAdminLayoutExposed as VfAdminLayoutExposed,
  CmAdminLayoutMobileSidebarScope as VfAdminLayoutMobileSidebarScope,
  CmAdminLayoutMobileToggleAttrs as VfAdminLayoutMobileToggleAttrs,
  CmAdminLayoutProps as VfAdminLayoutProps,
  CmAdminLayoutScope as VfAdminLayoutScope,
} from './admin-layout/admin-layout.types';
export { default as CmSetupLayout, default as VfSetupLayout } from './setup-layout/CmSetupLayout.vue';
export type { CmSetupLayoutAsidePosition, CmSetupLayoutProps } from './setup-layout/setup-layout.types';

export { default as CmAuthLayout, default as VfAuthLayout } from './page-layouts/CmAuthLayout.vue';
export { default as CmErrorLayout, default as VfErrorLayout } from './page-layouts/CmErrorLayout.vue';
export type { CmAuthLayoutProps, CmErrorLayoutProps } from './page-layouts/page-layout.types';

export { default as CmHeaderArea, default as VfHeaderArea } from './areas/CmHeaderArea.vue';
export { default as CmSidebarArea, default as VfSidebarArea } from './areas/CmSidebarArea.vue';
export { default as CmContentArea, default as VfContentArea } from './areas/CmContentArea.vue';
export { default as CmAsideArea, default as VfAsideArea } from './areas/CmAsideArea.vue';
export { default as CmFooterArea, default as VfFooterArea } from './areas/CmFooterArea.vue';
