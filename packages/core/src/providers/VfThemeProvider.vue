<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { themeContextKey } from './themeContext';
import { vueForgeConfigKey } from './vueForgeConfig';
import type { VfResolvedTheme, VfThemeMode, VfThemeProviderProps } from '@/types/theme';
import { DEFAULT_ATTRIBUTE, DEFAULT_STORAGE_KEY, isThemeMode, resolveTheme } from '@/utils/theme';

const props = defineProps<VfThemeProviderProps>();
const config = inject(vueForgeConfigKey, null);

const initialTheme = computed<VfThemeMode>(() => props.defaultTheme ?? config?.themeMode.defaultTheme ?? 'system');
const storageKey = computed(
  () => props.storageKey ?? config?.themeMode.storageKey ?? config?.theme.options.storageKey ?? DEFAULT_STORAGE_KEY,
);
const attribute = computed(
  () => props.attribute ?? config?.themeMode.attribute ?? config?.theme.options.attribute ?? DEFAULT_ATTRIBUTE,
);
const engineAttribute = computed(() => config?.theme.options.attribute ?? DEFAULT_ATTRIBUTE);
const rootSelector = computed(() => config?.theme.options.rootSelector ?? ':root');
const compatibleAttributes = ['data-theme', 'data-vf-theme'] as const;

function getThemeRoots(): Element[] {
  if (typeof document === 'undefined') {
    return [];
  }

  try {
    return Array.from(document.querySelectorAll(rootSelector.value));
  } catch {
    return [];
  }
}

function readStoredTheme(): VfThemeMode | null {
  try {
    const storedTheme = window.localStorage.getItem(storageKey.value);

    return isThemeMode(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

function getClientMode(): VfThemeMode {
  const storedTheme = readStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  const attributes = new Set([attribute.value, engineAttribute.value, ...compatibleAttributes]);

  for (const root of getThemeRoots()) {
    for (const name of attributes) {
      const rootTheme = root.getAttribute(name);
      if (rootTheme === 'light' || rootTheme === 'dark') {
        return rootTheme;
      }
    }
  }

  return initialTheme.value;
}

function getColorSchemeMediaQuery(): MediaQueryList | null {
  if (typeof window.matchMedia !== 'function') {
    return null;
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)');
  } catch {
    return null;
  }
}

const mode = ref<VfThemeMode>(initialTheme.value);
const systemTheme = ref<VfResolvedTheme>('light');
const mediaQuery = ref<MediaQueryList | null>(null);

const resolvedTheme = computed(() => resolveTheme(mode.value, systemTheme.value));
const hasMounted = ref(false);
let themeTransitionTimeout: number | null = null;

function clearThemeTransitionTimeout() {
  if (themeTransitionTimeout !== null) {
    window.clearTimeout(themeTransitionTimeout);
    themeTransitionTimeout = null;
  }
}

function updateDocumentTheme(theme: VfResolvedTheme, options: { animate?: boolean } = {}) {
  if (typeof document === 'undefined') {
    return;
  }

  const roots = getThemeRoots();

  if (options.animate) {
    clearThemeTransitionTimeout();
    document.documentElement.classList.add('vf-theme-transitioning');
  }

  const attributes = new Set([engineAttribute.value, attribute.value, ...compatibleAttributes]);

  for (const root of roots) {
    for (const name of attributes) {
      root.setAttribute(name, theme);
    }
  }

  if (options.animate) {
    themeTransitionTimeout = window.setTimeout(() => {
      document.documentElement.classList.remove('vf-theme-transitioning');
      themeTransitionTimeout = null;
    }, 320);
  }
}

function handleSystemThemeChange(event?: MediaQueryListEvent) {
  if (event) {
    systemTheme.value = event.matches ? 'dark' : 'light';
    return;
  }

  systemTheme.value = mediaQuery.value?.matches ? 'dark' : 'light';
}

function setTheme(value: VfThemeMode) {
  mode.value = value;
}

function toggleTheme() {
  const nextTheme = resolvedTheme.value === 'dark' ? 'light' : 'dark';
  mode.value = nextTheme;
}

watch(mode, (value) => {
  if (typeof window === 'undefined' || !hasMounted.value) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey.value, value);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}, { flush: 'sync' });

watch(
  resolvedTheme,
  (value) => {
    if (hasMounted.value) {
      updateDocumentTheme(value, { animate: true });
    }
  },
  { flush: 'sync' },
);

onMounted(() => {
  mode.value = getClientMode();
  mediaQuery.value = getColorSchemeMediaQuery();
  systemTheme.value = mediaQuery.value?.matches ? 'dark' : 'light';
  updateDocumentTheme(resolvedTheme.value);

  mediaQuery.value?.addEventListener('change', handleSystemThemeChange);

  hasMounted.value = true;
});

onBeforeUnmount(() => {
  mediaQuery.value?.removeEventListener('change', handleSystemThemeChange);
  clearThemeTransitionTimeout();
});

provide(themeContextKey, {
  mode,
  resolvedTheme,
  setTheme,
  toggleTheme,
});
</script>

<template>
  <slot />
</template>
