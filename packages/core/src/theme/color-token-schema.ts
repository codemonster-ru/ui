import { vfPrimitiveColorTokenNames, vfSemanticColorTokenNames } from '../../../theme/src/color-token-contract';
import { serializeThemeTokensToCssVars } from '../../../theme/src/css-vars';
import type { VfPrimitiveColorTokenName, VfSemanticColorTokenName } from '../../../theme/src/color-token-contract';

export const LEGACY_THEME_TOKEN_COUNT = 847;
export const LEGACY_DARK_OVERRIDE_COUNT = 53;
export const PRIMITIVE_COLOR_TOKEN_COUNT = 29;
export const SEMANTIC_COLOR_TOKEN_COUNT = 77;
export const ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT = 76;
export const COMPLETE_THEME_TOKEN_COUNT = 952;
export const MAX_CANONICAL_ALIAS_DEPTH = 4;
export const MAX_CUSTOM_PREFIX_ALIAS_DEPTH = 9;

export const primitiveColorTokens = {
  paletteNeutral0: '#ffffff',
  paletteNeutral50: '#f6f8fb',
  paletteNeutral100: '#f3f3f3',
  paletteNeutral200: '#d9dde3',
  paletteNeutral250: '#d7d7d7',
  paletteNeutral300: '#d4d4d4',
  paletteNeutral400: '#9da0a6',
  paletteNeutral500: '#616773',
  paletteNeutral600: '#363b46',
  paletteNeutral700: '#272b33',
  paletteNeutral750: '#252526',
  paletteNeutral800: '#20232a',
  paletteNeutral850: '#1f232b',
  paletteNeutral900: '#17191e',
  paletteNeutral950: '#111827',
  paletteNeutral1000: '#000000',
  palettePrimary500: '#276cb5',
  palettePrimary600: '#0e639c',
  paletteSuccess500: '#2e7d32',
  paletteSuccess600: '#37783e',
  paletteInfo500: '#0077a3',
  paletteInfo600: '#1a739f',
  paletteWarning400: '#b79a63',
  paletteWarning500: '#a1841f',
  paletteWarning950: '#1f1300',
  paletteDanger500: '#bf3f3f',
  paletteDanger600: '#c72e39',
  paletteHelp500: '#7b4c96',
  paletteHelp600: '#6e43a2',
} as const satisfies Record<VfPrimitiveColorTokenName, string>;

export const legacyLightColorTokens = {
  colorBg: 'var(--vf-palette-neutral-50)',
  colorSurface: 'var(--vf-palette-neutral-0)',
  colorSurfaceMuted: 'var(--vf-palette-neutral-100)',
  colorText: 'var(--vf-palette-neutral-850)',
  colorMuted: 'var(--vf-palette-neutral-500)',
  colorBorder: 'var(--vf-palette-neutral-200)',
  colorPrimary: 'var(--vf-palette-primary-600)',
  colorPrimaryContrast: 'var(--vf-palette-neutral-0)',
  colorPrimarySoft: 'color-mix(in srgb, var(--vf-color-primary) 12%, var(--vf-color-surface))',
  colorPrimaryBorderSoft: 'color-mix(in srgb, var(--vf-color-primary) 22%, var(--vf-color-border))',
  colorFocusRing: 'color-mix(in srgb, var(--vf-color-primary) 32%, var(--vf-color-surface))',
  colorSuccess: 'var(--vf-palette-success-500)',
  colorSuccessContrast: 'var(--vf-palette-neutral-0)',
  colorInfo: 'var(--vf-palette-info-500)',
  colorInfoContrast: 'var(--vf-palette-neutral-0)',
  colorWarn: 'var(--vf-palette-warning-500)',
  colorWarnContrast: 'var(--vf-palette-warning-950)',
  colorHelp: 'var(--vf-palette-help-600)',
  colorHelpContrast: 'var(--vf-palette-neutral-0)',
  colorDanger: 'var(--vf-palette-danger-600)',
  colorDangerContrast: 'var(--vf-palette-neutral-0)',
  colorContrast: 'var(--vf-palette-neutral-750)',
  colorContrastContrast: 'var(--vf-palette-neutral-0)',
  colorSuccessSoft: 'color-mix(in srgb, var(--vf-color-success) 12%, var(--vf-color-surface))',
  colorInfoSoft: 'color-mix(in srgb, var(--vf-color-info) 12%, var(--vf-color-surface))',
  colorWarnSoft: 'color-mix(in srgb, var(--vf-color-warn) 12%, var(--vf-color-surface))',
  colorHelpSoft: 'color-mix(in srgb, var(--vf-color-help) 12%, var(--vf-color-surface))',
  colorDangerSoft: 'color-mix(in srgb, var(--vf-color-danger) 12%, var(--vf-color-surface))',
  colorContrastSoft: 'color-mix(in srgb, var(--vf-color-contrast) 10%, var(--vf-color-surface))',
  colorSuccessBorderSoft: 'color-mix(in srgb, var(--vf-color-success) 24%, var(--vf-color-border))',
  colorInfoBorderSoft: 'color-mix(in srgb, var(--vf-color-info) 24%, var(--vf-color-border))',
  colorWarnBorderSoft: 'color-mix(in srgb, var(--vf-color-warn) 24%, var(--vf-color-border))',
  colorHelpBorderSoft: 'color-mix(in srgb, var(--vf-color-help) 24%, var(--vf-color-border))',
  colorDangerBorderSoft: 'color-mix(in srgb, var(--vf-color-danger) 24%, var(--vf-color-border))',
  colorContrastBorderSoft: 'color-mix(in srgb, var(--vf-color-contrast) 24%, var(--vf-color-border))',
  overlayBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 44%, transparent)',
} as const;

