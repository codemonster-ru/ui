<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { mountWarehousePagination } from '../../shared/showcase-layout-recipes.js';
import annabelLogo from '../../shared/annabel-logo-icon.svg';
import {
  columns,
  defaultPreview,
  nav,
  panels,
  previewClass,
  previews,
  regionControls,
  rows,
  steps,
  warehouseNavigation,
  warehouseIcons,
  initialSetupStep,
  warehousePagination,
} from '../../shared/showcase-layout-data.mts';
import { CmAdminLayout, CmAdminShell, CmAppShell, CmDocumentLayout, CmSetupLayout } from '@codemonster-ru/ui-layouts';
import {
  CmAvatar,
  CmButton,
  CmCard,
  CmDataTable,
  CmGrid,
  CmInput,
  CmNavMenu,
  CmStack,
  CmTabs,
} from '@codemonster-ru/ui-vue';
import ContractExamples from './ContractExamples.vue';

const layouts = [
  { value: 'content', label: 'Content' },
  { value: 'sidebar-content', label: 'Sidebar + content' },
  { value: 'sidebar-content-aside', label: 'Sidebar + content + aside' },
] as const;
type ShellLayout = (typeof layouts)[number]['value'];
const layoutTabs = layouts.map(({ value, label }) => ({ value, label, content: '' }));
const modes = ref<{ app: ShellLayout; document: ShellLayout }>({
  app: 'content',
  document: 'content',
});
const flags = ref<Record<string, Record<string, boolean>>>({ 'app-shell': {}, 'document-layout': {} });
const preview = ref<Record<string, string>>(Object.fromEntries(panels.map(({ slug }) => [slug, defaultPreview])));
const width = (slug: string) => selectedWidth(slug)?.width ?? 320;
const adminNav = ref('dashboard');
const shellNav = ref('warehouse-availability');
const warehousePager = ref<HTMLElement[] | null>(null);
const viewport = ref(window.innerWidth);
const syncViewport = () => {
  viewport.value = window.innerWidth;
};
onMounted(() => {
  window.addEventListener('resize', syncViewport);
  const root = warehousePager.value?.[0]?.closest<HTMLElement>('#demo-admin-shell');
  if (root) mountWarehousePagination(root);
});
onUnmounted(() => window.removeEventListener('resize', syncViewport));
function receivePage(event: Event) {
  const { page, size } = (event as CustomEvent<{ page: number; size: number }>).detail;
  warehousePage.value = page;
  warehousePageSize.value = size;
}
const compactRecipe = (slug: string) => slug === 'setup-layout';
function sizes(slug: string) {
  return previews.filter(({ value, width }) => (value === 'min' ? compactRecipe(slug) : width <= viewport.value));
}
function selectedWidth(slug: string) {
  const options = sizes(slug);
  return options.find(({ value }) => value === preview.value[slug]) ?? options.at(-1);
}
const warehousePage = ref(1);
const warehousePageSize = ref(5);
const warehouseRows = computed(() =>
  rows.slice((warehousePage.value - 1) * warehousePageSize.value, warehousePage.value * warehousePageSize.value),
);
const step = ref(initialSetupStep);
const acceptedLicense = ref(false);
const completed = ref(false);
watch(step, () => {
  completed.value = false;
});
function advanceSetup() {
  if (step.value === 'finish') completed.value = true;
  else moveStep(1);
}
const database = ref({ host: '127.0.0.1', port: '3306', name: 'annabel', user: 'annabel_user', password: '' });
const email = ref('');
function moveStep(offset: number) {
  const index = steps.findIndex(({ value }) => value === step.value);
  step.value = steps[Math.min(steps.length - 1, Math.max(0, index + offset))].value;
}
function setMode(kind: 'app' | 'document', value: string) {
  const match = layouts.find((layout) => layout.value === value);
  if (match) modes.value[kind] = match.value;
}
</script>

