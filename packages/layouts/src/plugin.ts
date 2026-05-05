import type { App, Plugin } from 'vue';
import VueForgeCore, { defaultThemePreset, type VfVueForgeOptions } from '@codemonster-ru/vueforge-core';
import type { VfVueForgeLayoutsOptions, VfVueForgeLayoutsThemeOptions } from './theme/public';
import { applyLayoutsThemeConfig, resolveLayoutsThemeConfig } from './theme/public';

const TOKEN_WARNING_FLAG = '__vfLayoutsMissingTokensWarned';
const TOKEN_DIAGNOSTICS_HOOK = '__vfLayoutsTokenDiagnostics';
const isVitest =
  typeof globalThis !== 'undefined' && Boolean((globalThis as { __vitest_worker__?: unknown }).__vitest_worker__);
const isDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

const CORE_DEPENDENCY_TOKENS = [
  '--vf-breakpoint-xs',
  '--vf-breakpoint-sm',
  '--vf-breakpoint-md',
  '--vf-breakpoint-lg',
  '--vf-breakpoint-xl',
  '--vf-breakpoint-2xl',
  '--vf-surface-padding',
  '--vf-radius-surface',
  '--vf-color-border',
  '--vf-color-surface',
  '--vf-color-surface-muted',
  '--vf-shadow',
  '--vf-color-text',
] as const;

const LAYOUT_OUTPUT_TOKENS = [
  '--vf-layout-container-max-width',
  '--vf-layout-container-padding',
  '--vf-layout-grid-min-item-width',
  '--vf-layout-section-inset-default',
  '--vf-layout-shell-sidebar-width',
  '--vf-layout-shell-aside-width',
  '--vf-layout-shell-sidebar-collapsed-width',
  '--vf-layout-shell-header-height',
  '--vf-layout-shell-area-padding-block',
  '--vf-layout-shell-area-padding-inline',
  '--vf-layout-viewport-height',
  '--vf-layout-min-width',
  '--vf-layout-size-zero',
  '--vf-layout-size-one',
  '--vf-layout-size-half',
  '--vf-layout-size-full',
  '--vf-layout-space-layout-base',
  '--vf-layout-space-layout-roomy',
  '--vf-layout-border-base',
  '--vf-layout-surface-base',
  '--vf-layout-surface-muted',
  '--vf-layout-surface-subtle',
  '--vf-layout-shadow-overlay',
  '--vf-layout-app-background',
  '--vf-layout-header-background',
  '--vf-layout-sidebar-background',
  '--vf-layout-content-background',
  '--vf-layout-aside-background',
  '--vf-layout-footer-background',
  '--vf-layout-app-shell-header-sticky-z-index',
  '--vf-layout-app-shell-subheader-sticky-z-index',
  '--vf-layout-app-shell-content-subheader-sticky-z-index',
  '--vf-layout-document-layout-header-sticky-z-index',
  '--vf-layout-document-layout-subheader-sticky-z-index',
  '--vf-layout-document-layout-content-subheader-sticky-z-index',
  '--vf-layout-section-radius',
  '--vf-layout-section-shadow',
  '--vf-layout-radius-base',
  '--vf-layout-surface-radius',
  '--vf-layout-surface-shadow',
  '--vf-layout-header-border',
  '--vf-layout-header-height',
  '--vf-layout-header-padding-block',
  '--vf-layout-header-padding-inline',
  '--vf-layout-subheader-height',
  '--vf-layout-subheader-padding-block',
  '--vf-layout-subheader-padding-inline',
  '--vf-layout-sidebar-border',
  '--vf-layout-sidebar-padding-block',
  '--vf-layout-sidebar-padding-inline',
  '--vf-layout-content-padding-block',
  '--vf-layout-content-padding-inline',
  '--vf-layout-content-subheader-background',
  '--vf-layout-content-subheader-border',
  '--vf-layout-content-subheader-height',
  '--vf-layout-content-subheader-padding-inline',
  '--vf-layout-aside-border',
  '--vf-layout-aside-padding-block',
  '--vf-layout-aside-padding-inline',
  '--vf-layout-footer-border',
  '--vf-layout-footer-padding-block',
  '--vf-layout-footer-padding-inline',
  '--vf-layout-document-layout-edge-notch-color',
  '--vf-layout-document-layout-edge-notch-height',
  '--vf-layout-document-layout-edge-notch-offset',
  '--vf-layout-document-layout-edge-notch-width',
  '--vf-layout-error-layout-padding-block',
  '--vf-layout-error-layout-panel-padding',
  '--vf-layout-error-layout-code-font-size',
  '--vf-layout-error-layout-code-font-weight',
  '--vf-layout-error-layout-code-line-height',
  '--vf-layout-error-layout-code-letter-spacing',
  '--vf-layout-error-layout-title-font-size',
  '--vf-layout-error-layout-title-line-height',
  '--vf-layout-error-layout-description-color',
  '--vf-layout-error-layout-description-line-height',
] as const;

