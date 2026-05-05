<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="192" fill="white" />
        <rect x="246" y="94" width="20" height="324" rx="10" fill="black" />
        <rect x="80" y="247" width="352" height="18" rx="9" fill="black" />
        <path
          d="M214 96c-31 42-49 99-49 160s18 118 49 160"
          fill="none"
          stroke="black"
          stroke-linecap="round"
          stroke-width="16"
        />
        <path
          d="M298 96c31 42 49 99 49 160s-18 118-49 160"
          fill="none"
          stroke="black"
          stroke-linecap="round"
          stroke-width="16"
        />
        <path
          d="M110 188c36-16 85-24 146-24s110 8 146 24"
          fill="none"
          stroke="black"
          stroke-linecap="round"
          stroke-width="16"
        />
        <path
          d="M110 324c36 16 85 24 146 24s110-8 146-24"
          fill="none"
          stroke="black"
          stroke-linecap="round"
          stroke-width="16"
        />
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = `globe-mask-${useId()}`;
</script>
