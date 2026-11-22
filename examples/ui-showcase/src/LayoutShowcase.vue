<script setup lang="ts">
import { CmGrid, CmPanel } from '@codemonster-ru/ui-vue';
import groups from '../../shared/showcase-groups.json';
import { layoutExamples } from '../../shared/showcase-layout-data.mts';
import LayoutPreview from './LayoutPreview.vue';
import ContractExamples from './ContractExamples';

const layoutSlugs = groups.find(({ id }) => id === 'layouts')!.components;
const shellSlugs = new Set<string>(layoutExamples.map(({ slug }) => slug));
const primitives = layoutSlugs.filter((slug) => !shellSlugs.has(slug) && !slug.endsWith('-area'));
const regions = layoutSlugs.filter((slug) => slug.endsWith('-area'));
</script>

<template>
  <CmPanel id="layout-shells" class="showcase-group" aria-labelledby="group-layout-shells" tabindex="-1">
    <h2 id="group-layout-shells" class="showcase-group-label">Application shells</h2>
    <CmGrid class="showcase-component-list">
      <ContractExamples v-for="{ slug, title } in layoutExamples" :key="slug" :slug="slug">
        <LayoutPreview :slug="slug" :title="title" />
      </ContractExamples>
    </CmGrid>
  </CmPanel>
  <CmPanel id="layout-primitives" class="showcase-group" aria-labelledby="group-layout-primitives" tabindex="-1">
    <h2 id="group-layout-primitives" class="showcase-group-label">Layout primitives</h2>
    <CmGrid class="showcase-component-list">
      <ContractExamples v-for="slug in primitives" :key="slug" :slug="slug" />
    </CmGrid>
  </CmPanel>
  <CmPanel id="layout-components" class="showcase-group" aria-labelledby="group-layout-components" tabindex="-1">
    <h2 id="group-layout-components" class="showcase-group-label">Layout regions</h2>
    <CmGrid class="showcase-component-list">
      <ContractExamples v-for="slug in regions" :key="slug" :slug="slug" />
    </CmGrid>
  </CmPanel>
</template>
