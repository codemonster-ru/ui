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
const DEFAULT_LAYOUTS_THEME_PREFIX = 'vf-layout';

function createPrefixAliasTokens(tokens: VfLayoutTokens, prefix: string): VfLayoutTokens {
  const variableNames = Object.keys(themeTokensToCssVarsBase(tokens as unknown as Partial<VfThemeTokens>, prefix));

  return Object.fromEntries(
    Object.keys(tokens).map((key, index) => [key, `var(${variableNames[index]})`]),
  ) as unknown as VfLayoutTokens;
}

function createCompatibilityConfig(config: VfResolvedLayoutThemeConfig): VfResolvedLayoutThemeConfig | null {
  if (config.options.prefix === DEFAULT_LAYOUTS_THEME_PREFIX) {
    return null;
  }

  return {
    ...config,
    preset: {
      ...config.preset,
      light: createPrefixAliasTokens(config.preset.light, config.options.prefix),
      dark: createPrefixAliasTokens(config.preset.dark, config.options.prefix),
    },
    options: {
      ...config.options,
      prefix: DEFAULT_LAYOUTS_THEME_PREFIX,
    },
  };
}

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
    prefix: options.prefix ?? DEFAULT_LAYOUTS_THEME_PREFIX,
    styleId: options.styleId ?? DEFAULT_LAYOUTS_THEME_STYLE_ID,
  }) as unknown as VfResolvedLayoutThemeOptions;
}

export function resolveLayoutsThemeConfig(config: VfLayoutThemeConfig = {}): VfResolvedLayoutThemeConfig {
  return {
    preset: resolveLayoutsPreset(config),
    options: resolveLayoutsThemeOptions(config.options),
  };
}

export function layoutsTokensToCssVars(
  tokens: Partial<VfLayoutTokens>,
  prefix = DEFAULT_LAYOUTS_THEME_PREFIX,
): Record<string, string> {
  return themeTokensToCssVarsBase(tokens as Partial<VfThemeTokens>, prefix);
}

export function layoutsPresetToCssText(config: VfResolvedLayoutThemeConfig) {
  const compatibilityConfig = createCompatibilityConfig(config);

  return [config, compatibilityConfig]
    .filter((candidate): candidate is VfResolvedLayoutThemeConfig => candidate !== null)
    .map((candidate) =>
      themePresetToCssTextBase(candidate as unknown as Parameters<typeof themePresetToCssTextBase>[0]),
    )
    .join('\n\n');
}

export function applyLayoutsThemeConfig(config: VfResolvedLayoutThemeConfig, targetDocument?: Document): HTMLElement {
  const style = applyThemeConfigBase(config as unknown as Parameters<typeof applyThemeConfigBase>[0], targetDocument);
  style.textContent = layoutsPresetToCssText(config);

  return style;
}
