import { vfPrimitiveColorTokenNames, vfSemanticColorTokenNames } from '../../../theme/src/color-token-contract';
import { serializeThemeTokensToCssVars } from '../../../theme/src/css-vars';
import type { VfPrimitiveColorTokenName, VfSemanticColorTokenName } from '../../../theme/src/color-token-contract';

export const PRIMITIVE_COLOR_TOKEN_COUNT = 66;
export const SEMANTIC_COLOR_TOKEN_COUNT = 85;
export const COMPLETE_THEME_TOKEN_COUNT = 962;
export const COMPLETE_DARK_OVERRIDE_COUNT = 101;
export const MAX_CANONICAL_ALIAS_DEPTH = 4;
export const MAX_CUSTOM_PREFIX_ALIAS_DEPTH = 9;

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

export const semanticLightColorTokens = {
  colorBackgroundCanvas: 'var(--vf-palette-neutral-50)',
  colorBackgroundSurface: 'var(--vf-palette-neutral-0)',
  colorBackgroundSurfaceSubtle: 'var(--vf-palette-neutral-100)',
  colorBackgroundSurfaceElevated: 'var(--vf-palette-neutral-0)',
  colorBackgroundSurfaceHover: 'var(--vf-palette-neutral-100)',
  colorBackgroundSurfaceActive: 'var(--vf-palette-neutral-200)',
  colorBackgroundSurfaceSelected: 'var(--vf-palette-primary-100)',
  colorBackgroundSurfaceSelectedHover: 'var(--vf-palette-primary-200)',
  colorBackgroundSurfaceSelectedActive: 'var(--vf-palette-primary-300)',
  colorBackgroundSurfaceDisabled: 'var(--vf-palette-neutral-100)',
  colorBackgroundInverse: 'var(--vf-palette-neutral-850)',
  colorBackgroundInverseHover: 'var(--vf-palette-neutral-800)',
  colorBackgroundInverseActive: 'var(--vf-palette-neutral-750)',
  colorBackgroundInverseSubtle: 'var(--vf-palette-neutral-100)',
  colorBackgroundBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 44%, transparent)',
  colorTextPrimary: 'var(--vf-palette-neutral-850)',
  colorTextSecondary: 'var(--vf-palette-neutral-600)',
  colorTextMuted: 'var(--vf-palette-neutral-500)',
  colorTextDisabled: 'var(--vf-palette-neutral-400)',
  colorTextPlaceholder: 'var(--vf-palette-neutral-500)',
  colorTextInverse: 'var(--vf-palette-neutral-0)',
  colorTextLink: 'var(--vf-palette-primary-700)',
  colorTextLinkHover: 'var(--vf-palette-primary-800)',
  colorTextLinkActive: 'var(--vf-palette-primary-900)',
  colorIconPrimary: 'var(--vf-palette-neutral-850)',
  colorIconSecondary: 'var(--vf-palette-neutral-600)',
  colorIconDisabled: 'var(--vf-palette-neutral-400)',
  colorIconInverse: 'var(--vf-palette-neutral-0)',
  colorBorderSubtle: 'var(--vf-palette-neutral-200)',
  colorBorderDefault: 'var(--vf-palette-neutral-250)',
  colorBorderStrong: 'var(--vf-palette-neutral-400)',
  colorBorderInteractive: 'var(--vf-palette-neutral-400)',
  colorBorderDisabled: 'var(--vf-palette-neutral-200)',
  colorBorderFocus: 'var(--vf-palette-primary-600)',
  colorBorderDivider: 'var(--vf-palette-neutral-200)',
  colorBorderInverse: 'var(--vf-palette-neutral-500)',
  colorInteractivePrimaryBackground: 'var(--vf-palette-primary-600)',
  colorInteractivePrimaryHoverBackground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimaryActiveBackground: 'var(--vf-palette-primary-800)',
  colorInteractivePrimarySubtleBackground: 'var(--vf-palette-primary-100)',
  colorInteractivePrimaryForeground: 'var(--vf-palette-neutral-0)',
  colorInteractivePrimarySubtleForeground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimaryBorder: 'var(--vf-palette-primary-500)',
  colorFocusRing: 'var(--vf-palette-primary-600)',
  colorSelectedForeground: 'var(--vf-palette-primary-800)',
  colorStatusSuccessSolidBackground: 'var(--vf-palette-success-600)',
  colorStatusSuccessSolidForeground: 'var(--vf-palette-neutral-0)',
  colorStatusSuccessSubtleBackground: 'var(--vf-palette-success-100)',
  colorStatusSuccessSubtleForeground: 'var(--vf-palette-success-700)',
  colorStatusSuccessBorder: 'var(--vf-palette-success-500)',
  colorStatusSuccessIcon: 'var(--vf-palette-success-700)',
  colorStatusSuccessHoverBackground: 'var(--vf-palette-success-700)',
  colorStatusSuccessActiveBackground: 'var(--vf-palette-success-800)',
  colorStatusWarningSolidBackground: 'var(--vf-palette-warning-400)',
  colorStatusWarningSolidForeground: 'var(--vf-palette-warning-950)',
  colorStatusWarningSubtleBackground: 'var(--vf-palette-warning-100)',
  colorStatusWarningSubtleForeground: 'var(--vf-palette-warning-800)',
  colorStatusWarningBorder: 'var(--vf-palette-warning-700)',
  colorStatusWarningIcon: 'var(--vf-palette-warning-800)',
  colorStatusWarningHoverBackground: 'var(--vf-palette-warning-500)',
  colorStatusWarningActiveBackground: 'var(--vf-palette-warning-600)',
  colorStatusDangerSolidBackground: 'var(--vf-palette-danger-600)',
  colorStatusDangerSolidForeground: 'var(--vf-palette-neutral-0)',
  colorStatusDangerSubtleBackground: 'var(--vf-palette-danger-100)',
  colorStatusDangerSubtleForeground: 'var(--vf-palette-danger-700)',
  colorStatusDangerBorder: 'var(--vf-palette-danger-500)',
  colorStatusDangerIcon: 'var(--vf-palette-danger-700)',
  colorStatusDangerHoverBackground: 'var(--vf-palette-danger-700)',
  colorStatusDangerActiveBackground: 'var(--vf-palette-danger-800)',
  colorStatusInfoSolidBackground: 'var(--vf-palette-info-600)',
  colorStatusInfoSolidForeground: 'var(--vf-palette-neutral-0)',
  colorStatusInfoSubtleBackground: 'var(--vf-palette-info-100)',
  colorStatusInfoSubtleForeground: 'var(--vf-palette-info-700)',
  colorStatusInfoBorder: 'var(--vf-palette-info-500)',
  colorStatusInfoIcon: 'var(--vf-palette-info-700)',
  colorStatusInfoHoverBackground: 'var(--vf-palette-info-700)',
  colorStatusInfoActiveBackground: 'var(--vf-palette-info-800)',
  colorStatusHelpSolidBackground: 'var(--vf-palette-help-600)',
  colorStatusHelpSolidForeground: 'var(--vf-palette-neutral-0)',
  colorStatusHelpSubtleBackground: 'var(--vf-palette-help-100)',
  colorStatusHelpSubtleForeground: 'var(--vf-palette-help-700)',
  colorStatusHelpBorder: 'var(--vf-palette-help-500)',
  colorStatusHelpIcon: 'var(--vf-palette-help-700)',
  colorStatusHelpHoverBackground: 'var(--vf-palette-help-700)',
  colorStatusHelpActiveBackground: 'var(--vf-palette-help-800)',
} as const satisfies Record<VfSemanticColorTokenName, string>;

