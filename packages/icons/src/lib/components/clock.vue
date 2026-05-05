<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M256 64C362.04 64 448 149.96 448 256C448 362.04 362.04 448 256 448C149.96 448 64 362.04 64 256C64 149.96 149.96 64 256 64ZM232 152V259.16C232 267.18 235.99 274.67 242.63 279.11L318.63 329.77C329.67 337.13 344.57 334.15 351.92 323.11C359.28 312.08 356.3 297.18 345.26 289.82L280 246.31V152C280 138.75 269.25 128 256 128C242.75 128 232 138.75 232 152Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
