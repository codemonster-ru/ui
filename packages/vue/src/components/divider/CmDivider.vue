<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmDividerOrientation } from './divider.types';

defineOptions({ inheritAttrs: false });
const orientations: readonly CmDividerOrientation[] = ['horizontal', 'vertical'];
const props = defineProps({
  orientation: {
    type: String as PropType<CmDividerOrientation>,
    default: 'horizontal',
    validator: (value: string) => ['horizontal', 'vertical'].includes(value),
  },
});
const attrs = useAttrs();
const orientation = computed(() => (orientations.includes(props.orientation) ? props.orientation : 'horizontal'));
const classes = computed(() =>
  mergeCmClasses('cm-divider', `cm-divider--${orientation.value}`, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'role', 'aria-orientation']));
</script>

<template><hr v-bind="rootAttrs" :class="classes" role="separator" :aria-orientation="orientation" /></template>
