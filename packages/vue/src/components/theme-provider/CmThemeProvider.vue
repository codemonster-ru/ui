<script setup lang="ts">
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

const props = withDefaults(defineProps<CmThemeProviderProps>(), {
  defaultTheme: 'system',
  storageKey: undefined,
  attribute: cmThemeAttribute,
});

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
  if (props.attribute !== cmThemeAttribute) root.setAttribute(props.attribute, resolvedTheme.value);
}
function readPreference(): string | null {
  try {
    return props.storageKey ? window.localStorage.getItem(props.storageKey) : readCmThemeCookie(document.cookie);
  } catch {
    return null;
  }
}
function persistTheme(): void {
  if (syncingStorage) return;
  try {
    if (props.storageKey) window.localStorage.setItem(props.storageKey, theme.value);
    else document.cookie = serializeCmThemeCookie(theme.value, { secure: window.location.protocol === 'https:' });
  } catch {
    // Privacy settings can disable persistence without disabling the theme controls.
  }
}
function syncStorage(event: StorageEvent): void {
  if (!props.storageKey || (event.key !== null && event.key !== props.storageKey)) return;
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
  const declared = root.getAttribute(cmThemeAttribute) ?? root.getAttribute(props.attribute);
  if (isCmThemeMode(preferred)) theme.value = preferred;
  else if (isCmThemeMode(declared)) theme.value = declared;

  if (typeof window.matchMedia === 'function') media = window.matchMedia('(prefers-color-scheme: dark)');
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
</script>

<template>
  <slot />
</template>
