<template>
  <div class="demo-page">
    <div class="demo-container">
      <VfStack>
        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Container</h2>
          </div>
          <div class="demo-container-frame">
            <VfSection surface>
              <VfContainer>
                <p class="demo-container-copy">
                  Use container as the default content boundary inside a full-width section.
                </p>
              </VfContainer>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Stack</h2>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfStack>
                <VfSection surface>Vertical composition</VfSection>
                <VfSection surface>Item</VfSection>
                <VfSection surface>Item</VfSection>
              </VfStack>
            </VfSection>
            <VfSection surface>
              <VfStack as="article">
                <VfSection surface>Article block</VfSection>
                <VfSection surface>Body section</VfSection>
                <VfSection surface>Related notes</VfSection>
              </VfStack>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Inline</h2>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfInline>
                <VfBadge>Default</VfBadge>
                <VfBadge>Wrapped</VfBadge>
                <VfBadge>Inline</VfBadge>
                <VfBadge>Row</VfBadge>
              </VfInline>
            </VfSection>
            <VfSection surface>
              <VfInline :wrap="false">
                <VfBadge>No wrap</VfBadge>
                <VfBadge>Actions</VfBadge>
                <VfBadge>Actions</VfBadge>
              </VfInline>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Section</h2>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection>
              <strong>surface: false</strong>
            </VfSection>
            <VfSection surface>
              <strong>surface: true</strong>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Grid</h2>
          </div>
          <VfStack>
            <VfSection surface>
              <VfGrid>
                <VfCard>Responsive card grid</VfCard>
                <VfCard>Item</VfCard>
                <VfCard>Item</VfCard>
                <VfCard>Item</VfCard>
              </VfGrid>
            </VfSection>
            <VfSection surface>
              <VfGrid>
                <VfCard>Use grid for summaries</VfCard>
                <VfCard>Examples</VfCard>
                <VfCard>Listings</VfCard>
              </VfGrid>
            </VfSection>
          </VfStack>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Foundation</h2>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfStack>
                <strong>Breakpoint values</strong>
                <div v-for="breakpoint in breakpointEntries" :key="breakpoint.name" class="demo-kv">
                  <span>{{ breakpoint.name }}</span>
                  <strong>{{ breakpoint.value }}</strong>
                </div>
              </VfStack>
            </VfSection>
            <VfSection surface>
              <VfStack>
                <strong>Runtime state</strong>
                <div class="demo-kv">
                  <span>current</span>
                  <strong>{{ currentBreakpoint }}</strong>
                </div>
                <strong>Responsive value</strong>
                <VfCard>{{ responsiveValue }}</VfCard>
              </VfStack>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-ErrorLayout</h2>
          </div>
          <VfTabs v-if="availableErrorBreakpoints.length" v-model="activeErrorBreakpoint" :items="errorBreakpointTabs">
            <template #panel>
              <article v-if="activeErrorBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeErrorBreakpointConfig.name }} ·
                  {{ activeErrorBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeErrorBreakpointConfig.name}`"
                  :style="{ maxWidth: activeErrorBreakpointConfig.value }"
                >
                  <VfSection surface class="demo-shell-frame">
                    <VfErrorLayout
                      code="404"
                      title="Page not found"
                      description="The page you requested does not exist or has been moved."
                      :fill-viewport="false"
                    >
                      <template #actions>
                        <VfButton variant="primary" type="button"> Go to home page </VfButton>
                      </template>
                    </VfErrorLayout>
                  </VfSection>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-AuthLayout</h2>
          </div>
          <VfTabs v-if="availableAuthBreakpoints.length" v-model="activeAuthBreakpoint" :items="authBreakpointTabs">
            <template #panel>
              <article v-if="activeAuthBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeAuthBreakpointConfig.name }} ·
                  {{ activeAuthBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeAuthBreakpointConfig.name}`"
                  :style="{ maxWidth: activeAuthBreakpointConfig.value }"
                >
                  <VfSection
                    surface
                    class="demo-auth-frame"
                    :class="activeAuthBreakpointConfig.name === 'min' && 'demo-auth-frame--min-preview'"
                  >
                    <VfAuthLayout
                      :class="activeAuthBreakpointConfig.name === 'min' && 'demo-auth-layout--min-preview'"
                      title="Sign in"
                      :fill-viewport="false"
                    >
                      <template #brand>
                        <img class="demo-auth-brand" :src="vueForgeLogoIcon" alt="VueForge" />
                      </template>

                      <template #description>
                        Don't have an account?
                        <VfLink href="/" underline="none"> Click here to sign up </VfLink>
                      </template>

                      <form class="demo-auth-form">
                        <VfInput placeholder="Email" type="email" />
                        <VfInput placeholder="Password" type="password" password-reveal />
                        <div class="demo-auth-options">
                          <VfCheckbox class="demo-auth-remember"> Remember me </VfCheckbox>
                          <VfLink class="demo-auth-forgot" href="/" underline="none"> Forgot password? </VfLink>
                        </div>
                        <VfButton variant="primary" type="submit"> Sign in </VfButton>
                        <p class="demo-auth-copyright">
                          <span>© 2026 VueForge.</span>
                          <span class="demo-auth-copyright__rights"> All rights reserved. </span>
                        </p>
                      </form>
                    </VfAuthLayout>
                  </VfSection>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-SetupLayout</h2>
          </div>
          <VfTabs v-if="availableSetupBreakpoints.length" v-model="activeSetupBreakpoint" :items="setupBreakpointTabs">
            <template #panel>
              <article v-if="activeSetupBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeSetupBreakpointConfig.name }} ·
                  {{ activeSetupBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeSetupBreakpointConfig.name}`"
                  :style="{ maxWidth: activeSetupBreakpointConfig.value }"
                >
                  <VfSection surface class="demo-shell-frame">
                    <VfSetupLayout
                      :title="activeSetupStepConfig.label"
                      description="Configure the CMS environment before the first administrator account is created."
                      :fill-viewport="false"
                      aside-position="left"
                      @next="goToNextSetupStep"
                      @back="goToPreviousSetupStep"
                    >
                      <template #brand>
                        <div class="demo-setup-brand-stack">
                          <div class="demo-setup-brand">
                            <img class="demo-setup-brand__mark" :src="annabelLogoIcon" alt="" aria-hidden="true" />
                            <span class="demo-setup-brand__name">Annabel CMS</span>
                          </div>
                          <div
                            v-if="activeSetupBreakpointHidesAside"
                            class="demo-setup-progress"
                            :aria-label="`Step ${activeSetupStepNumber} of ${setupSteps.length}`"
                          >
                            <span>Step {{ activeSetupStepNumber }} of {{ setupSteps.length }}</span>
                            <VfProgressBar
                              :value="activeSetupStepNumber"
                              :max="setupSteps.length"
                              label="Setup progress"
                              height="0.25rem"
                            />
                          </div>
                        </div>
                      </template>

                      <template v-if="!activeSetupBreakpointHidesAside" #aside>
                        <VfStepper
                          :items="setupSteps"
                          :model-value="activeSetupStep"
                          orientation="vertical"
                          aria-label="Installation steps"
                        />
                      </template>

                      <VfStack :id="setupFormId" as="form" class="demo-setup-form" @submit.prevent="goToNextSetupStep">
                        <div class="demo-setup-fields demo-setup-fields--split">
                          <VfField label="Host" description="Hostname, socket, or private address.">
                            <template #default="{ controlId, describedBy, invalid }">
                              <VfInput
                                :id="controlId"
                                :aria-describedby="describedBy"
                                :invalid="invalid"
                                placeholder="127.0.0.1"
                                value="127.0.0.1"
                              />
                            </template>
                          </VfField>

                          <VfField label="Port">
                            <template #default="{ controlId, describedBy, invalid }">
                              <VfInput
                                :id="controlId"
                                :aria-describedby="describedBy"
                                :invalid="invalid"
                                placeholder="3306"
                                value="3306"
                              />
                            </template>
                          </VfField>
                        </div>

                        <VfField label="Database name">
                          <template #default="{ controlId, describedBy, invalid }">
                            <VfInput
                              :id="controlId"
                              :aria-describedby="describedBy"
                              :invalid="invalid"
                              placeholder="annabel"
                              value="annabel"
                            />
                          </template>
                        </VfField>

                        <div class="demo-setup-fields demo-setup-fields--even">
                          <VfField label="Database user">
                            <template #default="{ controlId, describedBy, invalid }">
                              <VfInput
                                :id="controlId"
                                :aria-describedby="describedBy"
                                :invalid="invalid"
                                placeholder="annabel_user"
                                value="annabel_user"
                              />
                            </template>
                          </VfField>

                          <VfField label="Database password">
                            <template #default="{ controlId, describedBy, invalid }">
                              <VfInput
                                :id="controlId"
                                :aria-describedby="describedBy"
                                :invalid="invalid"
                                placeholder="Password"
                                type="password"
                                password-reveal
                              />
                            </template>
                          </VfField>
                        </div>
                      </VfStack>

                      <template #actions>
                        <VfButton
                          class="demo-setup-action-back"
                          variant="secondary"
                          type="button"
                          :disabled="isFirstSetupStep"
                          @click="goToPreviousSetupStep"
                        >
                          Back
                        </VfButton>
                        <VfButton variant="primary" type="submit" :form="setupFormId">
                          {{ isLastSetupStep ? 'Finish' : 'Continue' }}
                        </VfButton>
                      </template>
                    </VfSetupLayout>
                  </VfSection>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-AppShell</h2>
          </div>

          <VfTabs v-model="activeShellLayout" :items="shellLayoutTabs">
            <template #panel>
              <section v-if="activeShellLayoutConfig" class="demo-shell-layout">
                <div class="demo-shell-layout__header">
                  <div class="demo-shell-layout__title">layout: {{ activeShellLayoutConfig.name }}</div>
                  <VfInline>
                    <VfSwitch v-model="plainShellAreas">Plain columns</VfSwitch>
                    <VfSwitch v-model="showShellSubheader"> Show subheader </VfSwitch>
                    <VfSwitch v-model="showShellContentSubheader"> Show content subheader </VfSwitch>
                    <VfSwitch v-model="stickyShellHeader"> Sticky header </VfSwitch>
                    <VfSwitch v-if="activeShellLayoutConfig.name !== 'content'" v-model="stickyShellSidebar">
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeShellLayoutConfig.name === 'sidebar-content-aside'"
                      v-model="stickyShellAside"
                    >
                      Sticky aside
                    </VfSwitch>
                  </VfInline>
                </div>
                <VfTabs
                  v-if="availableShellBreakpoints.length"
                  v-model="activeShellBreakpoint"
                  :items="shellBreakpointTabs"
                >
                  <template #panel>
                    <article v-if="activeShellBreakpointConfig" class="demo-shell-card">
                      <div class="demo-shell-card__title">
                        {{ activeShellBreakpointConfig.name }} ·
                        {{ activeShellBreakpointConfig.value }}
                      </div>
                      <div
                        ref="activeShellPreview"
                        class="demo-shell-preview"
                        :class="`demo-shell-preview--${activeShellBreakpointConfig.name}`"
                      >
                        <VfSection
                          surface
                          class="demo-shell-frame"
                          :class="{
                            'demo-shell-frame--scroll': true,
                          }"
                        >
                          <VfAppShell
                            :layout="activeShellLayoutConfig.name"
                            :show-subheader="showShellSubheader"
                            :show-content-subheader="showShellContentSubheader"
                            :sticky-header="stickyShellHeader"
                            :sticky-sidebar="stickyShellSidebar"
                            :sticky-aside="stickyShellAside"
                            :sidebar-appearance="
                              plainShellAreas && !activeShellBreakpointHidesSidebar ? 'plain' : 'default'
                            "
                            :aside-appearance="plainShellAreas ? 'plain' : 'default'"
                            :content-appearance="plainShellAreas ? 'plain' : 'default'"
                            :class="{
                              'demo-shell-app--compact-aside':
                                activeShellLayoutConfig.name === 'sidebar-content-aside' &&
                                activeShellBreakpointHidesAside,
                              'demo-shell-app--compact-sidebar':
                                activeShellLayoutConfig.name !== 'content' && activeShellBreakpointHidesSidebar,
                            }"
                          >
                            <template #header>
                              <div class="demo-shell-header">
                                <div class="demo-shell-header__start">
                                  <div class="demo-shell-heading">
                                    <strong>Header</strong>
                                  </div>
                                </div>
                              </div>
                            </template>

                            <template #subheader>
                              <div class="demo-shell-header">
                                <div class="demo-shell-header__start">
                                  <div class="demo-shell-heading">
                                    <strong>Subheader</strong>
                                  </div>
                                </div>
                              </div>
                            </template>

                            <template v-if="activeShellLayoutConfig.name !== 'content'" #sidebar>
                              <VfStack class="demo-scroll-column">
                                <strong>Sidebar</strong>
                                <p
                                  v-for="item in demoSidebarItems"
                                  :key="`shell-sidebar-${item.id}`"
                                  class="demo-scroll-copy"
                                >
                                  {{ item.title }}. {{ item.text }}
                                </p>
                              </VfStack>
                            </template>

                            <template #content-subheader>
                              <div class="demo-shell-header">
                                <div class="demo-shell-header__start">
                                  <div class="demo-shell-heading">
                                    <strong>Content subheader</strong>
                                  </div>
                                </div>
                              </div>
                            </template>

                            <VfStack
                              :class="{
                                'demo-shell-content-area': true,
                                'demo-shell-content-area--plain': plainShellAreas,
                                'demo-scroll-column': true,
                              }"
                            >
                              <strong>Content</strong>
                              <p
                                v-for="item in demoContentItems"
                                :key="`shell-content-${item.id}`"
                                class="demo-scroll-copy"
                              >
                                {{ item.title }}. {{ item.text }}
                              </p>
                            </VfStack>

                            <template v-if="activeShellLayoutConfig.name === 'sidebar-content-aside'" #aside>
                              <VfStack class="demo-scroll-column">
                                <strong>Aside</strong>
                                <p
                                  v-for="item in demoAsideItems"
                                  :key="`shell-aside-${item.id}`"
                                  class="demo-scroll-copy"
                                >
                                  {{ item.title }}. {{ item.text }}
                                </p>
                              </VfStack>
                            </template>

                            <template #footer>
                              <strong>Footer</strong>
                            </template>
                          </VfAppShell>
                        </VfSection>
                      </div>
                    </article>
                  </template>
                </VfTabs>
              </section>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-DocumentLayout</h2>
          </div>
          <VfTabs v-model="activeDocumentLayout" :items="documentLayoutTabs">
            <template #panel>
              <section v-if="activeDocumentLayoutConfig" class="demo-document-layouts">
                <div class="demo-document-layouts__header">
                  <div class="demo-document-layouts__title">layout: {{ activeDocumentLayoutConfig.name }}</div>
                  <VfInline>
                    <VfSwitch v-model="plainDocumentColumns"> Plain columns </VfSwitch>
                    <VfSwitch v-model="showDocumentSubheader"> Show subheader </VfSwitch>
                    <VfSwitch v-model="showDocumentContentSubheader"> Show content subheader </VfSwitch>
                    <VfSwitch v-model="documentEdgeNotches"> Edge notches </VfSwitch>
                    <VfSwitch v-model="stickyDocumentHeader"> Sticky header </VfSwitch>
                    <VfSwitch v-if="activeDocumentLayoutConfig.name !== 'content'" v-model="stickyDocumentSidebar">
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeDocumentLayoutConfig.name === 'sidebar-content-aside'"
                      v-model="stickyDocumentAside"
                    >
                      Sticky aside
                    </VfSwitch>
                  </VfInline>
                </div>
                <VfTabs
                  v-if="availableDocumentBreakpoints.length"
                  v-model="activeDocumentBreakpoint"
                  :items="documentBreakpointTabs"
                >
                  <template #panel>
                    <article v-if="activeDocumentBreakpointConfig" class="demo-document-card">
                      <div class="demo-document-card__title">
                        {{ activeDocumentBreakpointConfig.name }} ·
                        {{ activeDocumentBreakpointConfig.value }}
                      </div>
                      <div
                        class="demo-document-preview"
                        :class="`demo-shell-preview--${activeDocumentBreakpointConfig.name}`"
                      >
                        <div
                          :class="{
                            'demo-document-preview--compact-container': activeDocumentBreakpointHidesContainerInset,
                          }"
                        >
                          <VfSection
                            surface
                            class="demo-document-layout-frame"
                            :class="{
                              'demo-document-layout-frame--scroll': true,
                            }"
                          >
                            <VfDocumentLayout
                              :layout="activeDocumentLayoutConfig.name"
                              :edge-notches="documentEdgeNotches"
                              :show-subheader="showDocumentSubheader"
                              :show-content-subheader="showDocumentContentSubheader"
                              :sticky-header="stickyDocumentHeader"
                              :sticky-sidebar="stickyDocumentSidebar"
                              :sticky-aside="stickyDocumentAside"
                              :class="{
                                'demo-document-layout': true,
                                'demo-document-layout--plain-columns': plainDocumentColumns,
                                'demo-document-layout--compact-aside':
                                  activeDocumentLayoutConfig.name === 'sidebar-content-aside' &&
                                  activeDocumentBreakpointHidesAside,
                                'demo-document-layout--compact-sidebar':
                                  activeDocumentLayoutConfig.name !== 'content' && activeDocumentBreakpointHidesSidebar,
                              }"
                            >
                              <template #header>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Header</strong>
                                </VfInline>
                              </template>

                              <template #subheader>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Subheader</strong>
                                </VfInline>
                              </template>

                              <template #content-subheader>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Content subheader</strong>
                                </VfInline>
                              </template>

                              <template v-if="activeDocumentLayoutConfig.name !== 'content'" #sidebar>
                                <VfStack class="demo-scroll-column">
                                  <strong>Sidebar</strong>
                                  <p
                                    v-for="item in demoSidebarItems"
                                    :key="`document-sidebar-${item.id}`"
                                    class="demo-scroll-copy"
                                  >
                                    {{ item.title }}. {{ item.text }}
                                  </p>
                                </VfStack>
                              </template>

                              <VfStack class="demo-scroll-column">
                                <strong>Content</strong>
                                <p
                                  v-for="item in demoContentItems"
                                  :key="`document-content-${item.id}`"
                                  class="demo-scroll-copy"
                                >
                                  {{ item.title }}. {{ item.text }}
                                </p>
                              </VfStack>

                              <template v-if="activeDocumentLayoutConfig.name === 'sidebar-content-aside'" #aside>
                                <VfStack class="demo-scroll-column">
                                  <strong>Aside</strong>
                                  <p
                                    v-for="item in demoAsideItems"
                                    :key="`document-aside-${item.id}`"
                                    class="demo-scroll-copy"
                                  >
                                    {{ item.title }}. {{ item.text }}
                                  </p>
                                </VfStack>
                              </template>

                              <template #footer>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Footer</strong>
                                </VfInline>
                              </template>
                            </VfDocumentLayout>
                          </VfSection>
                        </div>
                      </div>
                    </article>
                  </template>
                </VfTabs>
              </section>
            </template>
          </VfTabs>
        </section>
      </VfStack>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  VfBadge,
  VfButton,
  VfCard,
  VfCheckbox,
  VfField,
  VfInput,
  VfLink,
  VfProgressBar,
  VfStepper,
  VfSwitch,
  VfTabs,
} from '@codemonster-ru/vueforge-core';
import { computed, ref } from 'vue';
import {
  VfAppShell,
  VfAuthLayout,
  VfContainer,
  VfDocumentLayout,
  VfErrorLayout,
  VfGrid,
  VfInline,
  VfSection,
  VfSetupLayout,
  VfStack,
} from '@codemonster-ru/vueforge-layouts';
import { useCssVarBreakpoints } from '@codemonster-ru/vueforge-layouts';
import annabelLogoIcon from '../../assets/annabel-logo-icon.svg';
import vueForgeLogoIcon from '../../assets/vueforge-logo-icon.svg';

const resolvedBreakpoints = useCssVarBreakpoints();

function getViewportWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth;
}

const breakpointEntries = computed(() =>
  Object.entries(resolvedBreakpoints.value).map(([name, value]) => ({
    name,
    value: `${value}px`,
  })),
);

const shellLayouts = [
  {
    name: 'content' as const,
  },
  {
    name: 'sidebar-content' as const,
  },
  {
    name: 'sidebar-content-aside' as const,
  },
];

const shellLayoutTabs = shellLayouts.map((layout) => ({
  label: layout.name,
  value: layout.name,
}));
const documentLayoutTabs = shellLayoutTabs;

const activeShellLayout = ref<(typeof shellLayouts)[number]['name']>('content');
const plainShellAreas = ref(false);
const showShellSubheader = ref(false);
const showShellContentSubheader = ref(false);
const stickyShellHeader = ref(false);
const stickyShellSidebar = ref(false);
const stickyShellAside = ref(false);

const activeShellLayoutConfig = computed(() => shellLayouts.find((layout) => layout.name === activeShellLayout.value));

const availableShellBreakpoints = computed(() => {
  const viewportWidth = getViewportWidth();

  return breakpointEntries.value.filter(
    (breakpoint) =>
      viewportWidth >= resolvedBreakpoints.value[breakpoint.name as keyof typeof resolvedBreakpoints.value],
  );
});

const shellBreakpointTabs = computed(() =>
  availableShellBreakpoints.value.map((breakpoint) => ({
    label: breakpoint.name,
    value: breakpoint.name,
  })),
);
const authPreviewSizes = [
  {
    name: 'min',
    value: '320px',
  },
];
const setupSteps = [
  {
    value: 'license',
    label: 'License',
    description: 'Accept terms',
  },
  {
    value: 'database',
    label: 'Database',
    description: 'Connect storage',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Create account',
  },
  {
    value: 'finish',
    label: 'Finish',
    description: 'Review setup',
  },
];
const setupFormId = 'demo-setup-form';
const activeSetupStep = ref('database');
const activeSetupStepIndex = computed(() =>
  Math.max(
    setupSteps.findIndex((step) => step.value === activeSetupStep.value),
    0,
  ),
);
const activeSetupStepNumber = computed(() => activeSetupStepIndex.value + 1);
const activeSetupStepConfig = computed(() => setupSteps[activeSetupStepIndex.value] ?? setupSteps[0]);
const isFirstSetupStep = computed(() => activeSetupStepIndex.value === 0);
const isLastSetupStep = computed(() => activeSetupStepIndex.value === setupSteps.length - 1);
const availableAuthBreakpoints = computed(() => [...authPreviewSizes, ...availableShellBreakpoints.value]);
const authBreakpointTabs = computed(() =>
  availableAuthBreakpoints.value.map((breakpoint) => ({
    label: breakpoint.name,
    value: breakpoint.name,
  })),
);
const availableSetupBreakpoints = computed(() => availableAuthBreakpoints.value);
const setupBreakpointTabs = computed(() => authBreakpointTabs.value);
const availableErrorBreakpoints = computed(() => availableAuthBreakpoints.value);
const errorBreakpointTabs = computed(() => authBreakpointTabs.value);

function isBelowBreakpoint(breakpointValue: string | undefined, maxWidthExclusive: number) {
  return Number.parseInt(breakpointValue ?? '0', 10) < maxWidthExclusive;
}

function getPreferredBreakpointName(breakpoints: Array<{ name: string; value: string }>, preferredName = 'xl') {
  return (
    breakpoints.find((breakpoint) => breakpoint.name === preferredName)?.name ??
    breakpoints[breakpoints.length - 1]?.name ??
    ''
  );
}

function setSetupStep(index: number) {
  const nextStep = setupSteps[Math.min(Math.max(index, 0), setupSteps.length - 1)];

  if (nextStep) {
    activeSetupStep.value = nextStep.value;
  }
}

function goToNextSetupStep() {
  setSetupStep(activeSetupStepIndex.value + 1);
}

function goToPreviousSetupStep() {
  setSetupStep(activeSetupStepIndex.value - 1);
}

const activeAuthBreakpoint = ref<string>(getPreferredBreakpointName(availableAuthBreakpoints.value));
const activeErrorBreakpoint = ref<string>(getPreferredBreakpointName(availableErrorBreakpoints.value));
const activeSetupBreakpoint = ref<string>(getPreferredBreakpointName(availableSetupBreakpoints.value));
const activeShellBreakpoint = ref<string>(getPreferredBreakpointName(availableShellBreakpoints.value));

const activeAuthBreakpointConfig = computed(
  () =>
    availableAuthBreakpoints.value.find((breakpoint) => breakpoint.name === activeAuthBreakpoint.value) ??
    availableAuthBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableAuthBreakpoints.value),
    ) ??
    availableAuthBreakpoints.value[0],
);

const activeErrorBreakpointConfig = computed(
  () =>
    availableErrorBreakpoints.value.find((breakpoint) => breakpoint.name === activeErrorBreakpoint.value) ??
    availableErrorBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableErrorBreakpoints.value),
    ) ??
    availableErrorBreakpoints.value[0],
);

const activeSetupBreakpointConfig = computed(
  () =>
    availableSetupBreakpoints.value.find((breakpoint) => breakpoint.name === activeSetupBreakpoint.value) ??
    availableSetupBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableSetupBreakpoints.value),
    ) ??
    availableSetupBreakpoints.value[0],
);

const activeSetupBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeSetupBreakpointConfig.value?.value, resolvedBreakpoints.value.md),
);

const activeShellBreakpointConfig = computed(
  () =>
    availableShellBreakpoints.value.find((breakpoint) => breakpoint.name === activeShellBreakpoint.value) ??
    availableShellBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableShellBreakpoints.value),
    ) ??
    availableShellBreakpoints.value[0],
);

const availableDocumentBreakpoints = computed(() => availableShellBreakpoints.value);
const documentBreakpointTabs = computed(() => shellBreakpointTabs.value);
const activeDocumentBreakpoint = ref<string>(getPreferredBreakpointName(availableDocumentBreakpoints.value));
const activeDocumentLayout = ref<(typeof shellLayouts)[number]['name']>('content');
const plainDocumentColumns = ref(false);
const showDocumentSubheader = ref(false);
const showDocumentContentSubheader = ref(false);
const documentEdgeNotches = ref(false);
const stickyDocumentHeader = ref(false);
const stickyDocumentSidebar = ref(false);
const stickyDocumentAside = ref(false);
const activeDocumentLayoutConfig = computed(() =>
  shellLayouts.find((layout) => layout.name === activeDocumentLayout.value),
);
const activeDocumentBreakpointConfig = computed(
  () =>
    availableDocumentBreakpoints.value.find((breakpoint) => breakpoint.name === activeDocumentBreakpoint.value) ??
    availableDocumentBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableDocumentBreakpoints.value),
    ) ??
    availableDocumentBreakpoints.value[0],
);

const activeShellBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(activeShellBreakpointConfig.value?.value, resolvedBreakpoints.value.lg),
);

const activeShellBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeShellBreakpointConfig.value?.value, resolvedBreakpoints.value.xl),
);

const activeDocumentBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.lg),
);

const activeDocumentBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.xl),
);

const activeDocumentBreakpointHidesContainerInset = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.md),
);

const currentBreakpoint = computed(() => {
  const viewportWidth = getViewportWidth();

  if (viewportWidth >= resolvedBreakpoints.value['2xl']) return '2xl';
  if (viewportWidth >= resolvedBreakpoints.value.xl) return 'xl';
  if (viewportWidth >= resolvedBreakpoints.value.lg) return 'lg';
  if (viewportWidth >= resolvedBreakpoints.value.md) return 'md';
  if (viewportWidth >= resolvedBreakpoints.value.sm) return 'sm';
  if (viewportWidth >= resolvedBreakpoints.value.xs) return 'xs';
  return 'base';
});

const responsiveValue = computed(() => {
  if (currentBreakpoint.value === '2xl' || currentBreakpoint.value === 'xl') {
    return 'xl layout';
  }

  if (currentBreakpoint.value === 'lg') return 'lg layout';
  if (currentBreakpoint.value === 'md') return 'md layout';
  if (currentBreakpoint.value === 'sm') return 'sm layout';

  return 'base layout';
});

function buildDemoItems(section: string, count: number, text: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${section}-${index + 1}`,
    title: `${section} ${index + 1}`,
    text,
  }));
}

const demoSidebarItems = buildDemoItems(
  'Sidebar block',
  18,
  'Use this long fixture to validate sticky side column behavior, scrollbar appearance and stable top offsets while scrolling.',
);

const demoContentItems = buildDemoItems(
  'Content paragraph',
  26,
  'This is intentionally verbose demo text for stress-testing long scroll areas under sticky header and subheader combinations.',
);

const demoAsideItems = buildDemoItems(
  'Aside note',
  16,
  'Auxiliary column content is repeated to guarantee overflow and make sticky alignment regressions immediately visible.',
);
</script>
