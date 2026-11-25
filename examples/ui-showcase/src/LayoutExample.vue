<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { bars } from '@codemonster-ru/ui-icons';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';
import annabelLogoAsset from '../../shared/annabel-logo-icon.svg';
import {
  adminShellRows,
  columns,
  dashboardActivity,
  dashboardStats,
  initialShellLayout,
  type LayoutExampleSlug,
  shellTabs,
  shellRegionSamples,
  type ShellLayout,
  steps,
  warehouseNavigation,
  warehouseTableCaption,
  initialSetupStep,
} from '../../shared/showcase-layout-data.mts';
import { followShellPreview } from '../../shared/showcase-layout-recipes.js';
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
  CmDrawer,
  CmField,
  CmGrid,
  CmIcon,
  CmIconButton,
  CmProgressBar,
  CmButton,
  CmCard,
  CmInput,
  CmInline,
  CmLink,
  CmNavMenu,
  CmStack,
  CmTag,
} from '@codemonster-ru/ui-vue';
import { VfDataTable } from '@codemonster-ru/ui-vue/historical';
import logoAsset from '../../shared/vueforge-logo-icon.svg';
import { vScrollableTable } from './scrollable-table';

const { slug, staticPreview } = defineProps<{ slug: LayoutExampleSlug; staticPreview?: boolean }>();
const annabelLogo = staticPreview ? './annabel-logo-icon.svg' : annabelLogoAsset;
const logo = staticPreview ? './vueforge-logo-icon.svg' : logoAsset;
const corePath = staticPreview ? './core/' : '/core/';
const submitted = ref(false);

const mode = ref<ShellLayout>(initialShellLayout);
const options = ref<string[]>([]);
const appearance = computed(() => (options.value.includes('plain') ? 'plain' : 'default'));

function regionItemText(region: keyof typeof shellRegionSamples, number: number) {
  const { label, copy } = shellRegionSamples[region];
  return `${label} ${number}. ${copy}`;
}

const adminNav = ref('warehouse-availability');
const currentYear = new Date().getUTCFullYear();
const warehouseBranches = ref<readonly string[]>(['commerce']);
const shellNav = ref('warehouse-availability');
const warehouseMobile = ref(false);
const warehouseDrawerOpen = ref(false);
let warehouseMobileQuery: MediaQueryList | undefined;

function syncWarehouseNavigation({ matches }: { matches: boolean }) {
  if (matches === warehouseMobile.value) return;
  const trigger = document.getElementById('warehouse-navigation-toggle');
  const navigation = document.getElementById('warehouse-navigation');
  const focused = document.activeElement;
  const restoreFocus =
    document.hasFocus() && (warehouseDrawerOpen.value || focused === trigger || navigation?.contains(focused));
  warehouseMobile.value = matches;
  if (!matches) warehouseDrawerOpen.value = false;
  if (restoreFocus) {
    void nextTick(() => {
      const current = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
      const desktopTarget =
        current?.getClientRects().length && getComputedStyle(current).visibility === 'visible'
          ? current
          : navigation?.querySelector('button');
      (matches ? trigger : desktopTarget)?.focus({ preventScroll: true });
    });
  }
}

