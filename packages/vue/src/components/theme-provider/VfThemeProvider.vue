<script setup lang="ts">
import { inject } from 'vue';
import { provideTheme } from './provide-theme';
import type { CmThemeProviderProps } from './use-theme';
import { vfThemeOptionsKey } from './vueforge-core';

const props = defineProps<CmThemeProviderProps>();
const options = inject(vfThemeOptionsKey, undefined);

provideTheme(
  {
    get defaultTheme() {
      return props.defaultTheme ?? options?.defaultTheme ?? 'system';
    },
    get storageKey() {
      return props.storageKey ?? options?.themeStorageKey ?? 'vf-theme';
    },
    get attribute() {
      return props.attribute ?? options?.themeAttribute ?? 'data-vf-theme';
    },
  },
  'data-vf-theme',
);
</script>

<template>
  <slot />
</template>
