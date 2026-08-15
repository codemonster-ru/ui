<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { CSSProperties } from 'vue';
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

type UiVariant = {
  id: string;
  theme: 'light' | 'dark';
  density: 'normal' | 'compact';
};

type NavigationItem = {
  value: string;
  label: string;
  leadingIcon: IconName;
};

type IconTab = NavigationItem;

type TableColumn = {
  key: 'project' | 'owner' | 'status' | 'actions';
  header: string;
  width: string;
  align?: 'end';
};

type ProjectRow = {
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

const navigationItems: NavigationItem[] = [
  { value: 'overview', label: 'Overview', leadingIcon: 'house' },
  { value: 'customers', label: 'Customers', leadingIcon: 'users' },
  { value: 'projects', label: 'Projects', leadingIcon: 'folder' },
  { value: 'reports', label: 'Reports', leadingIcon: 'chartBar' },
  { value: 'settings', label: 'Settings', leadingIcon: 'gear' },
];

const tabs: IconTab[] = [
  { value: 'overview', label: 'Overview', leadingIcon: 'grid' },
  { value: 'analytics', label: 'Analytics', leadingIcon: 'chartBar' },
  { value: 'data', label: 'Data', leadingIcon: 'columns' },
];

const columns: TableColumn[] = [
  { key: 'project', header: 'Project', width: '280px' },
  { key: 'owner', header: 'Owner', width: '180px' },
  { key: 'status', header: 'Status', width: '130px' },
  { key: 'actions', header: 'Actions', width: '100px', align: 'end' },
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

const activeNavigation = ref<Record<string, string>>({});
const activeTabs = ref<Record<string, string>>({});
const openDropdownId = ref<string>();
const tabIndicators = ref<Record<string, CSSProperties>>({});
const tabScrollers = new Map<string, HTMLElement>();
const tablists = new Map<string, HTMLElement>();
let tabResizeObserver: ResizeObserver | undefined;

function activeNavigationValue(variantId: string): string {
  return activeNavigation.value[variantId] ?? 'overview';
}

function selectNavigation(variantId: string, value: string): void {
  activeNavigation.value = { ...activeNavigation.value, [variantId]: value };
}

function activeTabValue(variantId: string): string {
  return activeTabs.value[variantId] ?? 'overview';
}

function tabId(variantId: string, value: string): string {
  return `icon-saas-${variantId}-tab-${value}`;
}

function setTabScroller(variantId: string, element: unknown): void {
  if (element instanceof HTMLElement) tabScrollers.set(variantId, element);
  else tabScrollers.delete(variantId);
}

function setTablist(variantId: string, element: unknown): void {
  if (element instanceof HTMLElement) tablists.set(variantId, element);
  else tablists.delete(variantId);
}

function updateTabIndicator(variantId: string): void {
  const scroller = tabScrollers.get(variantId);
  const activeButton = tablists
    .get(variantId)
    ?.querySelector<HTMLElement>(`[data-icon-tab="${activeTabValue(variantId)}"]`);

  if (!scroller || !activeButton) return;

  const scrollerBounds = scroller.getBoundingClientRect();
  const tabBounds = activeButton.getBoundingClientRect();
  tabIndicators.value = {
    ...tabIndicators.value,
    [variantId]: {
      opacity: '1',
      transform: `translateX(${tabBounds.left - scrollerBounds.left}px)`,
      width: `${tabBounds.width}px`,
    },
  };
}

function activateTab(variantId: string, value: string, focus = false): void {
  activeTabs.value = { ...activeTabs.value, [variantId]: value };
  void nextTick(() => updateTabIndicator(variantId));

  if (focus) requestAnimationFrame(() => document.getElementById(tabId(variantId, value))?.focus());
}

function onTabKeydown(event: KeyboardEvent, variantId: string, value: string): void {
  const currentIndex = tabs.findIndex((tab) => tab.value === value);
  const isRtl = getComputedStyle(tablists.get(variantId) ?? (event.currentTarget as HTMLElement)).direction === 'rtl';
  let nextIndex: number | undefined;

  if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else if (
    event.key === 'ArrowDown' ||
    (event.key === 'ArrowRight' && !isRtl) ||
    (event.key === 'ArrowLeft' && isRtl)
  ) {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (
    event.key === 'ArrowUp' ||
    (event.key === 'ArrowLeft' && !isRtl) ||
    (event.key === 'ArrowRight' && isRtl)
  ) {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  }

  if (nextIndex === undefined) return;
  event.preventDefault();
  activateTab(variantId, tabs[nextIndex].value, true);
}

function dropdownTriggerId(variantId: string): string {
  return `icon-saas-${variantId}-dropdown-trigger`;
}

function dropdownMenuId(variantId: string): string {
  return `icon-saas-${variantId}-dropdown-menu`;
}

function closeDropdown(focusTrigger = false): void {
  const variantId = openDropdownId.value;
  openDropdownId.value = undefined;
  if (focusTrigger && variantId) void nextTick(() => document.getElementById(dropdownTriggerId(variantId))?.focus());
}

function openDropdown(variantId: string, focusFirstItem = false): void {
  openDropdownId.value = variantId;
  if (focusFirstItem) {
    void nextTick(() =>
      document.querySelector<HTMLElement>(`#${dropdownMenuId(variantId)} [role="menuitem"]`)?.focus(),
    );
  }
}

function toggleDropdown(variantId: string): void {
  if (openDropdownId.value === variantId) closeDropdown(true);
  else openDropdown(variantId);
}

function onDropdownTriggerKeydown(event: KeyboardEvent, variantId: string): void {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openDropdown(variantId, true);
  } else if (event.key === 'Escape' && openDropdownId.value === variantId) {
    event.preventDefault();
    closeDropdown(true);
  }
}

function onDropdownMenuKeydown(event: KeyboardEvent): void {
  const menu = event.currentTarget as HTMLElement;
  const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const currentIndex = items.findIndex((item) => item === document.activeElement);
  let nextIndex: number | undefined;

  if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length;
  else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = items.length - 1;
  else if (event.key === 'Escape') {
    event.preventDefault();
    closeDropdown(true);
    return;
  }

  if (nextIndex === undefined) return;
  event.preventDefault();
  items[nextIndex]?.focus();
}

function closeDropdownOnOutsidePointer(event: PointerEvent): void {
  if (!(event.target instanceof Element) || !event.target.closest('.icon-saas-dropdown')) closeDropdown();
}

onMounted(() => {
  tabResizeObserver = new ResizeObserver(() => variants.forEach(({ id }) => updateTabIndicator(id)));
  for (const element of [...tabScrollers.values(), ...tablists.values()]) tabResizeObserver.observe(element);
  variants.forEach(({ id }) => updateTabIndicator(id));
  document.addEventListener('pointerdown', closeDropdownOnOutsidePointer);
});

onBeforeUnmount(() => {
  tabResizeObserver?.disconnect();
  document.removeEventListener('pointerdown', closeDropdownOnOutsidePointer);
});
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
                      <VueIconify
                        icon="magnifyingGlass"
                        :size="variant.density === 'compact' ? '0.9375rem' : '1rem'"
                        aria-hidden="true"
                      />
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
                      <nav class="icon-saas-nav" aria-label="Workspace navigation">
                        <ul class="icon-saas-nav__list">
                          <li v-for="item in navigationItems" :key="item.value">
                            <button
                              class="icon-saas-nav__item"
                              :class="activeNavigationValue(variant.id) === item.value && 'icon-saas-nav__item--active'"
                              type="button"
                              :aria-current="activeNavigationValue(variant.id) === item.value ? 'page' : undefined"
                              @click="selectNavigation(variant.id, item.value)"
                            >
                              <span class="icon-saas-nav__item-content">
                                <span class="icon-saas-nav__leading-icon" aria-hidden="true">
                                  <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
                                </span>
                                <span>{{ item.label }}</span>
                              </span>
                            </button>
                          </li>
                        </ul>
                      </nav>
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

                      <div class="icon-saas-tabs">
                        <div class="icon-saas-tabs__list">
                          <div :ref="(element) => setTabScroller(variant.id, element)" class="icon-saas-tabs__scroller">
                            <div
                              :ref="(element) => setTablist(variant.id, element)"
                              class="icon-saas-tabs__tablist"
                              role="tablist"
                              aria-label="Workspace views"
                              aria-orientation="horizontal"
                            >
                              <button
                                v-for="tab in tabs"
                                :id="tabId(variant.id, tab.value)"
                                :key="tab.value"
                                class="icon-saas-tabs__tab"
                                :data-icon-tab="tab.value"
                                type="button"
                                role="tab"
                                :aria-selected="activeTabValue(variant.id) === tab.value"
                                :tabindex="activeTabValue(variant.id) === tab.value ? 0 : -1"
                                @click="activateTab(variant.id, tab.value)"
                                @keydown="onTabKeydown($event, variant.id, tab.value)"
                              >
                                <VfInline class="icon-saas-tab" :wrap="false">
                                  <VueIconify :icon="tab.leadingIcon" :size="16" />
                                  <span>{{ tab.label }}</span>
                                </VfInline>
                              </button>
                            </div>
                          </div>
                          <span class="icon-saas-tabs__baseline" aria-hidden="true" />
                          <span
                            class="icon-saas-tabs__indicator"
                            :style="tabIndicators[variant.id]"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

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
                          <template #icon><VueIconify icon="warning" size="var(--cm-icon-size-lg)" /></template>
                          Backup requires attention.
                        </VfAlert>
                        <VfAlert tone="info" role="alert">
                          <template #icon><VueIconify icon="infoCircle" size="var(--cm-icon-size-lg)" /></template>
                          3 updates are ready.
                        </VfAlert>
                      </VfGrid>

                      <section class="icon-saas-data-panel">
                        <header>
                          <VfInline class="icon-saas-data-panel__header" :wrap="false">
                            <strong>Recent projects</strong>
                            <div class="icon-saas-dropdown">
                              <div
                                :id="dropdownTriggerId(variant.id)"
                                class="icon-saas-dropdown__trigger"
                                :aria-controls="dropdownMenuId(variant.id)"
                                :aria-expanded="openDropdownId === variant.id"
                                aria-haspopup="menu"
                                tabindex="0"
                                @click="toggleDropdown(variant.id)"
                                @keydown="onDropdownTriggerKeydown($event, variant.id)"
                              >
                                <VfButton
                                  class="icon-saas-button"
                                  tabindex="-1"
                                  :size="variant.density === 'compact' ? 'sm' : 'md'"
                                  variant="secondary"
                                >
                                  Status
                                  <VueIconify icon="chevronDown" :size="14" />
                                </VfButton>
                              </div>
                              <div
                                v-if="openDropdownId === variant.id"
                                :id="dropdownMenuId(variant.id)"
                                class="icon-saas-dropdown__menu"
                                :aria-labelledby="dropdownTriggerId(variant.id)"
                                role="menu"
                                @keydown="onDropdownMenuKeydown"
                              >
                                <span class="icon-saas-dropdown__arrow" aria-hidden="true" />
                                <button
                                  class="icon-saas-menu__item icon-saas-menu__item--active"
                                  type="button"
                                  role="menuitem"
                                  @click="closeDropdown(true)"
                                >
                                  <VueIconify class="icon-saas-menu__item-icon" icon="check" aria-hidden="true" />
                                  <span class="icon-saas-menu__item-label">Active</span>
                                </button>
                                <button
                                  class="icon-saas-menu__item"
                                  type="button"
                                  role="menuitem"
                                  @click="closeDropdown(true)"
                                >
                                  <VueIconify class="icon-saas-menu__item-icon" icon="xmark" aria-hidden="true" />
                                  <span class="icon-saas-menu__item-label">Archived</span>
                                </button>
                              </div>
                            </div>
                          </VfInline>
                        </header>

                        <div class="icon-saas-table-wrap">
                          <div class="icon-saas-table-scroll">
                            <table
                              class="icon-saas-table"
                              :class="variant.density === 'compact' && 'icon-saas-table--compact'"
                            >
                              <thead>
                                <tr>
                                  <th
                                    v-for="column in columns"
                                    :key="column.key"
                                    :class="column.align === 'end' && 'icon-saas-table__cell--end'"
                                    :style="{ width: column.width }"
                                    scope="col"
                                  >
                                    <span class="icon-saas-table__header-content">{{ column.header }}</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="row in rows" :key="row.id">
                                  <td :style="{ width: columns[0].width }">
                                    <VfInline class="icon-saas-cell" :wrap="false">
                                      <VueIconify :icon="row.projectIcon" :size="16" />
                                      <span>{{ row.project }}</span>
                                    </VfInline>
                                  </td>
                                  <td :style="{ width: columns[1].width }">
                                    <VfInline class="icon-saas-cell" :wrap="false">
                                      <VueIconify icon="user" :size="16" />
                                      <span>{{ row.owner }}</span>
                                    </VfInline>
                                  </td>
                                  <td :style="{ width: columns[2].width }">
                                    <span class="icon-saas-status">{{ row.status }}</span>
                                  </td>
                                  <td class="icon-saas-table__cell--end" :style="{ width: columns[3].width }">
                                    <VfInline class="icon-saas-row-actions" :wrap="false">
                                      <VfIconButton label="Edit project" size="sm" variant="secondary">
                                        <VueIconify icon="pencil" size="var(--cm-icon-size-sm)" />
                                      </VfIconButton>
                                      <VfIconButton label="Delete project" size="sm" variant="secondary">
                                        <VueIconify icon="trash" size="var(--cm-icon-size-sm)" />
                                      </VfIconButton>
                                    </VfInline>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

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
  gap: var(--cm-space-6);
}

.icon-saas-context {
  overflow: hidden;
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-canvas);
  color: var(--cm-color-text-primary);
}

