<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';
import type { VfFeedbackTone } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfTagProps {
  tone?: VfFeedbackTone;
}

const props = withDefaults(defineProps<VfTagProps>(), {
  tone: 'neutral',
});

const attrs = useAttrs();

const classes = computed(() => cx('vf-tag', props.tone !== 'neutral' && `vf-tag--${props.tone}`));
</script>

<template>
  <span :class="classes" v-bind="attrs">
    <slot />
  </span>
</template>
