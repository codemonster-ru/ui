import { vfPrimitiveColorTokenNames, vfSemanticColorTokenNames } from '../../../theme/src/color-token-contract';
import { serializeThemeTokensToCssVars } from '../../../theme/src/css-vars';
import type { VfPrimitiveColorTokenName, VfSemanticColorTokenName } from '../../../theme/src/color-token-contract';

export const LEGACY_THEME_TOKEN_COUNT = 847;
export const LEGACY_DARK_OVERRIDE_COUNT = 53;
export const PRIMITIVE_COLOR_TOKEN_COUNT = 66;
export const SEMANTIC_COLOR_TOKEN_COUNT = 85;
export const ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT = 84;
export const COMPLETE_THEME_TOKEN_COUNT = 997;
export const COMPLETE_DARK_OVERRIDE_COUNT = LEGACY_DARK_OVERRIDE_COUNT + ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT;
export const MAX_CANONICAL_ALIAS_DEPTH = 5;
export const MAX_CUSTOM_PREFIX_ALIAS_DEPTH = 11;

export const primitiveColorTokens = {
  paletteNeutral0: 'oklch(99.5% 0.002 260)',
  paletteNeutral50: 'oklch(97.8% 0.005 260)',
  paletteNeutral100: 'oklch(95.8% 0.007 260)',
  paletteNeutral200: 'oklch(90% 0.012 260)',
  paletteNeutral250: 'oklch(84% 0.016 260)',
  paletteNeutral300: 'oklch(74.5% 0.020 260)',
  paletteNeutral400: 'oklch(65% 0.026 260)',
  paletteNeutral500: 'oklch(55% 0.032 260)',
  paletteNeutral600: 'oklch(48.8% 0.030 260)',
  paletteNeutral700: 'oklch(40.5% 0.025 260)',
  paletteNeutral750: 'oklch(33% 0.020 260)',
  paletteNeutral800: 'oklch(29% 0.018 260)',
  paletteNeutral850: 'oklch(25.6% 0.014 260)',
  paletteNeutral900: 'oklch(21.4% 0.010 260)',
  paletteNeutral950: 'oklch(16.5% 0.008 260)',
  paletteNeutral1000: 'oklch(11.5% 0.006 260)',
  palettePrimary100: 'oklch(95.5% 0.020 247)',
  palettePrimary200: 'oklch(89% 0.050 247)',
  palettePrimary300: 'oklch(76% 0.110 247)',
  palettePrimary400: 'oklch(65% 0.140 247)',
  palettePrimary500: 'oklch(55.7% 0.144 247)',
  palettePrimary600: 'oklch(50% 0.130 247)',
  palettePrimary700: 'oklch(45% 0.115 247)',
  palettePrimary800: 'oklch(38.5% 0.090 247)',
  palettePrimary900: 'oklch(30.5% 0.055 247)',
  paletteSuccess100: 'oklch(95.5% 0.020 148)',
  paletteSuccess300: 'oklch(79% 0.125 148)',
  paletteSuccess400: 'oklch(68% 0.145 148)',
  paletteSuccess500: 'oklch(59% 0.135 148)',
  paletteSuccess600: 'oklch(51.5% 0.115 148)',
  paletteSuccess700: 'oklch(45.5% 0.105 148)',
  paletteSuccess800: 'oklch(38.5% 0.080 148)',
  paletteSuccess900: 'oklch(30.5% 0.040 148)',
  paletteInfo100: 'oklch(95.5% 0.018 230)',
  paletteInfo300: 'oklch(78.5% 0.105 230)',
  paletteInfo400: 'oklch(68% 0.130 230)',
  paletteInfo500: 'oklch(60% 0.118 230)',
  paletteInfo600: 'oklch(52.5% 0.103 230)',
  paletteInfo700: 'oklch(46.5% 0.091 230)',
  paletteInfo800: 'oklch(39.5% 0.075 230)',
  paletteInfo900: 'oklch(30.5% 0.038 230)',
  paletteWarning100: 'oklch(96% 0.035 88)',
  paletteWarning300: 'oklch(81.5% 0.115 88)',
  paletteWarning400: 'oklch(76% 0.130 88)',
  paletteWarning500: 'oklch(68.5% 0.125 88)',
  paletteWarning600: 'oklch(61.5% 0.115 88)',
  paletteWarning700: 'oklch(54% 0.105 88)',
  paletteWarning800: 'oklch(47.5% 0.095 88)',
  paletteWarning900: 'oklch(31.5% 0.035 88)',
  paletteWarning950: 'oklch(21.5% 0.043 88)',
  paletteDanger100: 'oklch(95.5% 0.020 20)',
  paletteDanger300: 'oklch(76% 0.142 20)',
  paletteDanger400: 'oklch(66.5% 0.180 20)',
  paletteDanger500: 'oklch(60.5% 0.180 20)',
  paletteDanger600: 'oklch(53.5% 0.170 20)',
  paletteDanger700: 'oklch(47.5% 0.150 20)',
  paletteDanger800: 'oklch(40.5% 0.120 20)',
  paletteDanger900: 'oklch(30% 0.050 20)',
  paletteHelp100: 'oklch(95.5% 0.020 307)',
  paletteHelp300: 'oklch(77% 0.115 307)',
  paletteHelp400: 'oklch(67% 0.145 307)',
  paletteHelp500: 'oklch(60% 0.150 307)',
  paletteHelp600: 'oklch(52% 0.130 307)',
  paletteHelp700: 'oklch(44.5% 0.115 307)',
  paletteHelp800: 'oklch(38% 0.090 307)',
  paletteHelp900: 'oklch(29.5% 0.045 307)',
} as const satisfies Record<VfPrimitiveColorTokenName, string>;

