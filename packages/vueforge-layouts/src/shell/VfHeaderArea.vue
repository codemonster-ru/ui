<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    sticky?: boolean;
  }>(),
  {
    as: 'header',
    sticky: true,
  },
);

const attrs = useAttrs();
const classes = computed(() => cx('vf-header-area', props.sticky && 'vf-header-area--sticky'));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <slot />
  </component>
</template>
