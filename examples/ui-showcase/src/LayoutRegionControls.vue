<script setup lang="ts">
import { computed } from 'vue';
import { CmInline, CmStack, CmSwitch, CmTabs } from '@codemonster-ru/ui-vue';
import { regionControls, shellTabs, type ShellLayout } from '../../shared/showcase-layout-data.mts';

defineOptions({ inheritAttrs: false });
const { slug } = defineProps<{ slug: 'app-shell' | 'document-layout' }>();
const layout = defineModel<ShellLayout>('layout', { required: true });
const options = defineModel<string[]>('options', { required: true });
const previewTabs = shellTabs.map(({ label, value }) => ({ label, value }));
const controls = computed(() =>
  regionControls.filter(({ key }) => (slug === 'app-shell' ? key !== 'notches' : key !== 'plain')),
);

function setLayout(value: string) {
  const tab = shellTabs.find((item) => item.value === value);
  if (tab) layout.value = tab.value;
}

function setOption(key: string, checked: boolean) {
  options.value = checked ? [...options.value, key] : options.value.filter((option) => option !== key);
}
</script>

<template>
  <CmStack class="layout-preview__controls">
    <CmTabs
      :id="slug + '-regions'"
      :model-value="layout"
      :items="slug === 'app-shell' ? previewTabs : shellTabs"
      scroll-controls
      @update:model-value="setLayout"
    />
    <CmInline>
      <span
        v-for="{ key, label } in controls"
        :key="key"
        :hidden="(key === 'sidebar' && layout === 'content') || (key === 'aside' && layout !== 'sidebar-content-aside')"
        :data-region-option="key"
      >
        <CmSwitch
          :model-value="options.includes(key)"
          :label="label"
          :data-region-control="key"
          @update:model-value="setOption(key, $event)"
        />
      </span>
    </CmInline>
  </CmStack>
</template>
