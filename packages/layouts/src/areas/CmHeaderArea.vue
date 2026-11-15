<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string; sticky?: boolean }>(), { as: 'header', sticky: true });
</script>

<template>
  <component :is="props.as" class="cm-header-area" :class="{ 'cm-header-area--sticky': sticky }"><slot /></component>
</template>
