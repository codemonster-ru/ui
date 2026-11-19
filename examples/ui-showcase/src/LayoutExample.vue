<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { bars } from '@codemonster-ru/ui-icons';
import annabelLogo from '../../shared/annabel-logo-icon.svg';
import {
  columns,
  dashboardActivity,
  dashboardStats,
  type LayoutExampleSlug,
  regionControls,
  rows,
  steps,
  warehouseEmptyText,
  warehouseFilterLabel,
  warehouseNavigation,
  warehouseStockTones,
  warehouseTableCaption,
  initialSetupStep,
} from '../../shared/showcase-layout-data.mts';
import {
  CmAdminLayout,
  CmAdminShell,
  CmAppShell,
  CmAuthLayout,
  CmDocumentLayout,
  CmErrorLayout,
  CmSetupLayout,
} from '@codemonster-ru/ui-layouts';
import {
  CmAvatar,
  CmCheckbox,
  CmField,
  CmIcon,
  CmIconButton,
  CmProgressBar,
  CmSwitch,
  CmButton,
  CmCard,
  CmDataTable,
  CmInput,
  CmInline,
  CmLink,
  CmNavMenu,
  CmStack,
  CmTabs,
  CmTag,
} from '@codemonster-ru/ui-vue';
import logo from '../../shared/vueforge-logo-icon.svg';
import { vScrollableTable } from './scrollable-table';
import { matchesWarehouseFilter } from '../../shared/showcase-layout-recipes.js';

