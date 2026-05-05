import type { App, Plugin } from 'vue';
import { vueForgeConfigKey } from '@/providers/vueForgeConfig';
import type { VfVueForgeOptions } from '@/types/theme';
import { applyThemeConfig, resolveThemeConfig } from '@/theme';

export function createVueForgeCore() {
  const plugin: Plugin = {
    install(app: App, options: VfVueForgeOptions = {}) {
      const theme = resolveThemeConfig(options.theme);

      app.provide(vueForgeConfigKey, {
        theme,
        themeMode: {
          defaultTheme: options.defaultTheme,
          storageKey: options.themeStorageKey,
          attribute: options.themeAttribute,
        },
      });

      if (typeof document !== 'undefined') {
        applyThemeConfig(theme);
      }
    },
  };

  return plugin;
}

export const VueForgeCore = createVueForgeCore();

export default VueForgeCore;
