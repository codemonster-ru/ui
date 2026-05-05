<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M152 424h212c53 0 96-40.3 96-90s-43-90-96-90h-6.2c-13.6-45.8-56.4-78-106.8-78-57.3 0-103.7 41.5-110.8 95.2C96.8 267.5 62 303.2 62 348c0 42 40.3 76 90 76Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
