<script setup lang="ts">
import { computed } from 'vue';
import {
  resolveProgressBarClasses,
  resolveProgressBarMax,
  resolveProgressBarPercentage,
  resolveProgressBarRootStyle,
  resolveProgressBarValue,
  resolveProgressBarValueLabel,
  resolveProgressBarValueSemantics,
  resolveProgressBarValueStyle,
} from '@codemonster-ru/vueforge-shared-core';
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
  striped?: boolean;
  animated?: boolean;
}

const props = withDefaults(defineProps<VfProgressBarProps>(), {
  value: 0,
  max: 100,
  indeterminate: false,
  label: 'Progress',
  height: undefined,
  showValue: false,
  tone: 'primary',
  striped: false,
  animated: false,
});

const normalizedMax = computed(() => resolveProgressBarMax(props.max));
const normalizedValue = computed(() => resolveProgressBarValue(props.value, normalizedMax.value));
const percentage = computed(() => resolveProgressBarPercentage(normalizedValue.value, normalizedMax.value));
const valueLabel = computed(() => resolveProgressBarValueLabel(normalizedValue.value, normalizedMax.value));
const classes = computed(() =>
  cx(
    ...resolveProgressBarClasses({
      tone: props.tone,
      striped: props.striped,
      animated: props.animated,
      indeterminate: props.indeterminate,
    }),
  ),
);
// Plain objects handed to Vue's serialisers, as the reference did. An absent
// height gives an empty object, which both serialisers treat exactly as the
// historical `{ '--x': undefined }`; an empty-string height keeps its empty
// declaration, which the client drops and the server writes as `--x:;`. The
// fill's object is empty while indeterminate, which is the historical
// `{ inlineSize: undefined }` to both serialisers as well.
const rootStyle = computed(() => Object.fromEntries(resolveProgressBarRootStyle(props.height)));
const valueStyle = computed(() =>
  Object.fromEntries(resolveProgressBarValueStyle(props.indeterminate, percentage.value)),
);
const valueSemantics = computed(() =>
  resolveProgressBarValueSemantics(props.indeterminate, normalizedValue.value, normalizedMax.value),
);
</script>

<template>
  <div
    :class="classes"
    :style="rootStyle"
    role="progressbar"
    :aria-label="props.label"
    :aria-valuemin="valueSemantics?.valuemin"
    :aria-valuemax="valueSemantics?.valuemax"
    :aria-valuenow="valueSemantics?.valuenow"
  >
    <span class="vf-progress-bar__value" :style="valueStyle">
      <span v-if="props.showValue && !props.indeterminate" class="vf-progress-bar__label">
        {{ valueLabel }}
      </span>
    </span>
  </div>
</template>
