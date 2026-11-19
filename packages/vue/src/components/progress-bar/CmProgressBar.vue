<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { assertCm } from '../../internal/warn';
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
  label: { type: String, default: 'Progress' },
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: Boolean,
  showValue: Boolean,
  height: { type: [String, Number] as PropType<string | number | null>, default: null },
  striped: Boolean,
  animated: Boolean,
  tone: {
    type: String as PropType<CmProgressBarTone>,
    default: 'primary',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
});
assertCm(props.label.trim() !== '', 'ProgressBar label must be a non-empty string.');

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
    props.striped ? 'cm-progress-bar--striped' : undefined,
    props.striped && props.animated ? 'cm-progress-bar--animated' : undefined,
    tone.value === 'primary' ? undefined : `cm-progress-bar--${tone.value}`,
    attrs.class,
  ),
);
const rootAttrs = () =>
  omitCmOwnedAttrs(attrs, ['style', 'role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow']);
const rootStyle = computed(() => {
  const height = props.height;
  let cssHeight: string | undefined;
  if (typeof height === 'number') {
    if (Number.isFinite(height) && height >= 0) cssHeight = `${height}px`;
  } else {
    cssHeight = height?.trim();
  }
  return cssHeight
    ? { style: [attrs.style, { '--cm-progress-bar-height': cssHeight }] }
    : attrs.style === undefined
      ? {}
      : { style: attrs.style };
});
</script>

<template>
  <div
    v-bind="{ ...rootAttrs(), ...rootStyle }"
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