export const legacyDarkColorTokens = {
  ...legacyLightColorTokens,
  colorBg: 'var(--vf-palette-neutral-900)',
  colorSurface: 'var(--vf-palette-neutral-800)',
  colorSurfaceMuted: 'var(--vf-palette-neutral-700)',
  colorText: 'var(--vf-palette-neutral-300)',
  colorMuted: 'var(--vf-palette-neutral-400)',
  colorBorder: 'var(--vf-palette-neutral-600)',
  colorPrimary: 'var(--vf-palette-primary-500)',
  colorFocusRing: 'color-mix(in srgb, var(--vf-color-primary) 42%, var(--vf-color-surface))',
  colorSuccess: 'var(--vf-palette-success-600)',
  colorInfo: 'var(--vf-palette-info-600)',
  colorWarn: 'var(--vf-palette-warning-400)',
  colorHelp: 'var(--vf-palette-help-500)',
  colorDanger: 'var(--vf-palette-danger-500)',
  colorContrast: 'var(--vf-palette-neutral-250)',
  colorContrastContrast: 'var(--vf-palette-neutral-950)',
  overlayBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 56%, transparent)',
} as const satisfies Record<keyof typeof legacyLightColorTokens, string>;

export const semanticColorTokens = {
  colorBackgroundCanvas: 'var(--vf-color-bg)',
  colorBackgroundSurface: 'var(--vf-color-surface)',
  colorBackgroundSurfaceSubtle: 'var(--vf-color-surface-muted)',
  colorBackgroundSurfaceElevated: 'var(--vf-color-surface)',
  colorBackgroundSurfaceHover: 'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
  colorBackgroundSurfaceActive: 'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
  colorBackgroundSurfaceSelected: 'color-mix(in srgb, var(--vf-color-primary) 20%, var(--vf-color-surface))',
  colorBackgroundSurfaceDisabled: 'var(--vf-color-surface-muted)',
  colorBackgroundInverse: 'var(--vf-color-contrast)',
  colorBackgroundInverseSubtle: 'var(--vf-color-contrast-soft)',
  colorBackgroundBackdrop: 'var(--vf-overlay-backdrop)',
  colorTextPrimary: 'var(--vf-color-text)',
  colorTextSecondary: 'var(--vf-color-muted)',
  colorTextMuted: 'var(--vf-color-muted)',
  colorTextDisabled: 'var(--vf-color-muted)',
  colorTextPlaceholder: 'var(--vf-color-muted)',
  colorTextInverse: 'var(--vf-color-contrast-contrast)',
  colorIconPrimary: 'var(--vf-color-text)',
  colorIconSecondary: 'var(--vf-color-muted)',
  colorIconDisabled: 'var(--vf-color-muted)',
  colorIconInverse: 'var(--vf-color-contrast-contrast)',
  colorBorderSubtle: 'var(--vf-color-border)',
  colorBorderDefault: 'var(--vf-color-border)',
  colorBorderStrong: 'var(--vf-color-border)',
  colorBorderInteractive: 'var(--vf-color-border)',
  colorBorderDisabled: 'var(--vf-color-border)',
  colorBorderFocus: 'var(--vf-color-primary)',
  colorBorderDivider: 'var(--vf-color-border)',
  colorBorderInverse: 'var(--vf-color-contrast-border-soft)',
  colorInteractivePrimaryBackground: 'var(--vf-color-primary)',
  colorInteractivePrimaryHoverBackground: 'var(--vf-color-primary)',
  colorInteractivePrimaryActiveBackground: 'var(--vf-color-primary)',
  colorInteractivePrimarySubtleBackground: 'var(--vf-color-primary-soft)',
  colorInteractivePrimaryForeground: 'var(--vf-color-primary-contrast)',
  colorInteractivePrimaryBorder: 'var(--vf-color-primary-border-soft)',
  colorFocusRing: 'color-mix(in srgb, var(--vf-color-primary) 32%, var(--vf-color-surface))',
  colorSelectedForeground: 'var(--vf-color-primary)',
  colorStatusSuccessSolidBackground: 'var(--vf-color-success)',
  colorStatusSuccessSolidForeground: 'var(--vf-color-success-contrast)',
  colorStatusSuccessSubtleBackground: 'var(--vf-color-success-soft)',
  colorStatusSuccessSubtleForeground: 'var(--vf-color-success)',
  colorStatusSuccessBorder: 'var(--vf-color-success-border-soft)',
  colorStatusSuccessIcon: 'var(--vf-color-success)',
  colorStatusSuccessHoverBackground: 'var(--vf-color-success)',
  colorStatusSuccessActiveBackground: 'var(--vf-color-success)',
  colorStatusWarningSolidBackground: 'var(--vf-color-warn)',
  colorStatusWarningSolidForeground: 'var(--vf-color-warn-contrast)',
  colorStatusWarningSubtleBackground: 'var(--vf-color-warn-soft)',
  colorStatusWarningSubtleForeground: 'var(--vf-color-warn)',
  colorStatusWarningBorder: 'var(--vf-color-warn-border-soft)',
  colorStatusWarningIcon: 'var(--vf-color-warn)',
  colorStatusWarningHoverBackground: 'var(--vf-color-warn)',
  colorStatusWarningActiveBackground: 'var(--vf-color-warn)',
  colorStatusDangerSolidBackground: 'var(--vf-color-danger)',
  colorStatusDangerSolidForeground: 'var(--vf-color-danger-contrast)',
  colorStatusDangerSubtleBackground: 'var(--vf-color-danger-soft)',
  colorStatusDangerSubtleForeground: 'var(--vf-color-danger)',
  colorStatusDangerBorder: 'var(--vf-color-danger-border-soft)',
  colorStatusDangerIcon: 'var(--vf-color-danger)',
  colorStatusDangerHoverBackground: 'var(--vf-color-danger)',
  colorStatusDangerActiveBackground: 'var(--vf-color-danger)',
  colorStatusInfoSolidBackground: 'var(--vf-color-info)',
  colorStatusInfoSolidForeground: 'var(--vf-color-info-contrast)',
  colorStatusInfoSubtleBackground: 'var(--vf-color-info-soft)',
  colorStatusInfoSubtleForeground: 'var(--vf-color-info)',
  colorStatusInfoBorder: 'var(--vf-color-info-border-soft)',
  colorStatusInfoIcon: 'var(--vf-color-info)',
  colorStatusInfoHoverBackground: 'var(--vf-color-info)',
  colorStatusInfoActiveBackground: 'var(--vf-color-info)',
  colorStatusHelpSolidBackground: 'var(--vf-color-help)',
  colorStatusHelpSolidForeground: 'var(--vf-color-help-contrast)',
  colorStatusHelpSubtleBackground: 'var(--vf-color-help-soft)',
  colorStatusHelpSubtleForeground: 'var(--vf-color-help)',
  colorStatusHelpBorder: 'var(--vf-color-help-border-soft)',
  colorStatusHelpIcon: 'var(--vf-color-help)',
  colorStatusHelpHoverBackground: 'var(--vf-color-help)',
  colorStatusHelpActiveBackground: 'var(--vf-color-help)',
} as const satisfies Record<VfSemanticColorTokenName, string>;

