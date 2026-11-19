<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { CmLink } from '@codemonster-ru/ui-vue';
import { layoutExamples } from '../../shared/showcase-layout-data.mts';
import LayoutPrimitives from './LayoutPrimitives.vue';
import LayoutPreview from './LayoutPreview.vue';
import ContractExamples from './ContractExamples.vue';

const viewport = ref(window.innerWidth);
const syncViewport = () => {
  viewport.value = window.innerWidth;
};
onMounted(() => window.addEventListener('resize', syncViewport));
onUnmounted(() => window.removeEventListener('resize', syncViewport));
</script>

<template>
  <section
    v-for="{ slug, title, label, contract } in layoutExamples"
    :id="'demo-' + slug"
    :key="slug"
    class="showcase-group layout-guide-entry"
    :aria-labelledby="'layout-title-' + slug"
    tabindex="-1"
  >
    <header class="showcase-group-heading">
      <h2 :id="'layout-title-' + slug">{{ label }}</h2>
      <CmLink :href="'/components/' + slug + '/'" underline="hover">{{ title }}</CmLink>
    </header>
    <LayoutPreview :slug="slug" :title="title" />
    <ContractExamples v-if="contract" :slug="slug" />
  </section>
  <section id="layout-primitives" class="layout-guide" aria-labelledby="layout-primitives-title" tabindex="-1">
    <h2 id="layout-primitives-title">Layout primitives</h2>
    <LayoutPrimitives :viewport="viewport" />
  </section>
</template>
