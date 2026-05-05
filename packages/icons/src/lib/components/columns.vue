<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M76.8 128C76.8 99.76 99.76 76.8 128 76.8L384 76.8C412.24 76.8 435.2 99.76 435.2 128L435.2 384C435.2 412.24 412.24 435.2 384 435.2L128 435.2C99.76 435.2 76.8 412.24 76.8 384L76.8 128zM128 179.2L128 384L230.4 384L230.4 179.2L128 179.2zM384 179.2L281.6 179.2L281.6 384L384 384L384 179.2z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
