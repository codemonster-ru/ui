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
  href: null,
  disabled: false,
  loading: false,
});

const attrs = useAttrs();

const isLink = computed(() => Boolean(props.href));
const isDisabled = computed(() => props.disabled || props.loading);
const classes = computed(() =>
  mergeCmClasses('cm-button', `cm-button--${props.variant}`, `cm-button--${props.size}`, attrs.class as CmClassValue),
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
    :type="isLink ? undefined : props.type"
    :href="isLink && !isDisabled ? props.href : undefined"
    :disabled="!isLink && isDisabled ? true : undefined"
    :role="isLink && isDisabled ? 'link' : undefined"
    :aria-disabled="isLink && isDisabled ? 'true' : undefined"
    :aria-busy="props.loading ? 'true' : undefined"
    @click="preventDisabledLinkActivation"
  >
    <span v-if="props.loading" class="cm-button__spinner" aria-hidden="true" />
    <span v-else-if="$slots.leading" class="cm-button__leading"><slot name="leading" /></span>
    <span class="cm-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="cm-button__trailing"><slot name="trailing" /></span>
  </component>
</template>
