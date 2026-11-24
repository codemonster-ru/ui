<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { bars } from '@codemonster-ru/ui-icons';
import annabelLogoAsset from '../../shared/annabel-logo-icon.svg';
import {
  columns,
  dashboardActivity,
  dashboardStats,
  type LayoutExampleSlug,
  regionControls,
  shellTabs,
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
  CmContainer,
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
import logoAsset from '../../shared/vueforge-logo-icon.svg';
import { vScrollableTable } from './scrollable-table';
import { matchesWarehouseFilter } from '../../shared/showcase-layout-recipes.js';

const { slug, staticPreview } = defineProps<{ slug: LayoutExampleSlug; staticPreview?: boolean }>();
const annabelLogo = staticPreview ? './annabel-logo-icon.svg' : annabelLogoAsset;
const logo = staticPreview ? './vueforge-logo-icon.svg' : logoAsset;
const corePath = staticPreview ? './core/' : '/core/';
const submitted = ref(false);

type ShellLayout = (typeof shellTabs)[number]['value'];
const mode = ref<ShellLayout>('sidebar-content-aside');
const makeRegionFlags = () => Object.fromEntries(regionControls.map(({ key }) => [key, false]));
const flags = ref({ 'app-shell': makeRegionFlags(), 'document-layout': makeRegionFlags() });
const adminNav = ref('dashboard');
const warehouseBranches = ref<readonly string[]>(['commerce']);
const shellNav = ref('warehouse-availability');
const warehouseQuery = ref('');
const matchingProducts = computed(() =>
  rows.filter(({ cells }) => matchesWarehouseFilter(Object.values(cells), warehouseQuery.value)),
);
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
function setMode(value: string) {
  const match = shellTabs.find((layout) => layout.value === value);
  if (match) mode.value = match.value;
}
</script>

<template>
  <CmContainer v-if="slug === 'app-shell' || slug === 'document-layout'">
    <CmStack>
      <CmTabs
        :id="slug + '-regions'"
        :model-value="mode"
        :items="shellTabs"
        scroll-controls
        @update:model-value="setMode"
      />
      <CmInline>
        <template v-for="{ key, label } in regionControls" :key="key">
          <CmSwitch
            v-if="
              (key !== 'notches' || slug === 'document-layout') &&
              (key !== 'plain' || slug === 'app-shell') &&
              (key !== 'sidebar' || mode !== 'content') &&
              (key !== 'aside' || mode === 'sidebar-content-aside')
            "
            v-model="flags[slug][key]"
            :label="label"
            :data-region-control="staticPreview ? key : undefined"
          />
        </template>
      </CmInline>
    </CmStack>
  </CmContainer>
  <component
    :is="slug === 'app-shell' ? CmAppShell : CmDocumentLayout"
    v-if="slug === 'app-shell' || slug === 'document-layout'"
    :layout="mode"
    :show-subheader="staticPreview || flags[slug].subheader"
    :show-content-subheader="staticPreview || flags[slug]['content-subheader']"
    :data-preview-shell="staticPreview ? '' : undefined"
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
      <CmStack class="layout-example__region layout-example__sidebar">
        <strong>Sidebar</strong>
        <p v-for="n in 18" :key="n">Navigation item {{ n }}</p>
      </CmStack>
    </template>
    <CmStack class="layout-example__region">
      <strong>Content</strong>
      <p v-for="n in 26" :key="n">Content section {{ n }}</p>
    </CmStack>
    <template #aside>
      <CmStack class="layout-example__region">
        <strong>Aside</strong>
        <p v-for="n in 16" :key="n">Related item {{ n }}</p>
      </CmStack>
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
        id="showcase-warehouse"
        v-scrollable-table="warehouseTableCaption"
        :caption="warehouseTableCaption"
        :columns="columns"
        :rows="matchingProducts"
        column-dividers
        :empty-text="warehouseEmptyText"
      >
        <template #cellStatus="{ value }">
          <CmTag :tone="warehouseStockTones[value as keyof typeof warehouseStockTones]">{{ value }}</CmTag>
        </template>
      </CmDataTable>
    </CmStack>
  </CmAdminShell>
  <CmSetupLayout
    v-else-if="slug === 'setup-layout'"
    class="layout-example__setup"
    :title="steps.find(({ value }) => value === step)?.label"
    description="Configure the CMS environment before the first administrator account is created."
    aside-position="left"
    @next="advanceSetup"
    @back="moveStep(-1)"
  >
    <template #brand>
      <CmStack class="layout-example__setup-brand">
        <CmInline :wrap="false">
          <img :src="annabelLogo" alt="" width="32" height="32" />
          <strong>Annabel</strong>
        </CmInline>
        <div class="layout-example__setup-progress" data-setup-progress>
          <span>Step {{ stepIndex + 1 }} of {{ steps.length }}</span>
          <CmProgressBar :value="stepIndex + 1" :max="steps.length" label="Setup progress" height="0.25rem" />
        </div>
      </CmStack>
    </template>
    <template #aside>
      <CmNavMenu v-model:value="step" :items="steps" variant="pills" aria-label="Installation steps" />
    </template>
    <div v-if="staticPreview || step === 'license'" data-preview-step="license" :hidden="step !== 'license'">
      <CmCheckbox v-model="acceptedLicense" label="Accept terms" />
    </div>
    <CmStack v-if="staticPreview || step === 'database'" data-preview-step="database" :hidden="step !== 'database'">
      <div class="layout-example__field-row layout-example__field-row--host">
        <CmField
          v-slot="{ controlId, describedBy }"
          control-id="setup-preview-host"
          label="Host"
          description="Hostname, socket, or private address."
        >
          <CmInput
            :id="controlId"
            v-model="database.host"
            data-preview-field="host"
            :aria-describedby="describedBy"
            placeholder="127.0.0.1"
          />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="setup-preview-port" label="Port">
          <CmInput :id="controlId" v-model="database.port" data-preview-field="port" placeholder="3306" />
        </CmField>
      </div>
      <CmField v-slot="{ controlId }" control-id="setup-preview-name" label="Database name">
        <CmInput :id="controlId" v-model="database.name" data-preview-field="name" placeholder="annabel" />
      </CmField>
      <div class="layout-example__field-row">
        <CmField v-slot="{ controlId }" control-id="setup-preview-user" label="Database user">
          <CmInput :id="controlId" v-model="database.user" autocomplete="off" placeholder="annabel_user" />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="setup-preview-password" label="Database password">
          <CmInput
            :id="controlId"
            v-model="database.password"
            type="password"
            autocomplete="new-password"
            placeholder="Password"
            password-reveal
          />
        </CmField>
      </div>
    </CmStack>
    <CmField
      v-if="staticPreview || step === 'admin'"
      v-slot="{ controlId }"
      control-id="setup-preview-email"
      label="Email"
      data-preview-step="admin"
      :hidden="step !== 'admin'"
    >
      <CmInput :id="controlId" v-model="email" type="email" />
    </CmField>
    <p v-if="staticPreview || step === 'finish'" data-preview-step="finish" :hidden="step !== 'finish'">
      {{ database.name }} on {{ database.host }}:{{ database.port }}
    </p>
    <CmTag v-if="staticPreview || completed" data-setup-complete :hidden="!completed" role="status">
      Setup preview completed.
    </CmTag>
    <template #actions>
      <CmButton data-preview-back variant="secondary" :disabled="step === 'license'" @click="moveStep(-1)"
        >Back</CmButton
      >
      <CmButton data-preview-next @click="advanceSetup">{{ step === 'finish' ? 'Finish' : 'Continue' }}</CmButton>
    </template>
  </CmSetupLayout>
  <CmErrorLayout
    v-else-if="slug === 'error-layout'"
    :code="404"
    title="Page not found"
    description="The page you requested does not exist or has been moved."
  >
    <template #actions>
      <CmButton :href="corePath" target="_parent">Go to home page</CmButton>
    </template>
  </CmErrorLayout>
  <CmAuthLayout v-else title="Sign in">
    <template #brand><img :src="logo" width="36" height="36" alt="VueForge" /></template>
    <template #description>
      Don't have an account? <CmLink :href="corePath" target="_parent" underline="none">Click here to sign up</CmLink>
    </template>
    <CmStack as="form" data-layout-auth @submit.prevent="submitted = true">
      <CmField v-slot="{ controlId }" control-id="sign-in-email" label="Email" required>
        <CmInput :id="controlId" type="email" autocomplete="email" required />
      </CmField>
      <CmField v-slot="{ controlId }" control-id="sign-in-password" label="Password" required>
        <CmInput :id="controlId" type="password" autocomplete="current-password" password-reveal required />
      </CmField>
      <CmInline class="layout-example__sign-in-options">
        <CmCheckbox label="Remember me" /><CmLink :href="corePath" target="_parent" underline="none"
          >Forgot password?</CmLink
        >
      </CmInline>
      <CmButton type="submit">Sign in</CmButton>
      <CmTag v-if="staticPreview || submitted" data-auth-result :hidden="!submitted" role="status">
        Sign-in preview submitted.
      </CmTag>
    </CmStack>
    <template #footer><small>© 2026 VueForge. All rights reserved.</small></template>
  </CmAuthLayout>
</template>
