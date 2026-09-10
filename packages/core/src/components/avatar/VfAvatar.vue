<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { resolveAvatarBranch, resolveAvatarClasses } from '@codemonster-ru/vueforge-shared-core';
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

const classes = computed(() => cx(...resolveAvatarClasses(props.size, props.shape)));

// The v-if/v-else-if chain the reference wrote, stated once so both adapters
// read the same rule. The template below still branches; it just no longer
// re-derives the priority order in its conditions.
const branch = computed(() => resolveAvatarBranch({ image: props.image, label: props.label, icon: props.icon }));
</script>

<template>
  <span :class="classes" v-bind="attrs">
    <img v-if="branch === 'image'" class="vf-avatar__image" :src="props.image" :alt="props.imageAlt" />
    <span v-else-if="branch === 'label'" class="vf-avatar__label">{{ props.label }}</span>
    <VueIconify v-else-if="branch === 'icon'" class="vf-avatar__icon" :icon="props.icon" aria-hidden="true" />
    <slot v-else />
  </span>
</template>