function getMissingCssTokens(tokens: readonly string[]) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !isDev || isVitest) {
    return [];
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  return tokens.filter((token) => rootStyles.getPropertyValue(token).trim() === '');
}

function warnMissingCssTokensInDev(layoutStyleId: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !isDev || isVitest) {
    return;
  }

  const warnedWindow = window as typeof window & {
    [TOKEN_WARNING_FLAG]?: boolean;
  };

  if (warnedWindow[TOKEN_WARNING_FLAG]) {
    return;
  }

  const isLayoutStylePresent = document.getElementById(layoutStyleId) !== null;
  const missingCoreTokens = getMissingCssTokens(CORE_DEPENDENCY_TOKENS);
  const missingLayoutTokens = getMissingCssTokens(LAYOUT_OUTPUT_TOKENS);
  const missingExpectedTokens = [...missingCoreTokens, ...missingLayoutTokens];

  if (missingExpectedTokens.length === 0) {
    return;
  }

  warnedWindow[TOKEN_WARNING_FLAG] = true;

  console.warn(
    `[vueforge-layouts] Token diagnostics detected missing CSS variables. See grouped lists below (core/layout).`,
  );
  if (missingCoreTokens.length > 0) {
    console.info(
      `[vueforge-layouts] Missing core tokens (${missingCoreTokens.length}): ${missingCoreTokens.join(', ')}`,
    );
  }
  if (missingLayoutTokens.length > 0) {
    if (!isLayoutStylePresent) {
      console.warn(
        `[vueforge-layouts] Layout preset style "#${layoutStyleId}" was not found. Missing layout tokens (${missingLayoutTokens.length}): ${missingLayoutTokens.join(', ')}`,
      );
    } else {
      console.info(
        `[vueforge-layouts] Missing layout tokens (${missingLayoutTokens.length}) while "#${layoutStyleId}" is present. This usually means their source core references are unresolved: ${missingLayoutTokens.join(', ')}`,
      );
    }
  }

  const diagnosticsWindow = window as typeof window & {
    [TOKEN_DIAGNOSTICS_HOOK]?: () => {
      missingRequired: string[];
      missingCore: string[];
      missingLayout: string[];
      missingExpected: string[];
      layoutStyleId: string;
      isLayoutStylePresent: boolean;
    };
  };

  diagnosticsWindow[TOKEN_DIAGNOSTICS_HOOK] = () => ({
    missingRequired: [...missingExpectedTokens],
    missingCore: [...missingCoreTokens],
    missingLayout: [...missingLayoutTokens],
    missingExpected: [...missingExpectedTokens],
    layoutStyleId,
    isLayoutStylePresent,
  });
}

function isCompositeThemeConfig(value: VfVueForgeLayoutsOptions['theme']): value is VfVueForgeLayoutsThemeOptions {
  return typeof value === 'object' && value !== null && ('core' in value || 'layouts' in value);
}

function resolvePluginThemes(theme: VfVueForgeLayoutsOptions['theme']) {
  if (isCompositeThemeConfig(theme)) {
    return {
      core: theme.core
        ? {
            ...theme.core,
            preset: theme.core.preset ?? defaultThemePreset,
          }
        : undefined,
      layouts: theme.layouts,
    };
  }

  return {
    core: undefined,
    layouts: theme,
  };
}

export function createVueForgeLayouts() {
  const plugin: Plugin = {
    install(app: App, options: VfVueForgeLayoutsOptions = {}) {
      const themes = resolvePluginThemes(options.theme);
      const coreOptions: VfVueForgeOptions = {
        theme: themes.core,
        defaultTheme: options.defaultTheme,
        themeStorageKey: options.themeStorageKey,
        themeAttribute: options.themeAttribute,
      };

      app.use(VueForgeCore, coreOptions);

      const resolvedLayoutsThemeConfig = resolveLayoutsThemeConfig(themes.layouts ?? {});

      if (typeof document !== 'undefined') {
        applyLayoutsThemeConfig(resolvedLayoutsThemeConfig);
      }

      if (typeof window !== 'undefined' && isDev) {
        const runTokenCheck = () => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              warnMissingCssTokensInDev(resolvedLayoutsThemeConfig.options.styleId);
            });
          });
        };

        if (document.readyState === 'complete') {
          runTokenCheck();
        } else {
          window.addEventListener('load', runTokenCheck, { once: true });
        }
      }
    },
  };

  return plugin;
}

export const VueForgeLayouts = createVueForgeLayouts();

export default VueForgeLayouts;
