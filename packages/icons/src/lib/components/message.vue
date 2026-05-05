<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M136 88h240c48.6 0 88 39.4 88 88v112c0 48.6-39.4 88-88 88h-88l-94.4 69.3c-15.6 11.4-37.2.3-37.2-19V376h-20c-48.6 0-88-39.4-88-88V176c0-48.6 39.4-88 88-88Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
