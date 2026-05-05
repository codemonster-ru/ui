<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M320 332.8C397.76 332.8 460.8 269.76 460.8 192C460.8 114.24 397.76 51.2 320 51.2C242.24 51.2 179.2 114.24 179.2 192C179.2 206.96 181.52 221.44 185.84 234.96L56.8 364C53.2 367.6 51.2 372.48 51.2 377.6L51.2 441.6C51.2 452.24 59.76 460.8 70.4 460.8L134.4 460.8C145.04 460.8 153.6 452.24 153.6 441.6L153.6 409.6L185.6 409.6C196.24 409.6 204.8 401.04 204.8 390.4L204.8 358.4L236.8 358.4C241.92 358.4 246.8 356.4 250.4 352.8L277.04 326.16C290.56 330.48 305.04 332.8 320 332.8zM352 128C369.68 128 384 142.32 384 160C384 177.68 369.68 192 352 192C334.32 192 320 177.68 320 160C320 142.32 334.32 128 352 128z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
