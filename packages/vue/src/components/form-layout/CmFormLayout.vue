<script setup lang="ts">
import { computed } from 'vue';
import type { CmFormLayoutMode } from './form-layout.types';

const props = withDefaults(
  defineProps<{
    mode?: CmFormLayoutMode;
    labelWidth?: string;
  }>(),
  { mode: 'stacked', labelWidth: 'minmax(10rem, 25%)' },
);
const style = computed(() => ({ '--cm-form-layout-label-width': props.labelWidth }));
</script>

<template>
  <div class="cm-form-layout" :class="`cm-form-layout--${props.mode}`" :style="style">
    <slot />
  </div>
</template>
