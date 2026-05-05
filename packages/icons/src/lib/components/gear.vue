<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="144" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" transform="rotate(60 256 256)" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" transform="rotate(120 256 256)" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" transform="rotate(180 256 256)" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" transform="rotate(240 256 256)" fill="white" />
        <rect x="204" y="36" width="104" height="140" rx="34" transform="rotate(300 256 256)" fill="white" />
        <circle cx="256" cy="256" r="52" fill="black" />
      </mask>
    </defs>

    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = `gear-mask-${useId()}`;
</script>
