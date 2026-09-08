<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { isButtonDisabled, resolveButtonBusy, resolveButtonClasses } from '@codemonster-ru/vueforge-shared-core';
import VfProgressSpinner from '@/components/progress-spinner/VfProgressSpinner.vue';
import { cx } from '@/utils/classes';
import type { VfButtonVariant, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfButtonProps {
  variant?: VfButtonVariant;
  size?: VfControlSize;
  block?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<VfButtonProps>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  loading: false,
  type: 'button',
});

const attrs = useAttrs();

// Reading the attribute is Vue's half and stays here: `attrs.disabled` is a
// fact about Vue's fallthrough, and the reason the string "true" does not
// disable anything. What loading *means* is shared, so the answer goes to the
// shared rule rather than the raw attribute.
const hasDisabledAttribute = computed(() => attrs.disabled === true || attrs.disabled === '');
const isDisabled = computed(() => isButtonDisabled({ loading: props.loading, disabled: hasDisabledAttribute.value }));
const busy = computed(() => resolveButtonBusy(props.loading));

const classes = computed(() =>
  cx(
    ...resolveButtonClasses({
      variant: props.variant,
      size: props.size,
      block: props.block,
      loading: props.loading,
    }),
  ),
);
</script>

<template>
  <button v-bind="attrs" :class="classes" :type="props.type" :disabled="isDisabled" :aria-busy="busy">
    <VfProgressSpinner
      v-if="props.loading"
      class="vf-button__spinner"
      size="var(--vf-icon-current-size)"
      :stroke-width="5"
    />
    <slot />
  </button>
</template>
