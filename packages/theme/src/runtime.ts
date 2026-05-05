import { DEFAULT_ATTRIBUTE, DEFAULT_STORAGE_KEY } from './mode.js';
import type {
  VfResolvedThemeConfig,
  VfResolvedThemePreset,
  VfResolvedThemePresetOptions,
  VfThemeConfig,
  VfThemePreset,
  VfThemePresetOptions,
  VfThemeTokens,
} from './types.js';

const DEFAULT_THEME_PREFIX = 'vf';
const DEFAULT_THEME_STYLE_ID = 'vf-theme-preset';
const DEFAULT_THEME_ROOT_SELECTOR = ':root';

function camelToKebab(value: string) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/([a-z])(\d)/g, '$1-$2');
}

function mergeThemeTokens(...layers: Array<Partial<VfThemeTokens> | undefined>) {
  return Object.assign({}, ...layers) as VfThemeTokens;
}

export function createThemePreset(preset: VfThemePreset) {
  return preset;
}

export function resolveThemePresetOptions(options: VfThemePresetOptions = {}): VfResolvedThemePresetOptions {
  const prefix = options.prefix ?? DEFAULT_THEME_PREFIX;
  const rootSelector = options.rootSelector ?? DEFAULT_THEME_ROOT_SELECTOR;
  const attribute = options.attribute ?? DEFAULT_ATTRIBUTE;

  return {
    prefix,
    rootSelector,
    darkModeSelector: options.darkModeSelector ?? `${rootSelector}[${attribute}='dark']`,
    attribute,
    storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
    styleId: options.styleId ?? DEFAULT_THEME_STYLE_ID,
  };
}

export function resolveThemePreset(config: VfThemeConfig = {}): VfResolvedThemePreset {
  const preset = config.preset;

  if (!preset) {
    throw new Error('A theme preset is required to resolve theme tokens.');
  }

  const sharedOverrides = config.extend;
  const light = mergeThemeTokens(preset.tokens, sharedOverrides, config.light);
  const dark = mergeThemeTokens(preset.tokens, preset.dark, sharedOverrides, config.dark);

  return {
    name: preset.name,
    light,
    dark,
  };
}

export function resolveThemeConfig(config: VfThemeConfig = {}): VfResolvedThemeConfig {
  return {
    preset: resolveThemePreset(config),
    options: resolveThemePresetOptions(config.options),
  };
}

export function themeTokensToCssVars(tokens: Partial<VfThemeTokens>, prefix = DEFAULT_THEME_PREFIX) {
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [`--${prefix}-${camelToKebab(key)}`, value]));
}

function cssVarsToText(cssVars: Record<string, string>) {
  return Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

export function themePresetToCssText(config: VfResolvedThemeConfig) {
  const { preset, options } = config;
  const lightCssVars = cssVarsToText(themeTokensToCssVars(preset.light, options.prefix));
  const darkCssVars = cssVarsToText(themeTokensToCssVars(preset.dark, options.prefix));

  return [`${options.rootSelector} {\n${lightCssVars}\n}`, `${options.darkModeSelector} {\n${darkCssVars}\n}`].join(
    '\n\n',
  );
}

export function themeConfigsToCssText(configs: VfResolvedThemeConfig[]) {
  return configs.map((config) => themePresetToCssText(config)).join('\n\n');
}

function ensureStyleElement(styleId: string, targetDocument: Document) {
  return (
    targetDocument.getElementById(styleId) ?? Object.assign(targetDocument.createElement('style'), { id: styleId })
  );
}

export function applyThemeConfig(config: VfResolvedThemeConfig, targetDocument: Document = document) {
  return applyThemeConfigs([config], targetDocument)[0];
}

export function applyThemeConfigs(configs: VfResolvedThemeConfig[], targetDocument: Document = document) {
  const cssTextByStyleId = new Map<string, string[]>();

  for (const config of configs) {
    const styleId = config.options.styleId;
    const cssTexts = cssTextByStyleId.get(styleId) ?? [];

    cssTexts.push(themePresetToCssText(config));
    cssTextByStyleId.set(styleId, cssTexts);
  }

  return Array.from(cssTextByStyleId.entries()).map(([styleId, cssTexts]) => {
    const style = ensureStyleElement(styleId, targetDocument);
    style.textContent = cssTexts.join('\n\n');

    if (!style.parentNode) {
      targetDocument.head.appendChild(style);
    }

    return style;
  });
}
