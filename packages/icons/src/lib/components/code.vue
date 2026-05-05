<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M170 176 86 252l84 76"
      stroke="currentColor"
      stroke-width="52"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M290 108 222 404"
      stroke="currentColor"
      stroke-width="52"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M342 176 426 252l-84 76"
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
