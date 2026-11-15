<script setup lang="ts">
defineProps<{ title: string; columns?: 2 | 3 }>();
</script>

<template>
  <section class="showcase-panel core-matrix">
    <h3>{{ title }}</h3>
    <div class="core-matrix-grid" :class="{ 'core-matrix-grid--two': columns === 2 }"><slot /></div>
  </section>
</template>
