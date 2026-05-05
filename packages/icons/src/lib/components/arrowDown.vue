<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M256 120v264M256 384l-98-98M256 384l98-98"
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
