import { afterEach, describe, expect, it } from 'vitest';
import { applyThemeConfig, defaultThemePreset, resolveThemeConfig, themeTokensToCssVars } from '@/theme';

describe('theme bridge', () => {
  afterEach(() => {
    document.getElementById('vf-test-theme')?.remove();
  });

  it('uses core defaultThemePreset when preset is omitted', () => {
    const config = resolveThemeConfig({
      extend: {
        colorInteractivePrimaryBackground:
          'color-mix(in srgb, var(--vf-color-status-info-solid-background) 80%, var(--vf-color-text-primary))',
      },
      options: {
        styleId: 'vf-test-theme',
      },
    });

    expect(config.preset.name).toBe(defaultThemePreset.name);
    expect(config.preset.light.colorInteractivePrimaryBackground).toBe(
      'color-mix(in srgb, var(--vf-color-status-info-solid-background) 80%, var(--vf-color-text-primary))',
    );
    expect(config.preset.light.controlHeightMd).toBe(defaultThemePreset.tokens.controlHeightMd);
    expect(config.preset.light.paletteNeutral50).toBe('oklch(97.8% 0.005 260)');
    expect(config.preset.dark.paletteNeutral50).toBe('oklch(97.8% 0.005 260)');
    expect(config.preset.light.colorBackgroundCanvas).toBe('var(--vf-palette-neutral-50)');
    expect(config.preset.dark.colorBackgroundCanvas).toBe('var(--vf-palette-neutral-900)');
    expect(config.preset.dark.colorBackgroundSurface).toBe('var(--vf-palette-neutral-850)');
    expect(config.preset.dark.colorBackgroundSurfaceSubtle).toBe('var(--vf-palette-neutral-800)');
    expect(config.preset.dark.colorBorderDefault).toBe('var(--vf-palette-neutral-600)');
    expect(config.preset.dark.colorInteractivePrimaryBackground).toBe(
      'color-mix(in srgb, var(--vf-color-status-info-solid-background) 80%, var(--vf-color-text-primary))',
    );
    expect(config.preset.light.colorStatusWarningSolidForeground).toBe('var(--vf-palette-warning-950)');
    expect(config.preset.dark.colorStatusWarningSolidForeground).toBe('var(--vf-palette-warning-950)');
    expect(config.preset.light.colorBackgroundSurfaceSelectedHover).toBe('var(--vf-palette-primary-200)');
    expect(config.preset.dark.colorBackgroundSurfaceSelectedHover).toBe('var(--vf-palette-primary-800)');
    expect(config.preset.light.colorTextLink).toBe('var(--vf-palette-primary-700)');
    expect(config.preset.dark.colorTextLink).toBe('var(--vf-palette-primary-300)');
    expect(config.preset.dark.fieldBackground).toBe('var(--vf-color-background-surface)');

    expect(defaultThemePreset.tokens.selectableColor).toBe('var(--vf-color-text-secondary)');
    expect(defaultThemePreset.tokens.selectableHoverBackground).toBe(
      'var(--vf-color-background-surface-hover, transparent)',
    );
    expect(defaultThemePreset.tokens.selectableActiveBackground).toBe('var(--vf-color-background-surface-selected)');
    expect(defaultThemePreset.tokens.breadcrumbsLinkColor).toBe(
      'var(--vf-color-text-link, var(--vf-selectable-color))',
    );
    expect(defaultThemePreset.tokens.tabsTabActiveColor).toBe('var(--vf-color-selected-foreground)');
    expect(defaultThemePreset.tokens.badgeSuccessColor).toBe('var(--vf-color-status-success-subtle-foreground)');
    expect(defaultThemePreset.tokens.fieldHoverBorderColor).toBe('var(--vf-color-interactive-primary-border)');
    expect(defaultThemePreset.tokens.textLinkHoverColor).toBe('var(--vf-color-text-link-hover)');
    expect(defaultThemePreset.tokens.stepperCompleteMarkerBackground).toBe(
      'var(--vf-color-interactive-primary-background)',
    );
    expect(defaultThemePreset.tokens.stepperFocusRingColor).toBe('var(--vf-color-focus-ring)');

    expect(defaultThemePreset.tokens.avatarSizeMd).toBe('2.25rem');
    expect(defaultThemePreset.tokens.controlFontSizeLg).toBe('var(--vf-font-size-2xl)');
    expect(defaultThemePreset.tokens.controlLineHeight).toBe('var(--vf-text-label-line-height)');
    expect(defaultThemePreset.tokens.avatarFontSizeLg).toBe('var(--vf-font-size-3xl)');
  });

  it('applies resolved theme variables through the bridge API', () => {
    const style = applyThemeConfig(
      resolveThemeConfig({
        extend: {
          colorInteractivePrimaryBackground:
            'color-mix(in srgb, var(--vf-color-status-info-solid-background) 80%, var(--vf-color-text-primary))',
        },
        options: {
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(style.id).toBe('vf-test-theme');
    expect(style.textContent).toContain(
      '--vf-color-interactive-primary-background: color-mix(in srgb, var(--vf-color-status-info-solid-background) 80%, var(--vf-color-text-primary));',
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

  it('bridges a custom runtime prefix back to the canonical component namespace', () => {
    const style = applyThemeConfig(
      resolveThemeConfig({
        extend: {
          colorInteractivePrimaryBackground: '#123456',
          palettePrimary500: '#234567',
        },
        options: {
          prefix: 'brand',
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(style.textContent).toContain('--brand-color-interactive-primary-background: #123456;');
    expect(style.textContent).toContain(
      '--vf-color-interactive-primary-background: var(--brand-color-interactive-primary-background);',
    );
    expect(style.textContent).toContain('--vf-selectable-color: var(--brand-selectable-color);');
    expect(style.textContent).toContain('--brand-palette-primary-500: #234567;');
    expect(style.textContent).toContain('--vf-palette-primary-500: var(--brand-palette-primary-500);');
  });
});
