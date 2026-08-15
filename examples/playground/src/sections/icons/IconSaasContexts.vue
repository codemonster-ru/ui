<script setup lang="ts">
import {
  VfDataTable as LegacyDataTable,
  VfDropdown as LegacyDropdown,
  VfMenu as LegacyMenu,
  VfMenuItem as LegacyMenuItem,
  VfNavMenu,
  VfTabs as LegacyTabs,
  type VfDataTableColumn as LegacyDataTableColumn,
  type VfDataTableRow as LegacyDataTableRow,
  type VfNavMenuItem,
  type VfTabItem as LegacyTabItem,
} from '@codemonster-ru/vueforge-core';
import {
  CmAlert as VfAlert,
  CmButton as VfButton,
  CmCard as VfCard,
  CmGrid as VfGrid,
  CmIconButton as VfIconButton,
  CmInline as VfInline,
  CmInput as VfInput,
  CmSection as VfSection,
  CmStack as VfStack,
} from '@codemonster-ru/ui-vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/alert.css';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/input.css';

// This showcase uses a panel-less tablist, rich table cells, and an icon menu inside an arbitrary
// dropdown trigger. Those structures are intentionally outside the current owned Cm contracts.

type UiVariant = {
  id: string;
  theme: 'light' | 'dark';
  density: 'normal' | 'compact';
};

type ProjectRow = LegacyDataTableRow & {
  id: string;
  project: string;
  projectIcon: IconName;
  owner: string;
  status: string;
};

const variants: UiVariant[] = [
  { id: 'light-normal', theme: 'light', density: 'normal' },
  { id: 'dark-normal', theme: 'dark', density: 'normal' },
  { id: 'light-compact', theme: 'light', density: 'compact' },
  { id: 'dark-compact', theme: 'dark', density: 'compact' },
];

const navigationItems: VfNavMenuItem[] = [
  { value: 'overview', label: 'Overview', leadingIcon: 'house' },
  { value: 'customers', label: 'Customers', leadingIcon: 'users' },
  { value: 'projects', label: 'Projects', leadingIcon: 'folder' },
  { value: 'reports', label: 'Reports', leadingIcon: 'chartBar' },
  { value: 'settings', label: 'Settings', leadingIcon: 'gear' },
];

const tabs: Array<LegacyTabItem & { icon: IconName }> = [
  { value: 'overview', label: 'Overview', icon: 'grid' },
  { value: 'analytics', label: 'Analytics', icon: 'chartBar' },
  { value: 'data', label: 'Data', icon: 'columns' },
];

const columns: LegacyDataTableColumn[] = [
  { key: 'project', header: 'Project' },
  { key: 'owner', header: 'Owner' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: 'Actions', align: 'end' },
];

const rows: ProjectRow[] = [
  {
    id: 'atlas',
    project: 'Atlas migration',
    projectIcon: 'file',
    owner: 'M. Chen',
    status: 'Healthy',
  },
  {
    id: 'lifecycle',
    project: 'Lifecycle email',
    projectIcon: 'mail',
    owner: 'S. Rivera',
    status: 'Healthy',
  },
];

const projectRow = (row: LegacyDataTableRow): ProjectRow => row as ProjectRow;
const rowIcon = (row: LegacyDataTableRow): IconName => projectRow(row).projectIcon;
const rowText = (row: LegacyDataTableRow, key: 'project' | 'owner' | 'status'): string => projectRow(row)[key];
</script>

