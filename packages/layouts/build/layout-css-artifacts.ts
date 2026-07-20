/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLayoutsPreset } from '../src/theme/default-preset';
import { vfLayoutCustomMediaAliases } from '../src/theme/breakpoint-registry';
import type { VfLayoutTokens } from '../src/theme/types';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const generatedStylesDir = resolve(rootDir, '.generated/theme');
const generatedBreakpointsPath = resolve(generatedStylesDir, 'layout-breakpoints.css');
const generatedTokensPath = resolve(generatedStylesDir, 'layout-tokens.css');
const generatedThemePath = resolve(generatedStylesDir, 'layout-theme.css');

function tokenKeyToCssVar(key: string, prefix = 'vf') {
  const kebabKey = key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()
    .replace(/zindex/g, 'z-index');

  return `--${prefix}-${kebabKey}`;
}

function cssVarsToText(cssVars: Record<string, string>) {
  return Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${formatCssVarValue(key, value)};`)
    .join('\n');
}

function formatCssVarValue(key: string, value: string) {
  const calcMatch = /^calc\((.+ [+-] .+)\)$/.exec(value);
  const varPairMatch = /^(var\([^)]+\)) (var\([^)]+\))$/.exec(value);
  const declarationLength = `  ${key}: ${value};`.length;

  if (declarationLength <= 120) {
    return value;
  }

  if (calcMatch) {
    return `calc(\n    ${calcMatch[1]}\n  )`;
  }

  if (varPairMatch) {
    return `${varPairMatch[1]}\n    ${varPairMatch[2]}`;
  }

  return value;
}

function layoutsTokensToCssVars(tokens: Partial<VfLayoutTokens>, prefix = 'vf') {
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [tokenKeyToCssVar(key, prefix), value]));
}

export function buildLayoutCssArtifacts() {
  const cssVars = layoutsTokensToCssVars(defaultLayoutsPreset.tokens, 'vf-layout');
  const darkCssVars = layoutsTokensToCssVars(defaultLayoutsPreset.dark ?? {}, 'vf-layout');
  const mediaLines = [
    '/* Generated from src/theme/breakpoint-registry.ts. */',
    '/* Build-time breakpoint aliases consumed in styles.css and expanded by Vite plugin. */',
    ...Object.entries(vfLayoutCustomMediaAliases).map(([alias, query]) => `@custom-media ${alias} ${query};`),
    '',
  ];
  const tokenLines = [
    '/* Generated from src/theme/default-preset.ts. */',
    '/* Fallback baseline layout tokens for package CSS consumers. */',
    ':root {',
    cssVarsToText(cssVars),
    '}',
    '',
  ];
  const themeLines = [
    '/* Generated from src/theme/default-preset.ts. */',
    '/* Fallback mode layout styles for package CSS consumers. */',
    ...(Object.keys(darkCssVars).length > 0 ? [":root[data-vf-theme='dark'] {", cssVarsToText(darkCssVars), '}'] : []),
    '',
  ];

  mkdirSync(generatedStylesDir, { recursive: true });
  writeFileSync(generatedBreakpointsPath, mediaLines.join('\n'));
  writeFileSync(generatedTokensPath, tokenLines.join('\n'));
  writeFileSync(generatedThemePath, themeLines.join('\n'));
}

export const layoutCssArtifactPaths = {
  generatedBreakpointsPath,
  generatedThemePath,
  generatedStylesDir,
  generatedTokensPath,
  rootDir,
};
