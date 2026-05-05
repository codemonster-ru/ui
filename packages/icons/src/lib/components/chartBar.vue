<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M76 64C90.36 64 102 75.64 102 90V388C102 397.94 110.06 406 120 406H420C434.36 406 446 417.64 446 432C446 446.36 434.36 458 420 458H120C81.34 458 50 426.66 50 388V90C50 75.64 61.64 64 76 64Z"
      />
      <path
        fill="currentColor"
        d="M160 92H346C360.36 92 372 103.64 372 118C372 132.36 360.36 144 346 144H160C145.64 144 134 132.36 134 118C134 103.64 145.64 92 160 92Z"
      />
      <path
        fill="currentColor"
        d="M160 186H284C298.36 186 310 197.64 310 212C310 226.36 298.36 238 284 238H160C145.64 238 134 226.36 134 212C134 197.64 145.64 186 160 186Z"
      />
      <path
        fill="currentColor"
        d="M160 280H410C424.36 280 436 291.64 436 306C436 320.36 424.36 332 410 332H160C145.64 332 134 320.36 134 306C134 291.64 145.64 280 160 280Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
