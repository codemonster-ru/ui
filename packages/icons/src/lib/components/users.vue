<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <g transform="translate(-10.24 -10.24) scale(1.04)">
      <circle cx="256" cy="146" r="76" fill="currentColor" />
      <circle cx="82" cy="202" r="50" fill="currentColor" />
      <circle cx="430" cy="202" r="50" fill="currentColor" />
      <path
        fill="currentColor"
        d="M128 404C128 335.52 183.52 280 252 280H260C328.48 280 384 335.52 384 404V424C384 437.25 373.25 448 360 448H152C138.75 448 128 437.25 128 424V404Z"
      />
      <path
        fill="currentColor"
        d="M8 400C8 335.93 59.93 284 124 284H162C127.47 308.47 104 348.78 98 395.2V448H28C16.95 448 8 439.05 8 428V400Z"
      />
      <g transform="translate(512 0) scale(-1 1)">
        <path
          fill="currentColor"
          d="M8 400C8 335.93 59.93 284 124 284H162C127.47 308.47 104 348.78 98 395.2V448H28C16.95 448 8 439.05 8 428V400Z"
        />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
