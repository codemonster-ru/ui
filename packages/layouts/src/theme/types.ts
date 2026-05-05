import type { VfThemeConfig, VfThemeMode } from '@codemonster-ru/vueforge-core';

export interface VfLayoutTokens {
  shellSidebarWidth: string;
  shellAsideWidth: string;
  shellSidebarCollapsedWidth: string;
  shellHeaderHeight: string;
  viewportHeight: string;
  minWidth: string;
  sizeZero: string;
  sizeOne: string;
  sizeHalf: string;
  sizeFull: string;
  spaceLayoutBase: string;
  spaceLayoutRoomy: string;
  shellAreaPaddingBlock: string;
  shellAreaPaddingInline: string;
  containerMaxWidth: string;
  containerPadding: string;
  sectionInsetDefault: string;
  sectionRadius: string;
  sectionShadow: string;
  gridMinItemWidth: string;
  radiusBase: string;
  borderBase: string;
  surfaceBase: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  surfaceRadius: string;
  surfaceShadow: string;
  shadowOverlay: string;
  appBackground: string;
  headerBackground: string;
  headerBorder: string;
  headerHeight: string;
  headerPaddingBlock: string;
  headerPaddingInline: string;
  subheaderHeight: string;
  subheaderPaddingBlock: string;
  subheaderPaddingInline: string;
  sidebarBackground: string;
  sidebarBorder: string;
  sidebarPaddingBlock: string;
  sidebarPaddingInline: string;
  contentBackground: string;
  contentPaddingBlock: string;
  contentPaddingInline: string;
  contentSubheaderBackground: string;
  contentSubheaderBorder: string;
  contentSubheaderHeight: string;
  contentSubheaderPaddingInline: string;
  asideBackground: string;
  asideBorder: string;
  asidePaddingBlock: string;
  asidePaddingInline: string;
  footerBackground: string;
  footerBorder: string;
  footerPaddingBlock: string;
  footerPaddingInline: string;
  appShellHeaderStickyZIndex: string;
  appShellSubheaderStickyZIndex: string;
  appShellContentSubheaderStickyZIndex: string;
  documentLayoutHeaderStickyZIndex: string;
  documentLayoutSubheaderStickyZIndex: string;
  documentLayoutContentSubheaderStickyZIndex: string;
  documentLayoutEdgeNotchColor: string;
  documentLayoutEdgeNotchWidth: string;
  documentLayoutEdgeNotchHeight: string;
  documentLayoutEdgeNotchOffset: string;
  errorLayoutPaddingBlock: string;
  errorLayoutPanelPadding: string;
  errorLayoutCodeFontSize: string;
  errorLayoutCodeFontWeight: string;
  errorLayoutCodeLineHeight: string;
  errorLayoutCodeLetterSpacing: string;
  errorLayoutTitleFontSize: string;
  errorLayoutTitleLineHeight: string;
  errorLayoutDescriptionColor: string;
  errorLayoutDescriptionLineHeight: string;
}

export interface VfLayoutPreset {
  name?: string;
  tokens: VfLayoutTokens;
  dark?: Partial<VfLayoutTokens>;
}

export interface VfResolvedLayoutPreset {
  name?: string;
  light: VfLayoutTokens;
  dark: VfLayoutTokens;
}

export interface VfLayoutThemeOptions {
  prefix?: string;
  rootSelector?: string;
  darkModeSelector?: string;
  attribute?: string;
  storageKey?: string;
  styleId?: string;
}

export interface VfResolvedLayoutThemeOptions {
  prefix: string;
  rootSelector: string;
  darkModeSelector: string;
  attribute: string;
  storageKey: string;
  styleId: string;
}

export interface VfLayoutThemeConfig {
  preset?: VfLayoutPreset;
  extend?: Partial<VfLayoutTokens>;
  light?: Partial<VfLayoutTokens>;
  dark?: Partial<VfLayoutTokens>;
  options?: VfLayoutThemeOptions;
}

export interface VfResolvedLayoutThemeConfig {
  preset: VfResolvedLayoutPreset;
  options: VfResolvedLayoutThemeOptions;
}

export interface VfVueForgeLayoutsThemeOptions {
  core?: VfThemeConfig;
  layouts?: VfLayoutThemeConfig;
}

export interface VfVueForgeLayoutsOptions {
  theme?: VfLayoutThemeConfig | VfVueForgeLayoutsThemeOptions;
  defaultTheme?: VfThemeMode;
  themeStorageKey?: string;
  themeAttribute?: string;
}
