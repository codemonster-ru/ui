<template>
  <CmContainer element="main" size="xl" class="demo-page">
    <CmStack>
      <header class="demo-block__header">
        <CmBadge tone="primary">CodeMonster UI</CmBadge>
        <h1>Vue component showcase</h1>
        <p class="demo-text">The stable cross-platform component API rendered by the Vue adapter.</p>
      </header>

      <CmSection surface>
        <CmStack>
          <h2>Actions and feedback</h2>
          <CmInline>
            <CmButton v-for="variant in buttonVariants" :key="variant" :variant="variant">
              {{ variant }}
            </CmButton>
            <CmButton loading>Saving</CmButton>
            <CmLink href="/core" underline="hover">Native navigation</CmLink>
          </CmInline>
          <CmGrid>
            <CmAlert v-for="tone in feedbackTones" :key="tone" :tone="tone" :title="tone">
              Shared feedback treatment.
            </CmAlert>
          </CmGrid>
          <CmInline>
            <CmBadge v-for="tone in feedbackTones" :key="tone" :tone="tone">{{ tone }}</CmBadge>
          </CmInline>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Content</h2>
          <CmBreadcrumbs :items="breadcrumbs" />
          <CmGrid>
            <CmCard title="Team member">
              <CmInline>
                <CmAvatar label="MC" size="lg" />
                <CmStack>
                  <strong>Maya Chen</strong>
                  <span class="demo-text">Platform engineer</span>
                </CmStack>
              </CmInline>
            </CmCard>
            <CmCard title="Loading state">
              <CmStack>
                <CmSkeleton min-height="1.5rem" radius="control" />
                <CmSkeleton min-height="4rem" radius="surface" />
              </CmStack>
            </CmCard>
          </CmGrid>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Forms</h2>
          <CmGrid>
            <CmField control-id="showcase-email" label="Email" description="Used for release notifications." required>
              <template #default="{ controlId, describedBy, invalid, required }">
                <CmInput
                  :id="controlId"
                  v-model="email"
                  type="email"
                  name="email"
                  :aria-describedby="describedBy"
                  :invalid="invalid"
                  :required="required"
                />
              </template>
            </CmField>
            <CmField control-id="showcase-plan" label="Plan">
              <template #default="{ controlId, describedBy }">
                <CmSelect
                  :id="controlId"
                  v-model="plan"
                  name="plan"
                  :aria-describedby="describedBy"
                  :options="plans"
                />
              </template>
            </CmField>
            <CmField control-id="showcase-date" label="Release date">
              <template #default="{ controlId, describedBy }">
                <CmDatePicker
                  :id="controlId"
                  v-model="releaseDate"
                  name="release-date"
                  :aria-describedby="describedBy"
                />
              </template>
            </CmField>
            <CmField control-id="showcase-notes" label="Notes">
              <template #default="{ controlId, describedBy }">
                <CmTextarea
                  :id="controlId"
                  v-model="notes"
                  name="notes"
                  rows="3"
                  :aria-describedby="describedBy"
                />
              </template>
            </CmField>
          </CmGrid>
          <CmInline>
            <CmCheckbox v-model="notifications" name="preferences" value="notifications">Notifications</CmCheckbox>
            <CmSwitch v-model="automaticRelease" name="automatic-release">Automatic release</CmSwitch>
            <CmRadio v-model="channel" name="channel" value="stable">Stable</CmRadio>
            <CmRadio v-model="channel" name="channel" value="preview">Preview</CmRadio>
          </CmInline>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Navigation and disclosure</h2>
          <CmTabs id="showcase-tabs" v-model="activeTab" :items="tabs" />
          <CmAccordion id="showcase-faq" v-model:open-items="openItems" :items="accordionItems" multiple />
          <CmInline>
            <CmDropdown
              id="showcase-actions"
              v-model:open="dropdownOpen"
              label="Project actions"
              :items="menuItems"
            />
            <CmPopover id="showcase-popover" v-model:open="popoverOpen" label="Release help">
              Choose preview while validating a prerelease consumer.
            </CmPopover>
            <CmTooltip id="showcase-tooltip" label="Status" content="All migration checks passed." />
          </CmInline>
          <CmMenu :items="menuItems" aria-label="Project menu" />
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Data display</h2>
          <CmTable caption="Release channels" striped>
            <template #header>
              <tr><th scope="col">Channel</th><th scope="col">Audience</th></tr>
            </template>
            <tr><th scope="row">Stable</th><td>Production</td></tr>
            <tr><th scope="row">Preview</th><td>Validation</td></tr>
          </CmTable>
          <CmDataTable
            id="showcase-projects"
            v-model:selected-row-ids="selectedRows"
            v-model:sort="tableSort"
            v-model:page="tablePage"
            caption="Migration projects"
            :columns="tableColumns"
            :rows="tableRows"
            :page-count="2"
            selectable
            striped
          />
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Overlays</h2>
          <CmInline>
            <CmButton @click="dialogOpen = true">Open dialog</CmButton>
            <CmButton variant="secondary" @click="drawerOpen = true">Open drawer</CmButton>
            <CmButton variant="ghost" @click="commandPaletteOpen = true">Open command palette</CmButton>
          </CmInline>
          <CmDialog id="showcase-dialog" v-model:open="dialogOpen" title="Publish preview?">
            Validate the packed consumers before publishing.
            <template #footer><CmButton @click="dialogOpen = false">Done</CmButton></template>
          </CmDialog>
          <CmDrawer id="showcase-drawer" v-model:open="drawerOpen" title="Release checklist" side="end">
            Contracts, accessibility, visuals, and consumers are required gates.
          </CmDrawer>
          <CmCommandPalette
            id="showcase-commands"
            v-model:open="commandPaletteOpen"
            v-model:query="commandQuery"
            title="Go to"
            :commands="commands"
          />
        </CmStack>
      </CmSection>

      <CmDivider />
    </CmStack>
  </CmContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  CmAccordion,
  CmAlert,
  CmAvatar,
  CmBadge,
  CmBreadcrumbs,
  CmButton,
  CmCard,
  CmCheckbox,
  CmCommandPalette,
  CmContainer,
  CmDataTable,
  CmDatePicker,
  CmDialog,
  CmDivider,
  CmDrawer,
  CmDropdown,
  CmField,
  CmGrid,
  CmInline,
  CmInput,
  CmLink,
  CmMenu,
  CmPopover,
  CmRadio,
  CmSection,
  CmSelect,
  CmSkeleton,
  CmStack,
  CmSwitch,
  CmTable,
  CmTabs,
  CmTextarea,
  CmTooltip,
  type CmAccordionItem,
  type CmAlertTone,
  type CmButtonVariant,
  type CmCommandPaletteItem,
  type CmDataTableColumn,
  type CmDataTableRow,
  type CmDataTableSort,
  type CmMenuItem,
  type CmSelectOption,
  type CmTabItem,
} from '@codemonster-ru/ui-vue';

