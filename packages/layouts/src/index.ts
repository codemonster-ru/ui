import './styles.css';

export { default, VueForgeLayouts, createVueForgeLayouts } from './plugin';
export { default as VfContainer } from './primitives/VfContainer.vue';
export { default as VfStack } from './primitives/VfStack.vue';
export { default as VfInline } from './primitives/VfInline.vue';
export { default as VfSection } from './primitives/VfSection.vue';
export { default as VfGrid } from './primitives/VfGrid.vue';

export { default as VfAppShell } from './shell/VfAppShell.vue';
export { default as VfDocumentLayout } from './shell/VfDocumentLayout.vue';
export { default as VfErrorLayout } from './shell/VfErrorLayout.vue';
export { default as VfHeaderArea } from './shell/VfHeaderArea.vue';
export { default as VfSidebarArea } from './shell/VfSidebarArea.vue';
export { default as VfContentArea } from './shell/VfContentArea.vue';
export { default as VfAsideArea } from './shell/VfAsideArea.vue';
export { default as VfFooterArea } from './shell/VfFooterArea.vue';
export {
  applyLayoutsThemeConfig,
  createLayoutsPreset,
  defaultLayoutsPreset,
  layoutsPresetToCssText,
  layoutsTokensToCssVars,
  resolveLayoutsPreset,
  resolveLayoutsThemeConfig,
  resolveLayoutsThemeOptions,
} from './theme/public';
export type {
  VfLayoutPreset,
  VfLayoutThemeConfig,
  VfLayoutThemeOptions,
  VfLayoutTokens,
  VfVueForgeLayoutsOptions,
  VfVueForgeLayoutsThemeOptions,
  VfResolvedLayoutPreset,
  VfResolvedLayoutThemeConfig,
  VfResolvedLayoutThemeOptions,
} from './theme/public';
export {
  vfBreakpoints,
  toMinWidthQuery,
  toMaxWidthQuery,
  useBreakpoint,
  useBreakpoints,
  useBreakpointValue,
} from '@codemonster-ru/vueforge-core/foundation';
