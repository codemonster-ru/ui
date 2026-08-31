<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

type VfContainerSize = 'md' | 'lg' | 'xl' | '2xl';

const props = withDefaults(
  defineProps<{
    as?: string;
    size?: VfContainerSize;
    fluid?: boolean;
  }>(),
  {
    as: 'div',
    size: undefined,
    fluid: false,
  },
);

const attrs = useAttrs();
</script>

<template>
  <component
    :is="props.as"
    class="vf-container"
    :class="{
      'vf-container--fluid': props.fluid,
      [`vf-container--${props.size}`]: props.size,
    }"
    v-bind="attrs"
  >
    <slot />
  </component>
</template>
