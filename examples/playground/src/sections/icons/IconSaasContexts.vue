<script setup lang="ts">
import {
  VfAlert,
  VfButton,
  VfCard,
  VfDataTable,
  VfDropdown,
  VfIconButton,
  VfInput,
  VfMenu,
  VfMenuItem,
  VfNavMenu,
  VfPanel,
  VfTabs,
  type VfDataTableColumn,
  type VfDataTableRow,
  type VfNavMenuItem,
  type VfTabItem,
} from '@codemonster-ru/vueforge-core';
import {
  CmGrid as VfGrid,
  CmInline as VfInline,
  CmSection as VfSection,
  CmStack as VfStack,
} from '@codemonster-ru/ui-vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';

type UiVariant = {
  id: string;
  theme: 'light' | 'dark';
  density: 'normal' | 'compact';
};

type ProjectRow = VfDataTableRow & {
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

const tabs: Array<VfTabItem & { icon: IconName }> = [
  { value: 'overview', label: 'Overview', icon: 'grid' },
  { value: 'analytics', label: 'Analytics', icon: 'chartBar' },
  { value: 'data', label: 'Data', icon: 'columns' },
];

const columns: VfDataTableColumn[] = [
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

const projectRow = (row: VfDataTableRow): ProjectRow => row as ProjectRow;
const rowIcon = (row: VfDataTableRow): IconName => projectRow(row).projectIcon;
const rowText = (row: VfDataTableRow, key: 'project' | 'owner' | 'status'): string => projectRow(row)[key];
</script>

<template>
  <div class="icon-saas-contexts">
    <article
      v-for="variant in variants"
      :key="variant.id"
      :data-vf-theme="variant.theme"
      :class="['icon-saas-context', `icon-saas-context--${variant.density}`]"
    >
      <header class="icon-saas-context__label">
        <strong>{{ variant.theme }}</strong>
        <span>{{ variant.density }} density</span>
      </header>

      <div class="icon-saas-context__viewport">
        <VfAppShell class="icon-saas-shell" layout="sidebar-content" :content-padded="false" :sticky-header="false">
          <template #header>
            <VfInline class="icon-saas-toolbar" :wrap="false">
              <VfInline class="icon-saas-brand" :wrap="false">
                <VueIconify icon="grid" :size="18" />
                <strong>VueForge</strong>
              </VfInline>
              <VfInput
                class="icon-saas-search"
                :size="variant.density === 'compact' ? 'sm' : 'md'"
                leading-icon="magnifyingGlass"
                placeholder="Search projects"
                readonly
                aria-label="Search projects"
              />
              <VfInline class="icon-saas-toolbar__actions" :wrap="false">
                <VfIconButton
                  icon="bell"
                  :size="variant.density === 'compact' ? 'sm' : 'md'"
                  variant="secondary"
                  aria-label="Notifications"
                />
                <VfButton :size="variant.density === 'compact' ? 'sm' : 'md'" variant="secondary">
                  <VueIconify icon="plus" :size="16" />
                  New project
                </VfButton>
              </VfInline>
            </VfInline>
          </template>

          <template #sidebar>
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
          </template>

          <VfStack class="icon-saas-content">
            <VfInline class="icon-saas-title" :wrap="false">
              <div>
                <small>Workspace</small>
                <h3>Operations overview</h3>
              </div>
              <VfIconButton
                icon="download"
                :size="variant.density === 'compact' ? 'sm' : 'md'"
                variant="secondary"
                aria-label="Download report"
              />
            </VfInline>

            <VfTabs default-value="overview" :items="tabs">
              <template #tab="{ item }">
                <VfInline class="icon-saas-tab" :wrap="false">
                  <VueIconify :icon="tabs.find((tab) => tab.value === item.value)?.icon ?? 'grid'" :size="16" />
                  <span>{{ item.label }}</span>
                </VfInline>
              </template>
            </VfTabs>

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
              <VfAlert tone="warn" icon="warning">Backup requires attention.</VfAlert>
              <VfAlert tone="info" icon="infoCircle">3 updates are ready.</VfAlert>
            </VfGrid>

            <VfPanel class="icon-saas-data-panel">
              <template #header>
                <VfInline class="icon-saas-data-panel__header" :wrap="false">
                  <strong>Recent projects</strong>
                  <VfDropdown placement="bottom-end" :disable-teleport="true">
                    <template #trigger>
                      <VfButton tabindex="-1" :size="variant.density === 'compact' ? 'sm' : 'md'" variant="secondary">
                        Status
                        <VueIconify icon="chevronDown" :size="14" />
                      </VfButton>
                    </template>
                    <VfMenu>
                      <VfMenuItem icon="check" label="Active" active />
                      <VfMenuItem icon="xmark" label="Archived" />
                    </VfMenu>
                  </VfDropdown>
                </VfInline>
              </template>

              <VfDataTable
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
                    <VfIconButton icon="pencil" size="sm" variant="secondary" aria-label="Edit project" />
                    <VfIconButton icon="trash" size="sm" variant="secondary" aria-label="Delete project" />
                  </VfInline>
                </template>
              </VfDataTable>

              <VfInline class="icon-saas-pagination" :wrap="false">
                <span>1–2 of 24</span>
                <VfInline class="icon-saas-pagination__actions" :wrap="false">
                  <VfIconButton
                    class="icon-saas-pagination__previous"
                    icon="chevronRight"
                    size="sm"
                    variant="secondary"
                    aria-label="Previous page"
                  />
                  <VfIconButton icon="chevronRight" size="sm" variant="secondary" aria-label="Next page" />
                </VfInline>
              </VfInline>
            </VfPanel>

            <VfSection class="icon-saas-empty" surface>
              <VfInline class="icon-saas-empty__row" :wrap="false">
                <VueIconify icon="message" :size="24" />
                <div class="icon-saas-empty__copy">
                  <strong>No pending messages</strong>
                  <span>New activity will appear here.</span>
                </div>
                <VfIconButton icon="upload" size="sm" variant="secondary" aria-label="Upload a message" />
              </VfInline>
            </VfSection>
          </VfStack>
        </VfAppShell>
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
  --vf-layout-container-max-width: none;
  --vf-layout-container-padding: 0;
  --vf-layout-shell-sidebar-width: 180px;
  --vf-layout-header-height: 58px;
  --vf-layout-header-padding-inline: 14px;
  --vf-layout-content-padding-block: 16px;
  --vf-layout-content-padding-inline: 16px;
  --vf-layout-sidebar-padding-block: 12px;
  --vf-layout-sidebar-padding-inline: 10px;

  min-width: 0;
}

.icon-saas-context--compact .icon-saas-shell {
  --vf-layout-shell-sidebar-width: 164px;
  --vf-layout-header-height: 50px;
  --vf-layout-content-padding-block: 10px;
  --vf-layout-content-padding-inline: 12px;
  --vf-layout-sidebar-padding-block: 8px;
  --vf-layout-sidebar-padding-inline: 8px;
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
  padding: var(--vf-layout-content-padding-block) var(--vf-layout-content-padding-inline);
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
  padding: 0;
}

.icon-saas-data-panel__header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--vf-color-border-divider);
}

.icon-saas-data-panel :deep(.vf-panel__title) {
  margin: 0;
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

@container (max-width: 760px) {
  .icon-saas-shell {
    --vf-layout-shell-sidebar-width: 150px;
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
