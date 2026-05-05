<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="256" fill="white" />
        <g transform="translate(48.96 92.36) scale(0.84 0.63)">
          <path
            d="M248 72c-62.2 0-112 49.8-112 109 0 16.6 13.4 30 30 30s30-13.4 30-30c0-27.6 23.6-49 52-49 31 0 54 20 54 49 0 25.7-13.6 40.3-40.5 55.3C227.4 255.7 214 278.1 214 311v20c0 16.6 13.4 30 30 30s30-13.4 30-30v-14.1c0-18.7 5.9-28.9 36.7-46.1 33.1-18.4 51.3-45.2 51.3-89.8 0-62.2-48.6-109-114-109Z"
            fill="black"
          />
          <circle cx="252" cy="426" r="34" fill="black" />
        </g>
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = `question-circle-mask-${useId()}`;
</script>
