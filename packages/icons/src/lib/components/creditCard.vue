<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path fill="currentColor" d="M116 92H396C433.56 92 464 122.44 464 160V180H48V160C48 122.44 78.44 92 116 92Z" />
      <path
        fill="currentColor"
        d="M48 212H464V352C464 389.56 433.56 420 396 420H116C78.44 420 48 389.56 48 352V212ZM112 340C112 354.36 123.64 366 138 366H186C200.36 366 212 354.36 212 340C212 325.64 200.36 314 186 314H138C123.64 314 112 325.64 112 340ZM250 314C235.64 314 224 325.64 224 340C224 354.36 235.64 366 250 366H314C328.36 366 340 354.36 340 340C340 325.64 328.36 314 314 314H250Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
