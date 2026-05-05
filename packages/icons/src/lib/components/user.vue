<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <circle cx="256" cy="156" r="76" fill="currentColor" />
      <path
        fill="currentColor"
        d="M256 274c-94.6 0-172 68.8-172 153.1 0 22.6 18.3 40.9 40.9 40.9h262.2c22.6 0 40.9-18.3 40.9-40.9C428 342.8 350.6 274 256 274Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