export const legacyLightColorTokens = {
  colorBg: 'var(--vf-palette-neutral-50)',
  colorSurface: 'var(--vf-palette-neutral-0)',
  colorSurfaceMuted: 'var(--vf-palette-neutral-100)',
  colorText: 'var(--vf-palette-neutral-850)',
  colorMuted: 'var(--vf-palette-neutral-500)',
  colorBorder: 'var(--vf-palette-neutral-250)',
  colorPrimary: 'var(--vf-palette-primary-600)',
  colorPrimaryContrast: 'var(--vf-palette-neutral-0)',
  colorPrimarySoft: 'var(--vf-palette-primary-100)',
  colorPrimaryBorderSoft: 'var(--vf-palette-primary-500)',
  colorFocusRing: 'var(--vf-palette-primary-600)',
  colorSuccess: 'var(--vf-palette-success-600)',
  colorSuccessContrast: 'var(--vf-palette-neutral-0)',
  colorInfo: 'var(--vf-palette-info-600)',
  colorInfoContrast: 'var(--vf-palette-neutral-0)',
  colorWarn: 'var(--vf-palette-warning-400)',
  colorWarnContrast: 'var(--vf-palette-warning-950)',
  colorHelp: 'var(--vf-palette-help-600)',
  colorHelpContrast: 'var(--vf-palette-neutral-0)',
  colorDanger: 'var(--vf-palette-danger-600)',
  colorDangerContrast: 'var(--vf-palette-neutral-0)',
  colorContrast: 'var(--vf-palette-neutral-850)',
  colorContrastContrast: 'var(--vf-palette-neutral-0)',
  colorSuccessSoft: 'var(--vf-palette-success-100)',
  colorInfoSoft: 'var(--vf-palette-info-100)',
  colorWarnSoft: 'var(--vf-palette-warning-100)',
  colorHelpSoft: 'var(--vf-palette-help-100)',
  colorDangerSoft: 'var(--vf-palette-danger-100)',
  colorContrastSoft: 'var(--vf-palette-neutral-100)',
  colorSuccessBorderSoft: 'var(--vf-palette-success-500)',
  colorInfoBorderSoft: 'var(--vf-palette-info-500)',
  colorWarnBorderSoft: 'var(--vf-palette-warning-700)',
  colorHelpBorderSoft: 'var(--vf-palette-help-500)',
  colorDangerBorderSoft: 'var(--vf-palette-danger-500)',
  colorContrastBorderSoft: 'var(--vf-palette-neutral-500)',
  overlayBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 44%, transparent)',
} as const;

