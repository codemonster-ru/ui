import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLayoutsPreset } from '../src/theme/default-preset';
import type { VfLayoutTokens } from '../src/theme/types';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const generatedStylesDir = resolve(rootDir, '.generated/theme');
const generatedTokensPath = resolve(generatedStylesDir, 'layout-tokens.css');

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
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

function layoutsTokensToCssVars(tokens: VfLayoutTokens, prefix = 'vf') {
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [tokenKeyToCssVar(key, prefix), value]));
}

export function buildLayoutCssArtifacts() {
  const cssVars = layoutsTokensToCssVars(defaultLayoutsPreset.tokens, 'vf');
  const tokenLines = [
    '/* Generated from src/theme/default-preset.ts. */',
    '/* Fallback baseline layout tokens for package CSS consumers. */',
    ':root {',
    cssVarsToText(cssVars),
    '}',
    '',
  ];

  mkdirSync(generatedStylesDir, { recursive: true });
  writeFileSync(generatedTokensPath, tokenLines.join('\n'));
}

export const layoutCssArtifactPaths = {
  generatedStylesDir,
  generatedTokensPath,
  rootDir,
};
