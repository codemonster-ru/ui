<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';
import { cx } from '@/utils/classes';
import type { VfFormLayoutMode } from '@/types/components';

defineOptions({ inheritAttrs: false });

interface VfFormLayoutProps {
  mode?: VfFormLayoutMode;
  labelWidth?: string;
}

const props = withDefaults(defineProps<VfFormLayoutProps>(), {
  mode: 'stacked',
  labelWidth: 'minmax(10rem, 25%)',
});

const attrs = useAttrs();
const classes = computed(() =>
  cx('vf-form-layout', `vf-form-layout--${props.mode}`, attrs.class as string | undefined),
);
const styles = computed<StyleValue>(() => [
  attrs.style as StyleValue,
  { '--vf-form-layout-label-width': props.labelWidth },
]);
const forwardedAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
);
</script>

<template>
  <div :class="classes" :style="styles" v-bind="forwardedAttrs">
    <slot />
  </div>
</template>
