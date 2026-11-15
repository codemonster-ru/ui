<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string }>(), { as: 'footer' });
</script>

<template>
  <component :is="props.as" class="cm-footer-area"><slot /></component>
</template>
