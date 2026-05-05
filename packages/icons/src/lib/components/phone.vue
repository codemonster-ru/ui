<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M179.36 71.2C173.04 56.08 156.56 48.08 140.88 52.32L136.48 53.52C84.8 67.6 40.64 117.68 53.52 178.64C83.2 318.64 193.36 428.8 333.36 458.48C394.4 471.44 444.4 427.2 458.48 375.52L459.68 371.12C464 355.36 455.92 338.88 440.88 332.64L363.04 300.24C349.84 294.72 334.56 298.56 325.44 309.68L294.56 347.44C238.32 319.52 193.04 272.8 167.04 215.44L202.4 186.64C213.52 177.6 217.28 162.32 211.84 149.04L179.36 71.2z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
