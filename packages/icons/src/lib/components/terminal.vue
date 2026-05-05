<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M118.63 146.75C131.13 134.25 151.4 134.25 163.88 146.75L291.12 273.99C303.62 286.49 303.62 306.76 291.12 319.24L163.88 446.48C151.38 458.98 131.11 458.98 118.63 446.48C106.13 433.98 106.13 413.71 118.63 401.23L223.23 296.62L118.63 192.02C106.13 179.52 106.13 159.25 118.63 146.77V146.75Z"
    />
    <path
      fill="currentColor"
      d="M288 392H480C497.67 392 512 406.33 512 424C512 441.67 497.67 456 480 456H288C270.33 456 256 441.67 256 424C256 406.33 270.33 392 288 392Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
