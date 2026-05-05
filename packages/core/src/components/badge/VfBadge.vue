<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';
import type { VfBadgeTone } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfBadgeProps {
  tone?: VfBadgeTone;
}

const props = withDefaults(defineProps<VfBadgeProps>(), {
  tone: 'neutral',
});

const attrs = useAttrs();

const classes = computed(() => cx('vf-badge', props.tone !== 'neutral' && `vf-badge--${props.tone}`));
</script>

<template>
  <span :class="classes" v-bind="attrs">
    <slot />
  </span>
</template>
