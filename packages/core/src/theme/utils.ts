export { resolveThemePresetOptions } from '@codemonster-ru/vueforge-theme';
import {
  applyThemeConfig as applyThemeConfigBase,
  createThemePreset as createThemePresetBase,
  resolveThemeConfig as resolveThemeConfigBase,
  resolveThemePreset as resolveThemePresetBase,
  themePresetToCssText as themePresetToCssTextBase,
  themeTokensToCssVars as themeTokensToCssVarsBase,
} from '@codemonster-ru/vueforge-theme';
import type {
  VfResolvedThemeConfig as BaseVfResolvedThemeConfig,
  VfThemePreset as BaseVfThemePreset,
} from '@codemonster-ru/vueforge-theme';
import type {
  VfResolvedThemeConfig,
  VfResolvedThemePreset,
  VfThemeConfig,
  VfThemePreset,
  VfThemeTokens,
} from '@/types/theme';
import { defaultThemePreset } from './default-preset';

export function createThemePreset(preset: VfThemePreset): VfThemePreset {
  return createThemePresetBase(preset as unknown as BaseVfThemePreset) as unknown as VfThemePreset;
}

export function themeTokensToCssVars(tokens: Partial<VfThemeTokens>, prefix?: string) {
  return themeTokensToCssVarsBase(tokens, prefix);
}

export function themePresetToCssText(config: VfResolvedThemeConfig) {
  return themePresetToCssTextBase(config as unknown as BaseVfResolvedThemeConfig);
}

export function resolveThemePreset(config: VfThemeConfig = {}): VfResolvedThemePreset {
  return resolveThemePresetBase({
    ...config,
    preset: (config.preset ?? defaultThemePreset) as unknown as BaseVfThemePreset,
  }) as unknown as VfResolvedThemePreset;
}

export function resolveThemeConfig(config: VfThemeConfig = {}): VfResolvedThemeConfig {
  return resolveThemeConfigBase({
    ...config,
    preset: (config.preset ?? defaultThemePreset) as unknown as BaseVfThemePreset,
  }) as unknown as VfResolvedThemeConfig;
}

export function applyThemeConfig(config: VfResolvedThemeConfig, targetDocument?: Document) {
  return applyThemeConfigBase(config as unknown as BaseVfResolvedThemeConfig, targetDocument);
}