export const legacyDarkColorTokens = {
  ...legacyLightColorTokens,
  colorBg: 'var(--vf-palette-neutral-900)',
  colorSurface: 'var(--vf-palette-neutral-850)',
  colorSurfaceMuted: 'var(--vf-palette-neutral-800)',
  colorText: 'var(--vf-palette-neutral-200)',
  colorMuted: 'var(--vf-palette-neutral-400)',
  colorBorder: 'var(--vf-palette-neutral-600)',
  colorPrimary: 'var(--vf-palette-primary-500)',
  colorPrimaryContrast: 'var(--vf-palette-neutral-0)',
  colorPrimarySoft: 'var(--vf-palette-primary-900)',
  colorPrimaryBorderSoft: 'var(--vf-palette-primary-400)',
  colorFocusRing: 'var(--vf-palette-primary-300)',
  colorSuccess: 'var(--vf-palette-success-500)',
  colorSuccessContrast: 'var(--vf-palette-neutral-950)',
  colorInfo: 'var(--vf-palette-info-500)',
  colorInfoContrast: 'var(--vf-palette-neutral-950)',
  colorWarn: 'var(--vf-palette-warning-500)',
  colorHelp: 'var(--vf-palette-help-500)',
  colorHelpContrast: 'var(--vf-palette-neutral-950)',
  colorDanger: 'var(--vf-palette-danger-500)',
  colorDangerContrast: 'var(--vf-palette-neutral-950)',
  colorContrast: 'var(--vf-palette-neutral-200)',
  colorContrastContrast: 'var(--vf-palette-neutral-950)',
  colorSuccessSoft: 'var(--vf-palette-success-900)',
  colorInfoSoft: 'var(--vf-palette-info-900)',
  colorWarnSoft: 'var(--vf-palette-warning-900)',
  colorHelpSoft: 'var(--vf-palette-help-900)',
  colorDangerSoft: 'var(--vf-palette-danger-900)',
  colorContrastSoft: 'var(--vf-palette-neutral-800)',
  colorSuccessBorderSoft: 'var(--vf-palette-success-400)',
  colorInfoBorderSoft: 'var(--vf-palette-info-400)',
  colorWarnBorderSoft: 'var(--vf-palette-warning-400)',
  colorHelpBorderSoft: 'var(--vf-palette-help-400)',
  colorDangerBorderSoft: 'var(--vf-palette-danger-400)',
  colorContrastBorderSoft: 'var(--vf-palette-neutral-400)',
  overlayBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 56%, transparent)',
} as const satisfies Record<keyof typeof legacyLightColorTokens, string>;