.icon-saas-context__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
  text-transform: capitalize;
}

.icon-saas-context__label span {
  color: var(--cm-color-text-muted);
  font-size: var(--cm-font-size-sm);
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

.icon-saas-tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  gap: var(--cm-space-2);
  overflow-x: hidden;
}

.icon-saas-tabs__list {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 0 0 3px;
  background: transparent;
}

.icon-saas-tabs__scroller {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: auto hidden;
  scrollbar-width: none;
}

.icon-saas-tabs__scroller::-webkit-scrollbar {
  display: none;
}

.icon-saas-tabs__tablist {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: var(--cm-control-height-md);
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--cm-space-1);
}

.icon-saas-tabs__baseline {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: var(--cm-color-border-divider);
  pointer-events: none;
}

.icon-saas-tabs__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: var(--cm-control-height-md);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  padding: var(--cm-field-padding-md);
  padding-inline: var(--cm-space-3);
  border: 0;
  border-radius: var(--cm-radius-control-tight) var(--cm-radius-control-tight) 0 0;
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  white-space: nowrap;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.icon-saas-tabs__tab:hover:not([aria-selected='true']),
.icon-saas-tabs__tab:active:not([aria-selected='true']) {
  background: transparent;
  color: var(--cm-color-text-primary);
}

.icon-saas-tabs__tab[aria-selected='true'] {
  background: transparent;
  color: var(--cm-color-selected-foreground);
}

