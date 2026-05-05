<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M148 68H300C320.17 68 339.52 76.01 353.78 90.22L405.78 142.22C419.99 156.48 428 175.83 428 196V404C428 439.35 399.35 468 364 468H148C112.65 468 84 439.35 84 404V132C84 96.65 112.65 68 148 68ZM276 120V186C276 203.67 290.33 218 308 218H374L276 120ZM180 252C162.33 252 148 266.33 148 284C148 301.67 162.33 316 180 316H332C349.67 316 364 301.67 364 284C364 266.33 349.67 252 332 252H180ZM180 348C162.33 348 148 362.33 148 380C148 397.67 162.33 412 180 412H300C317.67 412 332 397.67 332 380C332 362.33 317.67 348 300 348H180Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