<template>
  <section
    v-for="{ slug, title } in panels"
    :id="'demo-' + slug"
    :key="slug"
    class="ui-showcase__demo showcase-panel showcase-panel--wide"
  >
    <h3>{{ title }}</h3>
    <fieldset v-show="sizes(slug).length" class="layout-preview__sizes">
      <legend>Preview width</legend>
      <label v-for="{ value } in sizes(slug)" :key="value">
        <input
          :checked="selectedWidth(slug)?.value === value"
          type="radio"
          :name="slug + '-preview'"
          :value="value"
          @change="preview[slug] = value"
        />
        <span>{{ value }}</span>
      </label>
    </fieldset>
    <p v-if="selectedWidth(slug)" class="layout-preview__caption">{{ selectedWidth(slug)?.label }}</p>
    <div class="layout-preview" :class="previewClass(width(slug))" :style="{ maxInlineSize: width(slug) + 'px' }">
      <template v-if="slug === 'app-shell' || slug === 'document-layout'">
        <CmTabs
          :id="slug + '-regions'"
          :model-value="modes[slug === 'app-shell' ? 'app' : 'document']"
          :items="layoutTabs"
          @update:model-value="setMode(slug === 'app-shell' ? 'app' : 'document', $event)"
        />
        <div class="layout-preview__toolbar">
          <template v-for="{ key, label } in regionControls" :key="key">
            <label v-if="key !== 'notches' || slug === 'document-layout'">
              <input v-model="flags[slug][key]" type="checkbox" :data-region-control="key" /> {{ label }}
            </label>
          </template>
        </div>
        <div
          v-show="sizes(slug).length"
          class="layout-preview__frame"
          :class="
            Object.keys(flags[slug])
              .filter((key) => flags[slug][key])
              .map((key) => 'layout-region--' + key)
          "
        >
          <component
            :is="slug === 'app-shell' ? CmAppShell : CmDocumentLayout"
            :layout="modes[slug === 'app-shell' ? 'app' : 'document']"
            v-bind="slug === 'app-shell' ? { stickyHeader: flags[slug].header } : {}"
          >
            <template #header><strong>Header</strong></template>
            <template v-if="flags[slug].subheader" #subheader><strong>Subheader</strong></template>
            <template #sidebar>
              <CmStack
                ><strong>Sidebar</strong>
                <p v-for="n in 8" :key="n">Navigation section {{ n }}</p></CmStack
              >
            </template>
            <CmStack>
              <strong v-if="flags[slug]['content-subheader']" class="layout-content-subheader"
                >Content subheader</strong
              >
              <strong>Content</strong>
              <p v-for="n in 10" :key="n">
                Section {{ n }}. Scroll the preview to see how the regions move with the document.
              </p>
            </CmStack>
            <template #aside>
              <CmStack
                ><strong>Aside</strong>
                <p v-for="n in 8" :key="n">Related information {{ n }}</p></CmStack
              >
            </template>
            <template #footer><strong>Footer</strong></template>
          </component>
        </div>
      </template>

      <div v-else v-show="sizes(slug).length" class="layout-preview__frame">
        <CmAdminLayout v-if="slug === 'admin-layout'" id="showcase-admin-layout" class="layout-preview__admin">
          <template #brand
            ><span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
          >
          <template #mobileBrand
            ><span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
          >
          <template #aside><CmNavMenu v-model:value="adminNav" :items="nav" /></template>
          <template #header
            ><CmButton variant="ghost" size="sm" data-cm-sidebar-toggle>Toggle sidebar</CmButton></template
          >
          <CmStack>
            <div class="layout-preview__toolbar">
              <strong>Dashboard</strong><CmButton size="sm">Create post</CmButton>
            </div>
            <CmGrid><CmCard>Published: 24</CmCard><CmCard>Drafts: 8</CmCard><CmCard>Views: 12,480</CmCard></CmGrid>
            <CmCard>
              <template #header>Recent inventory changes</template>
              <p>Warehouse A · 24 items received</p>
              <p>Warehouse B · 8 items reserved</p>
              <p>Warehouse C · 3 items returned</p>
            </CmCard>
            <CmCard>
              <template #header>Stock alerts</template>
              <p>Wireless keyboard · 2 items remaining</p>
              <p>USB-C dock · out of stock</p>
              <p>Studio monitor · reorder threshold reached</p>
            </CmCard>
          </CmStack>
          <template #footer>Inventory workspace</template>
        </CmAdminLayout>
        <CmAdminShell v-else-if="slug === 'admin-shell'" class="layout-preview__admin">
          <template #brand
            ><span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
          >
          <template #headerActions><CmAvatar label="AK" shape="circle" aria-label="User profile" /></template>
          <template #sidebar
            ><CmNavMenu
              v-model:value="shellNav"
              :items="warehouseNavigation"
              aria-label="Admin shell navigation"
              :style="warehouseIcons"
          /></template>
          <CmStack>
            <h4>Warehouse availability</h4>
            <CmDataTable id="showcase-warehouse" :columns="columns" :rows="warehouseRows" column-dividers />
            <!-- eslint-disable-next-line vue/no-v-html -- Static showcase pagination markup. -->
            <div ref="warehousePager" @warehouse-page="receivePage" v-html="warehousePagination()" />
          </CmStack>
        </CmAdminShell>
        <CmSetupLayout
          v-else
          :title="steps.find(({ value }) => value === step)?.label"
          description="Configure the CMS environment before the first administrator account is created."
          aside-position="left"
          @next="advanceSetup"
          @back="moveStep(-1)"
        >
          <template #brand>
            <span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span>
            <div v-if="width(slug) < 768" class="setup-preview-progress">
              <span>Step {{ steps.findIndex(({ value }) => value === step) + 1 }} of {{ steps.length }}</span>
              <progress
                :value="steps.findIndex(({ value }) => value === step) + 1"
                :max="steps.length"
                aria-label="Setup progress"
              />
            </div>
          </template>
          <template v-if="width(slug) >= 768" #aside
            ><CmNavMenu v-model:value="step" :items="steps" aria-label="Installation steps"
          /></template>
          <label v-if="step === 'license'"><input v-model="acceptedLicense" type="checkbox" /> Accept terms</label>
          <CmStack v-else-if="step === 'database'" class="setup-preview-fields">
            <label
              >Host <CmInput v-model="database.host" aria-describedby="setup-host-help" /><small id="setup-host-help"
                >Hostname, socket, or private address.</small
              ></label
            >
            <label>Port <CmInput v-model="database.port" /></label>
            <label>Database name <CmInput v-model="database.name" /></label>
            <label>Database user <CmInput v-model="database.user" /></label>
            <label>Database password <CmInput v-model="database.password" type="password" /></label>
          </CmStack>
          <label v-else-if="step === 'admin'">Email <CmInput v-model="email" type="email" /></label>
          <p v-else>{{ database.name }} on {{ database.host }}:{{ database.port }}</p>
          <p v-if="step === 'finish' && completed" role="status">Setup preview completed.</p>
          <template #actions>
            <CmButton variant="secondary" :disabled="step === 'license'" @click="moveStep(-1)">Back</CmButton>
            <CmButton @click="advanceSetup">{{ step === 'finish' ? 'Finish' : 'Continue' }}</CmButton>
          </template>
        </CmSetupLayout>
      </div>
    </div>
    <ContractExamples :slug="slug" />
  </section>
</template>
