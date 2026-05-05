<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M113 70H399C430.45 70 457.09 92.89 461.56 124.02L484.62 284.95C484.93 287.07 485.09 289.22 485.09 291.36V402C485.09 433.48 459.57 459 428.09 459H83.91C52.43 459 26.91 433.48 26.91 402V291.36C26.91 289.22 27.07 287.07 27.38 284.95L50.44 124.02C54.91 92.89 81.55 70 113 70ZM126.46 127C115.8 127 106.76 134.81 105.25 145.37L85.82 280.91H131.75C145.57 280.91 158.21 288.73 164.38 301.08L178.24 328.8C183.03 338.37 192.82 344.41 203.52 344.41H308.48C319.18 344.41 328.97 338.37 333.76 328.8L347.62 301.08C353.79 288.73 366.43 280.91 380.25 280.91H426.18L406.75 145.37C405.24 134.81 396.2 127 385.54 127H126.46Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
