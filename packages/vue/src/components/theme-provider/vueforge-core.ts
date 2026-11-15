import type { InjectionKey, ObjectPlugin } from 'vue';
import type { CmThemeProviderProps } from './use-theme';

export interface VfVueForgeOptions {
  defaultTheme?: CmThemeProviderProps['defaultTheme'];
  themeStorageKey?: string;
  themeAttribute?: string;
  /** Apply token overrides through a stylesheet with the shared `--cm-*` properties. */
  theme?: never;
}

export const vfThemeOptionsKey: InjectionKey<VfVueForgeOptions> = /* @__PURE__ */ Symbol('VueForge theme options');

export function createVueForgeCore(): ObjectPlugin<[options?: VfVueForgeOptions]> {
  return {
    install(app, options = {}) {
      if (Reflect.get(options, 'theme') !== undefined) {
        throw new TypeError('VueForgeCore theme overrides require a stylesheet using CodeMonster UI --cm-* tokens.');
      }
      const { defaultTheme, themeStorageKey, themeAttribute } = options;
      app.provide(vfThemeOptionsKey, { defaultTheme, themeStorageKey, themeAttribute });
    },
  };
}

export const VueForgeCore = /* @__PURE__ */ createVueForgeCore();
