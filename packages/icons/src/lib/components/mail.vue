<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <g transform="translate(-10.24 -10.24) scale(1.04)">
          <path
            fill="white"
            d="M110 108h292c43.1 0 78 34.9 78 78v156c0 43.1-34.9 78-78 78H110c-43.1 0-78-34.9-78-78V186c0-43.1 34.9-78 78-78Z"
          />
          <path
            fill="black"
            d="M78 164 210.3 270c27.1 21.7 65.3 21.7 92.4 0L434 164v19L282 305c-15.2 12.2-36.6 12.2-51.8 0L78 183v-19Z"
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

const maskId = useId();
</script>
