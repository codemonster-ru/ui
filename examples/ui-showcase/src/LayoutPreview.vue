<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CmRadio } from '@codemonster-ru/ui-vue';
import { defaultPreview, previews, type LayoutExampleSlug } from '../../shared/showcase-layout-data.mts';

defineProps<{ slug: LayoutExampleSlug; title: string }>();
const viewport = ref<HTMLElement>();
const availableWidth = ref(window.innerWidth);
const preferred = ref<string>();
const defaultWidth = previews.find(({ value }) => value === defaultPreview)?.width ?? Number.POSITIVE_INFINITY;
const selection = computed(
  () =>
    previews.find(({ value }) => value === preferred.value) ??
    [...previews].reverse().find(({ width }) => width <= availableWidth.value && width <= defaultWidth) ??
    previews[0],
);
const observer = new ResizeObserver(([entry]) => {
  availableWidth.value = entry.contentRect.width;
});
onMounted(() => {
  if (viewport.value) observer.observe(viewport.value);
});
onUnmounted(() => observer.disconnect());
</script>

<template>
  <fieldset class="layout-preview__sizes">
    <legend>Preview width</legend>
    <CmRadio
      v-for="{ value, label } in previews"
      :key="value"
      :name="slug + '-width'"
      :value="value"
      :label="label"
      :model-value="preferred ?? selection.value"
      size="sm"
      @update:model-value="preferred = $event"
    />
  </fieldset>
  <div
    ref="viewport"
    class="layout-preview__viewport"
    role="region"
    :aria-label="title + ' preview viewport'"
    tabindex="0"
  >
    <iframe
      class="layout-preview__frame"
      :src="'/layout-example.html?layout=' + slug"
      :title="title + ' preview'"
      :width="selection.width"
      loading="lazy"
    />
  </div>
</template>
