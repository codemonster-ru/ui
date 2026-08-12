<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmAvatarShape, CmAvatarSize } from './avatar.types';

defineOptions({ inheritAttrs: false });
const sizes: readonly CmAvatarSize[] = ['sm', 'md', 'lg'];
const shapes: readonly CmAvatarShape[] = ['square', 'circle'];
const props = defineProps({
  image: { type: String as PropType<string | null>, default: null },
  imageAlt: { type: String, default: '' },
  label: { type: String as PropType<string | null>, default: null },
  size: {
    type: String as PropType<CmAvatarSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  shape: {
    type: String as PropType<CmAvatarShape>,
    default: 'square',
    validator: (value: string) => ['square', 'circle'].includes(value),
  },
});
const attrs = useAttrs();
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const shape = computed(() => (shapes.includes(props.shape) ? props.shape : 'square'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-avatar',
    size.value === 'md' ? undefined : `cm-avatar--${size.value}`,
    shape.value === 'circle' ? 'cm-avatar--circle' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class']));
</script>

<template>
  <span v-bind="rootAttrs" :class="classes">
    <img v-if="props.image" class="cm-avatar__image" :src="props.image" :alt="props.imageAlt" />
    <span v-else-if="props.label" class="cm-avatar__label">{{ props.label }}</span>
    <slot v-else />
  </span>
</template>
