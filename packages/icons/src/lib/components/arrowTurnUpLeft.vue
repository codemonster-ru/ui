<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M424 96v80c0 44.2-35.8 80-80 80H128M128 256l98-98M128 256l98 98"
      stroke="currentColor"
      stroke-width="52"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
