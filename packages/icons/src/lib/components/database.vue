<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M256 56C166.6 56 96 83.48 96 118V170C96 204.52 166.6 232 256 232C345.4 232 416 204.52 416 170V118C416 83.48 345.4 56 256 56ZM256 104C326.57 104 368 121.01 368 128C368 134.99 326.57 152 256 152C185.43 152 144 134.99 144 128C144 121.01 185.43 104 256 104Z"
      />
      <path
        fill="currentColor"
        d="M96 216.88C129.63 237.87 190.12 250 256 250C321.88 250 382.37 237.87 416 216.88V288C416 322.52 345.4 350 256 350C166.6 350 96 322.52 96 288V216.88Z"
      />
      <path
        fill="currentColor"
        d="M96 334.88C129.63 355.87 190.12 368 256 368C321.88 368 382.37 355.87 416 334.88V394C416 428.52 345.4 456 256 456C166.6 456 96 428.52 96 394V334.88Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
