import { describe, expect, it } from 'vitest';
import {
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
  type VfSemanticColorTokenName,
} from '@codemonster-ru/vueforge-theme';
import {
  ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT,
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
  semanticColorTokens,
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
    expect(Object.keys(semanticColorTokens)).toEqual([...vfSemanticColorTokenNames]);
    expect(primitiveNames).toHaveProperty('size', PRIMITIVE_COLOR_TOKEN_COUNT);
    expect(semanticNames).toHaveProperty('size', SEMANTIC_COLOR_TOKEN_COUNT);
    expect(legacyNames).toHaveProperty('size', LEGACY_THEME_TOKEN_COUNT);
    expect(Object.keys(legacyDefaultThemePresetSource.dark ?? {})).toHaveLength(LEGACY_DARK_OVERRIDE_COUNT);
    expect(semanticLegacyOverlap).toEqual(['colorFocusRing']);
    expect(SEMANTIC_COLOR_TOKEN_COUNT - semanticLegacyOverlap.length).toBe(ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT);
    expect(Object.keys(defaultThemePresetSource.tokens)).toHaveLength(COMPLETE_THEME_TOKEN_COUNT);
    expect(LEGACY_THEME_TOKEN_COUNT + primitiveNames.size + ADDITIVE_SEMANTIC_COLOR_TOKEN_COUNT).toBe(
      COMPLETE_THEME_TOKEN_COUNT,
    );
  });

  it('uses the current palette values as mode-independent primitives', () => {
    expect(primitiveColorTokens).toEqual({
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

    expect(semanticColorTokens.colorStatusSuccessSolidBackground).toBe('var(--vf-color-success)');
    expect(semanticColorTokens.colorStatusSuccessSolidForeground).toBe('var(--vf-color-success-contrast)');
    expect(semanticColorTokens.colorStatusWarningSolidBackground).toBe('var(--vf-color-warn)');
    expect(semanticColorTokens.colorStatusWarningSolidForeground).toBe('var(--vf-color-warn-contrast)');
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
    expect(mappedSemanticNames).toHaveProperty('size', 74);
    expect(vfSemanticColorTokenNames.filter((name) => !mappedSemanticNames.has(name))).toEqual([
      'colorBackgroundSurfaceHover',
      'colorBackgroundSurfaceActive',
      'colorBackgroundSurfaceSelected',
    ]);

    for (const [legacyName, semanticTargets] of mappings) {
      expect(legacyDefaultThemePresetSource.tokens, legacyName).toHaveProperty(legacyName);
      expect(semanticTargets.length, legacyName).toBeGreaterThan(0);
      const [legacyCssName] = Object.keys(themeTokensToCssVars({ [legacyName]: 'test-value' }));

      for (const semanticName of semanticTargets) {
        expect(semanticNames.has(semanticName), `${legacyName} -> ${semanticName}`).toBe(true);

        if (semanticName === legacyName) {
          expect(semanticColorTokens[semanticName], `${legacyName} -> ${semanticName}`).toBe(
            legacyLightColorTokens[legacyName],
          );
        } else {
          expect(semanticColorTokens[semanticName], `${legacyName} -> ${semanticName}`).toContain(
            `var(${legacyCssName})`,
          );
        }
      }
    }

    expect(legacyColorTokenMappings.colorPrimary).toContain('colorInteractivePrimaryBackground');
    expect(legacyColorTokenMappings.colorMuted).toContain('colorTextDisabled');
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
    expect(lightResult.referenceCount).toBeGreaterThan(0);
    expect(darkResult.referenceCount).toBeGreaterThan(0);
  });

  it('keeps the custom-prefix compatibility graph defined, acyclic, and bounded', () => {
    const config = resolveThemeConfig({ options: { prefix: 'brand' } });

    for (const [mode, tokens] of [
      ['light', config.preset.light],
      ['dark', config.preset.dark],
    ] as const) {
      const variables = createCustomPrefixVariableGraph(tokens, 'brand');
      const result = validateCssVariableGraph(variables, {
        knownExternalVariables: knownExternalThemeCssVariables,
        maxDepth: MAX_CUSTOM_PREFIX_ALIAS_DEPTH,
      });

      expect(variables, mode).toHaveProperty('--brand-palette-neutral-50', '#f6f8fb');
      expect(variables, mode).toHaveProperty('--vf-palette-neutral-50', 'var(--brand-palette-neutral-50)');
      expect(variables, mode).toHaveProperty('--brand-color-background-canvas', 'var(--vf-color-bg)');
      expect(variables, mode).toHaveProperty('--vf-color-background-canvas', 'var(--brand-color-background-canvas)');
      expect(result.maxDepth, mode).toBeLessThanOrEqual(MAX_CUSTOM_PREFIX_ALIAS_DEPTH);
      expect(result.referenceCount, mode).toBeGreaterThan(0);
    }
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
