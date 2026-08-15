import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue';

import {
  applyShowcaseTheme,
  isShowcaseThemeMode,
  persistShowcaseTheme,
  resolveShowcaseTheme,
  showcaseThemeStorageKey,
  type ShowcaseTheme,
  type ShowcaseThemeMode,
} from './app-shell';

export interface ShowcaseThemeContext {
  themeMode: Ref<ShowcaseThemeMode>;
  resolvedTheme: ComputedRef<ShowcaseTheme>;
  setThemeMode(mode: ShowcaseThemeMode): void;
  toggleTheme(): void;
}

const showcaseThemeContextKey: InjectionKey<ShowcaseThemeContext> = Symbol('showcase-theme');

function readPersistedMode(): ShowcaseThemeMode {
  try {
    const storedMode = window.localStorage.getItem(showcaseThemeStorageKey);
    return isShowcaseThemeMode(storedMode) ? storedMode : 'system';
  } catch {
    return 'system';
  }
}

function getColorSchemeMediaQuery(): MediaQueryList | null {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  } catch {
    return null;
  }
}

export function provideShowcaseTheme(): ShowcaseThemeContext {
  const mediaQuery = ref<MediaQueryList | null>(null);
  const themeMode = ref<ShowcaseThemeMode>('system');
  const systemTheme = ref<ShowcaseTheme>('light');
  const resolvedTheme = computed(() => resolveShowcaseTheme(themeMode.value, systemTheme.value === 'dark'));
  let hasMounted = false;
  let transitionTimer: number | null = null;

  function clearTransitionTimer(): void {
    if (transitionTimer !== null) {
      window.clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  }

  function applyResolvedTheme(theme: ShowcaseTheme, animate = false): void {
    if (animate) {
      clearTransitionTimer();
      document.documentElement.classList.add('vf-theme-transitioning');
    }

    applyShowcaseTheme(document.documentElement, theme);

    if (animate) {
      transitionTimer = window.setTimeout(() => {
        document.documentElement.classList.remove('vf-theme-transitioning');
        transitionTimer = null;
      }, 320);
    }
  }

  function setThemeMode(mode: ShowcaseThemeMode): void {
    themeMode.value = mode;
  }

  function toggleTheme(): void {
    themeMode.value = resolvedTheme.value === 'dark' ? 'light' : 'dark';
  }

  function handleSystemThemeChange(event: MediaQueryListEvent): void {
    systemTheme.value = event.matches ? 'dark' : 'light';
  }

  watch(
    themeMode,
    (mode) => {
      if (!hasMounted) return;
      persistShowcaseTheme(window.localStorage, mode);
    },
    { flush: 'sync' },
  );

  watch(
    resolvedTheme,
    (theme) => {
      if (hasMounted) applyResolvedTheme(theme, true);
    },
    { flush: 'sync' },
  );

  onMounted(() => {
    mediaQuery.value = getColorSchemeMediaQuery();
    systemTheme.value = mediaQuery.value?.matches ? 'dark' : 'light';
    themeMode.value = readPersistedMode();
    applyResolvedTheme(resolvedTheme.value);
    mediaQuery.value?.addEventListener('change', handleSystemThemeChange);
    hasMounted = true;
  });

  onBeforeUnmount(() => {
    mediaQuery.value?.removeEventListener('change', handleSystemThemeChange);
    clearTransitionTimer();
    document.documentElement.classList.remove('vf-theme-transitioning');
  });

  const context: ShowcaseThemeContext = {
    themeMode,
    resolvedTheme,
    setThemeMode,
    toggleTheme,
  };

  provide(showcaseThemeContextKey, context);
  return context;
}

export function useShowcaseTheme(): ShowcaseThemeContext {
  const context = inject(showcaseThemeContextKey);
  if (!context) throw new Error('useShowcaseTheme must be used below provideShowcaseTheme');
  return context;
}
