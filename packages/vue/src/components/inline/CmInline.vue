<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmInlineElement } from './inline.types';

defineOptions({ inheritAttrs: false });
const elements: readonly CmInlineElement[] = ['div', 'nav', 'ul'];
const props = defineProps({
  element: {
    type: String as PropType<CmInlineElement>,
    default: 'div',
    validator: (value: string) => ['div', 'nav', 'ul'].includes(value),
  },
  wrap: { type: Boolean, default: true },
});
const attrs = useAttrs();
const rootElement = computed(() => (elements.includes(props.element) ? props.element : 'div'));
const classes = computed(() =>
  mergeCmClasses('cm-inline', props.wrap ? undefined : 'cm-inline--nowrap', attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <component :is="rootElement" v-bind="rootAttrs" :class="classes"><slot /></component>
</template>
