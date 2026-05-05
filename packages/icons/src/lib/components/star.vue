<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M256 44c11.4 0 22 6.2 27.5 16.2l48.8 89 102.3 14.9c11.5 1.7 21 9.8 24.5 20.9 3.5 11 .3 23.1-8.2 31l-74 72.3 17.4 101.5c2 11.5-2.7 23.1-12.1 30.1-9.5 7-22.1 8.1-32.7 2.9L256 373.3l-94.2 49.5c-10.6 5.2-23.2 4.1-32.7-2.9-9.4-7-14.1-18.6-12.1-30.1l17.4-101.5-74-72.3c-8.5-7.9-11.7-20-8.2-31 3.5-11.1 13-19.2 24.5-20.9L178.9 149l49.6-89C234 50.2 244.6 44 256 44Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
