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

const DEFAULT_CORE_THEME_PREFIX = 'vf';

function createPrefixAliasTokens(tokens: VfThemeTokens, prefix: string): VfThemeTokens {
  const variableNames = Object.keys(themeTokensToCssVarsBase(tokens, prefix));

  return Object.fromEntries(
    Object.keys(tokens).map((key, index) => [key, `var(${variableNames[index]})`]),
  ) as unknown as VfThemeTokens;
}

function createCompatibilityConfig(config: VfResolvedThemeConfig): VfResolvedThemeConfig | null {
  if (config.options.prefix === DEFAULT_CORE_THEME_PREFIX) {
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
      prefix: DEFAULT_CORE_THEME_PREFIX,
    },
  };
}

function isValidSelector(selector: string) {
  if (typeof document === 'undefined') {
    return true;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

function normalizeThemeSelectors(config: VfResolvedThemeConfig, source: VfThemeConfig): VfResolvedThemeConfig {
  const rootSelector = isValidSelector(config.options.rootSelector) ? config.options.rootSelector : ':root';
  const requestedDarkModeSelector = source.options?.darkModeSelector;
  const darkModeSelector =
    requestedDarkModeSelector && isValidSelector(requestedDarkModeSelector)
      ? requestedDarkModeSelector
      : `${rootSelector}[${config.options.attribute}='dark']`;

  if (rootSelector === config.options.rootSelector && darkModeSelector === config.options.darkModeSelector) {
    return config;
  }

  return {
    ...config,
    options: {
      ...config.options,
      rootSelector,
      darkModeSelector,
    },
  };
}

export function createThemePreset(preset: VfThemePreset): VfThemePreset {
  return createThemePresetBase(preset as unknown as BaseVfThemePreset) as unknown as VfThemePreset;
}

export function themeTokensToCssVars(tokens: Partial<VfThemeTokens>, prefix?: string) {
  return themeTokensToCssVarsBase(tokens, prefix);
}

export function themePresetToCssText(config: VfResolvedThemeConfig) {
  const compatibilityConfig = createCompatibilityConfig(config);

  return [config, compatibilityConfig]
    .filter((candidate): candidate is VfResolvedThemeConfig => candidate !== null)
    .map((candidate) => themePresetToCssTextBase(candidate as unknown as BaseVfResolvedThemeConfig))
    .join('\n\n');
}

export function resolveThemePreset(config: VfThemeConfig = {}): VfResolvedThemePreset {
  return resolveThemePresetBase({
    ...config,
    preset: (config.preset ?? defaultThemePreset) as unknown as BaseVfThemePreset,
  }) as unknown as VfResolvedThemePreset;
}

export function resolveThemeConfig(config: VfThemeConfig = {}): VfResolvedThemeConfig {
  const resolved = resolveThemeConfigBase({
    ...config,
    preset: (config.preset ?? defaultThemePreset) as unknown as BaseVfThemePreset,
  }) as unknown as VfResolvedThemeConfig;

  return normalizeThemeSelectors(resolved, config);
}

export function applyThemeConfig(config: VfResolvedThemeConfig, targetDocument?: Document) {
  const style = applyThemeConfigBase(config as unknown as BaseVfResolvedThemeConfig, targetDocument);
  style.textContent = themePresetToCssText(config);

  return style;
}