<template>
  <div class="icon-saas-contexts">
    <article
      v-for="variant in variants"
      :key="variant.id"
      :data-vf-theme="variant.theme"
      :data-cm-theme="variant.theme"
      :class="['icon-saas-context', `icon-saas-context--${variant.density}`]"
    >
      <header class="icon-saas-context__label">
        <strong>{{ variant.theme }}</strong>
        <span>{{ variant.density }} density</span>
      </header>

      <div class="icon-saas-context__viewport">
        <div class="icon-saas-shell">
          <header class="icon-saas-shell__header">
            <div class="icon-saas-shell__header-container">
              <VfInline class="icon-saas-toolbar" :wrap="false">
                <VfInline class="icon-saas-brand" :wrap="false">
                  <VueIconify icon="grid" :size="18" />
                  <strong>VueForge</strong>
                </VfInline>
                <div class="icon-saas-search">
                  <VfInput
                    :size="variant.density === 'compact' ? 'sm' : 'md'"
                    placeholder="Search projects"
                    readonly
                    aria-label="Search projects"
                  >
                    <template #leading>
                      <VueIconify icon="magnifyingGlass" size="var(--vf-field-icon-size)" aria-hidden="true" />
                    </template>
                  </VfInput>
                </div>
                <VfInline class="icon-saas-toolbar__actions" :wrap="false">
                  <VfIconButton
                    label="Notifications"
                    :size="variant.density === 'compact' ? 'sm' : 'md'"
                    variant="secondary"
                  >
                    <VueIconify
                      icon="bell"
                      :size="variant.density === 'compact' ? 'var(--cm-icon-size-sm)' : 'var(--cm-icon-size-md)'"
                    />
                  </VfIconButton>
                  <VfButton
                    class="icon-saas-button"
                    :size="variant.density === 'compact' ? 'sm' : 'md'"
                    variant="secondary"
                  >
                    <VueIconify icon="plus" :size="16" />
                    New project
                  </VfButton>
                </VfInline>
              </VfInline>
            </div>
          </header>

          <div class="icon-saas-shell__body">
            <div class="icon-saas-shell__body-container">
              <div class="icon-saas-shell__body-grid">
                <aside class="icon-saas-shell__sidebar">
                  <div class="icon-saas-shell__sidebar-inner">
                    <VfStack class="icon-saas-sidebar">
                      <VfNavMenu
                        default-value="overview"
                        :items="navigationItems"
                        variant="sidebar"
                        :compact="false"
                        aria-label="Workspace navigation"
                      />
                      <VfInline class="icon-saas-sidebar__user" :wrap="false">
                        <VueIconify icon="user" :size="18" />
                        <span>Ada Lovelace</span>
                      </VfInline>
                    </VfStack>
                  </div>
                </aside>

                <main class="icon-saas-shell__content">
                  <div class="icon-saas-shell__content-body">
                    <VfStack class="icon-saas-content">
                      <VfInline class="icon-saas-title" :wrap="false">
                        <div>
                          <small>Workspace</small>
                          <h3>Operations overview</h3>
                        </div>
                        <VfIconButton
                          label="Download report"
                          :size="variant.density === 'compact' ? 'sm' : 'md'"
                          variant="secondary"
                        >
                          <VueIconify
                            icon="download"
                            :size="variant.density === 'compact' ? 'var(--cm-icon-size-sm)' : 'var(--cm-icon-size-md)'"
                          />
                        </VfIconButton>
                      </VfInline>

                      <LegacyTabs default-value="overview" :items="tabs">
                        <template #tab="{ item }">
                          <VfInline class="icon-saas-tab" :wrap="false">
                            <VueIconify
                              :icon="tabs.find((tab) => tab.value === item.value)?.icon ?? 'grid'"
                              :size="16"
                            />
                            <span>{{ item.label }}</span>
                          </VfInline>
                        </template>
                      </LegacyTabs>

                      <VfGrid class="icon-saas-metrics">
                        <VfCard :compact="variant.density === 'compact'">
                          <VfInline class="icon-saas-metric" :wrap="false">
                            <VueIconify icon="users" :size="19" />
                            <span>Active users<strong>12,480</strong></span>
                          </VfInline>
                        </VfCard>
                        <VfCard :compact="variant.density === 'compact'">
                          <VfInline class="icon-saas-metric" :wrap="false">
                            <VueIconify icon="database" :size="19" />
                            <span>Storage<strong>68%</strong></span>
                          </VfInline>
                        </VfCard>
                        <VfCard :compact="variant.density === 'compact'">
                          <VfInline class="icon-saas-metric" :wrap="false">
                            <VueIconify icon="cloud" :size="19" />
                            <span>Uptime<strong>99.98%</strong></span>
                          </VfInline>
                        </VfCard>
                      </VfGrid>

                      <VfGrid class="icon-saas-feedback">
                        <VfAlert tone="warning" role="alert">
                          <template #icon><VueIconify icon="warning" size="var(--vf-icon-size-lg)" /></template>
                          Backup requires attention.
                        </VfAlert>
                        <VfAlert tone="info" role="alert">
                          <template #icon><VueIconify icon="infoCircle" size="var(--vf-icon-size-lg)" /></template>
                          3 updates are ready.
                        </VfAlert>
                      </VfGrid>

                      <section class="icon-saas-data-panel">
                        <header>
                          <VfInline class="icon-saas-data-panel__header" :wrap="false">
                            <strong>Recent projects</strong>
                            <LegacyDropdown placement="bottom-end" :disable-teleport="true">
                              <template #trigger>
                                <VfButton
                                  class="icon-saas-button"
                                  tabindex="-1"
                                  :size="variant.density === 'compact' ? 'sm' : 'md'"
                                  variant="secondary"
                                >
                                  Status
                                  <VueIconify icon="chevronDown" :size="14" />
                                </VfButton>
                              </template>
                              <LegacyMenu>
                                <LegacyMenuItem icon="check" label="Active" active />
                                <LegacyMenuItem icon="xmark" label="Archived" />
                              </LegacyMenu>
                            </LegacyDropdown>
                          </VfInline>
                        </header>

                        <LegacyDataTable
                          :columns="columns"
                          :rows="rows"
                          row-key="id"
                          :density="variant.density === 'compact' ? 'compact' : 'default'"
                          :column-widths="{ project: '280px', owner: '180px', status: '130px', actions: '100px' }"
                        >
                          <template #cell-project="{ row }">
                            <VfInline class="icon-saas-cell" :wrap="false">
                              <VueIconify :icon="rowIcon(row)" :size="16" />
                              <span>{{ rowText(row, 'project') }}</span>
                            </VfInline>
                          </template>
                          <template #cell-owner="{ row }">
                            <VfInline class="icon-saas-cell" :wrap="false">
                              <VueIconify icon="user" :size="16" />
                              <span>{{ rowText(row, 'owner') }}</span>
                            </VfInline>
                          </template>
                          <template #cell-status="{ row }">
                            <span class="icon-saas-status">{{ rowText(row, 'status') }}</span>
                          </template>
                          <template #cell-actions>
                            <VfInline class="icon-saas-row-actions" :wrap="false">
                              <VfIconButton label="Edit project" size="sm" variant="secondary">
                                <VueIconify icon="pencil" size="var(--cm-icon-size-sm)" />
                              </VfIconButton>
                              <VfIconButton label="Delete project" size="sm" variant="secondary">
                                <VueIconify icon="trash" size="var(--cm-icon-size-sm)" />
                              </VfIconButton>
                            </VfInline>
                          </template>
                        </LegacyDataTable>

                        <VfInline class="icon-saas-pagination" :wrap="false">
                          <span>1–2 of 24</span>
                          <VfInline class="icon-saas-pagination__actions" :wrap="false">
                            <VfIconButton
                              class="icon-saas-pagination__previous"
                              label="Previous page"
                              size="sm"
                              variant="secondary"
                            >
                              <VueIconify icon="chevronRight" size="var(--cm-icon-size-sm)" />
                            </VfIconButton>
                            <VfIconButton label="Next page" size="sm" variant="secondary">
                              <VueIconify icon="chevronRight" size="var(--cm-icon-size-sm)" />
                            </VfIconButton>
                          </VfInline>
                        </VfInline>
                      </section>

                      <VfSection class="icon-saas-empty" surface>
                        <VfInline class="icon-saas-empty__row" :wrap="false">
                          <VueIconify icon="message" :size="24" />
                          <div class="icon-saas-empty__copy">
                            <strong>No pending messages</strong>
                            <span>New activity will appear here.</span>
                          </div>
                          <VfIconButton label="Upload a message" size="sm" variant="secondary">
                            <VueIconify icon="upload" size="var(--cm-icon-size-sm)" />
                          </VfIconButton>
                        </VfInline>
                      </VfSection>
                    </VfStack>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.icon-saas-contexts {
  display: grid;
  gap: var(--vf-layout-space-layout-roomy, 24px);
}

