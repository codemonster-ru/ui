import { describe, expect, it } from 'vitest';
import { createCssVariablesTheme } from '@shikijs/core';
import {
  VUEFORGE_CODE_SELECTION_FALLBACKS,
  VUEFORGE_CODE_THEME_FALLBACKS,
  VUEFORGE_SHIKI_DARK_THEME_NAME,
  VUEFORGE_SHIKI_LIGHT_THEME_NAME,
  createVueForgeShikiTheme,
} from './vueforge';

type Oklch = readonly [lightness: number, chroma: number, hue: number];

const parseOklch = (value: string): Oklch => {
  const match = value.match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)$/);

  if (!match) {
    throw new Error(`Unsupported OKLCH test value: ${value}`);
  }

  return [Number(match[1]) / 100, Number(match[2]), Number(match[3])];
};

const toLinearSrgb = ([lightness, chroma, hue]: Oklch) => {
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const l = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s = lightness - 0.0894841775 * a - 1.291485548 * b;

  return [
    4.0767416621 * l ** 3 - 3.3077115913 * m ** 3 + 0.2309699292 * s ** 3,
    -1.2684380046 * l ** 3 + 2.6097574011 * m ** 3 - 0.3413193965 * s ** 3,
    -0.0041960863 * l ** 3 - 0.7034186147 * m ** 3 + 1.707614701 * s ** 3,
  ] as const;
};

const relativeLuminance = (value: string) => {
  const [red, green, blue] = toLinearSrgb(parseOklch(value));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

describe('VueForge Shiki themes', () => {
  it.each(Object.entries(VUEFORGE_CODE_THEME_FALLBACKS))(
    'keeps every %s syntax fallback in sRGB gamut and at least 4.5:1 against its editor background',
    (_mode, colors) => {
      for (const [role, value] of Object.entries(colors)) {
        const channels = toLinearSrgb(parseOklch(value));
        channels.forEach((channel) => {
          expect(channel, `${role} must stay in the sRGB gamut`).toBeGreaterThanOrEqual(0);
          expect(channel, `${role} must stay in the sRGB gamut`).toBeLessThanOrEqual(1);
        });

        if (role !== 'background') {
          expect(contrastRatio(value, colors.background), role).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps the %s selection readable and distinct from the editor surface',
    (mode) => {
      const colors = VUEFORGE_CODE_SELECTION_FALLBACKS[mode];

      expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.background, VUEFORGE_CODE_THEME_FALLBACKS[mode].background)).toBeGreaterThanOrEqual(
        1.5,
      );
    },
  );

  it('uses package-owned names and semantic CSS-variable adapters', () => {
    const lightTheme = createVueForgeShikiTheme('light', createCssVariablesTheme);
    const darkTheme = createVueForgeShikiTheme('dark', createCssVariablesTheme);

    expect(lightTheme.name).toBe(VUEFORGE_SHIKI_LIGHT_THEME_NAME);
    expect(lightTheme.type).toBe('light');
    expect(darkTheme.name).toBe(VUEFORGE_SHIKI_DARK_THEME_NAME);
    expect(darkTheme.type).toBe('dark');
    expect(lightTheme.colors?.['editor.background']).toContain('var(--vf-codeblock-syntax-background');
    expect(darkTheme.colors?.['editor.background']).toContain('var(--vf-codeblock-syntax-background');

    const serializedThemes = JSON.stringify([lightTheme, darkTheme]);
    expect(serializedThemes).toContain('var(--vf-codeblock-syntax-token-comment');
    for (const [syntaxVariable, semanticVariable] of [
      ['background', 'color-background-surface-subtle'],
      ['foreground', 'color-text-primary'],
      ['token-comment', 'color-text-secondary'],
      ['token-string', 'color-status-success-subtle-foreground'],
      ['token-constant', 'color-text-link'],
      ['token-keyword', 'color-status-danger-subtle-foreground'],
      ['token-parameter', 'color-status-warning-subtle-foreground'],
      ['token-function', 'color-status-help-subtle-foreground'],
      ['token-string-expression', 'color-status-info-subtle-foreground'],
      ['token-punctuation', 'color-text-secondary'],
      ['token-link', 'color-text-link'],
      ['token-inserted', 'color-status-success-subtle-foreground'],
      ['token-deleted', 'color-status-danger-subtle-foreground'],
      ['token-changed', 'color-status-warning-subtle-foreground'],
      ['ansi-black', 'color-text-primary'],
      ['ansi-red', 'color-status-danger-subtle-foreground'],
      ['ansi-green', 'color-status-success-subtle-foreground'],
      ['ansi-yellow', 'color-status-warning-subtle-foreground'],
      ['ansi-blue', 'color-text-link'],
      ['ansi-magenta', 'color-status-help-subtle-foreground'],
      ['ansi-cyan', 'color-status-info-subtle-foreground'],
      ['ansi-white', 'color-text-primary'],
      ['ansi-bright-black', 'color-text-secondary'],
      ['ansi-bright-red', 'color-status-danger-subtle-foreground'],
      ['ansi-bright-green', 'color-status-success-subtle-foreground'],
      ['ansi-bright-yellow', 'color-status-warning-subtle-foreground'],
      ['ansi-bright-blue', 'color-text-link'],
      ['ansi-bright-magenta', 'color-status-help-subtle-foreground'],
      ['ansi-bright-cyan', 'color-status-info-subtle-foreground'],
      ['ansi-bright-white', 'color-text-primary'],
    ]) {
      expect(serializedThemes).toContain(`var(--vf-codeblock-syntax-${syntaxVariable}, var(--vf-${semanticVariable},`);
    }
    expect(serializedThemes).toContain('oklch(');
    for (const legacyVariable of [
      'color-surface-muted',
      'color-text',
      'color-muted',
      'color-success',
      'color-primary',
      'color-danger',
      'color-warn',
      'color-help',
      'color-info',
    ]) {
      expect(serializedThemes).not.toContain(`var(--vf-${legacyVariable},`);
    }
    expect(serializedThemes).not.toContain('github-light');
    expect(serializedThemes).not.toContain('github-dark');
  });
});
