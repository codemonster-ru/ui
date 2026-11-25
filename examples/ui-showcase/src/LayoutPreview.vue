<script setup lang="ts">
import { vDevPreview } from './dev-previews';
import { ref, useTemplateRef } from 'vue';
import { CmFieldset, CmRadio, CmSkeleton } from '@codemonster-ru/ui-vue';
import {
  initialShellLayout,
  layoutPreviewChoices,
  type LayoutExampleSlug,
  type ShellLayout,
} from '../../shared/showcase-layout-data.mts';
import { fitShellPreviewForLayout } from '../../shared/showcase-layout-recipes.js';
import LayoutRegionControls from './LayoutRegionControls.vue';

const { slug, title } = defineProps<{ slug: LayoutExampleSlug; title: string }>();
const eager = slug === 'admin-shell';
const deferInDev = import.meta.env.DEV && !eager;
const source = '/layout-example.html?layout=' + slug;
const selection = ref('fit');
const layout = ref<ShellLayout>(initialShellLayout);
const options = ref<string[]>([]);
const frame = useTemplateRef<HTMLIFrameElement>('frame');

function setLayout(value: ShellLayout) {
  layout.value = value;
  if (frame.value) {
    fitShellPreviewForLayout(frame.value, value, (width) => (selection.value = width));
  }
}
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
  <LayoutRegionControls
    v-if="slug === 'app-shell' || slug === 'document-layout'"
    v-model:options="options"
    :layout="layout"
    :slug="slug"
    @update:layout="setLayout"
  />
  <div class="layout-preview__viewport" role="region" :aria-label="title + ' preview viewport'" tabindex="0">
    <iframe
      ref="frame"
      v-dev-preview="deferInDev ? source : undefined"
      class="layout-preview__frame"
      :src="deferInDev ? undefined : source"
      :title="title + ' preview'"
      :data-fit="selection === 'fit' ? '' : undefined"
      :data-shell-preview-layout="slug === 'app-shell' || slug === 'document-layout' ? layout : undefined"
      :data-shell-preview-options="slug === 'app-shell' || slug === 'document-layout' ? options.join(' ') : undefined"
      :width="selection === 'fit' ? undefined : selection"
      :loading="eager ? 'eager' : deferInDev ? undefined : 'lazy'"
    />
    <div class="layout-preview__placeholder" role="status" aria-label="Loading preview">
      <CmSkeleton />
    </div>
  </div>
</template>
