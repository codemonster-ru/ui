<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmProgressSpinnerSize, CmProgressSpinnerTone } from './progress-spinner.types';

defineOptions({ inheritAttrs: false });
const sizes: readonly CmProgressSpinnerSize[] = ['sm', 'md', 'lg'];
const tones: readonly CmProgressSpinnerTone[] = [
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
  size: {
    type: String as PropType<CmProgressSpinnerSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  tone: {
    type: String as PropType<CmProgressSpinnerTone>,
    default: 'primary',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
});
if (!props.label.trim()) throw new TypeError('ProgressSpinner label must be a non-empty string.');

const attrs = useAttrs();
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'primary'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-progress-spinner',
    `cm-progress-spinner--${size.value}`,
    tone.value === 'primary' ? undefined : `cm-progress-spinner--${tone.value}`,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow']),
);
</script>

<template>
  <span v-bind="rootAttrs" :class="classes" role="progressbar" :aria-label="props.label">
    <svg class="cm-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <circle class="cm-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
      <circle class="cm-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
    </svg>
  </span>
</template>
