<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { resolveIconButtonClasses, resolveIconButtonIconSize } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';
import type { VfButtonVariant, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfIconButtonProps {
  icon: IconName | string;
  variant?: VfButtonVariant;
  size?: VfControlSize;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<VfIconButtonProps>(), {
  variant: 'ghost',
  size: 'md',
  type: 'button',
});

const attrs = useAttrs();

// The class list and the icon size are the only derivations this component
// makes, and the Razor adapter has to make the same two. They live in
// shared-core so the platforms cannot drift; the rendering below is unchanged.
const classes = computed(() => cx(...resolveIconButtonClasses({ variant: props.variant, size: props.size })));

const iconSize = computed(() => resolveIconButtonIconSize(props.size));
</script>

<template>
  <button :class="classes" :type="props.type" v-bind="attrs">
    <VueIconify :icon="props.icon" :size="iconSize" aria-hidden="true" />
  </button>
</template>
