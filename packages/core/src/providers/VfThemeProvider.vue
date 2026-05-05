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

function getInitialMode(): VfThemeMode {
  if (typeof window === 'undefined') {
    return initialTheme.value;
  }

  const storedTheme = window.localStorage.getItem(storageKey.value);

  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  return initialTheme.value;
}

function getInitialSystemTheme(): VfResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const mode = ref<VfThemeMode>(getInitialMode());
const systemTheme = ref<VfResolvedTheme>(getInitialSystemTheme());
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

  const root = document.documentElement;

  if (options.animate) {
    clearThemeTransitionTimeout();
    root.classList.add('vf-theme-transitioning');
  }

  root.setAttribute(attribute.value, theme);

  if (options.animate) {
    themeTransitionTimeout = window.setTimeout(() => {
      root.classList.remove('vf-theme-transitioning');
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
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey.value, value);
});

watch(
  resolvedTheme,
  (value) => {
    updateDocumentTheme(value, { animate: hasMounted.value });
  },
  { immediate: true },
);

onMounted(() => {
  mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)');
  handleSystemThemeChange();
  mediaQuery.value.addEventListener('change', handleSystemThemeChange);
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
