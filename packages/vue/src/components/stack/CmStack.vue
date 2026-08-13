<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmStackElement } from './stack.types';

defineOptions({ inheritAttrs: false });
const elements: readonly CmStackElement[] = ['div', 'section', 'ul', 'ol'];
const props = defineProps({
  element: {
    type: String as PropType<CmStackElement>,
    default: 'div',
    validator: (value: string) => ['div', 'section', 'ul', 'ol'].includes(value),
  },
});
const attrs = useAttrs();
const rootElement = computed(() => (elements.includes(props.element) ? props.element : 'div'));
const classes = computed(() => mergeCmClasses('cm-stack', attrs.class as CmClassValue));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <component :is="rootElement" v-bind="rootAttrs" :class="classes"><slot /></component>
</template>
