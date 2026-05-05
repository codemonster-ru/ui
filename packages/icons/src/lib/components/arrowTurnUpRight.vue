<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M88 96v80c0 44.2 35.8 80 80 80h216M384 256l-98-98M384 256l-98 98"
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
