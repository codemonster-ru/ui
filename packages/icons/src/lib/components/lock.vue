<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M256 44c48.6 0 88 39.4 88 88v52h8c35.3 0 64 28.7 64 64v176c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V248c0-35.3 28.7-64 64-64h8v-52c0-48.6 39.4-88 88-88Zm0 52c-19.9 0-36 16.1-36 36v52h72v-52c0-19.9-16.1-36-36-36Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
