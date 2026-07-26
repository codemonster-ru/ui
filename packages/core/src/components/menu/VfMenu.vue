<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();
</script>

<template>
  <div class="vf-menu" role="menu" v-bind="attrs">
    <slot />
  </div>
</template>
