<script setup lang="ts">
import { vDevPreview } from './dev-previews';
import { ref } from 'vue';
import { CmFieldset, CmRadio } from '@codemonster-ru/ui-vue';
import { layoutPreviewChoices, type LayoutExampleSlug } from '../../shared/showcase-layout-data.mts';

const { slug, title } = defineProps<{ slug: LayoutExampleSlug; title: string }>();
const development = import.meta.env.DEV;
const selection = ref('fit');
</script>

<template>
  <CmFieldset :id="`${slug}-preview-width`" label="Width" class="layout-preview__sizes">
    <CmRadio
      v-for="{ value, label } in layoutPreviewChoices"
      :key="value"
      :name="slug + '-width'"
      :value="value"
      :label="label"
      v-model="selection"
      size="sm"
    />
  </CmFieldset>
  <div class="layout-preview__viewport" role="region" :aria-label="title + ' preview viewport'" tabindex="0">
    <iframe
      v-dev-preview="development ? '/layout-example.html?layout=' + slug : undefined"
      class="layout-preview__frame"
      :src="development ? undefined : '/layout-example.html?layout=' + slug"
      :title="title + ' preview'"
      :data-fit="selection === 'fit' ? '' : undefined"
      :width="selection === 'fit' ? undefined : selection"
      :loading="development ? undefined : 'lazy'"
    />
  </div>
</template>
