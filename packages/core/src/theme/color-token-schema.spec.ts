import { describe, expect, it } from 'vitest';
import {
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
  type VfSemanticColorTokenName,
} from '@codemonster-ru/vueforge-theme';
import {
  ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT,
  COMPLETE_DARK_OVERRIDE_COUNT,
  COMPLETE_THEME_TOKEN_COUNT,
  LEGACY_DARK_OVERRIDE_COUNT,
  LEGACY_THEME_TOKEN_COUNT,
  MAX_CANONICAL_ALIAS_DEPTH,
  MAX_CUSTOM_PREFIX_ALIAS_DEPTH,
  PRIMITIVE_COLOR_TOKEN_COUNT,
  SEMANTIC_COLOR_TOKEN_COUNT,
  knownExternalThemeCssVariables,
  legacyColorTokenMappings,
  legacyDarkColorTokens,
  legacyLightColorTokens,
  primitiveColorTokens,
  semanticDarkColorTokens,
  semanticLightColorTokens,
  validateColorTokenGraph,
  validateCssVariableGraph,
} from './color-token-schema';
import { defaultThemePresetSource, legacyDefaultThemePresetSource } from './default-preset-source';
import { resolveThemeConfig, themeTokensToCssVars } from './utils';

function createCustomPrefixVariableGraph(tokens: Parameters<typeof themeTokensToCssVars>[0], prefix: string) {
  const requestedVariables = themeTokensToCssVars(tokens, prefix);
  const canonicalAliases = Object.fromEntries(
    Object.keys(requestedVariables).map((name) => [`--vf-${name.slice(`--${prefix}-`.length)}`, `var(${name})`]),
  );

  return { ...requestedVariables, ...canonicalAliases };
}

