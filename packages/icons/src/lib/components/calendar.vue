<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(0 -10.24) scale(1 1.04)">
      <path
        fill="currentColor"
        d="M156 44c19.9 0 36 16.1 36 36v28h128V80c0-19.9 16.1-36 36-36s36 16.1 36 36v28h18c39.8 0 72 32.2 72 72v52H30v-52c0-39.8 32.2-72 72-72h18V80c0-19.9 16.1-36 36-36Z"
      />
      <path fill="currentColor" d="M30 268h452v120c0 44.2-35.8 80-80 80H110c-44.2 0-80-35.8-80-80V268Z" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
