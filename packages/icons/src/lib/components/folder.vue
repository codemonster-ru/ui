<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M118 96h126c10 0 19.7 3.4 27.4 9.7l28.6 23.2c7.7 6.3 17.4 9.7 27.4 9.7H394c30.9 0 56 25.1 56 56V390c0 33.1-26.9 60-60 60H122c-33.1 0-60-26.9-60-60V156c0-33.1 26.9-60 60-60Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