export const semanticLightColorTokens = {
  colorBackgroundCanvas: 'var(--vf-color-bg)',
  colorBackgroundSurface: 'var(--vf-color-surface)',
  colorBackgroundSurfaceSubtle: 'var(--vf-color-surface-muted)',
  colorBackgroundSurfaceElevated: 'var(--vf-color-surface)',
  colorBackgroundSurfaceHover: 'var(--vf-color-surface-muted)',
  colorBackgroundSurfaceActive: 'var(--vf-palette-neutral-200)',
  colorBackgroundSurfaceSelected: 'var(--vf-palette-primary-100)',
  colorBackgroundSurfaceSelectedHover: 'var(--vf-palette-primary-200)',
  colorBackgroundSurfaceSelectedActive: 'var(--vf-palette-primary-300)',
  colorBackgroundSurfaceDisabled: 'var(--vf-color-surface-muted)',
  colorBackgroundInverse: 'var(--vf-color-contrast)',
  colorBackgroundInverseHover: 'var(--vf-palette-neutral-800)',
  colorBackgroundInverseActive: 'var(--vf-palette-neutral-750)',
  colorBackgroundInverseSubtle: 'var(--vf-color-contrast-soft)',
  colorBackgroundBackdrop: 'var(--vf-overlay-backdrop)',
  colorTextPrimary: 'var(--vf-color-text)',
  colorTextSecondary: 'var(--vf-palette-neutral-600)',
  colorTextMuted: 'var(--vf-color-muted)',
  colorTextDisabled: 'var(--vf-palette-neutral-400)',
  colorTextPlaceholder: 'var(--vf-color-muted)',
  colorTextInverse: 'var(--vf-color-contrast-contrast)',
  colorTextLink: 'var(--vf-palette-primary-700)',
  colorTextLinkHover: 'var(--vf-palette-primary-800)',
  colorTextLinkActive: 'var(--vf-palette-primary-900)',
  colorIconPrimary: 'var(--vf-color-text)',
  colorIconSecondary: 'var(--vf-palette-neutral-600)',
  colorIconDisabled: 'var(--vf-palette-neutral-400)',
  colorIconInverse: 'var(--vf-color-contrast-contrast)',
  colorBorderSubtle: 'var(--vf-palette-neutral-200)',
  colorBorderDefault: 'var(--vf-color-border)',
  colorBorderStrong: 'var(--vf-palette-neutral-400)',
  colorBorderInteractive: 'var(--vf-palette-neutral-400)',
  colorBorderDisabled: 'var(--vf-palette-neutral-200)',
  colorBorderFocus: 'var(--vf-color-primary)',
  colorBorderDivider: 'var(--vf-palette-neutral-200)',
  colorBorderInverse: 'var(--vf-color-contrast-border-soft)',
  colorInteractivePrimaryBackground: 'var(--vf-color-primary)',
  colorInteractivePrimaryHoverBackground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimaryActiveBackground: 'var(--vf-palette-primary-800)',
  colorInteractivePrimarySubtleBackground: 'var(--vf-color-primary-soft)',
  colorInteractivePrimaryForeground: 'var(--vf-color-primary-contrast)',
  colorInteractivePrimarySubtleForeground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimaryBorder: 'var(--vf-color-primary-border-soft)',
  colorFocusRing: 'var(--vf-palette-primary-600)',
  colorSelectedForeground: 'var(--vf-palette-primary-800)',
  colorStatusSuccessSolidBackground: 'var(--vf-color-success)',
  colorStatusSuccessSolidForeground: 'var(--vf-color-success-contrast)',
  colorStatusSuccessSubtleBackground: 'var(--vf-color-success-soft)',
  colorStatusSuccessSubtleForeground: 'var(--vf-palette-success-700)',
  colorStatusSuccessBorder: 'var(--vf-color-success-border-soft)',
  colorStatusSuccessIcon: 'var(--vf-palette-success-700)',
  colorStatusSuccessHoverBackground: 'var(--vf-palette-success-700)',
  colorStatusSuccessActiveBackground: 'var(--vf-palette-success-800)',
  colorStatusWarningSolidBackground: 'var(--vf-color-warn)',
  colorStatusWarningSolidForeground: 'var(--vf-color-warn-contrast)',
  colorStatusWarningSubtleBackground: 'var(--vf-color-warn-soft)',
  colorStatusWarningSubtleForeground: 'var(--vf-palette-warning-800)',
  colorStatusWarningBorder: 'var(--vf-color-warn-border-soft)',
  colorStatusWarningIcon: 'var(--vf-palette-warning-800)',
  colorStatusWarningHoverBackground: 'var(--vf-palette-warning-500)',
  colorStatusWarningActiveBackground: 'var(--vf-palette-warning-600)',
  colorStatusDangerSolidBackground: 'var(--vf-color-danger)',
  colorStatusDangerSolidForeground: 'var(--vf-color-danger-contrast)',
  colorStatusDangerSubtleBackground: 'var(--vf-color-danger-soft)',
  colorStatusDangerSubtleForeground: 'var(--vf-palette-danger-700)',
  colorStatusDangerBorder: 'var(--vf-color-danger-border-soft)',
  colorStatusDangerIcon: 'var(--vf-palette-danger-700)',
  colorStatusDangerHoverBackground: 'var(--vf-palette-danger-700)',
  colorStatusDangerActiveBackground: 'var(--vf-palette-danger-800)',
  colorStatusInfoSolidBackground: 'var(--vf-color-info)',
  colorStatusInfoSolidForeground: 'var(--vf-color-info-contrast)',
  colorStatusInfoSubtleBackground: 'var(--vf-color-info-soft)',
  colorStatusInfoSubtleForeground: 'var(--vf-palette-info-700)',
  colorStatusInfoBorder: 'var(--vf-color-info-border-soft)',
  colorStatusInfoIcon: 'var(--vf-palette-info-700)',
  colorStatusInfoHoverBackground: 'var(--vf-palette-info-700)',
  colorStatusInfoActiveBackground: 'var(--vf-palette-info-800)',
  colorStatusHelpSolidBackground: 'var(--vf-color-help)',
  colorStatusHelpSolidForeground: 'var(--vf-color-help-contrast)',
  colorStatusHelpSubtleBackground: 'var(--vf-color-help-soft)',
  colorStatusHelpSubtleForeground: 'var(--vf-palette-help-700)',
  colorStatusHelpBorder: 'var(--vf-color-help-border-soft)',
  colorStatusHelpIcon: 'var(--vf-palette-help-700)',
  colorStatusHelpHoverBackground: 'var(--vf-palette-help-700)',
  colorStatusHelpActiveBackground: 'var(--vf-palette-help-800)',
} as const satisfies Record<VfSemanticColorTokenName, string>;