const buttonVariants: CmButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost'];
const feedbackTones: CmAlertTone[] = ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'];
const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Components', current: true }];
const plans: CmSelectOption[] = [{ value: 'team', label: 'Team' }, { value: 'enterprise', label: 'Enterprise' }];
const tabs: CmTabItem[] = [
  { value: 'overview', label: 'Overview', content: 'Portable component contracts.' },
  { value: 'api', label: 'API', content: 'Thin Vue and Razor adapters.' },
];
const accordionItems: CmAccordionItem[] = [
  { id: 'vue', title: 'Vue', content: 'Vue owns hydrated interaction.' },
  { id: 'razor', title: 'Razor', content: 'Razor supports progressive enhancement.' },
];
const menuItems: CmMenuItem[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'archive', label: 'Archive' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
];
const tableColumns: CmDataTableColumn[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];
const tableRows: CmDataTableRow[] = [
  { id: 'atlas', cells: { name: 'Atlas', status: 'Ready' } },
  { id: 'nova', cells: { name: 'Nova', status: 'Preview' } },
];
const commands: CmCommandPaletteItem[] = [
  { id: 'components', label: 'Components', keywords: 'vue razor' },
  { id: 'migration', label: 'Migration guide', keywords: 'vueforge codemonster' },
];

const email = ref('maya@example.com');
const plan = ref('team');
const releaseDate = ref('2026-08-13');
const notes = ref('Validate both adapters.');
const notifications = ref(true);
const automaticRelease = ref(false);
const channel = ref('stable');
const activeTab = ref('overview');
const openItems = ref<string[]>(['vue']);
const dropdownOpen = ref(false);
const popoverOpen = ref(false);
const selectedRows = ref<string[]>(['atlas']);
const tableSort = ref<CmDataTableSort | null>({ key: 'name', direction: 'ascending' });
const tablePage = ref(1);
const dialogOpen = ref(false);
const drawerOpen = ref(false);
const commandPaletteOpen = ref(false);
const commandQuery = ref('');
</script>

<style scoped>
.demo-page { padding-block: 2rem; }
.demo-block__header h1, h2 { margin: 0; }
.demo-text { color: var(--cm-color-text-muted); }
</style>
