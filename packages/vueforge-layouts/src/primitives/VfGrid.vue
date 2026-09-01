<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{ as?: string }>(), {
  as: 'div',
});

const attrs = useAttrs();
</script>

<template>
  <component :is="props.as" class="vf-grid" v-bind="attrs">
    <slot />
  </component>
</template>
