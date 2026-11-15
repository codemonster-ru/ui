<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { bars } from '@codemonster-ru/ui-icons';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';
import annabelLogo from '../../shared/annabel-logo-icon.svg';
import {
  columns,
  defaultPreview,
  previewClass,
  previews,
  regionControls,
  rows,
  steps,
  warehouseNavigation,
  layoutNavIcons,
  initialSetupStep,
} from '../../shared/showcase-layout-data.mts';
import { CmAdminLayout, CmAdminShell, CmAppShell, CmDocumentLayout, CmSetupLayout } from '@codemonster-ru/ui-layouts';
import {
  CmAvatar,
  CmCheckbox,
  CmDrawer,
  CmField,
  CmIcon,
  CmIconButton,
  CmProgressBar,
  CmSwitch,
  CmButton,
  CmCard,
  CmDataTable,
  CmGrid,
  CmInput,
  CmNavMenu,
  CmStack,
  CmTabs,
} from '@codemonster-ru/ui-vue';
import LayoutPrimitives from './LayoutPrimitives.vue';
import LayoutPageRecipes from './LayoutPageRecipes.vue';
import ContractExamples from './ContractExamples.vue';

const panels = [
  {
    slug: 'setup-layout',
    title: 'CmSetupLayout',
    description: 'Structures an initial configuration flow with progress, content, and actions.',
  },
  {
    slug: 'app-shell',
    title: 'CmAppShell and shell areas',
    description: 'Composes header, sidebar, content, aside, and footer regions into an application frame.',
  },
  {
    slug: 'admin-layout',
    title: 'CmAdminLayout',
    description: 'Provides responsive admin navigation with collapsible desktop and mobile sidebars.',
  },
  {
    slug: 'admin-shell',
    title: 'CmAdminShell',
    description: 'Provides an opinionated product shell for dense administration workflows.',
  },
  {
    slug: 'document-layout',
    title: 'CmDocumentLayout',
    description: 'Organizes documentation with optional navigation, article content, and an aside.',
  },
] as const;
const layouts = [
  { value: 'content', label: 'content' },
  { value: 'sidebar-content', label: 'sidebar-content' },
  { value: 'sidebar-content-aside', label: 'sidebar-content-aside' },
] as const;
type ShellLayout = (typeof layouts)[number]['value'];
const layoutTabs = layouts.map(({ value, label }) => ({ value, label, content: '' }));
const modes = ref<{ app: ShellLayout; document: ShellLayout }>({
  app: 'content',
  document: 'content',
});
const makeRegionFlags = () => Object.fromEntries(regionControls.map(({ key }) => [key, false]));
const flags = ref({ 'app-shell': makeRegionFlags(), 'document-layout': makeRegionFlags() });
const preview = ref<Record<string, string>>(Object.fromEntries(panels.map(({ slug }) => [slug, defaultPreview])));
const width = (slug: string) => selectedWidth(slug)?.width ?? 320;
const adminNav = ref('dashboard');
const warehouseBranches = ref<readonly string[]>(['commerce']);
const shellNav = ref('warehouse-availability');
const adminDrawer = ref(false);
const viewport = ref(window.innerWidth);
const syncViewport = () => {
  viewport.value = window.innerWidth;
};
onMounted(() => window.addEventListener('resize', syncViewport));
onUnmounted(() => window.removeEventListener('resize', syncViewport));
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
const pageCount = computed(() => Math.ceil(rows.length / warehousePageSize.value));
const step = ref(initialSetupStep);
const stepIndex = computed(() => steps.findIndex(({ value }) => value === step.value));
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
  <LayoutPrimitives :viewport="viewport" />
  <LayoutPageRecipes :viewport="viewport" />
  <section
    v-for="{ slug, title, description } in panels"
    :id="'demo-' + slug"
    :key="slug"
    class="showcase-group"
    :aria-labelledby="'layout-title-' + slug"
  >
    <header>
      <h2 :id="'layout-title-' + slug">{{ title }}</h2>
      <p>{{ description }}</p>
    </header>
    <div v-if="slug === 'app-shell' || slug === 'document-layout'" class="layout-region-options">
      <CmTabs
        :id="slug + '-regions'"
        :model-value="modes[slug === 'app-shell' ? 'app' : 'document']"
        :items="layoutTabs"
        @update:model-value="setMode(slug === 'app-shell' ? 'app' : 'document', $event)"
      />
      <div class="layout-region-toolbar">
        <strong>layout: {{ modes[slug === 'app-shell' ? 'app' : 'document'] }}</strong>
        <div class="layout-preview__toolbar">
          <template v-for="{ key, label } in regionControls" :key="key">
            <CmSwitch
              v-if="
                (key !== 'notches' || slug === 'document-layout') &&
                (key !== 'sidebar' || modes[slug === 'app-shell' ? 'app' : 'document'] !== 'content') &&
                (key !== 'aside' || modes[slug === 'app-shell' ? 'app' : 'document'] === 'sidebar-content-aside')
              "
              v-model="flags[slug][key]"
              :label="label"
            />
          </template>
        </div>
      </div>
    </div>
    <CmTabs
      v-if="sizes(slug).length"
      :id="slug + '-preview'"
      :model-value="'width-' + selectedWidth(slug)?.value"
      :items="sizes(slug).map(({ value }) => ({ value: 'width-' + value, label: value, content: '' }))"
      @update:model-value="preview[slug] = $event.slice(6)"
    >
      <template
        v-for="{ value } in sizes(slug)"
        :key="value"
        #[`panelWidth${value.charAt(0).toUpperCase()+value.slice(1)}`]="{ active: shown }"
      >
        <div v-if="shown" class="layout-demo-preview">
          <p class="layout-preview__caption">{{ value }} · {{ width(slug) }}px</p>
          <div
            class="layout-preview"
            :class="[previewClass(width(slug)), { 'layout-preview--wide': width(slug) >= cmBreakpoints.xl }]"
            :style="{ maxInlineSize: width(slug) + 'px' }"
          >
            <template v-if="slug === 'app-shell' || slug === 'document-layout'">
              <div
                class="layout-preview__frame layout-shell-frame"
                :class="
                  Object.keys(flags[slug])
                    .filter((key) => key === 'plain' && slug === 'document-layout' && flags[slug][key])
                    .map((key) => 'layout-region--' + key)
                "
              >
                <component
                  :is="slug === 'app-shell' ? CmAppShell : CmDocumentLayout"
                  :layout="modes[slug === 'app-shell' ? 'app' : 'document']"
                  :show-subheader="flags[slug].subheader"
                  :show-content-subheader="flags[slug]['content-subheader']"
                  :sticky-header="flags[slug].header"
                  :sticky-sidebar="flags[slug].sidebar"
                  :sticky-aside="flags[slug].aside"
                  v-bind="slug === 'app-shell'
                    ? { contentAppearance: flags[slug].plain ? 'plain' : 'default' }
                    : { edgeNotches: flags[slug].notches }"
                >
                  <template #header><strong>Header</strong></template>
                  <template #subheader><strong>Subheader</strong></template>
                  <template #content-subheader><strong>Content subheader</strong></template>
                  <template #sidebar>
                    <CmStack
                      ><strong>Sidebar</strong>
                      <p v-for="n in 18" :key="n">
                        Sidebar block {{ n }}. Use this long fixture to validate sticky side column behavior, scrollbar
                        appearance and stable top offsets while scrolling.
                      </p></CmStack
                    >
                  </template>
                  <CmStack>
                    <strong>Content</strong>
                    <p v-for="n in 26" :key="n">
                      Content paragraph {{ n }}. This is intentionally verbose demo text for stress-testing long scroll
                      areas under sticky header and subheader combinations.
                    </p>
                  </CmStack>
                  <template #aside>
                    <CmStack
                      ><strong>Aside</strong>
                      <p v-for="n in 16" :key="n">
                        Aside note {{ n }}. Auxiliary column content is repeated to guarantee overflow and make sticky
                        alignment regressions immediately visible.
                      </p></CmStack
                    >
                  </template>
                  <template #footer><strong>Footer</strong></template>
                </component>
              </div>
            </template>

            <div v-else class="layout-preview__frame" :class="{ 'layout-admin-frame': slug === 'admin-layout' }">
              <CmAdminLayout v-if="slug === 'admin-layout'" id="showcase-admin-layout" class="layout-preview__admin">
                <template #brand
                  ><span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
                >
                <template #mobileBrand
                  ><span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
                >
                <template #aside><CmNavMenu v-model:value="adminNav" :items="warehouseNavigation" /></template>
                <template #header
                  ><CmIconButton variant="ghost" label="Toggle sidebar" data-cm-sidebar-toggle
                    ><CmIcon :icon="bars" /></CmIconButton
                ></template>
                <CmStack>
                  <div class="layout-preview__toolbar">
                    <strong>Dashboard</strong><CmButton size="sm">Create post</CmButton>
                  </div>
                  <CmGrid
                    ><CmCard>Published: 24</CmCard><CmCard>Drafts: 8</CmCard><CmCard>Views: 12,480</CmCard></CmGrid
                  >
                  <CmCard>
                    <template #header>Recent inventory changes</template>
                    <p>Warehouse A · 24 items received</p>
                    <p>Warehouse B · 8 items reserved</p>
                    <p>Warehouse C · 3 items returned</p>
                    <p>Online stock · 12 items sold</p>
                  </CmCard>
                  <CmCard>
                    <template #header>Stock alerts</template>
                    <p>Wireless keyboard · 2 items remaining</p>
                    <p>USB-C dock · out of stock</p>
                    <p>Studio monitor · reorder threshold reached</p>
                    <p>Laptop stand · delivery expected tomorrow</p>
                  </CmCard>
                </CmStack>
                <template #footer>© 2026 VueForge. All rights reserved.</template>
              </CmAdminLayout>
              <CmAdminShell v-else-if="slug === 'admin-shell'" class="layout-preview__admin">
                <template #brand>
                  <CmIconButton
                    v-if="width(slug) < cmBreakpoints.lg"
                    variant="ghost"
                    label="Open navigation"
                    @click="adminDrawer = true"
                  >
                    <CmIcon :icon="bars" />
                  </CmIconButton>
                  <span class="layout-brand"><img :src="annabelLogo" alt="" /><strong>Annabel</strong></span></template
                >
                <template #headerActions><CmAvatar label="AK" shape="circle" aria-label="User profile" /></template>
                <template #sidebar
                  ><CmNavMenu
                    v-model:value="shellNav"
                    v-model:expanded-values="warehouseBranches"
                    :items="warehouseNavigation"
                    aria-label="Admin shell navigation"
                    :style="layoutNavIcons"
                /></template>
                <CmStack>
                  <h4>Warehouse availability</h4>
                  <CmDataTable
                    id="showcase-warehouse"
                    v-model:page="warehousePage"
                    :columns="columns"
                    :rows="warehouseRows"
                    column-dividers
                    :page-size="warehousePageSize"
                    :page-count="pageCount"
                    :total-rows="rows.length"
                    :page-size-options="[5, 10]"
                    @update:page-size="
                      warehousePageSize = $event;
                      warehousePage = 1;
                    "
                  />
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
                  <div v-if="width(slug) < cmBreakpoints.md" class="setup-preview-progress">
                    <span>Step {{ stepIndex + 1 }} of {{ steps.length }}</span>
                    <CmProgressBar :value="stepIndex + 1" :max="steps.length" label="Setup progress" />
                  </div>
                </template>
                <template v-if="width(slug) >= cmBreakpoints.md" #aside
                  ><CmNavMenu
                    v-model:value="step"
                    :items="steps"
                    aria-label="Installation steps"
                    :style="layoutNavIcons"
                /></template>
                <CmCheckbox v-if="step === 'license'" v-model="acceptedLicense" label="Accept terms" />
                <CmStack v-else-if="step === 'database'" class="layout-setup-stack">
                  <div class="layout-setup-fields layout-setup-fields--host">
                    <CmField
                      v-slot="{ controlId, describedBy }"
                      control-id="setup-preview-host"
                      label="Host"
                      description="Hostname, socket, or private address."
                    >
                      <CmInput
                        :id="controlId"
                        v-model="database.host"
                        :aria-describedby="describedBy"
                        placeholder="127.0.0.1"
                      />
                    </CmField>
                    <CmField v-slot="{ controlId }" control-id="setup-preview-port" label="Port">
                      <CmInput :id="controlId" v-model="database.port" placeholder="3306" />
                    </CmField>
                  </div>
                  <CmField v-slot="{ controlId }" control-id="setup-preview-name" label="Database name">
                    <CmInput :id="controlId" v-model="database.name" placeholder="annabel" />
                  </CmField>
                  <div class="layout-setup-fields">
                    <CmField v-slot="{ controlId }" control-id="setup-preview-user" label="Database user">
                      <CmInput :id="controlId" v-model="database.user" placeholder="annabel_user" />
                    </CmField>
                    <CmField v-slot="{ controlId }" control-id="setup-preview-password" label="Database password">
                      <CmInput
                        :id="controlId"
                        v-model="database.password"
                        type="password"
                        placeholder="Password"
                        password-reveal
                      />
                    </CmField>
                  </div>
                </CmStack>
                <CmField
                  v-else-if="step === 'admin'"
                  v-slot="{ controlId }"
                  control-id="setup-preview-email"
                  label="Email"
                >
                  <CmInput :id="controlId" v-model="email" type="email" />
                </CmField>
                <p v-else>{{ database.name }} on {{ database.host }}:{{ database.port }}</p>
                <p v-if="step === 'finish' && completed" role="status">Setup preview completed.</p>
                <template #actions>
                  <CmButton variant="secondary" :disabled="step === 'license'" @click="moveStep(-1)">Back</CmButton>
                  <CmButton @click="advanceSetup">{{ step === 'finish' ? 'Finish' : 'Continue' }}</CmButton>
                </template>
              </CmSetupLayout>
            </div>
          </div>
        </div>
      </template>
    </CmTabs>
    <ContractExamples v-if="sizes(slug).length" :slug="slug" />
  </section>
  <CmDrawer id="layout-admin-navigation" v-model:open="adminDrawer" title="Navigation" side="start" size="sm">
    <CmNavMenu
      v-model:value="shellNav"
      v-model:expanded-values="warehouseBranches"
      :items="warehouseNavigation"
      @update:value="adminDrawer = false"
    />
  </CmDrawer>
</template>
