<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M160 184h192c35.3 0 64 28.7 64 64v176c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V248c0-35.3 28.7-64 64-64Z"
    />
    <path
      d="M180 184v-56c0-48.6 34.7-88 77.5-88s77.5 39.4 77.5 88"
      stroke="currentColor"
      stroke-width="56"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
