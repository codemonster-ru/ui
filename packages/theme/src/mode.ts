import type { VfResolvedTheme, VfThemeMode } from './types.js';

export const DEFAULT_STORAGE_KEY = 'vf-theme';
export const DEFAULT_ATTRIBUTE = 'data-vf-theme';

export function isThemeMode(value: unknown): value is VfThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(mode: VfThemeMode, systemTheme: VfResolvedTheme): VfResolvedTheme {
  return mode === 'system' ? systemTheme : mode;
}
