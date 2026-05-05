<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <circle cx="256" cy="256" r="256" fill="white" />
        <path
          d="M333 176c11.5 0 20.8 9.3 20.8 20.8 0 5.5-2.1 10.8-6 14.8L241.3 334.9c-8.1 9.4-22.3 9.9-31 .4l-49.1-53.8c-7.7-8.4-7.1-21.6 1.3-29.3 8.4-7.7 21.6-7.1 29.3 1.3l33.1 36.2 91.9-106.2c4-4.6 9.7-7.3 15.8-7.3Z"
          fill="black"
          transform="translate(256 256) scale(1.22) translate(-256 -256)"
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

const maskId = `check-circle-mask-${useId()}`;
</script>
