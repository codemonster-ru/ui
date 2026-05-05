<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M224 88a136 136 0 1 1 0 272 136 136 0 0 1 0-272Zm96.2 232.2 91.8 91.8"
      stroke="currentColor"
      stroke-width="56"
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
