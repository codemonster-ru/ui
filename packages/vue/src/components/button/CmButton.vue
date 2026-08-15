<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmButtonSize, CmButtonType, CmButtonVariant } from './button.types';

defineOptions({
  inheritAttrs: false,
});

const variants: readonly CmButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost'];
const sizes: readonly CmButtonSize[] = ['sm', 'md', 'lg'];
const types: readonly CmButtonType[] = ['button', 'submit', 'reset'];

const props = defineProps({
  variant: {
    type: String as PropType<CmButtonVariant>,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'danger', 'ghost'].includes(value),
  },
  size: {
    type: String as PropType<CmButtonSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  type: {
    type: String as PropType<CmButtonType>,
    default: 'button',
    validator: (value: string) => ['button', 'submit', 'reset'].includes(value),
  },
  href: {
    type: String,
    default: null,
  },
  disabled: Boolean,
  loading: Boolean,
});

const attrs = useAttrs();

const isLink = computed(() => Boolean(props.href));
const isDisabled = computed(() => props.disabled || props.loading);
const variant = computed(() => (variants.includes(props.variant) ? props.variant : 'primary'));
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const type = computed(() => (types.includes(props.type) ? props.type : 'button'));
const classes = computed(() =>
  mergeCmClasses('cm-button', `cm-button--${variant.value}`, `cm-button--${size.value}`, attrs.class as CmClassValue),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'type',
    'href',
    'disabled',
    'role',
    'aria-disabled',
    'aria-busy',
    ...(isLink.value && isDisabled.value ? ['onClick'] : []),
  ]),
);

function preventDisabledLinkActivation(event: MouseEvent): void {
  if (isLink.value && isDisabled.value) {
    event.preventDefault();
  }
}
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    v-bind="rootAttrs"
    :class="classes"
    :type="isLink ? undefined : type"
    :href="isLink && !isDisabled ? props.href : undefined"
    :disabled="!isLink && isDisabled ? true : undefined"
    :role="isLink && isDisabled ? 'link' : undefined"
    :aria-disabled="isLink && isDisabled ? 'true' : undefined"
    :aria-busy="props.loading ? 'true' : undefined"
    @click="preventDisabledLinkActivation"
  >
    <span v-if="props.loading" class="cm-button__spinner" aria-hidden="true">
      <svg class="cm-button__spinner-svg" viewBox="0 0 50 50" focusable="false">
        <circle class="cm-button__spinner-track" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
        <circle class="cm-button__spinner-value" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
      </svg>
    </span>
    <span v-else-if="$slots.leading" class="cm-button__leading"><slot name="leading" /></span>
    <span class="cm-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="cm-button__trailing"><slot name="trailing" /></span>
  </component>
</template>
