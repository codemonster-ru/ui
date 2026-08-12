<script setup lang="ts">
import { computed, useAttrs, type CSSProperties, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmSkeletonRadius } from './skeleton.types';

defineOptions({ inheritAttrs: false });
const radii: readonly CmSkeletonRadius[] = ['control', 'surface', 'round'];
const cssLengthPattern = /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%|vh|vw|dvh|dvw|ch|ex))$/u;
const props = defineProps({
  minHeight: { type: [String, Number] as PropType<string | number | null>, default: null },
  radius: {
    type: String as PropType<CmSkeletonRadius>,
    default: 'surface',
    validator: (value: string) => ['control', 'surface', 'round'].includes(value),
  },
  animated: { type: Boolean, default: true },
});
const attrs = useAttrs();
const radius = computed(() => (radii.includes(props.radius) ? props.radius : 'surface'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-skeleton',
    props.animated ? 'cm-skeleton--animated' : undefined,
    `cm-skeleton--radius-${radius.value}`,
    attrs.class as CmClassValue,
  ),
);
const minHeight = computed(() => {
  if (props.minHeight === null) return undefined;
  if (typeof props.minHeight === 'number') {
    if (!Number.isFinite(props.minHeight) || props.minHeight < 0)
      throw new TypeError('Skeleton minHeight must be non-negative.');
    return `${props.minHeight}px`;
  }
  if (!cssLengthPattern.test(props.minHeight))
    throw new TypeError('Skeleton minHeight must be a non-negative CSS length.');
  return props.minHeight;
});
const rootStyle = computed<CSSProperties>(() => ({ minHeight: minHeight.value }));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'style', 'aria-hidden']));
</script>

<template><div v-bind="rootAttrs" :class="classes" :style="[attrs.style, rootStyle]" aria-hidden="true" /></template>
