<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M136 112H432C449.67 112 464 126.33 464 144C464 161.67 449.67 176 432 176H152C138.75 176 128 186.75 128 200C128 213.25 138.75 224 152 224H424C459.35 224 488 252.65 488 288V392C488 427.35 459.35 456 424 456H136C100.65 456 72 427.35 72 392V176C72 140.65 100.65 112 136 112ZM392 320C374.33 320 360 334.33 360 352C360 369.67 374.33 384 392 384C409.67 384 424 369.67 424 352C424 334.33 409.67 320 392 320Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
