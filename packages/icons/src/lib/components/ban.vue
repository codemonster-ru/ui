<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M344.96 381.2L130.8 167.04C112.88 192.16 102.4 222.88 102.4 256C102.4 340.8 171.2 409.6 256 409.6C289.2 409.6 319.92 399.12 344.96 381.2zM381.2 344.96C399.12 319.84 409.6 289.12 409.6 256C409.6 171.2 340.8 102.4 256 102.4C222.8 102.4 192.08 112.88 167.04 130.8L381.2 344.96zM51.2 256C51.2 142.88 142.88 51.2 256 51.2C369.12 51.2 460.8 142.88 460.8 256C460.8 369.12 369.12 460.8 256 460.8C142.88 460.8 51.2 369.12 51.2 256z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
