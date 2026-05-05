<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <g transform="translate(-10.24 -10.24) scale(1.04)">
          <path
            d="M256 112c115 0 193 99 213 130 8 12 8 26 0 38-20 31-98 130-213 130S63 311 43 280c-8-12-8-26 0-38 20-31 98-130 213-130Z"
            fill="white"
          />
          <circle cx="256" cy="261" r="96" fill="black" />
          <circle cx="256" cy="261" r="56" fill="white" />
          <circle cx="214" cy="219" r="44" fill="black" />
        </g>
        <rect x="6" y="235" width="500" height="48" rx="24" transform="rotate(45 256 256)" fill="black" />
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
    <rect x="6" y="235" width="500" height="48" rx="24" transform="rotate(45 256 256)" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = `eye-slash-mask-${useId()}`;
</script>
