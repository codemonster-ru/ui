<script setup lang="ts">
import { CmButton, CmDropdown, CmPopover, CmTooltip } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const popoverOpen = ref(false);
const placements = ['top', 'bottom'] as const;
const menus = [
  { id: 'core-dropdown', label: 'Open menu', placement: 'bottom-start' },
  { id: 'core-dropdown-end', label: 'Open menu', placement: 'bottom-end' },
] as const;
const actionItems = [
  { id: 'one', label: 'Action one' },
  { id: 'two', label: 'Action two' },
];
const items = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
] as const;
const viewItems = [
  { id: 'list', label: 'List', active: true },
  { id: 'board', label: 'Board', disabled: true },
  { id: 'grid', label: 'Grid' },
];
</script>

<template>
  <CoreMatrix title="Overlay visual QA matrix">
    <div v-for="placement in placements" :key="placement" class="core-matrix-cell">
      <h4>Tooltip · {{ placement }}</h4>
      <CmTooltip
        :id="'core-tooltip-' + placement"
        :label="placement"
        :placement="placement"
        :content="`Tooltip placement: ${placement}`"
        class="core-tooltip-sample"
      />
    </div>
    <div class="core-matrix-cell">
      <h4>Tooltip · custom trigger</h4>
      <CmTooltip id="core-tooltip-custom" placement="bottom" :open-delay="120" teleport-to="body">
        <CmButton variant="secondary">Keyboard shortcuts</CmButton>
        <template #content>Press <kbd>?</kbd> for keyboard shortcuts.</template>
      </CmTooltip>
    </div>
    <div v-for="entry in menus" :key="entry.id" class="core-matrix-cell">
      <h4>Dropdown · {{ entry.placement }}</h4>
      <CmDropdown v-bind="entry" :items="entry.placement === 'bottom-start' ? items : actionItems" />
    </div>
    <div class="core-matrix-cell">
      <h4>Dropdown · portaled pills menu</h4>
      <CmDropdown
        id="core-dropdown-pills"
        label="View options"
        variant="pills"
        teleport-to="body"
        :items="viewItems"
        :close-on-select="false"
      >
        <template #trigger><span aria-hidden="true">•••</span></template>
      </CmDropdown>
    </div>
    <div class="core-matrix-cell">
      <h4>Popover · content</h4>
      <CmPopover id="core-popover" v-model:open="popoverOpen" label="Open popover">
        <template #default>
          <div class="core-matrix-cell">
            <p>Compact content block.</p>
            <CmButton size="sm" @click="popoverOpen = false">Apply</CmButton>
          </div>
        </template>
      </CmPopover>
    </div>
  </CoreMatrix>
</template>
