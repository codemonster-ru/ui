<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="rotate(-90 256 256)">
      <path
        fill="currentColor"
        d="M237.92 135.52C247.92 125.52 264.16 125.52 274.16 135.52L427.76 289.12C437.76 299.12 437.76 315.36 427.76 325.36C417.76 335.36 401.52 335.36 391.52 325.36L256 189.84L120.48 325.28C110.48 335.28 94.24 335.28 84.24 325.28C74.24 315.28 74.24 299.04 84.24 289.04L237.84 135.44z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
