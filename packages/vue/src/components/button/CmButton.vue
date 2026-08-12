<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmButtonProps } from './button.types';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<CmButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
});

const attrs = useAttrs();

const classes = computed(() =>
  mergeCmClasses('cm-button', `cm-button--${props.variant}`, `cm-button--${props.size}`, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['type', 'disabled']));
</script>

<template>
  <button v-bind="rootAttrs" :class="classes" :type="props.type" :disabled="props.disabled">
    <span class="cm-button__label"><slot /></span>
  </button>
</template>
