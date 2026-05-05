<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="256" fill="white" />
        <rect x="233" y="120" width="46" height="148" rx="23" fill="black" />
        <circle cx="256" cy="352" r="31" fill="black" />
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = `alert-circle-mask-${useId()}`;
</script>
