<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfCardProps {
  title?: string;
  compact?: boolean;
}

const props = withDefaults(defineProps<VfCardProps>(), {
  title: undefined,
  compact: false,
});

const attrs = useAttrs();

const classes = computed(() => cx('vf-card', props.compact && 'vf-card--compact'));
</script>

<template>
  <section :class="classes" v-bind="attrs">
    <header v-if="props.title || $slots.header">
      <slot name="header">
        <h3 class="vf-card__title">{{ props.title }}</h3>
      </slot>
    </header>

    <div v-if="$slots.default" class="vf-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </section>
</template>
