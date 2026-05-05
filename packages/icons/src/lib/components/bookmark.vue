<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <path
        fill="currentColor"
        d="M160 68h192c35.3 0 64 28.7 64 64v298.4c0 28.7-31.8 45.9-55.8 30.3L256 394.2l-104.2 66.5c-24 15.4-55.8-1.8-55.8-30.3V132c0-35.3 28.7-64 64-64Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
