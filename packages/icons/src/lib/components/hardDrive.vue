<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M118 74H394C429.35 74 458 102.65 458 138V244.63C440.8 235.31 420.89 230 399.75 230H112.25C91.11 230 71.2 235.31 54 244.63V138C54 102.65 82.65 74 118 74Z"
      />
      <path
        fill="currentColor"
        d="M112.25 278H399.75C435.1 278 463.75 306.65 463.75 342V394C463.75 429.35 435.1 458 399.75 458H112.25C76.9 458 48.25 429.35 48.25 394V342C48.25 306.65 76.9 278 112.25 278ZM258 368C258 389.54 275.46 407 297 407C318.54 407 336 389.54 336 368C336 346.46 318.54 329 297 329C275.46 329 258 346.46 258 368ZM336 368C336 389.54 353.46 407 375 407C396.54 407 414 389.54 414 368C414 346.46 396.54 329 375 329C353.46 329 336 346.46 336 368Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
