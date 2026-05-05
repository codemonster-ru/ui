<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{ as?: string }>(), {
  as: 'footer',
});

const attrs = useAttrs();
</script>

<template>
  <component :is="props.as" class="vf-footer-area" v-bind="attrs">
    <slot />
  </component>
</template>
