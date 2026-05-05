<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -6.4) scale(1.04)">
      <circle cx="256" cy="106" r="42" fill="currentColor" />
      <path
        fill="currentColor"
        d="M214 182c-16.6 0-30 13.4-30 30s13.4 30 30 30h20v146h-24c-16.6 0-30 13.4-30 30s13.4 30 30 30h92c16.6 0 30-13.4 30-30s-13.4-30-30-30h-8V212c0-16.6-13.4-30-30-30h-50Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
