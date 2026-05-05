// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import {
  applyThemeConfig,
  applyThemeConfigs,
  resolveThemeConfig,
  resolveThemePreset,
  themeConfigsToCssText,
  themePresetToCssText,
  themeTokensToCssVars,
} from '../src';
import type { VfThemeTokens } from '../src';
import { createTestThemePreset } from './helpers';

const testPreset = createTestThemePreset({
  name: 'test-preset',
  tokens: {
    colorPrimary: '#0b63f6',
    colorSurface: '#ffffff',
    controlHeightMd: '2.25rem',
  },
  dark: {
    colorPrimary: '#6ea8fe',
  },
});

describe('theme runtime', () => {
  afterEach(() => {
    document.getElementById('vf-theme-preset')?.remove();
    document.getElementById('vf-test-theme')?.remove();
    document.getElementById('vf-test-theme-2')?.remove();
  });

  it('serializes theme tokens to css variables', () => {
    const tokensWithDigitSuffixes = {
      colorPrimary: '#ff5a36',
      controlHeightMd: '2.5rem',
      breakpoint2xl: '1536px',
      fontSize2xl: '1.125rem',
    } as Record<string, string>;

    const cssVars = themeTokensToCssVars(tokensWithDigitSuffixes as Partial<VfThemeTokens>, 'vf');

    expect(cssVars['--vf-color-primary']).toBe('#ff5a36');
    expect(cssVars['--vf-control-height-md']).toBe('2.5rem');
    expect(cssVars['--vf-breakpoint-2xl']).toBe('1536px');
    expect(cssVars['--vf-font-size-2xl']).toBe('1.125rem');
    expect(cssVars).not.toHaveProperty('--vf-breakpoint2xl');
    expect(cssVars).not.toHaveProperty('--vf-font-size2xl');
  });

  it('resolves light and dark theme tokens from a custom preset', () => {
    const preset = resolveThemePreset({
      preset: testPreset,
      extend: {
        colorPrimary: '#ff5a36',
      },
      dark: {
        colorPrimary: '#ff8f70',
      },
    });

    expect(preset.light.colorPrimary).toBe('#ff5a36');
    expect(preset.dark.colorPrimary).toBe('#ff8f70');
    expect(preset.light.controlHeightMd).toBe('2.25rem');
  });

  it('builds light and dark css text from a resolved config', () => {
    const lightExtend = {
      colorPrimary: '#ff5a36',
      breakpoint2xl: '1536px',
      fontSize2xl: '1.125rem',
    } as Record<string, string>;
    const darkExtend = {
      colorPrimary: '#ff8f70',
      breakpoint2xl: '1600px',
      fontSize2xl: '1.25rem',
    } as Record<string, string>;

    const config = resolveThemeConfig({
      preset: testPreset,
      extend: lightExtend as Partial<VfThemeTokens>,
      dark: darkExtend as Partial<VfThemeTokens>,
      options: {
        styleId: 'vf-test-theme',
      },
    });

    const cssText = themePresetToCssText(config);

    expect(cssText).toContain(':root');
    expect(cssText).toContain(":root[data-vf-theme='dark']");
    expect(cssText).toContain('--vf-color-primary: #ff5a36;');
    expect(cssText).toContain('--vf-color-primary: #ff8f70;');
    expect(cssText).toContain('--vf-breakpoint-2xl: 1536px;');
    expect(cssText).toContain('--vf-breakpoint-2xl: 1600px;');
    expect(cssText).toContain('--vf-font-size-2xl: 1.125rem;');
    expect(cssText).toContain('--vf-font-size-2xl: 1.25rem;');
    expect(cssText).not.toContain('--vf-breakpoint2xl');
    expect(cssText).not.toContain('--vf-font-size2xl');
  });

  it('builds combined css text from multiple resolved configs', () => {
    const configs = [
      resolveThemeConfig({
        preset: testPreset,
        extend: {
          colorPrimary: '#ff5a36',
        },
        options: {
          styleId: 'vf-test-theme',
        },
      }),
      resolveThemeConfig({
        preset: testPreset,
        extend: {
          colorSurface: '#f5f7fb',
        },
        options: {
          prefix: 'vf-layouts',
          styleId: 'vf-test-theme-2',
        },
      }),
    ];

    const cssText = themeConfigsToCssText(configs);

    expect(cssText).toContain('--vf-color-primary: #ff5a36;');
    expect(cssText).toContain('--vf-layouts-color-surface: #f5f7fb;');
  });

  it('injects a style tag with resolved theme variables', () => {
    const lightExtend = {
      colorPrimary: '#ff5a36',
      breakpoint2xl: '1536px',
      fontSize2xl: '1.125rem',
    } as Record<string, string>;

    const style = applyThemeConfig(
      resolveThemeConfig({
        preset: testPreset,
        extend: lightExtend as Partial<VfThemeTokens>,
        options: {
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(style.id).toBe('vf-test-theme');
    expect(style.textContent).toContain('--vf-color-primary: #ff5a36;');
    expect(style.textContent).toContain('--vf-breakpoint-2xl: 1536px;');
    expect(style.textContent).toContain('--vf-font-size-2xl: 1.125rem;');
    expect(style.textContent).not.toContain('--vf-breakpoint2xl');
    expect(style.textContent).not.toContain('--vf-font-size2xl');
    expect(document.getElementById('vf-test-theme')).toBe(style);
  });

  it('injects multiple style tags grouped by style id', () => {
    const styles = applyThemeConfigs([
      resolveThemeConfig({
        preset: testPreset,
        extend: {
          colorPrimary: '#ff5a36',
        },
        options: {
          styleId: 'vf-test-theme',
        },
      }),
      resolveThemeConfig({
        preset: testPreset,
        extend: {
          colorSurface: '#f5f7fb',
        },
        options: {
          prefix: 'vf-layouts',
          styleId: 'vf-test-theme-2',
        },
      }),
      resolveThemeConfig({
        preset: testPreset,
        dark: {
          colorPrimary: '#ff8f70',
        },
        options: {
          styleId: 'vf-test-theme',
        },
      }),
    ]);

    expect(styles).toHaveLength(2);
    expect(document.getElementById('vf-test-theme')?.textContent).toContain('--vf-color-primary: #ff5a36;');
    expect(document.getElementById('vf-test-theme')?.textContent).toContain('--vf-color-primary: #ff8f70;');
    expect(document.getElementById('vf-test-theme-2')?.textContent).toContain('--vf-layouts-color-surface: #f5f7fb;');
  });
});
