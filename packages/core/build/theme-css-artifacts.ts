import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultThemePresetSource } from '../src/theme/default-preset-source';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const generatedStylesDir = resolve(rootDir, '.generated/theme');
const generatedBreakpointsPath = resolve(generatedStylesDir, 'generated-breakpoints.css');
const generatedTokensPath = resolve(generatedStylesDir, 'tokens.css');
const generatedThemePath = resolve(generatedStylesDir, 'theme.css');

function cssVarsToText(cssVars: Record<string, string>) {
  return Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

function tokenKeyToCssVar(key: string, prefix = 'vf') {
  const kebabKey = key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();

  return `--${prefix}-${kebabKey}`;
}

function themeTokensToCssVars(tokens: Record<string, string>, prefix = 'vf') {
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [tokenKeyToCssVar(key, prefix), value]));
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
  const { breakpointCssVars } = splitBreakpointCssVars(themeTokensToCssVars(defaultThemePresetSource.tokens, 'vf'));
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
  const { tokenCssVars } = splitBreakpointCssVars(themeTokensToCssVars(defaultThemePresetSource.tokens, 'vf'));
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
  const darkCssVars = cssVarsToText(themeTokensToCssVars(defaultThemePresetSource.dark ?? {}, 'vf'));
  const lines = [
    '/* Generated from src/theme/default-preset-source.ts. */',
    '/* Fallback mode styles for package CSS consumers. */',
    ':root {',
    '  color-scheme: light;',
    '  background-color: var(--vf-color-bg);',
    '  color: var(--vf-color-text);',
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