export const semanticDarkColorTokens = {
  colorBackgroundCanvas: 'var(--vf-color-bg)',
  colorBackgroundSurface: 'var(--vf-color-surface)',
  colorBackgroundSurfaceSubtle: 'var(--vf-color-surface-muted)',
  colorBackgroundSurfaceElevated: 'var(--vf-palette-neutral-750)',
  colorBackgroundSurfaceHover: 'var(--vf-color-surface-muted)',
  colorBackgroundSurfaceActive: 'var(--vf-palette-neutral-750)',
  colorBackgroundSurfaceSelected: 'var(--vf-palette-primary-900)',
  colorBackgroundSurfaceSelectedHover: 'var(--vf-palette-primary-800)',
  colorBackgroundSurfaceSelectedActive: 'var(--vf-palette-primary-700)',
  colorBackgroundSurfaceDisabled: 'var(--vf-color-surface-muted)',
  colorBackgroundInverse: 'var(--vf-color-contrast)',
  colorBackgroundInverseHover: 'var(--vf-palette-neutral-300)',
  colorBackgroundInverseActive: 'var(--vf-palette-neutral-400)',
  colorBackgroundInverseSubtle: 'var(--vf-color-contrast-soft)',
  colorBackgroundBackdrop: 'var(--vf-overlay-backdrop)',
  colorTextPrimary: 'var(--vf-color-text)',
  colorTextSecondary: 'var(--vf-palette-neutral-300)',
  colorTextMuted: 'var(--vf-color-muted)',
  colorTextDisabled: 'var(--vf-palette-neutral-500)',
  colorTextPlaceholder: 'var(--vf-color-muted)',
  colorTextInverse: 'var(--vf-color-contrast-contrast)',
  colorTextLink: 'var(--vf-palette-primary-300)',
  colorTextLinkHover: 'var(--vf-palette-primary-200)',
  colorTextLinkActive: 'var(--vf-palette-primary-400)',
  colorIconPrimary: 'var(--vf-color-text)',
  colorIconSecondary: 'var(--vf-palette-neutral-300)',
  colorIconDisabled: 'var(--vf-palette-neutral-500)',
  colorIconInverse: 'var(--vf-color-contrast-contrast)',
  colorBorderSubtle: 'var(--vf-palette-neutral-700)',
  colorBorderDefault: 'var(--vf-color-border)',
  colorBorderStrong: 'var(--vf-palette-neutral-500)',
  colorBorderInteractive: 'var(--vf-palette-neutral-500)',
  colorBorderDisabled: 'var(--vf-palette-neutral-700)',
  colorBorderFocus: 'var(--vf-palette-primary-300)',
  colorBorderDivider: 'var(--vf-palette-neutral-700)',
  colorBorderInverse: 'var(--vf-color-contrast-border-soft)',
  colorInteractivePrimaryBackground: 'var(--vf-color-primary)',
  colorInteractivePrimaryHoverBackground: 'var(--vf-palette-primary-600)',
  colorInteractivePrimaryActiveBackground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimarySubtleBackground: 'var(--vf-color-primary-soft)',
  colorInteractivePrimaryForeground: 'var(--vf-color-primary-contrast)',
  colorInteractivePrimarySubtleForeground: 'var(--vf-palette-primary-300)',
  colorInteractivePrimaryBorder: 'var(--vf-color-primary-border-soft)',
  colorFocusRing: 'var(--vf-palette-primary-300)',
  colorSelectedForeground: 'var(--vf-palette-primary-200)',
  colorStatusSuccessSolidBackground: 'var(--vf-color-success)',
  colorStatusSuccessSolidForeground: 'var(--vf-color-success-contrast)',
  colorStatusSuccessSubtleBackground: 'var(--vf-color-success-soft)',
  colorStatusSuccessSubtleForeground: 'var(--vf-palette-success-300)',
  colorStatusSuccessBorder: 'var(--vf-color-success-border-soft)',
  colorStatusSuccessIcon: 'var(--vf-palette-success-300)',
  colorStatusSuccessHoverBackground: 'var(--vf-palette-success-400)',
  colorStatusSuccessActiveBackground: 'var(--vf-palette-success-300)',
  colorStatusWarningSolidBackground: 'var(--vf-color-warn)',
  colorStatusWarningSolidForeground: 'var(--vf-color-warn-contrast)',
  colorStatusWarningSubtleBackground: 'var(--vf-color-warn-soft)',
  colorStatusWarningSubtleForeground: 'var(--vf-palette-warning-300)',
  colorStatusWarningBorder: 'var(--vf-color-warn-border-soft)',
  colorStatusWarningIcon: 'var(--vf-palette-warning-300)',
  colorStatusWarningHoverBackground: 'var(--vf-palette-warning-400)',
  colorStatusWarningActiveBackground: 'var(--vf-palette-warning-300)',
  colorStatusDangerSolidBackground: 'var(--vf-color-danger)',
  colorStatusDangerSolidForeground: 'var(--vf-color-danger-contrast)',
  colorStatusDangerSubtleBackground: 'var(--vf-color-danger-soft)',
  colorStatusDangerSubtleForeground: 'var(--vf-palette-danger-300)',
  colorStatusDangerBorder: 'var(--vf-color-danger-border-soft)',
  colorStatusDangerIcon: 'var(--vf-palette-danger-300)',
  colorStatusDangerHoverBackground: 'var(--vf-palette-danger-400)',
  colorStatusDangerActiveBackground: 'var(--vf-palette-danger-300)',
  colorStatusInfoSolidBackground: 'var(--vf-color-info)',
  colorStatusInfoSolidForeground: 'var(--vf-color-info-contrast)',
  colorStatusInfoSubtleBackground: 'var(--vf-color-info-soft)',
  colorStatusInfoSubtleForeground: 'var(--vf-palette-info-300)',
  colorStatusInfoBorder: 'var(--vf-color-info-border-soft)',
  colorStatusInfoIcon: 'var(--vf-palette-info-300)',
  colorStatusInfoHoverBackground: 'var(--vf-palette-info-400)',
  colorStatusInfoActiveBackground: 'var(--vf-palette-info-300)',
  colorStatusHelpSolidBackground: 'var(--vf-color-help)',
  colorStatusHelpSolidForeground: 'var(--vf-color-help-contrast)',
  colorStatusHelpSubtleBackground: 'var(--vf-color-help-soft)',
  colorStatusHelpSubtleForeground: 'var(--vf-palette-help-300)',
  colorStatusHelpBorder: 'var(--vf-color-help-border-soft)',
  colorStatusHelpIcon: 'var(--vf-palette-help-300)',
  colorStatusHelpHoverBackground: 'var(--vf-palette-help-400)',
  colorStatusHelpActiveBackground: 'var(--vf-palette-help-300)',
} as const satisfies Record<VfSemanticColorTokenName, string>;

