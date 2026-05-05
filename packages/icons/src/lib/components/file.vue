<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <g transform="translate(-10.24 -10.24) scale(1.04)">
          <path
            fill="white"
            d="M148 68h140c20.4 0 40 8.1 54.5 22.6l72.9 72.9A77 77 0 0 1 438 218v186c0 35.3-28.7 64-64 64H148c-35.3 0-64-28.7-64-64V132c0-35.3 28.7-64 64-64Z"
          />
          <path fill="black" d="M280 90v78c0 13.3 10.7 24 24 24h78L280 90Z" />
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

const maskId = useId();
</script>
