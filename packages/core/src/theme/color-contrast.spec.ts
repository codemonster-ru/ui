import { describe, expect, it } from 'vitest';
import type { VfSemanticColorTokenName } from '@codemonster-ru/vueforge-theme';
import type { VfThemeTokens } from '@/types/theme';
import { resolveThemeConfig, themeTokensToCssVars } from './utils';

type ContrastPair = readonly [
  foreground: VfSemanticColorTokenName,
  background: VfSemanticColorTokenName,
  minimum: number,
];

// Disabled roles are intentionally excluded: they identify unavailable controls and are not supported text pairings.
const textContrastPairs = [
  ['colorTextPrimary', 'colorBackgroundCanvas', 4.5],
  ['colorTextPrimary', 'colorBackgroundSurface', 4.5],
  ['colorTextSecondary', 'colorBackgroundCanvas', 4.5],
  ['colorTextSecondary', 'colorBackgroundSurface', 4.5],
  ['colorTextSecondary', 'colorBackgroundSurfaceElevated', 4.5],
  ['colorTextSecondary', 'colorBackgroundSurfaceSubtle', 4.5],
  ['colorTextMuted', 'colorBackgroundCanvas', 4.5],
  ['colorTextMuted', 'colorBackgroundSurface', 4.5],
  ['colorTextPlaceholder', 'colorBackgroundSurface', 4.5],
  ['colorTextInverse', 'colorBackgroundInverse', 4.5],
  ['colorTextInverse', 'colorBackgroundInverseHover', 4.5],
  ['colorTextInverse', 'colorBackgroundInverseActive', 4.5],
  ['colorTextLink', 'colorBackgroundSurface', 4.5],
  ['colorTextLinkHover', 'colorBackgroundSurface', 4.5],
  ['colorTextLinkActive', 'colorBackgroundSurface', 4.5],
  ['colorTextLink', 'colorBackgroundCanvas', 4.5],
  ['colorTextLinkHover', 'colorBackgroundCanvas', 4.5],
  ['colorTextLinkActive', 'colorBackgroundCanvas', 4.5],
  ['colorInteractivePrimaryForeground', 'colorInteractivePrimaryBackground', 4.5],
  ['colorInteractivePrimaryForeground', 'colorInteractivePrimaryHoverBackground', 4.5],
  ['colorInteractivePrimaryForeground', 'colorInteractivePrimaryActiveBackground', 4.5],
  ['colorInteractivePrimarySubtleForeground', 'colorInteractivePrimarySubtleBackground', 4.5],
  ['colorSelectedForeground', 'colorBackgroundSurfaceSelected', 4.5],
  ['colorSelectedForeground', 'colorBackgroundSurfaceSelectedHover', 4.5],
  ['colorSelectedForeground', 'colorBackgroundSurfaceSelectedActive', 4.5],
] as const satisfies readonly ContrastPair[];

const uiContrastPairs = [
  ['colorBorderStrong', 'colorBackgroundSurface', 3],
  ['colorBorderInteractive', 'colorBackgroundSurface', 3],
  ['colorBorderInteractive', 'colorBackgroundCanvas', 3],
  ['colorBorderFocus', 'colorBackgroundSurface', 3],
  ['colorFocusRing', 'colorBackgroundCanvas', 3],
  ['colorFocusRing', 'colorBackgroundSurface', 3],
  ['colorIconSecondary', 'colorBackgroundSurface', 3],
  ['colorIconSecondary', 'colorBackgroundSurfaceElevated', 3],
  ['colorIconSecondary', 'colorBackgroundSurfaceDisabled', 3],
  ['colorIconPrimary', 'colorBackgroundCanvas', 3],
  ['colorIconPrimary', 'colorBackgroundSurface', 3],
  ['colorIconPrimary', 'colorBackgroundSurfaceSubtle', 3],
  ['colorIconPrimary', 'colorBackgroundSurfaceElevated', 3],
  ['colorIconInverse', 'colorBackgroundInverse', 3],
  ['colorIconInverse', 'colorBackgroundInverseHover', 3],
  ['colorIconInverse', 'colorBackgroundInverseActive', 3],
  ['colorBorderInverse', 'colorBackgroundInverseSubtle', 3],
  ['colorInteractivePrimaryBackground', 'colorBackgroundCanvas', 3],
  ['colorInteractivePrimaryBackground', 'colorBackgroundSurface', 3],
  ['colorInteractivePrimaryBackground', 'colorBackgroundSurfaceDisabled', 3],
  ['colorInteractivePrimarySubtleForeground', 'colorBorderDivider', 3],
] as const satisfies readonly ContrastPair[];