/** @deprecated Internal compatibility alias. Use semanticLightColorTokens for mode-explicit code. */
export const semanticColorTokens = semanticLightColorTokens;

export const legacyColorTokenMappings = {
  colorBg: ['colorBackgroundCanvas'],
  colorSurface: ['colorBackgroundSurface'],
  colorSurfaceMuted: ['colorBackgroundSurfaceSubtle', 'colorBackgroundSurfaceHover', 'colorBackgroundSurfaceDisabled'],
  colorText: ['colorTextPrimary', 'colorIconPrimary'],
  colorMuted: ['colorTextMuted', 'colorTextPlaceholder'],
  colorBorder: ['colorBorderDefault'],
  colorPrimary: ['colorInteractivePrimaryBackground'],
  colorPrimaryContrast: ['colorInteractivePrimaryForeground'],
  colorPrimarySoft: ['colorInteractivePrimarySubtleBackground'],
  colorPrimaryBorderSoft: ['colorInteractivePrimaryBorder'],
  colorFocusRing: ['colorFocusRing'],
  colorSuccess: ['colorStatusSuccessSolidBackground'],
  colorSuccessContrast: ['colorStatusSuccessSolidForeground'],
  colorSuccessSoft: ['colorStatusSuccessSubtleBackground'],
  colorSuccessBorderSoft: ['colorStatusSuccessBorder'],
  colorInfo: ['colorStatusInfoSolidBackground'],
  colorInfoContrast: ['colorStatusInfoSolidForeground'],
  colorInfoSoft: ['colorStatusInfoSubtleBackground'],
  colorInfoBorderSoft: ['colorStatusInfoBorder'],
  colorWarn: ['colorStatusWarningSolidBackground'],
  colorWarnContrast: ['colorStatusWarningSolidForeground'],
  colorWarnSoft: ['colorStatusWarningSubtleBackground'],
  colorWarnBorderSoft: ['colorStatusWarningBorder'],
  colorHelp: ['colorStatusHelpSolidBackground'],
  colorHelpContrast: ['colorStatusHelpSolidForeground'],
  colorHelpSoft: ['colorStatusHelpSubtleBackground'],
  colorHelpBorderSoft: ['colorStatusHelpBorder'],
  colorDanger: ['colorStatusDangerSolidBackground'],
  colorDangerContrast: ['colorStatusDangerSolidForeground'],
  colorDangerSoft: ['colorStatusDangerSubtleBackground'],
  colorDangerBorderSoft: ['colorStatusDangerBorder'],
  colorContrast: ['colorBackgroundInverse'],
  colorContrastContrast: ['colorTextInverse', 'colorIconInverse'],
  colorContrastSoft: ['colorBackgroundInverseSubtle'],
  colorContrastBorderSoft: ['colorBorderInverse'],
  overlayBackdrop: ['colorBackgroundBackdrop'],
} as const satisfies Record<keyof typeof legacyLightColorTokens, readonly VfSemanticColorTokenName[]>;

