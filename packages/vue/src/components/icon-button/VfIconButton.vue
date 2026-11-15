<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import VueIconify from '../icon/VueIconify.vue';
import CmIconButton from './CmIconButton.vue';
import type { CmIconButtonSize, CmIconButtonType, CmIconButtonVariant } from './icon-button.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    icon: string;
    variant?: CmIconButtonVariant;
    size?: CmIconButtonSize;
    type?: CmIconButtonType;
  }>(),
  { variant: 'ghost', size: 'md', type: 'button' },
);
const attrs = useAttrs();
const label = computed(() => {
  const explicit = attrs['aria-label'];
  const title = attrs.title;
  if (typeof explicit === 'string' && explicit.trim()) return explicit;
  return typeof title === 'string' && title.trim() ? title : 'Action';
});
</script>

<template>
  <CmIconButton v-bind="attrs" :label="label" :variant="props.variant" :size="props.size" :type="props.type">
    <VueIconify :icon="props.icon" size="100%" />
  </CmIconButton>
</template>
