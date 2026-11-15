<script setup lang="ts">
import { computed } from 'vue';

import CmProgressSpinner from './CmProgressSpinner.vue';
import type { VfProgressSpinnerProps } from './progress-spinner.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfProgressSpinnerProps>(), { label: 'Loading' });
const size = computed(() => {
  if (typeof props.size === 'number') {
    return Number.isFinite(props.size) && props.size >= 0 ? `${props.size}px` : undefined;
  }
  const value = props.size?.trim();
  return value && !/[;{}]/u.test(value) ? value : undefined;
});
</script>

<template>
  <CmProgressSpinner
    v-bind="$attrs"
    :label="props.label"
    :tone="props.tone === 'warn' ? 'warning' : props.tone"
    :stroke-width="props.strokeWidth"
    :style="size === undefined ? undefined : { '--cm-progress-spinner-size': size }"
  />
</template>