const statusNames = ['Success', 'Warning', 'Danger', 'Info', 'Help'] as const;
const statusProgressValueNames = {
  Success: 'colorStatusSuccessSolidBackground',
  Warning: 'colorStatusWarningActiveBackground',
  Danger: 'colorStatusDangerSolidBackground',
  Info: 'colorStatusInfoSolidBackground',
  Help: 'colorStatusHelpSolidBackground',
} as const satisfies Record<(typeof statusNames)[number], VfSemanticColorTokenName>;
const interactiveStateSequences = [
  ['colorBackgroundSurface', 'colorBackgroundSurfaceHover', 'colorBackgroundSurfaceActive'],
  ['colorBackgroundSurfaceSelected', 'colorBackgroundSurfaceSelectedHover', 'colorBackgroundSurfaceSelectedActive'],
  [
    'colorInteractivePrimaryBackground',
    'colorInteractivePrimaryHoverBackground',
    'colorInteractivePrimaryActiveBackground',
  ],
  ['colorBackgroundInverse', 'colorBackgroundInverseHover', 'colorBackgroundInverseActive'],
] as const satisfies readonly (readonly VfSemanticColorTokenName[])[];
const codeBlockSyntaxForegroundNames = [
  'colorTextPrimary',
  'colorTextSecondary',
  'colorTextLink',
  'colorStatusSuccessSubtleForeground',
  'colorStatusWarningSubtleForeground',
  'colorStatusDangerSubtleForeground',
  'colorStatusInfoSubtleForeground',
  'colorStatusHelpSubtleForeground',
] as const satisfies readonly VfSemanticColorTokenName[];
const componentTextContrastPairs = [
  ['colorTextPrimary', 'colorBackgroundSurfaceElevated', 4.5],
  ['colorTextPrimary', 'colorBackgroundSurfaceSubtle', 4.5],
  ['colorTextPrimary', 'colorInteractivePrimarySubtleBackground', 4.5],
  ['colorTextPrimary', 'colorBackgroundInverseSubtle', 4.5],
  ['colorTextSecondary', 'colorInteractivePrimarySubtleBackground', 4.5],
  ['colorTextSecondary', 'colorBackgroundInverseSubtle', 4.5],
  ['colorInteractivePrimarySubtleForeground', 'colorBackgroundSurfaceSubtle', 4.5],
  ['colorStatusDangerSubtleForeground', 'colorBackgroundCanvas', 4.5],
  ['colorStatusDangerSubtleForeground', 'colorBackgroundSurface', 4.5],
  ['colorStatusDangerSubtleForeground', 'colorBackgroundSurfaceSubtle', 4.5],
  ['colorTextInverse', 'colorIconSecondary', 4.5],
] as const satisfies readonly ContrastPair[];
const componentUiContrastPairs = [
  ['colorBorderFocus', 'colorBackgroundCanvas', 3],
  ['colorInteractivePrimaryBorder', 'colorBackgroundCanvas', 3],
  ['colorInteractivePrimaryBorder', 'colorBackgroundSurface', 3],
  ['colorInteractivePrimaryBorder', 'colorBackgroundSurfaceSubtle', 3],
  ['colorInteractivePrimaryBorder', 'colorInteractivePrimarySubtleBackground', 3],
  ['colorStatusDangerBorder', 'colorBackgroundCanvas', 3],
  ['colorStatusDangerBorder', 'colorBackgroundSurface', 3],
  ['colorIconPrimary', 'colorBackgroundInverseSubtle', 3],
  ['colorIconPrimary', 'colorBackgroundSurfaceDisabled', 3],
  ['colorBackgroundInverse', 'colorBackgroundSurfaceDisabled', 3],
  ['colorBorderInverse', 'colorBackgroundSurfaceSubtle', 3],
  ['colorFocusRing', 'colorBackgroundSurfaceSubtle', 3],
  ['colorBackgroundSurfaceSelectedActive', 'colorBackgroundSurfaceSubtle', 1.5],
] as const satisfies readonly ContrastPair[];

