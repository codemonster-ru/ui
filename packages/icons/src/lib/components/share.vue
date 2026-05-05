<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      d="M197 251L318 181"
      stroke="currentColor"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M197 297L318 367"
      stroke="currentColor"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <circle cx="148" cy="274" r="70" fill="currentColor" />
    <circle cx="352" cy="162" r="70" fill="currentColor" />
    <circle cx="352" cy="386" r="70" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
