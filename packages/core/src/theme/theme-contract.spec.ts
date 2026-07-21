import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildThemeCssArtifacts, themeCssArtifactPaths } from '../../build/theme-css-artifacts';
import { inlineCssImports } from '../../build/css-imports';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { VfThemeTokens } from '@/types/theme';
import { defaultThemePresetSource } from './default-preset-source';
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

describe('core theme contract', () => {
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
    expect(Object.keys(staticVariables)).toHaveLength(847);
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
    expect(Object.keys(staticDarkOverrides)).toHaveLength(53);
    expect(sortEntries(effectiveStaticDark)).toEqual(sortEntries(runtimeDark));
    expect(sortEntries(scopedLightVariables)).toEqual(sortEntries(runtimeLight));
    expect(Object.keys(scopedLightVariables)).toHaveLength(847);
    expect(sortEntries(scopedDarkVariables)).toEqual(sortEntries(runtimeDark));
    expect(Object.keys(scopedDarkVariables)).toHaveLength(847);
    expect(resolveCssVariable(scopedLightVariables, '--vf-selectable-color')).toBe('#616773');
    expect(resolveCssVariable(scopedDarkVariables, '--vf-selectable-color')).toBe('#9da0a6');
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
    expect(themeCss.match(/--vf-color-bg: #f6f8fb;/g)).toHaveLength(1);
    expect(themeCss.match(/--vf-color-bg: #17191e;/g)).toHaveLength(2);
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

    expect(getComputedStyle(document.documentElement).getPropertyValue('--vf-color-primary')).toBe('#276cb5');
    expect(getComputedStyle(darkBoundary).getPropertyValue('--vf-color-primary')).toBe('#276cb5');
    expect(getComputedStyle(lightBoundary).getPropertyValue('--vf-color-primary')).toBe('#0e639c');
    expect(getComputedStyle(nestedDarkBoundary).getPropertyValue('--vf-color-primary')).toBe('#276cb5');
    expect(getComputedStyle(darkBoundary).getPropertyValue('--vf-color-muted')).toBe('#9da0a6');
    expect(getComputedStyle(lightBoundary).getPropertyValue('--vf-color-muted')).toBe('#616773');
    expect(getComputedStyle(nestedDarkBoundary).getPropertyValue('--vf-color-muted')).toBe('#9da0a6');

    document.documentElement.dataset.theme = 'light';

    expect(getComputedStyle(document.documentElement).getPropertyValue('--vf-color-primary')).toBe('#0e639c');

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

    expect(getComputedStyle(document.documentElement).getPropertyValue('--vf-color-primary')).toBe('#276cb5');
    expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');

    delete document.documentElement.dataset.theme;
    document.documentElement.dataset.vfTheme = 'dark';

    expect(getComputedStyle(document.documentElement).getPropertyValue('--vf-color-primary')).toBe('#276cb5');
    expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');

    delete document.documentElement.dataset.vfTheme;
    style.remove();
  });
});
