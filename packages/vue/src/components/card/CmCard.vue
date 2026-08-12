<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmCardElement } from './card.types';

defineOptions({
  inheritAttrs: false,
});

const elements: readonly CmCardElement[] = ['section', 'article', 'div'];
const props = defineProps({
  element: {
    type: String as PropType<CmCardElement>,
    default: 'section',
    validator: (value: string) => ['section', 'article', 'div'].includes(value),
  },
  title: {
    type: String,
    default: null,
  },
  compact: Boolean,
});
const attrs = useAttrs();
const rootElement = computed(() => (elements.includes(props.element) ? props.element : 'section'));
const classes = computed(() =>
  mergeCmClasses('cm-card', props.compact ? 'cm-card--compact' : undefined, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <component :is="rootElement" v-bind="rootAttrs" :class="classes">
    <header v-if="$slots.header || props.title" class="cm-card__header">
      <slot name="header"
        ><h3 class="cm-card__title">{{ props.title }}</h3></slot
      >
    </header>
    <div v-if="$slots.default" class="cm-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="cm-card__footer"><slot name="footer" /></footer>
  </component>
</template>
