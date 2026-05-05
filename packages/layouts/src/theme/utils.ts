import {
  applyThemeConfig as applyThemeConfigBase,
  createThemePreset as createThemePresetBase,
  resolveThemePreset as resolveThemePresetBase,
  resolveThemePresetOptions,
  themePresetToCssText as themePresetToCssTextBase,
  themeTokensToCssVars as themeTokensToCssVarsBase,
  type VfThemeConfig,
  type VfThemePreset,
  type VfThemeTokens,
} from '@codemonster-ru/vueforge-theme';
import type {
  VfLayoutPreset,
  VfLayoutThemeConfig,
  VfLayoutTokens,
  VfResolvedLayoutPreset,
  VfResolvedLayoutThemeConfig,
  VfResolvedLayoutThemeOptions,
} from './types';
import { defaultLayoutsPreset } from './default-preset';

const DEFAULT_LAYOUTS_THEME_STYLE_ID = 'vf-layouts-theme-preset';

function toThemePreset(preset: VfLayoutPreset): VfThemePreset {
  return preset as unknown as VfThemePreset;
}

function toThemeConfig(config: VfLayoutThemeConfig): VfThemeConfig {
  return config as unknown as VfThemeConfig;
}

export function createLayoutsPreset(preset: VfLayoutPreset) {
  return createThemePresetBase(toThemePreset(preset)) as unknown as VfLayoutPreset;
}

export function resolveLayoutsPreset(config: VfLayoutThemeConfig = {}): VfResolvedLayoutPreset {
  return resolveThemePresetBase({
    ...toThemeConfig(config),
    preset: toThemePreset(config.preset ?? defaultLayoutsPreset),
  }) as unknown as VfResolvedLayoutPreset;
}

export function resolveLayoutsThemeOptions(options: VfLayoutThemeConfig['options'] = {}) {
  return resolveThemePresetOptions({
    ...options,
    prefix: options.prefix ?? 'vf-layout',
    styleId: options.styleId ?? DEFAULT_LAYOUTS_THEME_STYLE_ID,
  }) as unknown as VfResolvedLayoutThemeOptions;
}

export function resolveLayoutsThemeConfig(config: VfLayoutThemeConfig = {}): VfResolvedLayoutThemeConfig {
  return {
    preset: resolveLayoutsPreset(config),
    options: resolveLayoutsThemeOptions(config.options),
  };
}

export function layoutsTokensToCssVars(tokens: Partial<VfLayoutTokens>, prefix?: string) {
  return themeTokensToCssVarsBase(tokens as Partial<VfThemeTokens>, prefix);
}

export function layoutsPresetToCssText(config: VfResolvedLayoutThemeConfig) {
  return themePresetToCssTextBase(config as unknown as Parameters<typeof themePresetToCssTextBase>[0]);
}

export function applyLayoutsThemeConfig(config: VfResolvedLayoutThemeConfig, targetDocument?: Document) {
  return applyThemeConfigBase(config as unknown as Parameters<typeof applyThemeConfigBase>[0], targetDocument);
}
