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

export { default as CmAdminShell } from './admin-shell/CmAdminShell.vue';
export type { CmAdminShellProps } from './admin-shell/admin-shell.types';
export { default as CmAppShell } from './app-shell/CmAppShell.vue';
export type {
  CmAppShellExposed,
  CmAppShellProps,
  CmAppShellScope,
  CmAppShellVariant,
} from './app-shell/app-shell.types';
export { default as CmDocumentLayout } from './document-layout/CmDocumentLayout.vue';
export type { CmDocumentLayoutProps, CmDocumentLayoutVariant } from './document-layout/document-layout.types';
export { default as CmAdminLayout } from './admin-layout/CmAdminLayout.vue';
export type {
  CmAdminLayoutExposed,
  CmAdminLayoutMobileSidebarScope,
  CmAdminLayoutMobileToggleAttrs,
  CmAdminLayoutProps,
  CmAdminLayoutScope,
} from './admin-layout/admin-layout.types';
export { default as CmSetupLayout } from './setup-layout/CmSetupLayout.vue';
export type { CmSetupLayoutAsidePosition, CmSetupLayoutProps } from './setup-layout/setup-layout.types';
