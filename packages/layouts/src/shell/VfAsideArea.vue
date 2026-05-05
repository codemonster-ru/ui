<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    appearance?: 'default' | 'plain';
  }>(),
  {
    as: 'aside',
    appearance: 'default',
  },
);

const attrs = useAttrs();
const classes = computed(() => cx('vf-aside-area', props.appearance === 'plain' && 'vf-aside-area--plain'));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <div class="vf-aside-area__inner">
      <slot />
    </div>
  </component>
</template>
