<script setup lang="ts">
import { cmThemeAttribute } from '@codemonster-ru/ui-runtime/core';
import { provideTheme } from './provide-theme';
import type { CmThemeProviderProps } from './use-theme';

const props = withDefaults(defineProps<CmThemeProviderProps>(), {
  defaultTheme: 'system',
  attribute: cmThemeAttribute,
});

provideTheme(props);
</script>

<template>
  <slot />
</template>
