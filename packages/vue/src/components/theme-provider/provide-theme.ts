import {
  cmThemeAttribute,
  isCmThemeMode,
  nextCmThemeMode,
  readCmThemeCookie,
  resolveCmTheme,
  serializeCmThemeCookie,
  type CmResolvedTheme,
} from '@codemonster-ru/ui-runtime/core';
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { cmThemeContextKey, type CmThemeContext, type CmThemeProviderProps } from './use-theme';

type ThemeProviderOptions = CmThemeProviderProps & Required<Pick<CmThemeProviderProps, 'defaultTheme' | 'attribute'>>;

export function provideTheme(props: ThemeProviderOptions, legacyAttribute?: string): void {
  const theme = ref(props.defaultTheme);
  const system = ref<CmResolvedTheme>('light');
  const resolvedTheme = computed(() => resolveCmTheme(theme.value, system.value));
  const setTheme: CmThemeContext['setTheme'] = (value) => {
    if (isCmThemeMode(value)) theme.value = value;
  };
  function toggleTheme(): void {
    setTheme(nextCmThemeMode(resolvedTheme.value));
  }
  provide(cmThemeContextKey, { theme, resolvedTheme, setTheme, toggleTheme });

  let media: MediaQueryList | undefined;
  let syncingStorage = false;
  function syncSystem(): void {
    system.value = media?.matches ? 'dark' : 'light';
  }
  function applyTheme(): void {
    const root = document.documentElement;
    // CSS resolves system mode without JavaScript; keep the server and browser preference intact.
    root.setAttribute(cmThemeAttribute, theme.value);
    if (legacyAttribute) root.setAttribute(legacyAttribute, resolvedTheme.value);
    if (props.attribute !== cmThemeAttribute && props.attribute !== legacyAttribute) {
      root.setAttribute(props.attribute, resolvedTheme.value);
    }
  }
  function readPreference(): string | null {
    try {
      return props.storageKey !== undefined
        ? window.localStorage.getItem(props.storageKey)
        : readCmThemeCookie(document.cookie);
    } catch {
      return null;
    }
  }
  function persistTheme(): void {
    if (syncingStorage) return;
    try {
      if (props.storageKey !== undefined) window.localStorage.setItem(props.storageKey, theme.value);
      else document.cookie = serializeCmThemeCookie(theme.value, { secure: window.location.protocol === 'https:' });
    } catch {
      // Privacy settings can disable persistence without disabling the theme controls.
    }
  }
  function syncStorage(event: StorageEvent): void {
    if (props.storageKey === undefined || (event.key !== null && event.key !== props.storageKey)) return;
    syncingStorage = true;
    try {
      setTheme(isCmThemeMode(event.newValue) ? event.newValue : props.defaultTheme);
    } finally {
      syncingStorage = false;
    }
  }

  onMounted(() => {
    const preferred = readPreference();
    const root = document.documentElement;
    const declared = [
      root.getAttribute(cmThemeAttribute),
      root.getAttribute(props.attribute),
      legacyAttribute ? root.getAttribute(legacyAttribute) : null,
    ].find(isCmThemeMode);
    if (isCmThemeMode(preferred)) theme.value = preferred;
    else if (declared) theme.value = declared;

    try {
      media = window.matchMedia?.('(prefers-color-scheme: dark)');
    } catch {
      // Resolve to light when the browser cannot read the system preference.
    }
    syncSystem();
    applyTheme();
    media?.addEventListener('change', syncSystem);
    window.addEventListener('storage', syncStorage);
    watch([theme, resolvedTheme], applyTheme, { flush: 'sync' });
    watch(theme, persistTheme, { flush: 'sync' });
  });

  onBeforeUnmount(() => {
    media?.removeEventListener('change', syncSystem);
    window.removeEventListener('storage', syncStorage);
  });
}
