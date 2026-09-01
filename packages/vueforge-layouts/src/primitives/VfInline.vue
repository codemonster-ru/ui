<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    wrap?: boolean;
  }>(),
  {
    as: 'div',
    wrap: true,
  },
);

const attrs = useAttrs();
const classes = computed(() => cx('vf-inline', !props.wrap && 'vf-inline--nowrap'));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <slot />
  </component>
</template>