/* stylelint-disable-next-line no-descending-specificity -- Focus state intentionally overrides hover. */
.icon-saas-tabs__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.icon-saas-tabs__indicator {
  position: absolute;
  z-index: 2;
  bottom: 0;
  left: 0;
  display: block;
  height: 3px;
  background: var(--cm-color-selected-foreground);
  opacity: 0;
  pointer-events: none;
  transition:
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    width var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    opacity var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
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

.icon-saas-nav {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
}

.icon-saas-nav__list {
  display: grid;
  gap: var(--cm-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.icon-saas-nav__item {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: var(--cm-control-height-md);
  align-items: center;
  justify-content: space-between;
  padding: var(--cm-field-padding-md);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  text-align: start;
  text-decoration: none;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.icon-saas-nav__item-content {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--cm-space-2);
}

.icon-saas-nav__leading-icon {
  display: inline-flex;
  width: calc(var(--cm-icon-size-md) * 1.25);
  min-width: calc(var(--cm-icon-size-md) * 1.25);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: currentcolor;
}

.icon-saas-nav__item:hover:not(.icon-saas-nav__item--active) {
  background: var(--cm-color-background-surface-hover);
  color: var(--cm-color-text-primary);
}

/* stylelint-disable-next-line no-descending-specificity -- Focus state intentionally overrides hover. */
.icon-saas-nav__item:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
  color: var(--cm-color-selected-foreground);
}

.icon-saas-nav__item--active {
  border-color: transparent;
  background: var(--cm-color-background-surface-selected);
  color: var(--cm-color-selected-foreground);
  font-weight: var(--cm-font-weight-medium);
}

.icon-saas-sidebar__user {
  align-items: center;
  margin-top: auto;
  padding: 12px 10px 2px;
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.icon-saas-content {
  padding: var(--icon-saas-content-padding-block) var(--icon-saas-content-padding-inline);
}

.icon-saas-title h3 {
  margin: 2px 0 0;
  font-size: 1.1875rem;
}

.icon-saas-title small {
  color: var(--cm-color-text-muted);
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
  color: var(--cm-color-text-muted);
  line-height: 1.25;
}

.icon-saas-metric strong {
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
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
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.icon-saas-dropdown {
  position: relative;
  display: inline-flex;
  flex-direction: column;
}

.icon-saas-dropdown__trigger {
  width: fit-content;
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
}

.icon-saas-dropdown__trigger:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.icon-saas-dropdown__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 1100;
  display: flex;
  min-width: 12rem;
  flex-direction: column;
  gap: var(--cm-space-1);
  padding: var(--cm-space-2);
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-control);
  background: var(--cm-color-background-surface-elevated);
  box-shadow: var(--cm-shadow-overlay);
}

.icon-saas-dropdown__arrow {
  position: absolute;
  top: -6px;
  right: var(--cm-space-4);
  z-index: 0;
  width: 0.625rem;
  height: 0.625rem;
  border-top: var(--cm-border-width) solid var(--cm-color-border-default);
  border-left: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface-elevated);
  pointer-events: none;
  transform: rotate(45deg);
}

.icon-saas-menu__item {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  min-height: var(--cm-control-height-sm);
  align-items: center;
  gap: var(--cm-space-2);
  padding: var(--cm-field-padding-sm);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control-tight);
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--cm-font-size-xl);
  text-align: start;
  text-decoration: none;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.icon-saas-menu__item-icon {
  width: var(--cm-icon-size-md);
  height: var(--cm-icon-size-md);
  flex: none;
}