function cssVariableName(name: keyof VfThemeTokens) {
  return Object.keys(themeTokensToCssVars({ [name]: 'unused' }))[0];
}

function resolveCssVariable(variables: Record<string, string>, name: string, seen = new Set<string>()): string {
  if (seen.has(name)) {
    throw new Error(`Circular CSS variable reference: ${name}`);
  }

  const value = variables[name];
  if (value === undefined) {
    throw new Error(`Missing CSS variable: ${name}`);
  }

  const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);
  return reference ? resolveCssVariable(variables, reference[1], new Set(seen).add(name)) : value;
}

function parseOklch(value: string) {
  const match = value.match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)$/);
  if (!match) {
    throw new Error(`Expected a resolved OKLCH color, received: ${value}`);
  }

  return {
    lightness: Number(match[1]) / 100,
    chroma: Number(match[2]),
    hue: (Number(match[3]) * Math.PI) / 180,
  };
}

function oklchToLinearSrgb(value: string) {
  const { lightness, chroma, hue } = parseOklch(value);
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ] as const;
}

function relativeLuminance(value: string) {
  const [red, green, blue] = oklchToLinearSrgb(value);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function resolvedSemanticColor(variables: Record<string, string>, name: VfSemanticColorTokenName) {
  return resolveCssVariable(variables, cssVariableName(name));
}

describe('semantic color contrast', () => {
  const config = resolveThemeConfig();
  const modes = [
    ['light', themeTokensToCssVars(config.preset.light)],
    ['dark', themeTokensToCssVars(config.preset.dark)],
  ] as const;

  it('keeps every authored primitive inside the sRGB gamut used by the contrast contract', () => {
    for (const [name, value] of Object.entries(config.preset.light).filter(([name]) => name.startsWith('palette'))) {
      const channels = oklchToLinearSrgb(value);

      for (const [index, channel] of channels.entries()) {
        expect(channel, `${name} channel ${index}`).toBeGreaterThanOrEqual(-0.0001);
        expect(channel, `${name} channel ${index}`).toBeLessThanOrEqual(1.0001);
      }
    }
  });

  it.each(modes)('meets the allowed semantic text pairings in %s mode', (mode, variables) => {
    for (const [foregroundName, backgroundName, minimum] of textContrastPairs) {
      const foreground = resolvedSemanticColor(variables, foregroundName);
      const background = resolvedSemanticColor(variables, backgroundName);

      expect(
        contrastRatio(foreground, background),
        `${mode}: ${foregroundName} on ${backgroundName}`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });

  it.each(modes)('meets the allowed semantic UI boundary pairings in %s mode', (mode, variables) => {
    for (const [foregroundName, backgroundName, minimum] of uiContrastPairs) {
      const foreground = resolvedSemanticColor(variables, foregroundName);
      const background = resolvedSemanticColor(variables, backgroundName);

      expect(
        contrastRatio(foreground, background),
        `${mode}: ${foregroundName} on ${backgroundName}`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });

  it.each(modes)('meets the concrete component text pairings in %s mode', (mode, variables) => {
    const chromaticSurfacePairs = [
      ['colorTextPrimary', 'colorInteractivePrimarySubtleBackground', 4.5],
      ['colorTextSecondary', 'colorInteractivePrimarySubtleBackground', 4.5],
      ...statusNames.flatMap(
        (status) =>
          [
            ['colorTextPrimary', `colorStatus${status}SubtleBackground`, 4.5],
            ['colorTextSecondary', `colorStatus${status}SubtleBackground`, 4.5],
          ] as const satisfies readonly ContrastPair[],
      ),
    ] as const satisfies readonly ContrastPair[];

    for (const [foregroundName, backgroundName, minimum] of [...componentTextContrastPairs, ...chromaticSurfacePairs]) {
      const foreground = resolvedSemanticColor(variables, foregroundName);
      const background = resolvedSemanticColor(variables, backgroundName);

      expect(
        contrastRatio(foreground, background),
        `${mode}: ${foregroundName} on ${backgroundName}`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });

  it.each(modes)('meets the concrete component boundary pairings in %s mode', (mode, variables) => {
    const neutralTagPairs = statusNames.flatMap(
      (status) =>
        [
          [`colorStatus${status}SubtleForeground`, 'colorBackgroundSurfaceSubtle', 4.5],
          [`colorStatus${status}Border`, 'colorBackgroundSurfaceSubtle', 3],
        ] as const satisfies readonly ContrastPair[],
    );

    for (const [foregroundName, backgroundName, minimum] of [...componentUiContrastPairs, ...neutralTagPairs]) {
      const foreground = resolvedSemanticColor(variables, foregroundName);
      const background = resolvedSemanticColor(variables, backgroundName);

      expect(
        contrastRatio(foreground, background),
        `${mode}: ${foregroundName} on ${backgroundName}`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });

  it.each(modes)('keeps switch thumb icons distinguishable in %s mode', (mode, variables) => {
    const pairs = [
      ['switchThumbColor', 'switchThumbBackground'],
      ['switchThumbCheckedColor', 'switchThumbCheckedBackground'],
      ['switchThumbInverseColor', 'switchThumbInverseBackground'],
    ] as const satisfies readonly (readonly [keyof VfThemeTokens, keyof VfThemeTokens])[];

    for (const [foregroundName, backgroundName] of pairs) {
      const foreground = resolveCssVariable(variables, cssVariableName(foregroundName));
      const background = resolveCssVariable(variables, cssVariableName(backgroundName));

      expect(
        contrastRatio(foreground, background),
        `${mode}: ${foregroundName} on ${backgroundName}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(modes)('keeps the actual CodeBlock semantic adapter pairings readable in %s mode', (mode, variables) => {
    const background = resolvedSemanticColor(variables, 'colorBackgroundSurfaceSubtle');

    for (const foregroundName of codeBlockSyntaxForegroundNames) {
      const foreground = resolvedSemanticColor(variables, foregroundName);

      expect(
        contrastRatio(foreground, background),
        `${mode}: CodeBlock ${foregroundName} on colorBackgroundSurfaceSubtle`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    const selectionForeground = resolvedSemanticColor(variables, 'colorTextPrimary');
    const selectionBackground = resolvedSemanticColor(variables, 'colorBackgroundSurfaceSelectedActive');

    expect(
      contrastRatio(selectionForeground, selectionBackground),
      `${mode}: CodeBlock selection foreground`,
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(selectionBackground, background),
      `${mode}: CodeBlock selection against editor surface`,
    ).toBeGreaterThanOrEqual(1.5);
  });

  it.each(modes)('meets solid, subtle, hover, active, and border status pairings in %s mode', (mode, variables) => {
    for (const status of statusNames) {
      const pairs = [
        [`colorStatus${status}SolidForeground`, `colorStatus${status}SolidBackground`, 4.5],
        [`colorStatus${status}SolidForeground`, `colorStatus${status}HoverBackground`, 4.5],
        [`colorStatus${status}SolidForeground`, `colorStatus${status}ActiveBackground`, 4.5],
        [`colorStatus${status}SubtleForeground`, `colorStatus${status}SubtleBackground`, 4.5],
        [`colorStatus${status}Icon`, `colorStatus${status}SubtleBackground`, 3],
        [`colorStatus${status}Icon`, 'colorBackgroundSurfaceDisabled', 3],
        [`colorStatus${status}Border`, `colorStatus${status}SubtleBackground`, 3],
        [statusProgressValueNames[status], 'colorBackgroundSurfaceDisabled', 3],
      ] as const satisfies readonly ContrastPair[];

      for (const [foregroundName, backgroundName, minimum] of pairs) {
        const foreground = resolvedSemanticColor(variables, foregroundName);
        const background = resolvedSemanticColor(variables, backgroundName);

        expect(
          contrastRatio(foreground, background),
          `${mode}: ${foregroundName} on ${backgroundName}`,
        ).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  it.each(modes)('keeps supported interactive state materials independent in %s mode', (mode, variables) => {
    const sequences = [
      ...interactiveStateSequences,
      ...statusNames.map(
        (status) =>
          [
            `colorStatus${status}SolidBackground`,
            `colorStatus${status}HoverBackground`,
            `colorStatus${status}ActiveBackground`,
          ] as const satisfies readonly VfSemanticColorTokenName[],
      ),
    ];

    for (const sequence of sequences) {
      const resolvedValues = sequence.map((name) => resolvedSemanticColor(variables, name));

      expect(new Set(resolvedValues).size, `${mode}: ${sequence.join(' -> ')}`).toBe(sequence.length);
    }
  });
});
