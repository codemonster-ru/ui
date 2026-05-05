<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M92 290c11.3 0 21.4 7 25.4 17.7l25.2 67.1 62.8-191.3c3.7-11.1 14.2-18.7 25.9-18.5 11.7.2 21.9 8.1 25.1 19.4l44.2 152.6 38.6-80.1c4.3-9 13.4-14.8 23.4-14.8H420c14.4 0 26 11.6 26 26s-11.6 26-26 26h-41.2l-61.4 127.5c-4.6 9.6-14.6 15.5-25.3 14.8-10.6-.6-19.9-7.5-22.9-17.7L230 283.2l-58.1 177c-3.6 10.9-13.9 18.5-25.4 18.5h-.4c-11.6-.2-21.9-7.5-25.9-18.4l-46.1-122.7H50c-14.4 0-26-11.6-26-26s11.6-26 26-26h42Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
