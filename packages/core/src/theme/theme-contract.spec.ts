import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildThemeCssArtifacts, themeCssArtifactPaths } from '../../build/theme-css-artifacts';
import { inlineCssImports } from '../../build/css-imports';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { vfPrimitiveColorTokenNames, vfSemanticColorTokenNames } from '@codemonster-ru/vueforge-theme';
import type { VfThemeTokens } from '@/types/theme';
import {
  COMPLETE_THEME_TOKEN_COUNT,
  LEGACY_DARK_OVERRIDE_COUNT,
  LEGACY_THEME_TOKEN_COUNT,
  PRIMITIVE_COLOR_TOKEN_COUNT,
  SEMANTIC_COLOR_TOKEN_COUNT,
} from './color-token-schema';
import { defaultThemePresetSource, legacyDefaultThemePresetSource } from './default-preset-source';
import { resolveThemeConfig, themeTokensToCssVars } from './utils';

const canonicalFallbackNames = [
  '--vf-field-floating-label-translate-y-default',
  '--vf-field-floating-label-active-translate-y-default',
  '--vf-drawer-offset-x-rest',
  '--vf-drawer-offset-y-rest',
  '--vf-drawer-offset-x-left',
  '--vf-drawer-offset-x-right',
  '--vf-drawer-offset-y-top',
  '--vf-drawer-offset-y-bottom',
  '--vf-command-palette-item-title-icon-offset-y-default',
] as const;

const malformedFallbackNames = [
  '--vf-field-floating-label-translate-ydefault',
  '--vf-field-floating-label-active-translate-ydefault',
  '--vf-drawer-offset-xrest',
  '--vf-drawer-offset-yrest',
  '--vf-drawer-offset-xleft',
  '--vf-drawer-offset-xright',
  '--vf-drawer-offset-ytop',
  '--vf-drawer-offset-ybottom',
  '--vf-command-palette-item-title-icon-offset-ydefault',
] as const;

const scopedLightSelector = [
  ":is(:root):where([data-vf-theme='light'], [data-theme='light'])",
  ":where(:root) :where([data-vf-theme='light'], [data-theme='light'])",
].join(',\n');
const scopedDarkSelector = [
  ":is(:root):where([data-vf-theme='dark'], [data-theme='dark'])",
  ":where(:root) :where([data-vf-theme='dark'], [data-theme='dark'])",
].join(',\n');

