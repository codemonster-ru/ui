<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M179.2 128C193.36 128 204.8 116.56 204.8 102.4C204.8 88.24 193.36 76.8 179.2 76.8L128 76.8C85.6 76.8 51.2 111.2 51.2 153.6L51.2 358.4C51.2 400.8 85.6 435.2 128 435.2L179.2 435.2C193.36 435.2 204.8 423.76 204.8 409.6C204.8 395.44 193.36 384 179.2 384L128 384C113.84 384 102.4 372.56 102.4 358.4L102.4 153.6C102.4 139.44 113.84 128 128 128L179.2 128z"
    />
    <path
      fill="currentColor"
      transform="translate(-10 0) scale(0.8)"
      d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