.icon-saas-menu__item-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.icon-saas-menu__item:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
  color: var(--cm-color-selected-foreground);
}

.icon-saas-menu__item:hover:not(.icon-saas-menu__item--active) {
  background: transparent;
  color: var(--cm-color-text-primary);
}

.icon-saas-menu__item--active,
.icon-saas-menu__item--active:hover {
  background: transparent;
  color: var(--cm-color-selected-foreground);
}

.icon-saas-table-wrap {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
}

.icon-saas-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.icon-saas-table {
  width: 100%;
  min-width: 36rem;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.icon-saas-table :where(th, td) {
  padding: var(--cm-field-padding-lg);
  text-align: start;
  vertical-align: top;
}

.icon-saas-table th {
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-divider);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-medium);
}

.icon-saas-table tbody tr + tr td {
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.icon-saas-table--compact :where(th, td) {
  padding: var(--cm-field-padding-md);
}

.icon-saas-table__header-content {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
}

.icon-saas-table__cell--end {
  text-align: end;
}

.icon-saas-cell {
  min-width: 0;
}

.icon-saas-status {
  color: var(--cm-color-status-success-subtle-foreground);
}

.icon-saas-row-actions {
  justify-content: flex-end;
}

.icon-saas-pagination {
  box-sizing: border-box;
  padding: 8px 12px;
  border-top: var(--cm-border-width) solid var(--cm-color-border-divider);
  color: var(--cm-color-text-muted);
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
  color: var(--cm-color-text-muted);
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