function openWarehouseNavigation(event: MouseEvent) {
  (event.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
  warehouseDrawerOpen.value = true;
}

onMounted(() => {
  if (slug === 'app-shell' || slug === 'document-layout') {
    followShellPreview(slug, (layout, enabled) => {
      const tab = shellTabs.find(({ value }) => value === layout);
      if (tab) mode.value = tab.value;
      options.value = enabled;
    });
  }
  if (slug !== 'admin-shell') return;
  warehouseMobileQuery = window.matchMedia(`(width < ${cmBreakpoints.lg}px)`);
  syncWarehouseNavigation(warehouseMobileQuery);
  warehouseMobileQuery.addEventListener('change', syncWarehouseNavigation);
});
onBeforeUnmount(() => warehouseMobileQuery?.removeEventListener('change', syncWarehouseNavigation));

const warehouseRows = adminShellRows.map(({ id, cells }) => ({ id, ...cells }));
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
</script>

<template>
  <component
    :is="slug === 'app-shell' ? CmAppShell : CmDocumentLayout"
    v-if="slug === 'app-shell' || slug === 'document-layout'"
    :layout="staticPreview ? 'sidebar-content-aside' : mode"
    :show-subheader="staticPreview || options.includes('subheader')"
    :show-content-subheader="staticPreview || options.includes('content-subheader')"
    :data-preview-shell="staticPreview ? mode : undefined"
    :sticky-header="options.includes('header')"
    :sticky-sidebar="options.includes('sidebar')"
    :sticky-aside="options.includes('aside')"
    :class="{ 'layout-example__document--plain-columns': slug === 'document-layout' && appearance === 'plain' }"
    v-bind="
      slug === 'app-shell'
        ? { contentAppearance: appearance, sidebarAppearance: appearance, asideAppearance: appearance }
        : { edgeNotches: options.includes('notches') }
    "
  >
    <template #header><strong>Header</strong></template>
    <template #subheader><strong>Subheader</strong></template>
    <template #content-subheader><strong>Content subheader</strong></template>
    <template #sidebar>
      <CmStack class="layout-example__region layout-example__sidebar">
        <strong>Sidebar</strong>
        <p v-for="n in 18" :key="n">{{ regionItemText('sidebar', n) }}</p>
      </CmStack>
    </template>
    <CmStack class="layout-example__region">
      <strong>Content</strong>
      <p v-for="n in 26" :key="n">{{ regionItemText('content', n) }}</p>
    </CmStack>
    <template #aside>
      <CmStack class="layout-example__region">
        <strong>Aside</strong>
        <p v-for="n in 16" :key="n">{{ regionItemText('aside', n) }}</p>
      </CmStack>
    </template>
    <template #footer><strong>Footer</strong></template>
  </component>
  <CmAdminLayout v-else-if="slug === 'admin-layout'" id="showcase-admin-layout" class="layout-example__admin">
    <template #brand>
      <CmInline class="layout-example__admin-brand" :wrap="false">
        <img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong>
      </CmInline>
    </template>
    <template #mobileBrand>
      <CmInline class="layout-example__admin-brand" :wrap="false">
        <img :src="annabelLogo" alt="" width="24" height="24" /><strong>Annabel</strong>
      </CmInline>
    </template>
    <template #aside>
      <CmNavMenu v-model:value="adminNav" :items="warehouseNavigation" aria-label="Admin navigation" />
    </template>
    <template #header="{ isSidebarCollapsed }">
      <CmIconButton
        :label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        aria-controls="showcase-admin-layout"
        :aria-expanded="!isSidebarCollapsed"
        data-cm-sidebar-toggle
      >
        <CmIcon :icon="bars" />
      </CmIconButton>
    </template>
    <CmStack>
      <CmInline class="layout-example__dashboard-heading">
        <h1>Dashboard</h1>
        <CmButton size="sm">Create post</CmButton>
      </CmInline>
      <CmGrid>
        <CmCard v-for="{ label, value } in dashboardStats" :key="label" element="div">{{ label }}: {{ value }}</CmCard>
      </CmGrid>
      <CmCard v-for="{ title, action, items } in dashboardActivity" :key="title">
        <template #header>
          <CmInline class="layout-example__dashboard-heading">
            <h2>{{ title }}</h2>
            <CmButton size="sm" variant="secondary">{{ action }}</CmButton>
          </CmInline>
        </template>
        <CmStack element="ul" class="layout-example__activity-list" role="list">
          <li v-for="item in items" :key="item">{{ item }}</li>
        </CmStack>
      </CmCard>
    </CmStack>
    <template #footer>© {{ currentYear }} VueForge. All rights reserved.</template>
  </CmAdminLayout>
  <template v-else-if="slug === 'admin-shell'">
    <CmAdminShell
      class="layout-example__warehouse"
      :data-warehouse-mobile="warehouseMobile ? '' : undefined"
      :fill-viewport="false"
    >
      <template #brand>
        <CmInline :wrap="false">
          <CmIconButton
            id="warehouse-navigation-toggle"
            :data-warehouse-navigation-toggle="cmBreakpoints.lg"
            variant="ghost"
            label="Open navigation"
            aria-haspopup="dialog"
            aria-controls="warehouse-drawer"
            :aria-expanded="warehouseDrawerOpen"
            @click="openWarehouseNavigation"
          >
            <CmIcon :icon="bars" />
          </CmIconButton>
          <CmInline :wrap="false">
            <img :src="annabelLogo" alt="" width="24" height="24" />
            <strong>Annabel</strong>
          </CmInline>
        </CmInline>
      </template>
      <template #headerActions><CmAvatar label="AK" shape="circle" aria-label="User profile" /></template>
      <template #sidebar>
        <Teleport to="#warehouse-drawer-navigation" :disabled="!warehouseMobile" defer>
          <CmNavMenu
            id="warehouse-navigation"
            v-model:value="shellNav"
            v-model:expanded-values="warehouseBranches"
            :items="warehouseNavigation"
            aria-label="Admin shell navigation"
            @select="warehouseDrawerOpen = false"
          />
        </Teleport>
      </template>
      <CmStack>
        <h3 class="layout-example__warehouse-title">{{ warehouseTableCaption }}</h3>
        <VfDataTable
          id="showcase-warehouse"
          v-scrollable-table="warehouseTableCaption"
          :caption="warehouseTableCaption"
          :columns="columns"
          :rows="warehouseRows"
          row-key="id"
          column-dividers
          sorting-mode="manual"
          pagination
          :pagination-mode="staticPreview ? 'manual' : 'client'"
          :default-page-size="10"
          :page-size-options="[10, 20]"
        />
      </CmStack>
    </CmAdminShell>
    <CmDrawer
      id="warehouse"
      v-model:open="warehouseDrawerOpen"
      title="Navigation"
      side="left"
      size="sm"
      dividers
      close-on-overlay-click
    >
      <div id="warehouse-drawer-navigation"></div>
    </CmDrawer>
  </template>
  <CmSetupLayout
    v-else-if="slug === 'setup-layout'"
    class="layout-example__setup"
    :title="steps.find(({ value }) => value === step)?.label"
    description="Configure the CMS environment before the first administrator account is created."
    aside-position="left"
    :fill-viewport="false"
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
    class="layout-example__error"
    :code="404"
    title="Page not found"
    description="The page you requested does not exist or has been moved."
    :fill-viewport="false"
  >
    <template #actions>
      <CmButton :href="corePath" target="_parent">Go to home page</CmButton>
    </template>
  </CmErrorLayout>
  <CmAuthLayout v-else title="Sign in" :fill-viewport="false">
    <template #brand><img :src="logo" width="36" height="36" alt="VueForge" /></template>
    <template #description>
      Don't have an account? <CmLink :href="corePath" target="_parent" underline="none">Click here to sign up</CmLink>
    </template>
    <CmStack as="form" data-layout-auth autocomplete="off" inert @submit.prevent="submitted = true">
      <CmInput id="sign-in-email" type="email" aria-label="Email" placeholder="Email" required />
      <CmInput
        id="sign-in-password"
        type="password"
        aria-label="Password"
        placeholder="Password"
        password-reveal
        required
      />
      <div class="layout-example__sign-in-options">
        <CmCheckbox label="Remember me" class="layout-example__sign-in-remember" />
        <CmLink :href="corePath" target="_parent" underline="none">Forgot password?</CmLink>
      </div>
      <CmButton type="submit">Sign in</CmButton>
      <CmTag v-if="staticPreview || submitted" data-auth-result :hidden="!submitted" role="status">
        Sign-in preview submitted.
      </CmTag>
      <p class="layout-example__sign-in-copyright">© 2026 VueForge. <span>All rights reserved.</span></p>
    </CmStack>
  </CmAuthLayout>
</template>
