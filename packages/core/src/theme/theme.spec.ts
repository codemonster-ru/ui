import { afterEach, describe, expect, it } from 'vitest';
import { applyThemeConfig, defaultThemePreset, resolveThemeConfig, themeTokensToCssVars } from '@/theme';

describe('theme bridge', () => {
  afterEach(() => {
    document.getElementById('vf-test-theme')?.remove();
  });

  it('uses core defaultThemePreset when preset is omitted', () => {
    const config = resolveThemeConfig({
      extend: {
        colorPrimary: 'color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text))',
      },
      options: {
        styleId: 'vf-test-theme',
      },
    });

    expect(config.preset.name).toBe(defaultThemePreset.name);
    expect(config.preset.light.colorPrimary).toBe('color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text))');
    expect(config.preset.light.controlHeightMd).toBe(defaultThemePreset.tokens.controlHeightMd);
    expect(defaultThemePreset.tokens.selectableColor).toBe('var(--vf-color-muted)');
    expect(defaultThemePreset.tokens.navMenuItemColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.navMenuTopItemFontWeight).toBe('var(--vf-text-label-font-weight)');
    expect(defaultThemePreset.tokens.navMenuBranchColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.menuBarTopItemFontWeight).toBe('var(--vf-text-label-font-weight)');
    expect(defaultThemePreset.tokens.breadcrumbsCurrentColor).toBe('var(--vf-selectable-active-color)');
    expect(defaultThemePreset.tokens.selectOptionColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.selectOptionActiveColor).toBe('var(--vf-selectable-active-color)');
    expect(defaultThemePreset.tokens.tableOfContentsPillsActiveBackground).toBe(
      'var(--vf-selectable-active-background)',
    );
  });

  it('applies resolved theme variables through the bridge API', () => {
    const style = applyThemeConfig(
      resolveThemeConfig({
        extend: {
          colorPrimary: 'color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text))',
        },
        options: {
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(style.id).toBe('vf-test-theme');
    expect(style.textContent).toContain(
      '--vf-color-primary: color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text));',
    );
    expect(style.textContent).toContain('--vf-breakpoint-2xl: 1536px;');
    expect(style.textContent).not.toContain('--vf-breakpoint2xl:');
    expect(document.getElementById('vf-test-theme')).toBe(style);
  });

  it('serializes numeric breakpoint tokens with kebab-case separators', () => {
    const cssVars = themeTokensToCssVars({
      breakpoint2xl: '1536px',
    });

    expect(cssVars['--vf-breakpoint-2xl']).toBe('1536px');
    expect(cssVars['--vf-breakpoint2xl']).toBeUndefined();
  });
});
