<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    surface?: boolean;
  }>(),
  {
    as: 'section',
    surface: false,
  },
);

const attrs = useAttrs();
const classes = computed(() => cx('vf-section', props.surface && 'vf-section--surface'));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <slot />
  </component>
</template>
