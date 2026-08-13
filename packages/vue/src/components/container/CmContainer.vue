<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmContainerElement, CmContainerSize } from './container.types';

defineOptions({ inheritAttrs: false });
const elements: readonly CmContainerElement[] = ['div', 'main', 'section'];
const props = defineProps({
  element: {
    type: String as PropType<CmContainerElement>,
    default: 'div',
    validator: (value: string) => ['div', 'main', 'section'].includes(value),
  },
  size: {
    type: String as PropType<CmContainerSize | null>,
    default: null,
    validator: (value: string | null) => value === null || ['md', 'lg', 'xl', '2xl'].includes(value),
  },
  fluid: Boolean,
});
const attrs = useAttrs();
const rootElement = computed(() => (elements.includes(props.element) ? props.element : 'div'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-container',
    props.fluid ? 'cm-container--fluid' : props.size ? `cm-container--${props.size}` : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <component :is="rootElement" v-bind="rootAttrs" :class="classes"><slot /></component>
</template>
