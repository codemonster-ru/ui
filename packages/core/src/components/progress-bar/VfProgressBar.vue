<script setup lang="ts">
import { computed } from 'vue';
import { cx } from '@/utils/classes';
import type { VfFeedbackTone } from '@/types/components';

defineOptions({
  name: 'VfProgressBar',
});

interface VfProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  label?: string;
  height?: string | number;
  showValue?: boolean;
  tone?: VfFeedbackTone;
}

const props = withDefaults(defineProps<VfProgressBarProps>(), {
  value: 0,
  max: 100,
  indeterminate: false,
  label: 'Progress',
  height: undefined,
  showValue: false,
  tone: 'primary',
});

const normalizedMax = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : 100));
const normalizedValue = computed(() => {
  if (!Number.isFinite(props.value)) {
    return 0;
  }

  return Math.min(Math.max(props.value, 0), normalizedMax.value);
});
const percentage = computed(() => `${(normalizedValue.value / normalizedMax.value) * 100}%`);
const valueLabel = computed(() => `${Math.round((normalizedValue.value / normalizedMax.value) * 100)}%`);
const classes = computed(() => cx('vf-progress-bar', props.tone !== 'primary' && `vf-progress-bar--${props.tone}`));
const rootStyle = computed(() => ({
  '--vf-progress-bar-height': toCssLength(props.height),
}));

function toCssLength(value: string | number | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}
</script>

<template>
  <div
    :class="[classes, { 'vf-progress-bar--indeterminate': props.indeterminate }]"
    :style="rootStyle"
    role="progressbar"
    :aria-label="props.label"
    :aria-valuemin="props.indeterminate ? undefined : 0"
    :aria-valuemax="props.indeterminate ? undefined : normalizedMax"
    :aria-valuenow="props.indeterminate ? undefined : normalizedValue"
  >
    <span class="vf-progress-bar__value" :style="{ inlineSize: props.indeterminate ? undefined : percentage }">
      <span v-if="props.showValue && !props.indeterminate" class="vf-progress-bar__label">
        {{ valueLabel }}
      </span>
    </span>
  </div>
</template>
