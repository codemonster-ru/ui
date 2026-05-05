<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M256 448c-10.2 0-20.3-3.6-28.1-10.8L121.5 338.5C68.8 291 64 207.5 110.9 154.1 154.5 104.6 229.1 101 256 144.1 282.9 101 357.5 104.6 401.1 154.1c46.9 53.4 42.1 136.9-10.6 184.4L284.1 437.2c-7.8 7.2-17.9 10.8-28.1 10.8Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
