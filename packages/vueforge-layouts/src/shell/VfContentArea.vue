<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    padded?: boolean;
  }>(),
  {
    as: 'main',
    padded: true,
  },
);

const attrs = useAttrs();
const classes = computed(() => cx('vf-content-area', props.padded && 'vf-content-area--padded'));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <slot />
  </component>
</template>
