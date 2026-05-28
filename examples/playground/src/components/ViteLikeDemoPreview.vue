<template>
  <div class="vf-playground" data-theme="inherit">
    <div class="vf-playground__tabs">
      <VfTabs
        class="vf-playground__tabs-default"
        :items="tabItems"
        :model-value="activeTab"
        @update:model-value="onTabChange"
      />
    </div>

    <div v-if="activeTab === 'preview'" class="vf-playground__panel preview">
      <component :is="demoComponent" />
    </div>

    <div v-if="activeTab === 'code'" class="vf-playground__panel vf-playground__panel--code">
      <div class="vf-playground__codeblock-host">
        <VfCodeBlock :code="source" language="typescript" :show-line-numbers="true" theme="dark" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { VfTabs, type VfTabItem } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';

import VueRuntimeSmokeDemo from 'virtual:vueforge-playground/vue-runtime-smoke';
import CustomResolverSmokeDemo from 'virtual:vueforge-playground/custom-resolver-smoke';

const props = defineProps<{
  demoId: 'vue-runtime-smoke' | 'custom-resolver-smoke';
  source: string;
}>();

const activeTab = ref<'preview' | 'code'>('preview');
const tabItems: VfTabItem[] = [
  { value: 'code', label: 'Code' },
  { value: 'preview', label: 'Preview' }
];

const demoComponentMap: Record<'vue-runtime-smoke' | 'custom-resolver-smoke', Component> = {
  'vue-runtime-smoke': VueRuntimeSmokeDemo,
  'custom-resolver-smoke': CustomResolverSmokeDemo
};

const demoComponent = computed(() => demoComponentMap[props.demoId]);

function onTabChange(value: string): void {
  if (value === 'preview' || value === 'code') {
    activeTab.value = value;
  }
}
</script>

<style scoped>
.vf-playground__panel.preview {
  min-height: 0;
  max-height: none;
  overflow: visible;
  display: grid;
  place-items: center;
  padding: var(--vf-layout-space-layout-lg) 0;
}

.vf-playground__panel.preview > * {
  width: 100%;
  max-width: 100%;
}
</style>
