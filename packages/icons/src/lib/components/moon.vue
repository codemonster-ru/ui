<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <g transform="rotate(-34 256 256)">
          <circle cx="262" cy="256" r="174" fill="white" />
          <circle cx="356" cy="256" r="146" fill="black" />
        </g>
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

const maskId = useId();

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
