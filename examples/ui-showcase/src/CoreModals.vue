<script setup lang="ts">
import { CmButton, CmCommandPalette, CmDialog, CmDrawer, CmInput, type CmDialogSize } from '@codemonster-ru/ui-vue';
import { onMounted, onUnmounted, ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const sizes = ['sm', 'md', 'lg'] as const;
const drawers = [
  { label: 'left', side: 'start', size: 'md' },
  { label: 'right', side: 'end', size: 'md' },
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
const drawerOptions = ref<(typeof drawers)[number]>(drawers[1]);
const palette = ref(false);
const query = ref('');
const confirm = ref(false);
const result = ref('No action confirmed yet.');

function openPalette(initialQuery = '') {
  query.value = initialQuery;
  palette.value = true;
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
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Command palette · states</h4>
      <div class="core-theme-controls">
        <CmButton variant="secondary" @click="openPalette()">empty query</CmButton>
        <CmButton variant="secondary" @click="openPalette('theme')">matched query</CmButton>
      </div>
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
  <CmCommandPalette
    id="core-palette"
    v-model:open="palette"
    v-model:query="query"
    title="Search Documentation"
    placeholder="Search components, guides, and API..."
    :commands="commands"
  />
  <CmDialog
    id="core-confirm"
    v-model:open="confirm"
    title="Delete example user?"
    description="This action cannot be undone."
    size="sm"
  >
    <template #footer>
      <div class="core-theme-controls">
        <CmButton variant="secondary" @click="confirm = false">Cancel</CmButton>
        <CmButton
          variant="danger"
          @click="
            result = 'Example user deleted.';
            confirm = false;
          "
          >Delete</CmButton
        >
      </div>
    </template>
  </CmDialog>
</template>
