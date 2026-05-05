<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M96 96H416C446.93 96 472 121.07 472 152V168C472 198.93 446.93 224 416 224H96C65.07 224 40 198.93 40 168V152C40 121.07 65.07 96 96 96Z"
      />
      <path
        fill="currentColor"
        d="M78 264H434V392C434 433.97 399.97 468 358 468H154C112.03 468 78 433.97 78 392V264ZM188 320C170.33 320 156 334.33 156 352C156 369.67 170.33 384 188 384H324C341.67 384 356 369.67 356 352C356 334.33 341.67 320 324 320H188Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
