<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-12.8 -12.8) scale(1.05)">
      <path
        fill="currentColor"
        d="M104.32 214.56C108.32 224.16 117.6 230.4 128 230.4L384 230.4C394.32 230.4 403.68 224.16 407.68 214.56C411.68 204.96 409.44 194 402.16 186.64L274.16 58.64C264.16 48.64 247.92 48.64 237.92 58.64L109.92 186.64C102.56 194 100.4 204.96 104.4 214.56zM104.32 297.36C100.32 306.96 102.56 317.92 109.84 325.28L237.84 453.28C247.84 463.28 264.08 463.28 274.08 453.28L402.08 325.28C409.44 317.92 411.6 306.96 407.6 297.36C403.6 287.76 394.32 281.6 384 281.6L128 281.6C117.68 281.6 108.32 287.84 104.32 297.44z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
