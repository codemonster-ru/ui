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
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
} from '../src';
import type { VfThemeTokens } from '../src';
import { createTestThemePreset } from './helpers';

const testPreset = createTestThemePreset({
  name: 'test-preset',
  tokens: {
    colorMuted: '#5f6673',
    colorPrimary: '#0b63f6',
    colorPrimarySoft: 'var(--vf-color-muted)',
    colorSurface: '#ffffff',
    controlHeightMd: '2.25rem',
  },
  dark: {
    colorMuted: '#a0a5ae',
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

  it('exports the complete primitive and semantic color token contracts', () => {
    expect(vfPrimitiveColorTokenNames).toHaveLength(66);
    expect(new Set(vfPrimitiveColorTokenNames)).toHaveProperty('size', 66);
    expect(vfPrimitiveColorTokenNames).toContain('paletteNeutral1000');
    expect(vfPrimitiveColorTokenNames).toContain('palettePrimary100');
    expect(vfPrimitiveColorTokenNames).toContain('paletteWarning950');
    expect(vfPrimitiveColorTokenNames).toContain('paletteHelp900');

    expect(vfSemanticColorTokenNames).toHaveLength(85);
    expect(new Set(vfSemanticColorTokenNames)).toHaveProperty('size', 85);
    expect(vfSemanticColorTokenNames).toContain('colorFocusRing');
    expect(vfSemanticColorTokenNames).toContain('colorBackgroundSurfaceSelectedHover');
    expect(vfSemanticColorTokenNames).toContain('colorTextLinkActive');
    expect(vfSemanticColorTokenNames).toContain('colorInteractivePrimarySubtleForeground');
    expect(vfSemanticColorTokenNames).toContain('colorStatusHelpActiveBackground');
  });

  it('serializes primitive and semantic color tokens with a custom prefix', () => {
    const cssVars = themeTokensToCssVars(
      {
        paletteNeutral50: '#f6f8fb',
        paletteWarning950: '#1f1300',
        colorBackgroundCanvas: 'var(--brand-palette-neutral-50)',
        colorInteractivePrimaryBackground: 'var(--brand-palette-primary-600)',
        colorStatusWarningSolidForeground: 'var(--brand-palette-warning-950)',
      },
      'brand',
    );

    expect(cssVars['--brand-palette-neutral-50']).toBe('#f6f8fb');
    expect(cssVars['--brand-palette-warning-950']).toBe('#1f1300');
    expect(cssVars['--brand-color-background-canvas']).toBe('var(--brand-palette-neutral-50)');
    expect(cssVars['--brand-color-interactive-primary-background']).toBe('var(--brand-palette-primary-600)');
    expect(cssVars['--brand-color-status-warning-solid-foreground']).toBe('var(--brand-palette-warning-950)');
  });

  it('emits primitive and semantic color tokens through the resolved runtime config', () => {
    const config = resolveThemeConfig({
      preset: createTestThemePreset({
        tokens: {
          palettePrimary500: '#276cb5',
          palettePrimary600: '#0e639c',
          colorInteractivePrimaryBackground: 'var(--brand-palette-primary-600)',
        },
        dark: {
          colorInteractivePrimaryBackground: 'var(--brand-palette-primary-500)',
        },
      }),
      options: {
        prefix: 'brand',
      },
    });

    const cssText = themePresetToCssText(config);

    expect(cssText.match(/--brand-palette-primary-500: #276cb5;/g)).toHaveLength(4);
    expect(cssText.match(/--brand-palette-primary-600: #0e639c;/g)).toHaveLength(4);
    expect(
      cssText.match(/--brand-color-interactive-primary-background: var\(--brand-palette-primary-600\);/g),
    ).toHaveLength(2);
    expect(
      cssText.match(/--brand-color-interactive-primary-background: var\(--brand-palette-primary-500\);/g),
    ).toHaveLength(2);
    expect(cssText).not.toContain('--vf-palette-primary-600');
  });

  it('preserves adjacent acronym and word boundaries in css variable names', () => {
    const cssVars = themeTokensToCssVars(
      {
        fieldFloatingLabelTranslateYDefault: '-50%',
        fieldFloatingLabelActiveTranslateYDefault: '-100%',
        drawerOffsetXRest: '0',
        drawerOffsetYBottom: '100%',
        commandPaletteItemTitleIconOffsetYDefault: '-1px',
      } as Partial<VfThemeTokens>,
      'vf',
    );

    expect(cssVars['--vf-field-floating-label-translate-y-default']).toBe('-50%');
    expect(cssVars['--vf-field-floating-label-active-translate-y-default']).toBe('-100%');
    expect(cssVars['--vf-drawer-offset-x-rest']).toBe('0');
    expect(cssVars['--vf-drawer-offset-y-bottom']).toBe('100%');
    expect(cssVars['--vf-command-palette-item-title-icon-offset-y-default']).toBe('-1px');
    expect(cssVars).not.toHaveProperty('--vf-field-floating-label-translate-ydefault');
    expect(cssVars).not.toHaveProperty('--vf-field-floating-label-active-translate-ydefault');
    expect(cssVars).not.toHaveProperty('--vf-drawer-offset-xrest');
    expect(cssVars).not.toHaveProperty('--vf-drawer-offset-ybottom');
    expect(cssVars).not.toHaveProperty('--vf-command-palette-item-title-icon-offset-ydefault');
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
    expect(cssText).toContain('color-scheme: light;');
    expect(cssText).toContain('color-scheme: dark;');
    expect(cssText).toContain('--vf-color-primary: #ff5a36;');
    expect(cssText).toContain('--vf-color-primary: #ff8f70;');
    expect(cssText).toContain('--vf-breakpoint-2xl: 1536px;');
    expect(cssText).toContain('--vf-breakpoint-2xl: 1600px;');
    expect(cssText).toContain('--vf-font-size-2xl: 1.125rem;');
    expect(cssText).toContain('--vf-font-size-2xl: 1.25rem;');
    expect(cssText).not.toContain('--vf-breakpoint2xl');
    expect(cssText).not.toContain('--vf-font-size2xl');
  });

  it('emits reversible light and dark variables for nested theme boundaries', () => {
    const config = resolveThemeConfig({
      preset: testPreset,
      light: {
        colorPrimary: '#ff5a36',
      },
      dark: {
        colorPrimary: '#ff8f70',
      },
      options: {
        rootSelector: '#theme-root',
        attribute: 'data-brand-theme',
      },
    });

    const cssText = themePresetToCssText(config);

    expect(cssText).toContain(
      ":is(#theme-root):where([data-brand-theme='light'], [data-theme='light'], [data-vf-theme='light'])",
    );
    expect(cssText).toContain(
      ":where(#theme-root) :where([data-brand-theme='light'], [data-theme='light'], [data-vf-theme='light'])",
    );
    expect(cssText).toContain(
      ":is(#theme-root):where([data-brand-theme='dark'], [data-theme='dark'], [data-vf-theme='dark'])",
    );
    expect(cssText).toContain(
      ":where(#theme-root) :where([data-brand-theme='dark'], [data-theme='dark'], [data-vf-theme='dark'])",
    );
    expect(cssText).toContain(':where(#theme-root)');
    expect(cssText).toContain("[data-brand-theme='light']");
    expect(cssText).toContain("[data-brand-theme='dark']");
    expect(cssText).toContain("[data-theme='light']");
    expect(cssText).toContain("[data-theme='dark']");
    expect(cssText).toContain("[data-vf-theme='light']");
    expect(cssText).toContain("[data-vf-theme='dark']");
    expect(cssText.match(/--vf-color-primary: #ff5a36;/g)).toHaveLength(2);
    expect(cssText.match(/--vf-color-primary: #ff8f70;/g)).toHaveLength(2);
    expect(cssText.match(/--vf-control-height-md: 2.25rem;/g)).toHaveLength(4);
    expect(cssText.match(/--vf-color-primary-soft: var\(--vf-color-muted\);/g)).toHaveLength(4);
    expect(cssText.match(/color-scheme: light;/g)).toHaveLength(2);
    expect(cssText.match(/color-scheme: dark;/g)).toHaveLength(2);
  });

  it('resolves compatible root-self and nested inverse mode boundaries in the cascade', () => {
    const themeRoot = document.createElement('section');
    const lightBoundary = document.createElement('div');
    const darkBoundary = document.createElement('div');

    themeRoot.id = 'theme-root';
    themeRoot.dataset.theme = 'dark';
    lightBoundary.dataset.vfTheme = 'light';
    darkBoundary.setAttribute('data-brand-theme', 'dark');
    lightBoundary.appendChild(darkBoundary);
    themeRoot.appendChild(lightBoundary);
    document.body.appendChild(themeRoot);

    applyThemeConfig(
      resolveThemeConfig({
        preset: testPreset,
        light: {
          colorPrimary: '#ff5a36',
        },
        dark: {
          colorPrimary: '#ff8f70',
        },
        options: {
          rootSelector: '#theme-root',
          attribute: 'data-brand-theme',
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-primary')).toBe('#ff8f70');
    expect(getComputedStyle(lightBoundary).getPropertyValue('--vf-color-primary')).toBe('#ff5a36');
    expect(getComputedStyle(darkBoundary).getPropertyValue('--vf-color-primary')).toBe('#ff8f70');
    expect(getComputedStyle(themeRoot).colorScheme).toBe('dark');
    expect(getComputedStyle(lightBoundary).colorScheme).toBe('light');
    expect(getComputedStyle(darkBoundary).colorScheme).toBe('dark');
    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-muted')).toBe('#a0a5ae');
    expect(getComputedStyle(lightBoundary).getPropertyValue('--vf-color-muted')).toBe('#5f6673');
    expect(getComputedStyle(darkBoundary).getPropertyValue('--vf-color-muted')).toBe('#a0a5ae');

    themeRoot.dataset.theme = 'light';

    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-primary')).toBe('#ff5a36');
    expect(getComputedStyle(themeRoot).colorScheme).toBe('light');
    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-muted')).toBe('#5f6673');

    themeRoot.remove();
  });

  it('lets an explicit light boundary override a custom root dark selector', () => {
    const themeRoot = document.createElement('section');
    themeRoot.id = 'theme-root';
    themeRoot.className = 'dark';
    themeRoot.setAttribute('data-brand-theme', 'light');
    document.body.appendChild(themeRoot);

    applyThemeConfig(
      resolveThemeConfig({
        preset: testPreset,
        light: { colorPrimary: '#ff5a36' },
        dark: { colorPrimary: '#ff8f70' },
        options: {
          rootSelector: '#theme-root',
          darkModeSelector: '#theme-root.dark',
          attribute: 'data-brand-theme',
          styleId: 'vf-test-theme',
        },
      }),
    );

    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-primary')).toBe('#ff5a36');
    expect(getComputedStyle(themeRoot).colorScheme).toBe('light');

    themeRoot.setAttribute('data-brand-theme', 'dark');

    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-primary')).toBe('#ff8f70');
    expect(getComputedStyle(themeRoot).colorScheme).toBe('dark');

    themeRoot.remove();
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
