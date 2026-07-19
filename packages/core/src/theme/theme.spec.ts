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
    expect(defaultThemePreset.tokens.avatarSizeMd).toBe('2.25rem');
    expect(defaultThemePreset.tokens.controlFontSizeLg).toBe('var(--vf-font-size-2xl)');
    expect(defaultThemePreset.tokens.controlLineHeight).toBe('var(--vf-text-label-line-height)');
    expect(defaultThemePreset.tokens.avatarBackground).toBe('var(--vf-color-surface-muted)');
    expect(defaultThemePreset.tokens.avatarFontSizeLg).toBe('var(--vf-font-size-3xl)');
    expect(defaultThemePreset.tokens.navMenuItemColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.navMenuItemHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuItemHoverBackground).toBe('transparent');
    expect(defaultThemePreset.tokens.navMenuItemActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuItemActiveBackground).toBe('transparent');
    expect(defaultThemePreset.tokens.navMenuItemAncestorActiveColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.navMenuTopItemFontWeight).toBe('var(--vf-text-label-font-weight)');
    expect(defaultThemePreset.tokens.navMenuBranchColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.menuBarTopItemFontWeight).toBe('var(--vf-text-label-font-weight)');
    expect(defaultThemePreset.tokens.breadcrumbsLinkHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.breadcrumbsCurrentColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.selectOptionColor).toBe('var(--vf-selectable-color)');
    expect(defaultThemePreset.tokens.selectOptionActiveColor).toBe('var(--vf-selectable-active-color)');
    expect(defaultThemePreset.tokens.navMenuPillsItemHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuPillsItemHoverBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuPillsItemActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuPillsItemActiveBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuPillsItemAncestorActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuSidebarTopHoverBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarTopAncestorActiveBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 8%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarRailColor).toBe(
      'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarNestedActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.navMenuSidebarRailActiveColor).toBe(
      'color-mix(in srgb, var(--vf-color-text) 42%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarCollapseLevel0Margin).toBe(
      'calc(var(--vf-nav-menu-collapse-inset-level-0-margin) + var(--vf-surface-gap-compact) * 2)',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarIconAlignedLevel0Margin).toBe(
      'calc(var(--vf-border-width) + var(--vf-field-padding-inline-md) + var(--vf-nav-menu-leading-icon-column-size) * 0.5)',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarLevelStep).toBe(
      'calc(var(--vf-nav-menu-leading-icon-column-size) + var(--vf-nav-menu-item-gap) * 0.5)',
    );
    expect(defaultThemePreset.tokens.navMenuSidebarNestedItemOffset).toBe('var(--vf-surface-gap-compact)');
    expect(defaultThemePreset.tokens.navMenuSidebarConnectorOffsetTop).toBe(
      'calc(var(--vf-border-width) + var(--vf-field-padding-block-md) + 0.75rem)',
    );
    expect(defaultThemePreset.tokens.tableOfContentsPillsHoverBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.tableOfContentsPillsActiveBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.menuBarPillsTopOpenBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 8%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.menuBarItemAncestorActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.menuBarTopHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.menuBarTopActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.menuBarSubmenuActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.menuBarPillsSubmenuActiveBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.accordionTriggerHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.accordionTriggerExpandedColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.tabsTabHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.tabsTabActiveColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.tabsIndicatorColor).toBe('var(--vf-color-primary)');
    expect(defaultThemePreset.tokens.fieldHoverBorderColor).toBe(
      'color-mix(in srgb, var(--vf-color-text) 18%, var(--vf-color-border))',
    );
    expect(defaultThemePreset.tokens.selectionControlHoverBorderColor).toBe('var(--vf-field-hover-border-color)');
    expect(defaultThemePreset.tokens.selectOptionHoverColor).toBe('var(--vf-color-text)');
    expect(defaultThemePreset.tokens.selectOptionHoverBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.buttonGhostHoverBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 6%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.buttonGhostActiveBackground).toBe(
      'color-mix(in srgb, var(--vf-color-text) 10%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.textLinkHoverColor).toBe(
      'color-mix(in srgb, var(--vf-color-primary) 82%, var(--vf-color-text))',
    );
    expect(defaultThemePreset.tokens.stepperRailColor).toBe(
      'color-mix(in srgb, var(--vf-color-border) 88%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.stepperCompleteMarkerBackground).toBe('var(--vf-color-primary)');
    expect(defaultThemePreset.tokens.stepperCurrentMarkerBackground).toBe(
      'color-mix(in srgb, var(--vf-color-primary) 12%, var(--vf-color-surface))',
    );
    expect(defaultThemePreset.tokens.stepperFocusRingColor).toBe('var(--vf-color-focus-ring)');
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
