<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmAlertTone } from './alert.types';

defineOptions({ inheritAttrs: false });
const tones: readonly CmAlertTone[] = [
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
    type: String as PropType<CmAlertTone>,
    default: 'info',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
  title: { type: String, default: null },
});
const attrs = useAttrs();
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'info'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-alert',
    tone.value === 'info' ? undefined : `cm-alert--${tone.value}`,
    attrs.class as CmClassValue,
  ),
);
const rootRole = computed(() => (typeof attrs.role === 'string' ? attrs.role : 'status'));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'role']));
</script>

<template>
  <section v-bind="rootAttrs" :class="classes" :role="rootRole">
    <div v-if="$slots.icon" class="cm-alert__icon" aria-hidden="true"><slot name="icon" /></div>
    <div class="cm-alert__content">
      <p v-if="$slots.title || props.title" class="cm-alert__title">
        <slot name="title">{{ props.title }}</slot>
      </p>
      <div class="cm-alert__body"><slot /></div>
    </div>
  </section>
</template>
