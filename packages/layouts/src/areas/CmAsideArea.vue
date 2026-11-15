<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string; appearance?: 'default' | 'plain' }>(), {
  as: 'aside',
  appearance: 'default',
});
</script>

<template>
  <component :is="props.as" class="cm-aside-area" :class="{ 'cm-layout-area--plain': appearance === 'plain' }">
    <div class="cm-aside-area__inner"><slot /></div>
  </component>
</template>
