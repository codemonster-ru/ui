import { createThemePreset } from '../src';
import type { VfThemePreset, VfThemeTokens } from '../src';

export function createTestThemeTokens(overrides: Partial<VfThemeTokens>): VfThemeTokens {
  return overrides as VfThemeTokens;
}

export function createTestThemePreset(
  preset: Omit<VfThemePreset, 'tokens'> & {
    tokens: Partial<VfThemeTokens>;
  },
) {
  return createThemePreset({
    ...preset,
    tokens: createTestThemeTokens(preset.tokens),
  });
}
