<script setup lang="ts">
import { provideTheme } from './provide-theme';
import type { CmThemeProviderProps } from './use-theme';

const props = withDefaults(defineProps<CmThemeProviderProps>(), {
  defaultTheme: 'system',
  storageKey: 'vf-theme',
  attribute: 'data-vf-theme',
});

provideTheme(props, 'data-vf-theme');
</script>

<template>
  <slot />
</template>
