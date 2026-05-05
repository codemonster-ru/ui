<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <circle cx="224" cy="168" r="84" fill="currentColor" />
      <path
        fill="currentColor"
        d="M196 324C104.32 324 30 398.32 30 490V512C30 529.67 44.33 544 62 544H386C403.67 544 418 529.67 418 512V490C418 398.32 343.68 324 252 324H196Z"
      />
      <rect x="394" y="128" width="52" height="192" rx="26" fill="currentColor" />
      <rect x="324" y="198" width="192" height="52" rx="26" fill="currentColor" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
