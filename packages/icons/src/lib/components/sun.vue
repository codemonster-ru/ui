<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(45 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(90 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(135 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(180 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(225 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(270 256 256)" />
    <rect x="238" y="52" width="36" height="76" rx="18" fill="currentColor" transform="rotate(315 256 256)" />
    <circle cx="256" cy="256" r="102" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
