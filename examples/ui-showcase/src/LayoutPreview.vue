<script setup lang="ts">
import { vDevPreview } from './dev-previews';
import { ref } from 'vue';
import { CmFieldset, CmRadio } from '@codemonster-ru/ui-vue';
import {
  initialAppShellLayout,
  layoutPreviewChoices,
  type LayoutExampleSlug,
  type ShellLayout,
} from '../../shared/showcase-layout-data.mts';
import LayoutRegionControls from './LayoutRegionControls.vue';

const { slug, title } = defineProps<{ slug: LayoutExampleSlug; title: string }>();
const development = import.meta.env.DEV;
const selection = ref('fit');
const layout = ref<ShellLayout>(initialAppShellLayout);
const options = ref<string[]>([]);
</script>

<template>
  <CmFieldset :id="`${slug}-preview-width`" label="Width" class="layout-preview__sizes">
    <CmRadio
      v-for="{ value, label } in layoutPreviewChoices"
      :key="value"
      v-model="selection"
      :name="slug + '-width'"
      :value="value"
      :label="label"
      size="sm"
    />
  </CmFieldset>
  <LayoutRegionControls v-if="slug === 'app-shell'" v-model:layout="layout" v-model:options="options" :slug="slug" />
  <div class="layout-preview__viewport" role="region" :aria-label="title + ' preview viewport'" tabindex="0">
    <iframe
      v-dev-preview="development ? '/layout-example.html?layout=' + slug : undefined"
      class="layout-preview__frame"
      :src="development ? undefined : '/layout-example.html?layout=' + slug"
      :title="title + ' preview'"
      :data-fit="selection === 'fit' ? '' : undefined"
      :data-app-shell-layout="slug === 'app-shell' ? layout : undefined"
      :data-app-shell-options="slug === 'app-shell' ? options.join(' ') : undefined"
      :width="selection === 'fit' ? undefined : selection"
      :loading="development ? undefined : 'lazy'"
    />
  </div>
</template>
