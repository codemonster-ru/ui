<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M108 108H240C253.82 108 267.3 112.49 278.39 120.79L314.8 148.09C320.34 152.25 327.07 154.5 334 154.5H430C467.56 154.5 498 184.94 498 222.5V234H172C131.84 234 96.3 259.96 83.93 298.17L63.39 361.61C54.42 348.95 50 333.67 50 316.5V166C50 133.97 75.97 108 108 108Z"
    />
    <path
      fill="currentColor"
      d="M159 282H510C547.57 282 573.74 319.27 561.04 354.62L524.87 455.28C515.19 482.23 489.66 500 461.03 500H110C72.43 500 46.26 462.73 58.96 427.38L95.13 326.72C104.81 299.77 130.34 282 159 282Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
