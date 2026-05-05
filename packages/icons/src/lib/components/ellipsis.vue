<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <circle cx="122" cy="256" r="45" fill="currentColor" />
    <circle cx="256" cy="256" r="45" fill="currentColor" />
    <circle cx="390" cy="256" r="45" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
