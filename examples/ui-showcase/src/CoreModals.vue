<script setup lang="ts">
import {
  CmButton,
  CmCommandPalette,
  CmConfirmDialog,
  CmDialog,
  CmDrawer,
  CmInput,
  VfCommandPalette,
  type CmDialogSize,
} from '@codemonster-ru/ui-vue';
import { VfDrawer } from '@codemonster-ru/ui-vue/historical';
import { onMounted, onUnmounted, ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const sizes = ['sm', 'md', 'lg'] as const;
const drawers = [
  { label: 'left', side: 'start', size: 'md' },
  { label: 'right', side: 'end', size: 'md' },
  { label: 'top', side: 'top', size: 'md' },
  { label: 'bottom', side: 'bottom', size: 'md' },
  { label: 'fullscreen', side: 'start', size: 'full' },
] as const;
const commands = [
  { id: 'theme', label: 'Change theme' },
  { id: 'settings', label: 'Open settings' },
  { id: 'release', label: 'View release notes' },
];
const dialog = ref(false);
const size = ref<CmDialogSize>('md');
const drawer = ref(false);
const offsetDrawer = ref(false);
const drawerOptions = ref<(typeof drawers)[number]>(drawers[1]);
const palette = ref(false);
const query = ref('');
const docSearch = ref(false);
const docQuery = ref('theme');
const docResult = ref('No documentation result selected.');
const docs = [
  { title: 'Theme provider', section: 'Foundations', snippet: 'Switch themes and follow the system preference.' },
  { title: 'Token catalog', section: 'Design system', snippet: 'Look up colors, motion, and sizing.' },
];
const confirm = ref(false);
const result = ref('No action confirmed yet.');

function openPalette(initialQuery = '') {
  query.value = initialQuery;
  palette.value = true;
}

function selectDoc(item: unknown) {
  const entry = docs.find(({ title }) => item && typeof item === 'object' && 'title' in item && item.title === title);
  if (entry) docResult.value = `Selected: ${entry.title}`;
}

function onShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (!palette.value) openPalette();
  }
}
onMounted(() => window.addEventListener('keydown', onShortcut));
onUnmounted(() => window.removeEventListener('keydown', onShortcut));
</script>

<template>
  <CoreMatrix title="Modal visual QA matrix" :columns="2">
    <div class="core-matrix-cell">
      <h4>Dialog · sizes</h4>
      <div class="core-theme-controls">
        <CmButton
          v-for="option in sizes"
          :key="option"
          :size="option"
          @click="
            size = option;
            dialog = true;
          "
          >{{ option }} dialog</CmButton
        >
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Drawer · placements</h4>
      <div class="core-theme-controls">
        <CmButton
          v-for="option in drawers"
          :key="option.label"
          variant="secondary"
          @click="
            drawerOptions = option;
            drawer = true;
          "
          >{{ option.label }}</CmButton
        >
        <CmButton variant="secondary" @click="offsetDrawer = true">offset drawer</CmButton>
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Command palette · states</h4>
      <div class="core-theme-controls">
        <CmButton variant="secondary" @click="openPalette()">empty query</CmButton>
        <CmButton variant="secondary" @click="openPalette('theme')">matched query</CmButton>
        <CmButton variant="secondary" @click="docSearch = true">documentation search</CmButton>
      </div>
      <p aria-live="polite">{{ docResult }}</p>
    </div>
    <div class="core-matrix-cell">
      <h4>Confirmation dialog</h4>
      <CmButton class="core-confirm-launcher" variant="danger" @click="confirm = true">Delete example user</CmButton>
      <p aria-live="polite">{{ result }}</p>
    </div>
  </CoreMatrix>
  <CmDialog id="core-dialog" v-model:open="dialog" title="Dialog" :size="size" dividers>
    <p>Dialog content.</p>
    <template #footer><CmButton variant="secondary" @click="dialog = false">Close</CmButton></template>
  </CmDialog>
  <CmDrawer
    id="core-drawer"
    v-model:open="drawer"
    :title="drawerOptions.size === 'full' ? 'Fullscreen Drawer' : 'Drawer'"
    :side="drawerOptions.side"
    :size="drawerOptions.size"
    dividers
  >
    <div class="core-matrix-cell">
      <p>{{ drawerOptions.size === 'full' ? 'Fullscreen drawer content.' : 'Drawer content.' }}</p>
      <CmInput aria-label="Search in drawer" placeholder="Search in drawer" />
    </div>
    <template #footer="{ close }">
      <div class="core-theme-controls">
        <CmButton @click="close">Apply</CmButton>
        <CmButton variant="secondary" @click="close">Close</CmButton>
      </div>
    </template>
  </CmDrawer>
  <VfDrawer
    id="core-offset"
    v-model:open="offsetDrawer"
    aria-label="Shell settings"
    placement="left"
    size="sm"
    :offset-top="48"
    :body-padding="20"
    :close-on-escape="false"
    rounded
  >
    <p>Content starts below the shell header.</p>
  </VfDrawer>
  <CmCommandPalette
    id="core-palette"
    v-model:open="palette"
    v-model:query="query"
    title="Search Documentation"
    placeholder="Search components, guides, and API..."
    :commands="commands"
  />
  <VfCommandPalette
    id="core-doc-search"
    v-model:open="docSearch"
    v-model="docQuery"
    title="Search documentation"
    :items="docs"
    @select="selectDoc"
  />
  <CmConfirmDialog
    v-model:open="confirm"
    title="Delete example user?"
    description="This action cannot be undone."
    confirm-label="Delete"
    @confirm="result = 'Example user deleted.'"
  />
</template>
