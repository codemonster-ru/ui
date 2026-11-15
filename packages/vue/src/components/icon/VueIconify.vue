<script setup lang="ts">
import { computed } from 'vue';
import * as icons from '@codemonster-ru/ui-icons';

import CmIcon from './CmIcon.vue';
import type { VueIconifyProps } from './icon.types';

const props = withDefaults(defineProps<VueIconifyProps>(), {
  icon: 'moon',
  family: 'classic',
  size: 'var(--vf-icon-current-size, var(--vf-icon-size-md, var(--cm-icon-size-md)))',
});

const opticalOffsets: Readonly<Record<string, readonly [number, number]>> = {
  chartBar: [-0.0108, 0.0204],
  cloud: [0.0108, -0.0254],
  download: [0, 0.0158],
  heart: [0, -0.0058],
  info: [0, 0.0175],
  key: [-0.0175, 0.0196],
  link: [-0.0008, 0.0167],
  message: [0, -0.0217],
  phone: [-0.0108, 0.0158],
  shield: [0, -0.005],
  sparkles: [0.0204, 0.0108],
  star: [0, 0.0188],
  upload: [0, 0.0158],
};

const iconName = computed(() =>
  props.icon.includes('-')
    ? props.icon.toLowerCase().replace(/-([a-z0-9])/gu, (_, letter: string) => letter.toUpperCase())
    : props.icon,
);
const geometry = computed(() => {
  const entry = icons[iconName.value as keyof typeof icons];
  return entry && typeof entry === 'object' && 'classic/solid' in entry ? (entry as icons.CmIconGeometry) : icons.moon;
});
const variant = computed(() => {
  if (!icons.cmIconFamilies.includes(props.family)) throw new Error(`Unknown icon family "${props.family}".`);
  const resolved = props.variant ?? (geometry.value['classic/regular'] ? 'regular' : 'solid');
  if (!geometry.value[`${props.family}/${resolved}`]) {
    throw new Error(`Icon "${iconName.value}" does not support the "${props.family}/${resolved}" rendering.`);
  }
  return resolved;
});
const offsets = computed(() => {
  const [x, y] = opticalOffsets[iconName.value] ?? [0, 0];
  return { '--cm-icon-offset-x': `${x * 100}%`, '--cm-icon-offset-y': `${y * 100}%` };
});
</script>

<template>
  <CmIcon v-bind="props" :icon="geometry" :variant="variant" :style="offsets" />
</template>