export const legacyColorTokenMappings = {
  colorBg: ['colorBackgroundCanvas'],
  colorSurface: ['colorBackgroundSurface', 'colorBackgroundSurfaceElevated'],
  colorSurfaceMuted: ['colorBackgroundSurfaceSubtle', 'colorBackgroundSurfaceDisabled'],
  colorText: ['colorTextPrimary', 'colorIconPrimary'],
  colorMuted: [
    'colorTextSecondary',
    'colorTextMuted',
    'colorTextDisabled',
    'colorTextPlaceholder',
    'colorIconSecondary',
    'colorIconDisabled',
  ],
  colorBorder: [
    'colorBorderSubtle',
    'colorBorderDefault',
    'colorBorderStrong',
    'colorBorderInteractive',
    'colorBorderDisabled',
    'colorBorderDivider',
  ],
  colorPrimary: [
    'colorBorderFocus',
    'colorInteractivePrimaryBackground',
    'colorInteractivePrimaryHoverBackground',
    'colorInteractivePrimaryActiveBackground',
    'colorSelectedForeground',
  ],
  colorPrimaryContrast: ['colorInteractivePrimaryForeground'],
  colorPrimarySoft: ['colorInteractivePrimarySubtleBackground'],
  colorPrimaryBorderSoft: ['colorInteractivePrimaryBorder'],
  colorFocusRing: ['colorFocusRing'],
  colorSuccess: [
    'colorStatusSuccessSolidBackground',
    'colorStatusSuccessSubtleForeground',
    'colorStatusSuccessIcon',
    'colorStatusSuccessHoverBackground',
    'colorStatusSuccessActiveBackground',
  ],
  colorSuccessContrast: ['colorStatusSuccessSolidForeground'],
  colorSuccessSoft: ['colorStatusSuccessSubtleBackground'],
  colorSuccessBorderSoft: ['colorStatusSuccessBorder'],
  colorInfo: [
    'colorStatusInfoSolidBackground',
    'colorStatusInfoSubtleForeground',
    'colorStatusInfoIcon',
    'colorStatusInfoHoverBackground',
    'colorStatusInfoActiveBackground',
  ],
  colorInfoContrast: ['colorStatusInfoSolidForeground'],
  colorInfoSoft: ['colorStatusInfoSubtleBackground'],
  colorInfoBorderSoft: ['colorStatusInfoBorder'],
  colorWarn: [
    'colorStatusWarningSolidBackground',
    'colorStatusWarningSubtleForeground',
    'colorStatusWarningIcon',
    'colorStatusWarningHoverBackground',
    'colorStatusWarningActiveBackground',
  ],
  colorWarnContrast: ['colorStatusWarningSolidForeground'],
  colorWarnSoft: ['colorStatusWarningSubtleBackground'],
  colorWarnBorderSoft: ['colorStatusWarningBorder'],
  colorHelp: [
    'colorStatusHelpSolidBackground',
    'colorStatusHelpSubtleForeground',
    'colorStatusHelpIcon',
    'colorStatusHelpHoverBackground',
    'colorStatusHelpActiveBackground',
  ],
  colorHelpContrast: ['colorStatusHelpSolidForeground'],
  colorHelpSoft: ['colorStatusHelpSubtleBackground'],
  colorHelpBorderSoft: ['colorStatusHelpBorder'],
  colorDanger: [
    'colorStatusDangerSolidBackground',
    'colorStatusDangerSubtleForeground',
    'colorStatusDangerIcon',
    'colorStatusDangerHoverBackground',
    'colorStatusDangerActiveBackground',
  ],
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
