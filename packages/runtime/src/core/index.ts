/**
 * Framework-free component logic shared by every adapter.
 *
 * Nothing in here touches the DOM, so it is safe to import during server rendering and from a
 * framework component that owns its own markup.
 */
export { nextTabsValue, resolveTabsValue } from './tabs.js';
export type { CmTabsCoreItem, CmTabsDirection } from './tabs.js';
