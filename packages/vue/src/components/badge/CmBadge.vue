<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmBadgeTone } from './badge.types';

defineOptions({ inheritAttrs: false });
const tones: readonly CmBadgeTone[] = [
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
  tone: {
    type: String as PropType<CmBadgeTone>,
    default: 'neutral',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
});
const attrs = useAttrs();
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'neutral'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-badge',
    tone.value === 'neutral' ? undefined : `cm-badge--${tone.value}`,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class']));
</script>

<template>
  <span v-bind="rootAttrs" :class="classes"><slot /></span>
</template>
