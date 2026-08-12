<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmSectionElement } from './section.types';

defineOptions({ inheritAttrs: false });
const elements: readonly CmSectionElement[] = ['section', 'div', 'article', 'aside'];
const props = defineProps({
  element: {
    type: String as PropType<CmSectionElement>,
    default: 'section',
    validator: (value: string) => ['section', 'div', 'article', 'aside'].includes(value),
  },
  surface: Boolean,
});
const attrs = useAttrs();
const rootElement = computed(() => (elements.includes(props.element) ? props.element : 'section'));
const classes = computed(() =>
  mergeCmClasses('cm-section', props.surface ? 'cm-section--surface' : undefined, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <component :is="rootElement" v-bind="rootAttrs" :class="classes"><slot /></component>
</template>
