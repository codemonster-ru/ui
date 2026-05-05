<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M236 76C201.76 76 174 103.76 174 138V354C174 388.24 201.76 416 236 416H400C434.24 416 462 388.24 462 354V187C462 170.12 454.98 153.99 442.62 142.26L392.83 95.01C381.29 84.05 365.99 78 350.07 78H236V76Z"
    />
    <path
      fill="currentColor"
      d="M148 168C113.76 168 86 195.76 86 230V446C86 480.24 113.76 508 148 508H312C346.24 508 374 480.24 374 446V432H314V446C314 447.1 313.1 448 312 448H148C146.9 448 146 447.1 146 446V230C146 228.9 146.9 228 148 228H164V168H148Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