describe('color token schema', () => {
  it('keeps primitive, semantic, legacy, and complete contract counts explicit', () => {
    const legacyNames = new Set(Object.keys(legacyDefaultThemePresetSource.tokens));
    const primitiveNames = new Set(vfPrimitiveColorTokenNames);
    const semanticNames = new Set(vfSemanticColorTokenNames);
    const semanticLegacyOverlap = vfSemanticColorTokenNames.filter((name) => legacyNames.has(name));

    expect(Object.keys(primitiveColorTokens)).toEqual([...vfPrimitiveColorTokenNames]);
    expect(Object.keys(semanticLightColorTokens)).toEqual([...vfSemanticColorTokenNames]);
    expect(Object.keys(semanticDarkColorTokens)).toEqual([...vfSemanticColorTokenNames]);
    expect(primitiveNames).toHaveProperty('size', PRIMITIVE_COLOR_TOKEN_COUNT);
    expect(semanticNames).toHaveProperty('size', SEMANTIC_COLOR_TOKEN_COUNT);
    expect(legacyNames).toHaveProperty('size', LEGACY_THEME_TOKEN_COUNT);
    expect(Object.keys(legacyDefaultThemePresetSource.dark ?? {})).toHaveLength(LEGACY_DARK_OVERRIDE_COUNT);
    expect(Object.keys(defaultThemePresetSource.dark ?? {})).toHaveLength(COMPLETE_DARK_OVERRIDE_COUNT);
    expect(semanticLegacyOverlap).toEqual(['colorFocusRing']);
    expect(SEMANTIC_COLOR_TOKEN_COUNT - semanticLegacyOverlap.length).toBe(ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT);
    expect(Object.keys(defaultThemePresetSource.tokens)).toHaveLength(COMPLETE_THEME_TOKEN_COUNT);
    expect(LEGACY_THEME_TOKEN_COUNT + primitiveNames.size + ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT).toBe(
      COMPLETE_THEME_TOKEN_COUNT,
    );
  });

  it('uses the target OKLCH palette values as mode-independent primitives', () => {
    expect(primitiveColorTokens).toEqual({
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
    });

    for (const name of vfPrimitiveColorTokenNames) {
      expect(defaultThemePresetSource.tokens[name], name).toBe(primitiveColorTokens[name]);
      expect(defaultThemePresetSource.dark).not.toHaveProperty(name);
    }
  });

  it('keeps every semantic role present and separates status foreground from solid background', () => {
    const semanticNames = new Set(vfSemanticColorTokenNames);

    for (const tone of ['Success', 'Warning', 'Danger', 'Info', 'Help'] as const) {
      const roleNames = [
        `colorStatus${tone}SolidBackground`,
        `colorStatus${tone}SolidForeground`,
        `colorStatus${tone}SubtleBackground`,
        `colorStatus${tone}SubtleForeground`,
        `colorStatus${tone}Border`,
        `colorStatus${tone}Icon`,
        `colorStatus${tone}HoverBackground`,
        `colorStatus${tone}ActiveBackground`,
      ];

      expect(new Set(roleNames)).toHaveProperty('size', 8);
      for (const name of roleNames) {
        expect(semanticNames.has(name as (typeof vfSemanticColorTokenNames)[number]), name).toBe(true);
      }
    }

    expect(semanticLightColorTokens.colorStatusSuccessSolidBackground).toBe('var(--vf-color-success)');
    expect(semanticLightColorTokens.colorStatusSuccessSubtleForeground).toBe('var(--vf-palette-success-700)');
    expect(semanticDarkColorTokens.colorStatusSuccessSolidBackground).toBe('var(--vf-color-success)');
    expect(semanticDarkColorTokens.colorStatusSuccessSubtleForeground).toBe('var(--vf-palette-success-300)');
    expect(semanticLightColorTokens.colorStatusWarningSolidForeground).toBe('var(--vf-color-warn-contrast)');
    expect(semanticDarkColorTokens.colorStatusWarningSolidForeground).toBe('var(--vf-color-warn-contrast)');

    expect(semanticLightColorTokens.colorBackgroundSurfaceSelectedHover).toBe('var(--vf-palette-primary-200)');
    expect(semanticDarkColorTokens.colorBackgroundSurfaceSelectedHover).toBe('var(--vf-palette-primary-800)');
    expect(semanticLightColorTokens.colorTextLink).toBe('var(--vf-palette-primary-700)');
    expect(semanticDarkColorTokens.colorTextLink).toBe('var(--vf-palette-primary-300)');
  });

  it('maps every legacy root color token to its declared semantic aliases', () => {
    const semanticNames = new Set(vfSemanticColorTokenNames);
    const mappings = Object.entries(legacyColorTokenMappings) as Array<
      [keyof typeof legacyLightColorTokens, readonly VfSemanticColorTokenName[]]
    >;
    const mappedSemanticNames = new Set(mappings.flatMap(([, semanticTargets]) => semanticTargets));

    expect(Object.keys(legacyColorTokenMappings).sort()).toEqual(Object.keys(legacyLightColorTokens).sort());
    expect(Object.keys(legacyDarkColorTokens).sort()).toEqual(Object.keys(legacyLightColorTokens).sort());
    expect(mappings).toHaveLength(36);
    expect(mappedSemanticNames.size).toBeLessThan(vfSemanticColorTokenNames.length);
    expect(mappedSemanticNames.has('colorBackgroundSurfaceSelectedHover')).toBe(false);
    expect(mappedSemanticNames.has('colorTextLink')).toBe(false);
    expect(mappedSemanticNames.has('colorInteractivePrimarySubtleForeground')).toBe(false);

    for (const [legacyName, semanticTargets] of mappings) {
      expect(legacyDefaultThemePresetSource.tokens, legacyName).toHaveProperty(legacyName);
      expect(semanticTargets.length, legacyName).toBeGreaterThan(0);
      const [legacyCssName] = Object.keys(themeTokensToCssVars({ [legacyName]: 'test-value' }));

      for (const semanticName of semanticTargets) {
        expect(semanticNames.has(semanticName), `${legacyName} -> ${semanticName}`).toBe(true);

        if (semanticName === legacyName) {
          expect(semanticLightColorTokens[semanticName], `${legacyName} -> ${semanticName}`).toBe(
            legacyLightColorTokens[legacyName],
          );
          expect(semanticDarkColorTokens[semanticName], `${legacyName} -> ${semanticName} dark`).toBe(
            legacyDarkColorTokens[legacyName],
          );
        } else {
          expect(semanticLightColorTokens[semanticName], `${legacyName} -> ${semanticName}`).toContain(
            `var(${legacyCssName})`,
          );
          expect(semanticDarkColorTokens[semanticName], `${legacyName} -> ${semanticName} dark`).toContain(
            `var(${legacyCssName})`,
          );
        }
      }
    }

    expect(legacyColorTokenMappings.colorPrimary).toContain('colorInteractivePrimaryBackground');
    expect(legacyColorTokenMappings.colorMuted).toContain('colorTextMuted');
    expect(legacyColorTokenMappings.overlayBackdrop).toEqual(['colorBackgroundBackdrop']);
  });

  it('keeps the canonical light and dark graphs defined, acyclic, and bounded', () => {
    const config = resolveThemeConfig();
    const lightResult = validateColorTokenGraph(config.preset.light, {
      knownExternalVariables: knownExternalThemeCssVariables,
      maxDepth: MAX_CANONICAL_ALIAS_DEPTH,
    });
    const darkResult = validateColorTokenGraph(config.preset.dark, {
      knownExternalVariables: knownExternalThemeCssVariables,
      maxDepth: MAX_CANONICAL_ALIAS_DEPTH,
    });

    expect(lightResult.maxDepth).toBeLessThanOrEqual(MAX_CANONICAL_ALIAS_DEPTH);
    expect(darkResult.maxDepth).toBeLessThanOrEqual(MAX_CANONICAL_ALIAS_DEPTH);
    expect(Math.max(lightResult.maxDepth, darkResult.maxDepth)).toBe(MAX_CANONICAL_ALIAS_DEPTH);
    expect(lightResult.referenceCount).toBeGreaterThan(0);
    expect(darkResult.referenceCount).toBeGreaterThan(0);
  });

  it('keeps the custom-prefix compatibility graph defined, acyclic, and bounded', () => {
    const config = resolveThemeConfig({ options: { prefix: 'brand' } });
    const modeDepths: number[] = [];

    for (const [mode, tokens] of [
      ['light', config.preset.light],
      ['dark', config.preset.dark],
    ] as const) {
      const variables = createCustomPrefixVariableGraph(tokens, 'brand');
      const result = validateCssVariableGraph(variables, {
        knownExternalVariables: knownExternalThemeCssVariables,
        maxDepth: MAX_CUSTOM_PREFIX_ALIAS_DEPTH,
      });

      expect(variables, mode).toHaveProperty('--brand-palette-neutral-50', 'oklch(97.8% 0.005 260)');
      expect(variables, mode).toHaveProperty('--vf-palette-neutral-50', 'var(--brand-palette-neutral-50)');
      expect(variables, mode).toHaveProperty('--brand-color-background-canvas', 'var(--vf-color-bg)');
      expect(variables, mode).toHaveProperty('--vf-color-background-canvas', 'var(--brand-color-background-canvas)');
      expect(result.maxDepth, mode).toBeLessThanOrEqual(MAX_CUSTOM_PREFIX_ALIAS_DEPTH);
      expect(result.referenceCount, mode).toBeGreaterThan(0);
      modeDepths.push(result.maxDepth);
    }

    expect(Math.max(...modeDepths)).toBe(MAX_CUSTOM_PREFIX_ALIAS_DEPTH);
  });

  it('rejects undefined references, cycles, and excessive alias depth', () => {
    expect(() => validateCssVariableGraph({ '--vf-a': 'var(--vf-missing)' })).toThrow(
      'Undefined CSS variable reference: --vf-a -> --vf-missing',
    );
    expect(() =>
      validateCssVariableGraph({
        '--vf-a': 'var(--vf-b)',
        '--vf-b': 'var(--vf-a)',
      }),
    ).toThrow('Circular CSS variable reference');
    expect(() =>
      validateCssVariableGraph(
        {
          '--vf-a': 'var(--vf-b)',
          '--vf-b': 'var(--vf-c)',
          '--vf-c': '#fff',
        },
        { maxDepth: 1 },
      ),
    ).toThrow('CSS variable alias depth 2 exceeds 1');
  });
});
