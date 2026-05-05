<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M384 76.8C412.24 76.8 435.2 99.76 435.2 128L435.2 384C435.2 412.24 412.24 435.2 384 435.2L128 435.2L122.8 434.96C96.96 432.32 76.8 410.48 76.8 384L76.8 128C76.8 99.76 99.76 76.8 128 76.8L384 76.8zM128 307.2L128 384L230.4 384L230.4 307.2L128 307.2zM281.6 307.2L281.6 384L384 384L384 307.2L281.6 307.2zM128 256L230.4 256L230.4 179.2L128 179.2L128 256zM281.6 256L384 256L384 179.2L281.6 179.2L281.6 256z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
