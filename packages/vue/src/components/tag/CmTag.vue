<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import type { CmTagTone } from './tag.types';

defineOptions({ inheritAttrs: false });
const tones: readonly CmTagTone[] = ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'];
const props = defineProps({
  tone: {
    type: String as PropType<CmTagTone>,
    default: 'neutral',
    validator: (value: string) =>
      ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'].includes(value),
  },
});
const attrs = useAttrs();
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'neutral'));
const classes = computed(() =>
  mergeCmClasses('cm-tag', tone.value === 'neutral' ? undefined : `cm-tag--${tone.value}`, attrs.class),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class']));
</script>

<template>
  <span v-bind="rootAttrs" :class="classes"><slot /></span>
</template>
