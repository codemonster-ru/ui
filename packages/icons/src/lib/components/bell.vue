<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M256 42c19.9 0 36 16.1 36 36v9.5c65.8 16.5 114 76 114 146.8v51.2c0 34.5 12.4 67.8 35 94.1l7 8.1c17.7 20.7 3 52.3-24.3 52.3H88.3c-27.3 0-42-31.6-24.3-52.3l7-8.1c22.6-26.3 35-59.6 35-94.1v-51.2c0-70.8 48.2-130.3 114-146.8V78c0-19.9 16.1-36 36-36Z"
    />
    <path fill="currentColor" d="M200 452h112c-9.3 35-32.9 60-56 60s-46.7-25-56-60Z" />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
