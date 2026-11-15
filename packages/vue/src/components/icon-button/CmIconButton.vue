<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { buttonVariants } from '../button/button.types';
import type { CmIconButtonSize, CmIconButtonType, CmIconButtonVariant } from './icon-button.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmIconButtonSize[] = ['sm', 'md', 'lg'];
const types: readonly CmIconButtonType[] = ['button', 'submit', 'reset'];

const props = defineProps({
  label: {
    type: String,
    required: true,
    validator: (value: string) => value.trim().length > 0,
  },
  variant: {
    type: String as PropType<CmIconButtonVariant>,
    default: 'ghost',
    validator: (value: CmIconButtonVariant) => buttonVariants.includes(value),
  },
  size: {
    type: String as PropType<CmIconButtonSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  type: {
    type: String as PropType<CmIconButtonType>,
    default: 'button',
    validator: (value: string) => ['button', 'submit', 'reset'].includes(value),
  },
  disabled: Boolean,
});

const attrs = useAttrs();
const variant = computed(() => (buttonVariants.includes(props.variant) ? props.variant : 'ghost'));
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const type = computed(() => (types.includes(props.type) ? props.type : 'button'));
const classes = computed(() =>
  mergeCmClasses('cm-icon-button', `cm-icon-button--${variant.value}`, `cm-icon-button--${size.value}`, attrs.class),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['type', 'disabled', 'aria-label']));
</script>

<template>
  <button
    v-bind="rootAttrs"
    :class="classes"
    :type="type"
    :disabled="props.disabled || undefined"
    :aria-label="props.label"
  >
    <span class="cm-icon-button__icon" aria-hidden="true"><slot /></span>
  </button>
</template>
