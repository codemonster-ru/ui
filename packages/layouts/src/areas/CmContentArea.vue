<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string; padded?: boolean }>(), { as: 'main', padded: true });
</script>

<template>
  <component :is="props.as" class="cm-content-area" :class="{ 'cm-content-area--padded': padded }"><slot /></component>
</template>