const { slug } = defineProps<{ slug: LayoutExampleSlug }>();
const submitted = ref(false);

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
const makeRegionFlags = () => Object.fromEntries(regionControls.map(({ key }) => [key, false]));
const flags = ref({ 'app-shell': makeRegionFlags(), 'document-layout': makeRegionFlags() });
const adminNav = ref('dashboard');
const warehouseBranches = ref<readonly string[]>(['commerce']);
const shellNav = ref('warehouse-availability');
const warehousePage = ref(1);
const warehousePageSize = ref(5);
const warehouseQuery = ref('');
const matchingProducts = computed(() =>
  rows.filter(({ cells }) => matchesWarehouseFilter(Object.values(cells), warehouseQuery.value)),
);
const warehouseRows = computed(() =>
  matchingProducts.value.slice(
    (warehousePage.value - 1) * warehousePageSize.value,
    warehousePage.value * warehousePageSize.value,
  ),
);
const pageCount = computed(() => Math.max(1, Math.ceil(matchingProducts.value.length / warehousePageSize.value)));
watch(warehouseQuery, () => (warehousePage.value = 1));
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
  <CmStack v-if="slug === 'app-shell' || slug === 'document-layout'" class="cm-container">
    <CmTabs
      :id="slug + '-regions'"
      :model-value="modes[slug === 'app-shell' ? 'app' : 'document']"
      :items="layoutTabs"
      @update:model-value="setMode(slug === 'app-shell' ? 'app' : 'document', $event)"
    />
    <CmInline>
      <template v-for="{ key, label } in regionControls" :key="key">
        <CmSwitch
          v-if="
            (key !== 'notches' || slug === 'document-layout') &&
            (key !== 'plain' || slug === 'app-shell') &&
            (key !== 'sidebar' || modes[slug === 'app-shell' ? 'app' : 'document'] !== 'content') &&
            (key !== 'aside' || modes[slug === 'app-shell' ? 'app' : 'document'] === 'sidebar-content-aside')
          "
          v-model="flags[slug][key]"
          :label="label"
        />
      </template>
    </CmInline>
  </CmStack>
  <component
    :is="slug === 'app-shell' ? CmAppShell : CmDocumentLayout"
    v-if="slug === 'app-shell' || slug === 'document-layout'"
    :layout="modes[slug === 'app-shell' ? 'app' : 'document']"
    :show-subheader="flags[slug].subheader"
    :show-content-subheader="flags[slug]['content-subheader']"
    :sticky-header="flags[slug].header"
    :sticky-sidebar="flags[slug].sidebar"
    :sticky-aside="flags[slug].aside"
    v-bind="
      slug === 'app-shell'
        ? {
            contentAppearance: flags[slug].plain ? 'plain' : 'default',
            sidebarAppearance: flags[slug].plain ? 'plain' : 'default',
            asideAppearance: flags[slug].plain ? 'plain' : 'default',
          }
        : { edgeNotches: flags[slug].notches }
    "
  >
    <template #header><strong>Header</strong></template>
    <template #subheader><strong>Subheader</strong></template>
    <template #content-subheader><strong>Content subheader</strong></template>
    <template #sidebar>
      <CmStack
        ><strong>Sidebar</strong>
        <p v-for="n in 18" :key="n">
          Sidebar block {{ n }}. Use this long fixture to validate sticky side column behavior, scrollbar appearance and
          stable top offsets while scrolling.
        </p></CmStack
      >
    </template>
    <CmStack>
      <strong>Content</strong>
      <p v-for="n in 26" :key="n">
        Content paragraph {{ n }}. This is intentionally verbose demo text for stress-testing long scroll areas under
        sticky header and subheader combinations.
      </p>
    </CmStack>
    <template #aside>
      <CmStack
        ><strong>Aside</strong>
        <p v-for="n in 16" :key="n">
          Aside note {{ n }}. Auxiliary column content is repeated to guarantee overflow and make sticky alignment
          regressions immediately visible.
        </p></CmStack
      >
    </template>
    <template #footer><strong>Footer</strong></template>
  </component>
  <CmAdminLayout v-else-if="slug === 'admin-layout'" id="showcase-admin-layout">
    <template #brand
      ><CmInline :wrap="false"
        ><img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong></CmInline
      ></template
    >
    <template #mobileBrand
      ><CmInline :wrap="false"
        ><img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong></CmInline
      ></template
    >
    <template #aside><CmNavMenu v-model:value="adminNav" :items="warehouseNavigation" /></template>
    <template #header
      ><CmIconButton variant="ghost" label="Toggle sidebar" data-cm-sidebar-toggle><CmIcon :icon="bars" /></CmIconButton
    ></template>
    <CmStack>
      <div class="layout-example__dashboard-heading">
        <h1>Dashboard</h1>
        <CmButton size="sm">Create post</CmButton>
      </div>
      <dl class="layout-example__metrics">
        <div v-for="{ label, value } in dashboardStats" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
      <div class="layout-example__activity">
        <CmCard v-for="{ title, items } in dashboardActivity" :key="title">
          <template #header
            ><h2 class="layout-example__activity-heading">{{ title }}</h2></template
          >
          <ul class="layout-example__activity-list" role="list">
            <li v-for="item in items" :key="item">{{ item }}</li>
          </ul>
        </CmCard>
      </div>
    </CmStack>
    <template #footer>Inventory workspace</template>
  </CmAdminLayout>
  <CmAdminShell v-else-if="slug === 'admin-shell'" :fill-viewport="false">
    <template #brand>
      <CmInline :wrap="false"
        ><img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong></CmInline
      ></template
    >
    <template #headerActions><CmAvatar label="AK" shape="circle" aria-label="User profile" /></template>
    <template #sidebar
      ><CmNavMenu
        v-model:value="shellNav"
        v-model:expanded-values="warehouseBranches"
        :items="warehouseNavigation"
        aria-label="Admin shell navigation"
    /></template>
    <CmStack>
      <CmField v-slot="{ controlId }" control-id="warehouse-filter" :label="warehouseFilterLabel">
        <CmInput :id="controlId" v-model="warehouseQuery" type="search" aria-controls="showcase-warehouse" />
      </CmField>
      <CmDataTable
        v-scrollable-table="warehouseTableCaption"
        id="showcase-warehouse"
        v-model:page="warehousePage"
        :caption="warehouseTableCaption"
        :columns="columns"
        :rows="warehouseRows"
        column-dividers
        :page-size="warehousePageSize"
        :page-count="pageCount"
        :total-rows="matchingProducts.length"
        :empty-text="warehouseEmptyText"
        :page-size-options="[5, 10]"
        @update:page-size="
          warehousePageSize = $event;
          warehousePage = 1;
        "
      >
        <template #cellStatus="{ value }">
          <CmTag :tone="warehouseStockTones[value as keyof typeof warehouseStockTones]">{{ value }}</CmTag>
        </template>
      </CmDataTable>
    </CmStack>
  </CmAdminShell>
  <CmSetupLayout
    v-else-if="slug === 'setup-layout'"
    :title="steps.find(({ value }) => value === step)?.label"
    description="Configure the CMS environment before the first administrator account is created."
    aside-position="left"
    @next="advanceSetup"
    @back="moveStep(-1)"
  >
    <template #brand>
      <div class="layout-example__setup-brand">
        <CmInline :wrap="false"
          ><img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong></CmInline
        >
        <div class="layout-example__setup-progress">
          <span>Step {{ stepIndex + 1 }} of {{ steps.length }}</span>
          <CmProgressBar :value="stepIndex + 1" :max="steps.length" label="Setup progress" />
        </div>
      </div>
    </template>
    <template #aside><CmNavMenu v-model:value="step" :items="steps" aria-label="Installation steps" /></template>
    <CmCheckbox v-if="step === 'license'" v-model="acceptedLicense" label="Accept terms" />
    <CmStack v-else-if="step === 'database'">
      <div class="layout-example__field-row">
        <CmField
          v-slot="{ controlId, describedBy }"
          control-id="setup-preview-host"
          label="Host"
          description="Hostname, socket, or private address."
        >
          <CmInput :id="controlId" v-model="database.host" :aria-describedby="describedBy" placeholder="127.0.0.1" />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="setup-preview-port" label="Port">
          <CmInput :id="controlId" v-model="database.port" placeholder="3306" />
        </CmField>
      </div>
      <CmField v-slot="{ controlId }" control-id="setup-preview-name" label="Database name">
        <CmInput :id="controlId" v-model="database.name" placeholder="annabel" />
      </CmField>
      <div class="layout-example__field-row">
        <CmField v-slot="{ controlId }" control-id="setup-preview-user" label="Database user">
          <CmInput :id="controlId" v-model="database.user" placeholder="annabel_user" />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="setup-preview-password" label="Database password">
          <CmInput :id="controlId" v-model="database.password" type="password" placeholder="Password" password-reveal />
        </CmField>
      </div>
    </CmStack>
    <CmField v-else-if="step === 'admin'" v-slot="{ controlId }" control-id="setup-preview-email" label="Email">
      <CmInput :id="controlId" v-model="email" type="email" />
    </CmField>
    <p v-else>{{ database.name }} on {{ database.host }}:{{ database.port }}</p>
    <p v-if="step === 'finish' && completed" role="status">Setup preview completed.</p>
    <template #actions>
      <CmButton variant="secondary" :disabled="step === 'license'" @click="moveStep(-1)">Back</CmButton>
      <CmButton @click="advanceSetup">{{ step === 'finish' ? 'Finish' : 'Continue' }}</CmButton>
    </template>
  </CmSetupLayout>
  <CmErrorLayout
    v-else-if="slug === 'error-layout'"
    :code="404"
    title="Page not found"
    description="The page you requested does not exist or has been moved."
  >
    <template #actions>
      <CmButton href="/core/" target="_parent">Go to home page</CmButton>
    </template>
  </CmErrorLayout>
  <CmAuthLayout v-else title="Sign in">
    <template #brand><img :src="logo" width="36" height="36" alt="VueForge" /></template>
    <template #description>
      Don't have an account? <CmLink href="/core/" target="_parent" underline="none">Click here to sign up</CmLink>
    </template>
    <CmStack as="form" @submit.prevent="submitted = true">
      <CmField v-slot="{ controlId }" control-id="sign-in-email" label="Email" required>
        <CmInput :id="controlId" type="email" autocomplete="email" required />
      </CmField>
      <CmField v-slot="{ controlId }" control-id="sign-in-password" label="Password" required>
        <CmInput :id="controlId" type="password" autocomplete="current-password" password-reveal required />
      </CmField>
      <CmInline class="layout-example__sign-in-options">
        <CmCheckbox label="Remember me" /><CmLink href="/core/" target="_parent" underline="none"
          >Forgot password?</CmLink
        >
      </CmInline>
      <CmButton type="submit">Sign in</CmButton>
      <output v-if="submitted" aria-live="polite">Sign-in preview submitted.</output>
    </CmStack>
    <template #footer><small>© 2026 VueForge. All rights reserved.</small></template>
  </CmAuthLayout>
</template>