export const semanticDarkColorTokens = {
  colorBackgroundCanvas: 'var(--vf-palette-neutral-900)',
  colorBackgroundSurface: 'var(--vf-palette-neutral-850)',
  colorBackgroundSurfaceSubtle: 'var(--vf-palette-neutral-800)',
  colorBackgroundSurfaceElevated: 'var(--vf-palette-neutral-750)',
  colorBackgroundSurfaceHover: 'var(--vf-palette-neutral-800)',
  colorBackgroundSurfaceActive: 'var(--vf-palette-neutral-750)',
  colorBackgroundSurfaceSelected: 'var(--vf-palette-primary-900)',
  colorBackgroundSurfaceSelectedHover: 'var(--vf-palette-primary-800)',
  colorBackgroundSurfaceSelectedActive: 'var(--vf-palette-primary-700)',
  colorBackgroundSurfaceDisabled: 'var(--vf-palette-neutral-800)',
  colorBackgroundInverse: 'var(--vf-palette-neutral-200)',
  colorBackgroundInverseHover: 'var(--vf-palette-neutral-300)',
  colorBackgroundInverseActive: 'var(--vf-palette-neutral-400)',
  colorBackgroundInverseSubtle: 'var(--vf-palette-neutral-800)',
  colorBackgroundBackdrop: 'color-mix(in srgb, var(--vf-palette-neutral-1000) 56%, transparent)',
  colorTextPrimary: 'var(--vf-palette-neutral-200)',
  colorTextSecondary: 'var(--vf-palette-neutral-300)',
  colorTextMuted: 'var(--vf-palette-neutral-400)',
  colorTextDisabled: 'var(--vf-palette-neutral-500)',
  colorTextPlaceholder: 'var(--vf-palette-neutral-400)',
  colorTextInverse: 'var(--vf-palette-neutral-950)',
  colorTextLink: 'var(--vf-palette-primary-300)',
  colorTextLinkHover: 'var(--vf-palette-primary-200)',
  colorTextLinkActive: 'var(--vf-palette-primary-400)',
  colorIconPrimary: 'var(--vf-palette-neutral-200)',
  colorIconSecondary: 'var(--vf-palette-neutral-300)',
  colorIconDisabled: 'var(--vf-palette-neutral-500)',
  colorIconInverse: 'var(--vf-palette-neutral-950)',
  colorBorderSubtle: 'var(--vf-palette-neutral-700)',
  colorBorderDefault: 'var(--vf-palette-neutral-600)',
  colorBorderStrong: 'var(--vf-palette-neutral-500)',
  colorBorderInteractive: 'var(--vf-palette-neutral-500)',
  colorBorderDisabled: 'var(--vf-palette-neutral-700)',
  colorBorderFocus: 'var(--vf-palette-primary-300)',
  colorBorderDivider: 'var(--vf-palette-neutral-700)',
  colorBorderInverse: 'var(--vf-palette-neutral-400)',
  colorInteractivePrimaryBackground: 'var(--vf-palette-primary-500)',
  colorInteractivePrimaryHoverBackground: 'var(--vf-palette-primary-600)',
  colorInteractivePrimaryActiveBackground: 'var(--vf-palette-primary-700)',
  colorInteractivePrimarySubtleBackground: 'var(--vf-palette-primary-900)',
  colorInteractivePrimaryForeground: 'var(--vf-palette-neutral-0)',
  colorInteractivePrimarySubtleForeground: 'var(--vf-palette-primary-300)',
  colorInteractivePrimaryBorder: 'var(--vf-palette-primary-400)',
  colorFocusRing: 'var(--vf-palette-primary-300)',
  colorSelectedForeground: 'var(--vf-palette-primary-200)',
  colorStatusSuccessSolidBackground: 'var(--vf-palette-success-500)',
  colorStatusSuccessSolidForeground: 'var(--vf-palette-neutral-950)',
  colorStatusSuccessSubtleBackground: 'var(--vf-palette-success-900)',
  colorStatusSuccessSubtleForeground: 'var(--vf-palette-success-300)',
  colorStatusSuccessBorder: 'var(--vf-palette-success-400)',
  colorStatusSuccessIcon: 'var(--vf-palette-success-300)',
  colorStatusSuccessHoverBackground: 'var(--vf-palette-success-400)',
  colorStatusSuccessActiveBackground: 'var(--vf-palette-success-300)',
  colorStatusWarningSolidBackground: 'var(--vf-palette-warning-500)',
  colorStatusWarningSolidForeground: 'var(--vf-palette-warning-950)',
  colorStatusWarningSubtleBackground: 'var(--vf-palette-warning-900)',
  colorStatusWarningSubtleForeground: 'var(--vf-palette-warning-300)',
  colorStatusWarningBorder: 'var(--vf-palette-warning-400)',
  colorStatusWarningIcon: 'var(--vf-palette-warning-300)',
  colorStatusWarningHoverBackground: 'var(--vf-palette-warning-400)',
  colorStatusWarningActiveBackground: 'var(--vf-palette-warning-300)',
  colorStatusDangerSolidBackground: 'var(--vf-palette-danger-500)',
  colorStatusDangerSolidForeground: 'var(--vf-palette-neutral-950)',
  colorStatusDangerSubtleBackground: 'var(--vf-palette-danger-900)',
  colorStatusDangerSubtleForeground: 'var(--vf-palette-danger-300)',
  colorStatusDangerBorder: 'var(--vf-palette-danger-400)',
  colorStatusDangerIcon: 'var(--vf-palette-danger-300)',
  colorStatusDangerHoverBackground: 'var(--vf-palette-danger-400)',
  colorStatusDangerActiveBackground: 'var(--vf-palette-danger-300)',
  colorStatusInfoSolidBackground: 'var(--vf-palette-info-500)',
  colorStatusInfoSolidForeground: 'var(--vf-palette-neutral-950)',
  colorStatusInfoSubtleBackground: 'var(--vf-palette-info-900)',
  colorStatusInfoSubtleForeground: 'var(--vf-palette-info-300)',
  colorStatusInfoBorder: 'var(--vf-palette-info-400)',
  colorStatusInfoIcon: 'var(--vf-palette-info-300)',
  colorStatusInfoHoverBackground: 'var(--vf-palette-info-400)',
  colorStatusInfoActiveBackground: 'var(--vf-palette-info-300)',
  colorStatusHelpSolidBackground: 'var(--vf-palette-help-500)',
  colorStatusHelpSolidForeground: 'var(--vf-palette-neutral-950)',
  colorStatusHelpSubtleBackground: 'var(--vf-palette-help-900)',
  colorStatusHelpSubtleForeground: 'var(--vf-palette-help-300)',
  colorStatusHelpBorder: 'var(--vf-palette-help-400)',
  colorStatusHelpIcon: 'var(--vf-palette-help-300)',
  colorStatusHelpHoverBackground: 'var(--vf-palette-help-400)',
  colorStatusHelpActiveBackground: 'var(--vf-palette-help-300)',
} as const satisfies Record<VfSemanticColorTokenName, string>;

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
