<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M454.72 30.16C462.56 27.36 471.2 29.36 477.12 35.2C483.04 41.04 484.96 49.76 482.16 57.6L339.76 455.12C335.76 466.24 325.28 473.6 313.52 473.6C302.16 473.6 291.92 466.72 287.68 456.24L236.32 329.84C232.72 321.04 234.32 310.96 240.48 303.76L316.08 213.84C320.16 208.96 319.84 201.84 315.36 197.36C310.88 192.88 303.68 192.56 298.88 196.64L208.96 272.08C201.68 278.16 191.68 279.76 182.88 276.24L56.08 224.64C45.6 220.4 38.72 210.16 38.72 198.8C38.72 187.04 46.08 176.56 57.2 172.56L454.72 30.16z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
