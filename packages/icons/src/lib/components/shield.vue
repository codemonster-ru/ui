<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-15.36 -15.36) scale(1.06)">
      <path
        fill="currentColor"
        d="M256 58c10.7 0 21.4 2.2 31.2 6.7l120.7 54.6c18.6 8.4 30.5 27 30.5 47.4v53.8c0 118.8-70.3 227.2-179.2 276.3-2.1.9-4.4 1.4-6.7 1.4s-4.6-.5-6.7-1.4C137 447.7 66.8 339.3 66.8 220.5v-53.8c0-20.4 11.9-39 30.5-47.4L218 64.7c9.8-4.5 20.5-6.7 31.2-6.7h6.8Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
