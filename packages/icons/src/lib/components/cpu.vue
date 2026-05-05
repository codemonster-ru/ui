<template>
  <svg v-bind="iconSvgAttrs" :width="size" :height="size">
    <defs>
      <mask :id="maskId">
        <rect width="512" height="512" fill="black" />
        <rect x="120" y="120" width="272" height="272" rx="54" fill="white" />
        <rect x="192" y="192" width="128" height="128" rx="26" fill="black" />
      </mask>
    </defs>
    <rect width="512" height="512" fill="currentColor" :mask="`url(#${maskId})`" />
    <rect x="202" y="40" width="36" height="64" rx="18" fill="currentColor" />
    <rect x="274" y="40" width="36" height="64" rx="18" fill="currentColor" />
    <rect x="202" y="408" width="36" height="64" rx="18" fill="currentColor" />
    <rect x="274" y="408" width="36" height="64" rx="18" fill="currentColor" />
    <rect x="40" y="202" width="64" height="36" rx="18" fill="currentColor" />
    <rect x="40" y="274" width="64" height="36" rx="18" fill="currentColor" />
    <rect x="408" y="202" width="64" height="36" rx="18" fill="currentColor" />
    <rect x="408" y="274" width="64" height="36" rx="18" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);

const maskId = useId();
</script>
