<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M194 70h124c16.5 0 31.2 10.5 36.3 26.1l8.6 25.9H428c17.7 0 32 14.3 32 32s-14.3 32-32 32H84c-17.7 0-32-14.3-32-32s14.3-32 32-32h65.1l8.6-25.9C162.8 80.5 177.5 70 194 70ZM112 218h288l-16.6 205.8c-2.1 26.3-24 46.2-50.4 46.2H179c-26.4 0-48.3-19.9-50.4-46.2L112 218Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
