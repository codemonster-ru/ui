<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <circle cx="224" cy="168" r="84" fill="currentColor" />
      <path
        fill="currentColor"
        d="M196 324C104.32 324 30 398.32 30 490V512C30 529.67 44.33 544 62 544H386C403.67 544 418 529.67 418 512V490C418 398.32 343.68 324 252 324H196Z"
      />
      <path
        d="M362 230 404 272 500 168"
        stroke="currentColor"
        stroke-width="40"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
