<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="rotate(90 256 256)">
      <path
        fill="currentColor"
        d="M240.24 352.64C250.32 360.8 265.12 360.24 274.48 350.88L376.88 248.48C384.24 241.12 386.4 230.16 382.4 220.56C378.4 210.96 369.12 204.8 358.8 204.8L154 204.8C143.68 204.8 134.32 211.04 130.32 220.64C126.32 230.24 128.56 241.2 135.92 248.48L238.32 350.88L240.24 352.64z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
