<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <g transform="translate(-12.8 -12.8) scale(1.05)">
          <path
            d="M256 58c13 0 24 7 31 21l145 274c9 17 7 33-5 47-10 11-24 18-41 18H126c-17 0-31-7-41-18-12-14-14-30-5-47L225 79c7-14 18-21 31-21Z"
            fill="white"
          />
          <rect x="233" y="146" width="46" height="132" rx="23" fill="black" />
          <circle cx="256" cy="342" r="25" fill="black" />
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

const maskId = `warning-mask-${useId()}`;
</script>
