<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmProgressBarTone } from './progress-bar.types';

defineOptions({ inheritAttrs: false });
const tones: readonly CmProgressBarTone[] = [
  'neutral',
  'primary',
  'success',
  'info',
  'warning',
  'help',
  'danger',
  'contrast',
];
const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: Boolean,
  showValue: Boolean,
  tone: {
    type: String as PropType<CmProgressBarTone>,
    default: 'primary',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
});
if (!props.label.trim()) throw new TypeError('ProgressBar label must be a non-empty string.');

const attrs = useAttrs();
const normalizedMax = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : 100));
const normalizedValue = computed(() => {
  if (!Number.isFinite(props.value)) return 0;
  return Math.min(Math.max(props.value, 0), normalizedMax.value);
});
const percentage = computed(() => (normalizedValue.value / normalizedMax.value) * 100);
const valueLabel = computed(() => `${Math.round(percentage.value)}%`);
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'primary'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-progress-bar',
    props.indeterminate ? 'cm-progress-bar--indeterminate' : undefined,
    tone.value === 'primary' ? undefined : `cm-progress-bar--${tone.value}`,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow']),
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    :class="classes"
    role="progressbar"
    :aria-label="props.label"
    :aria-valuemin="props.indeterminate ? undefined : 0"
    :aria-valuemax="props.indeterminate ? undefined : normalizedMax"
    :aria-valuenow="props.indeterminate ? undefined : normalizedValue"
  >
    <span
      class="cm-progress-bar__value"
      v-bind="props.indeterminate ? {} : { style: { inlineSize: `${percentage}%` } }"
    >
      <span v-if="props.showValue && !props.indeterminate" class="cm-progress-bar__label">{{ valueLabel }}</span>
    </span>
  </div>
</template>
