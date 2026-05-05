<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M96 424h80c44.2 0 80-35.8 80-80V128M256 128l-98 98M256 128l98 98"
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