function parseCssVariableDeclarations(css: string) {
  return Object.fromEntries(
    [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

function extractCssRule(css: string, selector: string) {
  const marker = `${selector} {`;
  const ruleStart = css.indexOf(marker);

  if (ruleStart < 0) {
    throw new Error(`Missing CSS rule: ${selector}`);
  }

  const bodyStart = ruleStart + marker.length;
  const bodyEnd = css.indexOf('\n}', bodyStart);

  if (bodyEnd < 0) {
    throw new Error(`Unterminated CSS rule: ${selector}`);
  }

  return css.slice(bodyStart, bodyEnd);
}

function sortEntries(record: Record<string, string>) {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function resolveCssVariable(variables: Record<string, string>, name: string, seen = new Set<string>()): string {
  if (seen.has(name)) {
    throw new Error(`Circular CSS variable reference: ${name}`);
  }

  const value = variables[name];
  if (value === undefined) {
    throw new Error(`Missing CSS variable: ${name}`);
  }

  const nextSeen = new Set(seen).add(name);
  return value.replace(/var\((--[a-z0-9-]+)\)/g, (_match, dependency: string) =>
    resolveCssVariable(variables, dependency, nextSeen),
  );
}

function resolveComputedCssVariable(element: Element, name: string, seen = new Set<string>()): string {
  if (seen.has(name)) {
    throw new Error(`Circular computed CSS variable reference: ${name}`);
  }

  const value = getComputedStyle(element).getPropertyValue(name).trim();
  if (!value) {
    throw new Error(`Missing computed CSS variable: ${name}`);
  }

  const nextSeen = new Set(seen).add(name);
  return value.replace(/var\((--[a-z0-9-]+)\)/g, (_match, dependency: string) =>
    resolveComputedCssVariable(element, dependency, nextSeen),
  );
}

describe('core theme contract', () => {
  it('keeps the additive color architecture complete without duplicating legacy names', () => {
    const architectureNames = new Set([...vfPrimitiveColorTokenNames, ...vfSemanticColorTokenNames]);
    const presetNames = new Set(Object.keys(defaultThemePresetSource.tokens));
    const legacyNames = new Set(Object.keys(legacyDefaultThemePresetSource.tokens));
    const overlap = vfSemanticColorTokenNames.filter((name) => legacyNames.has(name));

    expect(legacyNames).toHaveProperty('size', LEGACY_THEME_TOKEN_COUNT);
    expect(vfPrimitiveColorTokenNames).toHaveLength(PRIMITIVE_COLOR_TOKEN_COUNT);
    expect(vfSemanticColorTokenNames).toHaveLength(SEMANTIC_COLOR_TOKEN_COUNT);
    expect(architectureNames).toHaveProperty('size', PRIMITIVE_COLOR_TOKEN_COUNT + SEMANTIC_COLOR_TOKEN_COUNT);
    expect(overlap).toEqual(['colorFocusRing']);
    expect(presetNames).toHaveProperty('size', COMPLETE_THEME_TOKEN_COUNT);
    expect(LEGACY_THEME_TOKEN_COUNT + architectureNames.size - overlap.length).toBe(COMPLETE_THEME_TOKEN_COUNT);

    for (const name of architectureNames) {
      expect(presetNames.has(name), name).toBe(true);
    }
  });

  it('keeps built-in preset keys equal to the public token contract', () => {
    expectTypeOf<keyof typeof defaultThemePresetSource.tokens>().toEqualTypeOf<keyof VfThemeTokens>();
  });

  it('accepts every built-in 1.x token through the public override contract', () => {
    const config = resolveThemeConfig({
      extend: {
        fieldIconSize: '1rem',
        drawerViewportWidth: '100dvw',
        tableOfContentsTitleColor: 'var(--vf-color-muted)',
      },
    });

    expect(config.preset.light.fieldIconSize).toBe('1rem');
    expect(config.preset.light.drawerViewportWidth).toBe('100dvw');
    expect(config.preset.light.tableOfContentsTitleColor).toBe('var(--vf-color-muted)');
  });

  it('keeps fallback light declarations byte-for-value equivalent to runtime variables', () => {
    buildThemeCssArtifacts();

    const breakpointCss = readFileSync(themeCssArtifactPaths.generatedBreakpointsPath, 'utf8');
    const tokenCss = readFileSync(themeCssArtifactPaths.generatedTokensPath, 'utf8');
    const staticVariables = {
      ...parseCssVariableDeclarations(extractCssRule(breakpointCss, ':root')),
      ...parseCssVariableDeclarations(extractCssRule(tokenCss, ':root')),
    };
    const runtimeVariables = themeTokensToCssVars(defaultThemePresetSource.tokens);

    expect(sortEntries(staticVariables)).toEqual(sortEntries(runtimeVariables));
    expect(Object.keys(staticVariables)).toHaveLength(COMPLETE_THEME_TOKEN_COUNT);
    expect(resolveCssVariable(staticVariables, '--vf-color-background-canvas')).toBe('#f6f8fb');
    expect(resolveCssVariable(staticVariables, '--vf-color-text-primary')).toBe('#1f232b');
    expect(resolveCssVariable(staticVariables, '--vf-color-border-default')).toBe('#d9dde3');
    expect(resolveCssVariable(staticVariables, '--vf-color-interactive-primary-background')).toBe('#0e639c');
    expect(resolveCssVariable(staticVariables, '--vf-color-status-success-solid-background')).toBe('#2e7d32');
  });

  it('keeps fallback dark overrides equivalent to the source and effective runtime theme', () => {
    buildThemeCssArtifacts();

    const themeCss = readFileSync(themeCssArtifactPaths.generatedThemePath, 'utf8');
    const staticDarkOverrides = parseCssVariableDeclarations(extractCssRule(themeCss, ':root[data-vf-theme="dark"]'));
    const scopedLightVariables = parseCssVariableDeclarations(extractCssRule(themeCss, scopedLightSelector));
    const scopedDarkVariables = parseCssVariableDeclarations(extractCssRule(themeCss, scopedDarkSelector));
    const runtimeLight = themeTokensToCssVars(defaultThemePresetSource.tokens);
    const runtimeDarkOverrides = themeTokensToCssVars(defaultThemePresetSource.dark ?? {});
    const runtimeDark = themeTokensToCssVars(resolveThemeConfig().preset.dark);
    const effectiveStaticDark = {
      ...runtimeLight,
      ...staticDarkOverrides,
    };

    expect(sortEntries(staticDarkOverrides)).toEqual(sortEntries(runtimeDarkOverrides));
    expect(Object.keys(staticDarkOverrides)).toHaveLength(LEGACY_DARK_OVERRIDE_COUNT);
    expect(Object.keys(defaultThemePresetSource.dark ?? {})).toHaveLength(LEGACY_DARK_OVERRIDE_COUNT);
    expect(sortEntries(effectiveStaticDark)).toEqual(sortEntries(runtimeDark));
    expect(sortEntries(scopedLightVariables)).toEqual(sortEntries(runtimeLight));
    expect(Object.keys(scopedLightVariables)).toHaveLength(COMPLETE_THEME_TOKEN_COUNT);
    expect(sortEntries(scopedDarkVariables)).toEqual(sortEntries(runtimeDark));
    expect(Object.keys(scopedDarkVariables)).toHaveLength(COMPLETE_THEME_TOKEN_COUNT);
    const resolvedModePairs = [
      ['--vf-selectable-color', '#616773', '#9da0a6'],
      ['--vf-color-background-canvas', '#f6f8fb', '#17191e'],
      ['--vf-color-background-surface', '#ffffff', '#20232a'],
      ['--vf-color-text-primary', '#1f232b', '#d4d4d4'],
      ['--vf-color-text-inverse', '#ffffff', '#111827'],
      ['--vf-color-border-default', '#d9dde3', '#363b46'],
      ['--vf-color-border-interactive', '#d9dde3', '#363b46'],
      ['--vf-color-border-focus', '#0e639c', '#276cb5'],
      ['--vf-color-interactive-primary-background', '#0e639c', '#276cb5'],
      ['--vf-color-status-success-solid-background', '#2e7d32', '#37783e'],
      ['--vf-color-status-info-solid-background', '#0077a3', '#1a739f'],
      ['--vf-color-status-warning-solid-background', '#a1841f', '#b79a63'],
      ['--vf-color-status-warning-solid-foreground', '#1f1300', '#1f1300'],
      ['--vf-color-status-danger-solid-background', '#c72e39', '#bf3f3f'],
      ['--vf-color-status-help-solid-background', '#6e43a2', '#7b4c96'],
    ] as const;

    for (const [name, lightValue, darkValue] of resolvedModePairs) {
      expect(resolveCssVariable(scopedLightVariables, name), `${name} light`).toBe(lightValue);
      expect(resolveCssVariable(scopedDarkVariables, name), `${name} dark`).toBe(darkValue);
    }
  });

  it('emits canonical fallback names and no malformed serializer variants', () => {
    buildThemeCssArtifacts();

    const fallbackCss = [
      readFileSync(themeCssArtifactPaths.generatedBreakpointsPath, 'utf8'),
      readFileSync(themeCssArtifactPaths.generatedTokensPath, 'utf8'),
      readFileSync(themeCssArtifactPaths.generatedThemePath, 'utf8'),
    ].join('\n');

    for (const name of canonicalFallbackNames) {
      expect(fallbackCss).toContain(`${name}:`);
    }
    for (const name of malformedFallbackNames) {
      expect(fallbackCss).not.toContain(`${name}:`);
    }
  });

  it('keeps root fallback behavior and emits complete reversible scoped modes', () => {
    buildThemeCssArtifacts();

    const tokensCss = readFileSync(themeCssArtifactPaths.generatedTokensPath, 'utf8');
    const themeCss = readFileSync(themeCssArtifactPaths.generatedThemePath, 'utf8');

    expect(tokensCss).not.toContain("[data-theme='light']");
    expect(tokensCss).not.toContain("[data-vf-theme='light']");
    expect(themeCss).toContain(':root[data-vf-theme="dark"]');
    expect(themeCss).toContain(scopedLightSelector);
    expect(themeCss).toContain(scopedDarkSelector);
    expect(themeCss.match(/--vf-color-bg: var\(--vf-palette-neutral-50\);/g)).toHaveLength(1);
    expect(themeCss.match(/--vf-color-bg: var\(--vf-palette-neutral-900\);/g)).toHaveLength(2);
    expect(themeCss.match(/--vf-z-overlay: 1000;/g)).toHaveLength(3);
    expect(extractCssRule(themeCss, scopedLightSelector)).toContain('color-scheme: light;');
    expect(extractCssRule(themeCss, scopedDarkSelector)).toContain('color-scheme: dark;');
    expect(extractCssRule(themeCss, scopedLightSelector)).toContain('--vf-selectable-color: var(--vf-color-muted);');
    expect(extractCssRule(themeCss, scopedDarkSelector)).toContain('--vf-selectable-color: var(--vf-color-muted);');
  });

  it('resolves fallback root-self and nested inverse mode boundaries in the cascade', () => {
    buildThemeCssArtifacts();

    const tokenCss = readFileSync(themeCssArtifactPaths.generatedTokensPath, 'utf8').replace(
      /^@import\s+[^;]+;\s*$/m,
      '',
    );
    const themeCss = readFileSync(themeCssArtifactPaths.generatedThemePath, 'utf8');
    const style = document.createElement('style');
    const darkBoundary = document.createElement('section');
    const lightBoundary = document.createElement('div');
    const nestedDarkBoundary = document.createElement('div');

    style.id = 'vf-fallback-contract';
    style.textContent = `${tokenCss}\n${themeCss}`;
    darkBoundary.dataset.vfTheme = 'dark';
    lightBoundary.dataset.theme = 'light';
    nestedDarkBoundary.dataset.vfTheme = 'dark';
    lightBoundary.appendChild(nestedDarkBoundary);
    darkBoundary.appendChild(lightBoundary);
    document.head.appendChild(style);
    document.body.appendChild(darkBoundary);

    document.documentElement.dataset.theme = 'dark';

    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-primary')).toBe('#276cb5');
    expect(resolveComputedCssVariable(darkBoundary, '--vf-color-primary')).toBe('#276cb5');
    expect(resolveComputedCssVariable(lightBoundary, '--vf-color-primary')).toBe('#0e639c');
    expect(resolveComputedCssVariable(nestedDarkBoundary, '--vf-color-primary')).toBe('#276cb5');
    expect(resolveComputedCssVariable(darkBoundary, '--vf-color-muted')).toBe('#9da0a6');
    expect(resolveComputedCssVariable(lightBoundary, '--vf-color-muted')).toBe('#616773');
    expect(resolveComputedCssVariable(nestedDarkBoundary, '--vf-color-muted')).toBe('#9da0a6');
    expect(resolveComputedCssVariable(darkBoundary, '--vf-color-background-canvas')).toBe('#17191e');
    expect(resolveComputedCssVariable(lightBoundary, '--vf-color-background-canvas')).toBe('#f6f8fb');
    expect(resolveComputedCssVariable(nestedDarkBoundary, '--vf-color-background-canvas')).toBe('#17191e');

    document.documentElement.dataset.theme = 'light';

    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-primary')).toBe('#0e639c');

    delete document.documentElement.dataset.theme;
    darkBoundary.remove();
    style.remove();
  });

  it('preserves dark color-scheme for both compatible attributes in the assembled stylesheet', () => {
    buildThemeCssArtifacts();

    const style = document.createElement('style');
    style.textContent = inlineCssImports(resolve(__dirname, '../styles/styles.css'));
    document.head.appendChild(style);

    document.documentElement.dataset.theme = 'dark';

    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-primary')).toBe('#276cb5');
    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-background-canvas')).toBe('#17191e');
    expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');

    delete document.documentElement.dataset.theme;
    document.documentElement.dataset.vfTheme = 'dark';

    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-primary')).toBe('#276cb5');
    expect(resolveComputedCssVariable(document.documentElement, '--vf-color-background-canvas')).toBe('#17191e');
    expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');

    delete document.documentElement.dataset.vfTheme;
    style.remove();
  });
});
