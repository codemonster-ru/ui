import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScopedThemeModeSelector, serializeThemeTokensToCssVars } from '../../theme/src/css-vars';
import {
  knownExternalThemeCssVariables,
  MAX_CANONICAL_ALIAS_DEPTH,
  validateColorTokenGraph,
} from '../src/theme/color-token-schema';
import { defaultThemePresetSource } from '../src/theme/default-preset-source';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const generatedStylesDir = resolve(rootDir, '.generated/theme');
const generatedBreakpointsPath = resolve(generatedStylesDir, 'generated-breakpoints.css');
const generatedTokensPath = resolve(generatedStylesDir, 'tokens.css');
const generatedThemePath = resolve(generatedStylesDir, 'theme.css');
const fallbackThemeAttribute = 'data-vf-theme';

function cssVarsToText(cssVars: Record<string, string>) {
  return Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

function splitBreakpointCssVars(cssVars: Record<string, string>) {
  const breakpointCssVars: Record<string, string> = {};
  const tokenCssVars: Record<string, string> = {};

  for (const [key, value] of Object.entries(cssVars)) {
    if (key.startsWith('--vf-breakpoint-')) {
      breakpointCssVars[key] = value;
    } else {
      tokenCssVars[key] = value;
    }
  }

  return { breakpointCssVars, tokenCssVars };
}

function buildBreakpointCss() {
  const { breakpointCssVars } = splitBreakpointCssVars(
    serializeThemeTokensToCssVars(defaultThemePresetSource.tokens, 'vf'),
  );
  const lines = [
    '/* Generated from src/theme/default-preset-source.ts */',
    ':root {',
    ...Object.entries(breakpointCssVars).map(([name, value]) => `  ${name}: ${value};`),
    '}',
    '',
  ];

  mkdirSync(generatedStylesDir, { recursive: true });
  writeFileSync(generatedBreakpointsPath, lines.join('\n'));
}

function buildTokensCss() {
  const { tokenCssVars } = splitBreakpointCssVars(serializeThemeTokensToCssVars(defaultThemePresetSource.tokens, 'vf'));
  const lines = [
    '/* Generated from src/theme/default-preset-source.ts. */',
    '/* Fallback baseline tokens for package CSS consumers. */',
    '@import "./generated-breakpoints.css";',
    '',
    ':root {',
    cssVarsToText(tokenCssVars),
    '}',
    '',
  ];

  mkdirSync(generatedStylesDir, { recursive: true });
  writeFileSync(generatedTokensPath, lines.join('\n'));
}

function buildThemeCss() {
  const lightTokens = defaultThemePresetSource.tokens;
  const darkOverrides = defaultThemePresetSource.dark ?? {};
  const resolvedDarkTokens = { ...lightTokens, ...darkOverrides };
  const darkCssVars = cssVarsToText(serializeThemeTokensToCssVars(darkOverrides, 'vf'));
  const scopedLightCssVars = cssVarsToText(serializeThemeTokensToCssVars(lightTokens, 'vf'));
  const scopedDarkCssVars = cssVarsToText(serializeThemeTokensToCssVars(resolvedDarkTokens, 'vf'));
  const lightScopeSelector = createScopedThemeModeSelector(':root', fallbackThemeAttribute, 'light');
  const darkScopeSelector = createScopedThemeModeSelector(':root', fallbackThemeAttribute, 'dark');
  const lines = [
    '/* Generated from src/theme/default-preset-source.ts. */',
    '/* Fallback mode styles for package CSS consumers. */',
    ':root {',
    '  color-scheme: light;',
    '  background-color: var(--vf-color-bg);',
    '  color: var(--vf-color-text);',
    '}',
    '',
    `${lightScopeSelector} {`,
    '  color-scheme: light;',
    scopedLightCssVars,
    '}',
    '',
    'button,',
    'input,',
    'optgroup,',
    'select,',
    'textarea {',
    '  font: inherit;',
    '}',
    '',
    ':root[data-vf-theme="dark"] {',
    '  color-scheme: dark;',
    darkCssVars,
    '}',
    '',
    `${darkScopeSelector} {`,
    '  color-scheme: dark;',
    scopedDarkCssVars,
    '}',
    '',
    ':root.vf-theme-transitioning,',
    ':root.vf-theme-transitioning body,',
    ':root.vf-theme-transitioning #app,',
    ':root.vf-theme-transitioning [class^="vf-"],',
    ':root.vf-theme-transitioning [class*=" vf-"],',
    ':root.vf-theme-transitioning .demo-page,',
    ':root.vf-theme-transitioning .demo-container,',
    ':root.vf-theme-transitioning .demo-header,',
    ':root.vf-theme-transitioning .demo-block,',
    ':root.vf-theme-transitioning .demo-example,',
    ':root.vf-theme-transitioning .demo-item {',
    '  transition:',
    '    background-color var(--vf-motion-duration-normal)',
    '      var(--vf-motion-ease-standard),',
    '    border-color var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),',
    '    color var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),',
    '    box-shadow var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),',
    '    fill var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),',
    '    stroke var(--vf-motion-duration-normal) var(--vf-motion-ease-standard);',
    '}',
    '',
  ];

  mkdirSync(generatedStylesDir, { recursive: true });
  writeFileSync(generatedThemePath, lines.join('\n'));
}

export function buildThemeCssArtifacts() {
  const validationOptions = {
    knownExternalVariables: knownExternalThemeCssVariables,
    maxDepth: MAX_CANONICAL_ALIAS_DEPTH,
  };

  validateColorTokenGraph(defaultThemePresetSource.tokens, validationOptions);
  validateColorTokenGraph({ ...defaultThemePresetSource.tokens, ...defaultThemePresetSource.dark }, validationOptions);
  buildBreakpointCss();
  buildTokensCss();
  buildThemeCss();
}

export const themeCssArtifactPaths = {
  generatedBreakpointsPath,
  generatedStylesDir,
  generatedThemePath,
  generatedTokensPath,
  rootDir,
};
