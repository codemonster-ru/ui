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
  loading: false,
});

const attrs = useAttrs();

const classes = computed(() =>
  mergeCmClasses('cm-button', `cm-button--${props.variant}`, `cm-button--${props.size}`, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['type', 'disabled', 'aria-busy']));
</script>

<template>
  <button
    v-bind="rootAttrs"
    :class="classes"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading ? 'true' : undefined"
  >
    <span v-if="props.loading" class="cm-button__spinner" aria-hidden="true" />
    <span v-else-if="$slots.leading" class="cm-button__leading"><slot name="leading" /></span>
    <span class="cm-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="cm-button__trailing"><slot name="trailing" /></span>
  </button>
</template>
