<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="256" fill="white" />
        <g transform="translate(50.88 97.78) scale(0.82 0.63)">
          <circle cx="256" cy="106" r="42" fill="black" />
          <path
            d="M214 182c-16.6 0-30 13.4-30 30s13.4 30 30 30h20v146h-24c-16.6 0-30 13.4-30 30s13.4 30 30 30h92c16.6 0 30-13.4 30-30s-13.4-30-30-30h-8V212c0-16.6-13.4-30-30-30h-50Z"
            fill="black"
          />
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

const maskId = `info-circle-mask-${useId()}`;
</script>
