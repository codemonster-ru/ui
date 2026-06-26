<script setup lang="ts">
import { computed } from 'vue';
import { cx } from '@/utils/classes';
import type { VfFeedbackTone } from '@/types/components';

defineOptions({
  name: 'VfProgressSpinner',
});

interface VfProgressSpinnerProps {
  label?: string;
  size?: string | number;
  strokeWidth?: number;
  tone?: VfFeedbackTone;
}

const props = withDefaults(defineProps<VfProgressSpinnerProps>(), {
  label: 'Loading',
  size: undefined,
  strokeWidth: 4,
  tone: 'primary',
});

const classes = computed(() =>
  cx('vf-progress-spinner', props.tone !== 'primary' && `vf-progress-spinner--${props.tone}`),
);
const rootStyle = computed(() => ({
  '--vf-progress-spinner-size': toCssLength(props.size),
}));

function toCssLength(value: string | number | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}
</script>

<template>
  <span :class="classes" :style="rootStyle" role="progressbar" :aria-label="props.label">
    <svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />
      <circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />
    </svg>
  </span>
</template>
