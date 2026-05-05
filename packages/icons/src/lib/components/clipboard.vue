<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <path
      fill="currentColor"
      d="M176 78C176 55.91 193.91 38 216 38H296C318.09 38 336 55.91 336 78V86H364C401.56 86 432 116.44 432 154V390C432 427.56 401.56 458 364 458H148C110.44 458 80 427.56 80 390V154C80 116.44 110.44 86 148 86H176V78ZM232 78C232 69.16 239.16 62 248 62H264C272.84 62 280 69.16 280 78V94H232V78Z"
    />
    <path
      fill="currentColor"
      d="M190 130H322C339.67 130 354 144.33 354 162C354 179.67 339.67 194 322 194H190C172.33 194 158 179.67 158 162C158 144.33 172.33 130 190 130Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
