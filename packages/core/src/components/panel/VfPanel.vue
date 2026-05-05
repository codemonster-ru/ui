<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfPanelProps {
  title?: string;
  subtle?: boolean;
}

const props = withDefaults(defineProps<VfPanelProps>(), {
  title: undefined,
  subtle: false,
});

const attrs = useAttrs();
const classes = computed(() => cx('vf-panel', props.subtle && 'vf-panel--subtle'));
</script>

<template>
  <section :class="classes" v-bind="attrs">
    <header v-if="props.title || $slots.header">
      <slot name="header">
        <h3 class="vf-panel__title">{{ props.title }}</h3>
      </slot>
    </header>

    <slot />
  </section>
</template>