.icon-saas-context {
  overflow: hidden;
  border: var(--vf-layout-border-base);
  border-radius: var(--vf-layout-section-radius);
  background: var(--vf-color-background-canvas);
  color: var(--vf-color-text-primary);
}

.icon-saas-context__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: var(--vf-layout-border-base);
  background: var(--vf-color-background-surface);
  text-transform: capitalize;
}

.icon-saas-context__label span {
  color: var(--vf-color-text-muted);
  font-size: var(--vf-text-caption-font-size);
}

.icon-saas-context__viewport {
  container-type: inline-size;
  overflow: hidden;
}

.icon-saas-shell {
  --icon-saas-sidebar-width: 180px;
  --icon-saas-header-height: 58px;
  --icon-saas-content-padding-block: 16px;
  --icon-saas-content-padding-inline: 16px;
  --icon-saas-sidebar-padding-block: 12px;
  --icon-saas-sidebar-padding-inline: 10px;

  display: grid;
  grid-template:
    'header' auto
    'body' minmax(0, 1fr) / minmax(0, 1fr);
  min-width: 0;
  background: var(--cm-color-background-surface-subtle);
  color: var(--cm-color-text-primary);
}

.icon-saas-shell__header {
  position: relative;
  z-index: 20;
  grid-area: header;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  gap: var(--cm-space-4);
  block-size: var(--icon-saas-header-height);
  padding-block: var(--cm-space-3);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.icon-saas-shell__header-container,
.icon-saas-shell__body-container {
  width: 100%;
  max-width: none;
  margin-inline: auto;
  padding-inline: 0;
}

.icon-saas-shell__header-container,
.icon-saas-shell__body,
.icon-saas-shell__body-grid,
.icon-saas-shell__sidebar,
.icon-saas-shell__content,
.icon-saas-shell__content-body {
  min-width: 0;
}

.icon-saas-shell__body {
  grid-area: body;
  min-height: 0;
}

.icon-saas-shell__body-container {
  height: 100%;
}

.icon-saas-shell__body-grid {
  display: grid;
  grid-template: 'sidebar content' minmax(0, 1fr) / minmax(0, var(--icon-saas-sidebar-width)) minmax(0, 1fr);
  min-height: 100%;
}

.icon-saas-shell__sidebar {
  grid-area: sidebar;
  overflow-y: auto;
  border-right: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.icon-saas-shell__sidebar-inner {
  min-width: 0;
  padding: var(--icon-saas-sidebar-padding-block) var(--icon-saas-sidebar-padding-inline);
}

.icon-saas-shell__content {
  display: grid;
  grid-area: content;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: start;
  padding: 0;
  background: var(--cm-color-background-surface);
}

.icon-saas-shell__content-body {
  min-height: 0;
}

.icon-saas-context--compact .icon-saas-shell {
  --icon-saas-sidebar-width: 164px;
  --icon-saas-header-height: 50px;
  --icon-saas-content-padding-block: 10px;
  --icon-saas-content-padding-inline: 12px;
  --icon-saas-sidebar-padding-block: 8px;
  --icon-saas-sidebar-padding-inline: 8px;
}

.icon-saas-toolbar,
.icon-saas-title,
.icon-saas-data-panel__header,
.icon-saas-pagination {
  width: 100%;
  align-items: center;
  justify-content: space-between;
}

.icon-saas-toolbar {
  gap: 12px;
}

.icon-saas-brand,
.icon-saas-toolbar__actions,
.icon-saas-tab,
.icon-saas-cell,
.icon-saas-row-actions,
.icon-saas-pagination__actions {
  align-items: center;
}

.icon-saas-brand {
  min-width: 150px;
}

.icon-saas-search {
  width: min(320px, 42%);
}

.icon-saas-toolbar__actions {
  margin-inline-start: auto;
}

.icon-saas-button :deep(.cm-button__label) {
  display: contents;
}

.icon-saas-sidebar {
  min-height: 100%;
}

.icon-saas-sidebar__user {
  align-items: center;
  margin-top: auto;
  padding: 12px 10px 2px;
  border-top: 1px solid var(--vf-color-border-divider);
}

.icon-saas-content {
  padding: var(--icon-saas-content-padding-block) var(--icon-saas-content-padding-inline);
}

.icon-saas-title h3 {
  margin: 2px 0 0;
  font-size: var(--vf-heading-h-4-font-size);
}

.icon-saas-title small {
  color: var(--vf-color-text-muted);
}

.icon-saas-metrics,
.icon-saas-feedback {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.icon-saas-feedback {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.icon-saas-metric {
  align-items: center;
}

.icon-saas-metric span {
  display: grid;
  color: var(--vf-color-text-muted);
  line-height: 1.25;
}

.icon-saas-metric strong {
  color: var(--vf-color-text-primary);
  font-size: var(--vf-text-body-lg-font-size);
}

.icon-saas-data-panel {
  display: flex;
  flex-direction: column;
  gap: var(--cm-space-3);
  padding: 0;
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  line-height: var(--cm-line-height-normal);
}

.icon-saas-data-panel__header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--vf-color-border-divider);
}

.icon-saas-data-panel :deep(.vf-table-wrap) {
  border: 0;
  border-radius: 0;
}

.icon-saas-cell {
  min-width: 0;
}

.icon-saas-status {
  color: var(--vf-color-status-success-text);
}

.icon-saas-row-actions {
  justify-content: flex-end;
}

.icon-saas-pagination {
  box-sizing: border-box;
  padding: 8px 12px;
  border-top: 1px solid var(--vf-color-border-divider);
  color: var(--vf-color-text-muted);
}

.icon-saas-pagination__previous :deep(.vf-icon) {
  transform: rotate(180deg);
}

.icon-saas-empty {
  padding: 12px;
}

.icon-saas-empty__row {
  align-items: center;
}

.icon-saas-empty__copy {
  display: grid;
  margin-inline-end: auto;
}

.icon-saas-empty__copy span {
  color: var(--vf-color-text-muted);
}

.icon-saas-context--compact .icon-saas-content {
  gap: 8px;
}

.icon-saas-context--compact .icon-saas-data-panel__header,
.icon-saas-context--compact .icon-saas-pagination,
.icon-saas-context--compact .icon-saas-empty {
  padding-block: 6px;
}

@media (width <= 1023.98px) {
  .icon-saas-shell__body-grid {
    grid-template: 'content' minmax(0, 1fr) / minmax(0, 1fr);
  }

  .icon-saas-shell__sidebar {
    display: none;
  }
}

@container (max-width: 760px) {
  .icon-saas-shell {
    --icon-saas-sidebar-width: 150px;
  }

  .icon-saas-brand {
    min-width: auto;
  }

  .icon-saas-metrics,
  .icon-saas-feedback {
    grid-template-columns: 1fr;
  }
}
</style>
