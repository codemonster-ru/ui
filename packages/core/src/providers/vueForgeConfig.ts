import type { InjectionKey } from 'vue';
import type { VfResolvedThemeConfig, VfThemeMode } from '@/types/theme';

export interface VfVueForgeThemeModeDefaults {
  defaultTheme?: VfThemeMode;
  storageKey?: string;
  attribute?: string;
}

export interface VfVueForgeRuntimeConfig {
  theme: VfResolvedThemeConfig;
  themeMode: VfVueForgeThemeModeDefaults;
}

export const vueForgeConfigKey: InjectionKey<VfVueForgeRuntimeConfig> = Symbol('VueForgeConfig');
