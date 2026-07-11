<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { cx } from '@/utils/classes';
import type { VfAvatarShape, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfAvatarProps {
  image?: string;
  imageAlt?: string;
  label?: string;
  icon?: IconName | string;
  size?: VfControlSize;
  shape?: VfAvatarShape;
}

const props = withDefaults(defineProps<VfAvatarProps>(), {
  image: undefined,
  imageAlt: '',
  label: undefined,
  icon: undefined,
  size: 'md',
  shape: 'square',
});

const attrs = useAttrs();

const classes = computed(() =>
  cx('vf-avatar', props.size !== 'md' && `vf-avatar--${props.size}`, props.shape === 'circle' && 'vf-avatar--circle'),
);
</script>

<template>
  <span :class="classes" v-bind="attrs">
    <img v-if="props.image" class="vf-avatar__image" :src="props.image" :alt="props.imageAlt" />
    <span v-else-if="props.label" class="vf-avatar__label">{{ props.label }}</span>
    <VueIconify v-else-if="props.icon" class="vf-avatar__icon" :icon="props.icon" aria-hidden="true" />
    <slot v-else />
  </span>
</template>
