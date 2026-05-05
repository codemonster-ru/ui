<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M196 58H316C337.54 58 355 75.46 355 97V118H408C445.56 118 476 148.44 476 186V242H332V230C332 212.33 317.67 198 300 198H212C194.33 198 180 212.33 180 230V242H36V186C36 148.44 66.44 118 104 118H157V97C157 75.46 174.46 58 196 58ZM213 118H299V114C299 105.16 291.84 98 283 98H229C220.16 98 213 105.16 213 114V118Z"
      />
      <path
        fill="currentColor"
        d="M36 290H180V314C180 331.67 194.33 346 212 346H300C317.67 346 332 331.67 332 314V290H476V386C476 423.56 445.56 454 408 454H104C66.44 454 36 423.56 36 386V290ZM236 254V290H276V254H236Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
