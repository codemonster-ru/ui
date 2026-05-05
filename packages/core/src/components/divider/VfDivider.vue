<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';
import type { VfDividerOrientation } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDividerProps {
  orientation?: VfDividerOrientation;
}

const props = withDefaults(defineProps<VfDividerProps>(), {
  orientation: 'horizontal',
});

const attrs = useAttrs();

const isVertical = computed(() => props.orientation === 'vertical');
const classes = computed(() => cx('vf-divider', `vf-divider--${props.orientation}`));
</script>

<template>
  <div
    :class="classes"
    :aria-orientation="props.orientation"
    :role="isVertical ? 'separator' : undefined"
    v-bind="attrs"
  />
</template>