export const knownExternalThemeCssVariables = ['--vf-overlay-border-width'] as const;

const cssVariableReferencePattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g;

export interface CssVariableGraphValidationOptions {
  knownExternalVariables?: readonly string[];
  maxDepth?: number;
}

export interface CssVariableGraphValidationResult {
  maxDepth: number;
  referenceCount: number;
}

export function validateCssVariableGraph(
  variables: Record<string, string>,
  options: CssVariableGraphValidationOptions = {},
): CssVariableGraphValidationResult {
  const knownExternalVariables = new Set(options.knownExternalVariables ?? []);
  const dependencies = new Map<string, string[]>();
  let referenceCount = 0;

  for (const [name, value] of Object.entries(variables)) {
    const references = [...value.matchAll(cssVariableReferencePattern)].map((match) => match[1]);
    referenceCount += references.length;

    for (const reference of references) {
      if (!(reference in variables) && !knownExternalVariables.has(reference)) {
        throw new Error(`Undefined CSS variable reference: ${name} -> ${reference}`);
      }
    }

    dependencies.set(
      name,
      references.filter((reference) => reference in variables),
    );
  }

  const resolvedDepths = new Map<string, number>();
  const activePath = new Set<string>();

  function resolveDepth(name: string): number {
    const resolvedDepth = resolvedDepths.get(name);
    if (resolvedDepth !== undefined) {
      return resolvedDepth;
    }
    if (activePath.has(name)) {
      throw new Error(`Circular CSS variable reference: ${[...activePath, name].join(' -> ')}`);
    }

    activePath.add(name);
    const depth = Math.max(0, ...(dependencies.get(name) ?? []).map((dependency) => 1 + resolveDepth(dependency)));
    activePath.delete(name);
    resolvedDepths.set(name, depth);
    return depth;
  }

  const maxDepth = Math.max(0, ...Object.keys(variables).map(resolveDepth));
  if (options.maxDepth !== undefined && maxDepth > options.maxDepth) {
    throw new Error(`CSS variable alias depth ${maxDepth} exceeds ${options.maxDepth}`);
  }

  return { maxDepth, referenceCount };
}

export function validateColorTokenGraph(
  tokens: object,
  options: CssVariableGraphValidationOptions & { prefix?: string } = {},
) {
  const { prefix = 'vf', ...validationOptions } = options;
  return validateCssVariableGraph(serializeThemeTokensToCssVars(tokens, prefix), validationOptions);
}

if (vfPrimitiveColorTokenNames.length !== PRIMITIVE_COLOR_TOKEN_COUNT) {
  throw new Error('Primitive color token contract count is out of sync.');
}
if (vfSemanticColorTokenNames.length !== SEMANTIC_COLOR_TOKEN_COUNT) {
  throw new Error('Semantic color token contract count is out of sync.');
}
