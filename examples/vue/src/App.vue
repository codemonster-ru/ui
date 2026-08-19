<script setup lang="ts">
import { computed } from 'vue';
import LegacyShowcase from './LegacyShowcase.vue';
import SharedShowcase from './SharedShowcase.vue';

const legacySections = new Set(['core', 'colors', 'layouts', 'icons', 'codeblock', 'playground', 'showcase']);
const currentSection = computed(() => window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] ?? '');
const showLegacyShowcase = computed(() => legacySections.has(currentSection.value));
</script>

<template>
  <LegacyShowcase v-if="showLegacyShowcase" />
  <SharedShowcase v-else />
</template>
