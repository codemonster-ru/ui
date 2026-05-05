export type VfThemeMode = 'light' | 'dark' | 'system';
export type VfResolvedTheme = 'light' | 'dark';

export interface VfThemeTokens {
  colorBg: string;
  colorSurface: string;
  colorSurfaceMuted: string;
  colorText: string;
  colorMuted: string;
  colorBorder: string;
  colorPrimary: string;
  colorPrimaryContrast: string;
  colorPrimarySoft: string;
  colorPrimaryBorderSoft: string;
  colorFocusRing: string;
  colorSuccess: string;
  colorSuccessContrast: string;
  colorInfo: string;
  colorInfoContrast: string;
  colorWarn: string;
  colorWarnContrast: string;
  colorHelp: string;
  colorHelpContrast: string;
  colorDanger: string;
  colorDangerContrast: string;
  colorContrast: string;
  colorContrastContrast: string;
  colorSuccessSoft: string;
  colorInfoSoft: string;
  colorWarnSoft: string;
  colorHelpSoft: string;
  colorDangerSoft: string;
  colorContrastSoft: string;
  colorSuccessBorderSoft: string;
  colorInfoBorderSoft: string;
  colorWarnBorderSoft: string;
  colorHelpBorderSoft: string;
  colorDangerBorderSoft: string;
  colorContrastBorderSoft: string;
  focusRingWidth: string;
  radius: string;
  radiusControl: string;
  radiusControlTight: string;
  radiusSurface: string;
  radiusOverlay: string;
  breakpointXs: string;
  breakpointSm: string;
  breakpointMd: string;
  breakpointLg: string;
  breakpointXl: string;
  breakpoint2xl: string;
  controlHeightSm: string;
  controlHeightMd: string;
  controlHeightLg: string;
  controlFontSizeSm: string;
  controlFontSizeMd: string;
  controlFontSizeLg: string;
  buttonPaddingSm: string;
  buttonPaddingMd: string;
  buttonPaddingLg: string;
  buttonGap: string;
  fieldPaddingSm: string;
  fieldPaddingMd: string;
  fieldPaddingLg: string;
  checkboxSizeSm: string;
  checkboxSizeMd: string;
  checkboxSizeLg: string;
  selectionGap: string;
  checkboxMarkWidth: string;
  checkboxMarkHeight: string;
  checkboxMarkStrokeWidth: string;
  checkboxMarkOffsetY: string;
  radioDotSize: string;
  switchWidthSm: string;
  switchWidthMd: string;
  switchWidthLg: string;
  switchHeightSm: string;
  switchHeightMd: string;
  switchHeightLg: string;
  switchThumbSizeSm: string;
  switchThumbSizeMd: string;
  switchThumbSizeLg: string;
  switchThumbInset: string;
  textareaMinHeightSm: string;
  textareaMinHeightMd: string;
  textareaMinHeightLg: string;
  overlayPadding: string;
  overlayGap: string;
  overlayViewportPadding: string;
  menuPadding: string;
  menuGap: string;
  menuMinWidth: string;
  surfacePadding: string;
  surfaceGap: string;
  surfacePaddingCompact: string;
  surfaceGapCompact: string;
  sectionPadding: string;
  sectionGap: string;
  tabsGap: string;
  tabsListGap: string;
  tabsListPadding: string;
  tabsTabPaddingInline: string;
  tabsPanelPaddingTop: string;
  navMenuListGap: string;
  navMenuNestedGap: string;
  navMenuCollapseOffsetTop: string;
  navMenuCollapseInsetLevel0Margin: string;
  navMenuCollapseInsetLevel0Padding: string;
  navMenuCollapseInsetSimpleLevel0Margin: string;
  navMenuCollapseInsetSimpleLevel0Padding: string;
  navMenuCollapseInsetDeepMargin: string;
  navMenuCollapseInsetDeepPadding: string;
  navMenuCollapseInsetSimpleDeepMargin: string;
  navMenuCollapseInsetSimpleDeepPadding: string;
  navMenuNodeGroupSpacing: string;
  navMenuGroupPadding: string;
  navMenuGroupFontSize: string;
  navMenuItemPadding: string;
  navMenuItemGap: string;
  navMenuLeadingIconSize: string;
  navMenuLeadingIconColumnSize: string;
  badgeHeight: string;
  badgePadding: string;
  badgeGap: string;
  badgeRadius: string;
  badgeFontSize: string;
  badgeLineHeight: string;
  tagHeight: string;
  tagPadding: string;
  tagFontSize: string;
  tagLineHeight: string;
  tooltipPadding: string;
  tooltipMaxWidth: string;
  tooltipFontSize: string;
  tooltipLineHeight: string;
  dialogWidthSm: string;
  dialogWidthMd: string;
  dialogWidthLg: string;
  dialogMaxHeight: string;
  drawerSizeSm: string;
  drawerSizeMd: string;
  drawerSizeLg: string;
  drawerOffsetTop: string;
  drawerBodyPadding: string;
  dialogTitleFontSize: string;
  dialogHeaderGap: string;
  dialogActionsGap: string;
  popoverWidth: string;
  floatingArrowSize: string;
  overlayBackdrop: string;
  alertPrimarySoft: string;
  alertPrimaryBorderSoft: string;
  alertContentGap: string;
  alertTitleFontSize: string;
  cardTitleFontSize: string;
  panelTitleFontSize: string;
  motionDurationFast: string;
  motionDurationNormal: string;
  motionEaseStandard: string;
  zOverlay: string;
  zDrawer: string;
  zDropdown: string;
  zPopover: string;
  zTooltip: string;
  spacing: string;
  shadow: string;
}

export interface VfThemePreset {
  name?: string;
  tokens: VfThemeTokens;
  dark?: Partial<VfThemeTokens>;
}

export interface VfResolvedThemePreset {
  name?: string;
  light: VfThemeTokens;
  dark: VfThemeTokens;
}

export interface VfThemePresetOptions {
  prefix?: string;
  rootSelector?: string;
  darkModeSelector?: string;
  attribute?: string;
  storageKey?: string;
  styleId?: string;
}

export interface VfResolvedThemePresetOptions {
  prefix: string;
  rootSelector: string;
  darkModeSelector: string;
  attribute: string;
  storageKey: string;
  styleId: string;
}

export interface VfThemeConfig {
  preset?: VfThemePreset;
  extend?: Partial<VfThemeTokens>;
  light?: Partial<VfThemeTokens>;
  dark?: Partial<VfThemeTokens>;
  options?: VfThemePresetOptions;
}

export interface VfResolvedThemeConfig {
  preset: VfResolvedThemePreset;
  options: VfResolvedThemePresetOptions;
}
