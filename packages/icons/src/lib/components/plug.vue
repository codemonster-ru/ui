<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path fill="currentColor" d="M180 72C180 54.33 194.33 40 212 40C229.67 40 244 54.33 244 72V168H180V72Z" />
    <path fill="currentColor" d="M324 72C324 54.33 338.33 40 356 40C373.67 40 388 54.33 388 72V168H324V72Z" />
    <path
      fill="currentColor"
      d="M128 152H432C449.67 152 464 166.33 464 184C464 201.67 449.67 216 432 216H128C110.33 216 96 201.67 96 184C96 166.33 110.33 152 128 152Z"
    />
    <path
      fill="currentColor"
      d="M128 216H432V268C432 350.84 364.84 418 282 418H278C195.16 418 128 350.84 128 268V216Z"
    />
    <path fill="currentColor" d="M248 418H312V496C312 513.67 297.67 528 280 528C262.33 528 248 513.67 248 496V418Z" />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
