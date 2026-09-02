/**
 * Page layouts for CodeMonster UI.
 *
 * A layout composes components into a page shell: regions, their geometry, and the state deciding
 * whether a region is shown. That is a different job from a component, which is why it is a
 * different package — see docs/architecture/layout-line-ownership.md.
 *
 * Layout state is expressed as `data-cm-*` attributes on the layout root rather than a slot scope,
 * because a scope is exactly what the Annabel Razor adapter cannot consume. The decisions live in
 * `@codemonster-ru/ui-runtime/core` and both adapters render from them.
 */

export { default as CmAdminShell } from './admin-shell/CmAdminShell.vue';
export type { CmAdminShellProps } from './admin-shell/admin-shell.types';
export { default as CmAppShell } from './app-shell/CmAppShell.vue';
export type { CmAppShellVariant } from './app-shell/app-shell.types';
export { default as CmDocumentLayout } from './document-layout/CmDocumentLayout.vue';
export type { CmDocumentLayoutVariant } from './document-layout/document-layout.types';
export { default as CmAdminLayout } from './admin-layout/CmAdminLayout.vue';
export type { CmAdminLayoutProps } from './admin-layout/admin-layout.types';
export { default as CmSetupLayout } from './setup-layout/CmSetupLayout.vue';
export type { CmSetupLayoutAsidePosition, CmSetupLayoutProps } from './setup-layout/setup-layout.types';
