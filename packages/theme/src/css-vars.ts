import type { VfResolvedTheme } from './types.js';

const COMPATIBLE_THEME_ATTRIBUTES = ['data-theme', 'data-vf-theme'] as const;

function camelToKebab(value: string) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/([a-z])(\d)/g, '$1-$2');
}

export function serializeThemeTokensToCssVars(tokens: object, prefix = 'vf'): Record<string, string> {
  return Object.fromEntries(
    (Object.entries(tokens) as Array<[string, string]>).map(([key, value]) => [
      `--${prefix}-${camelToKebab(key)}`,
      value,
    ]),
  );
}

export function createScopedThemeModeSelector(rootSelector: string, attribute: string, mode: VfResolvedTheme) {
  const attributes = [...new Set([attribute, ...COMPATIBLE_THEME_ATTRIBUTES])];
  const modeSelectors = attributes.map((name) => `[${name}='${mode}']`).join(', ');

  return [`:is(${rootSelector}):where(${modeSelectors})`, `:where(${rootSelector}) :where(${modeSelectors})`].join(
    ',\n',
  );
}
