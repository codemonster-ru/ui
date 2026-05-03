<template>
  <div class="demo-page">
    <VfContainer>
      <VfStack>
        <header class="demo-header">
          <div>
            <h1>Vueforge Layouts</h1>
            <p class="demo-meta">Component catalog</p>
          </div>
          <VfInline class="demo-theme-switch" :wrap="false">
            <VfThemeSwitch label="Dark mode" static thumb-contrast="inverse" />
          </VfInline>
        </header>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-Container</h2>
          </div>
          <div class="demo-container-frame">
            <VfSection surface>
              <VfContainer>
                <p class="demo-container-copy">
                  Use container as the default content boundary inside a
                  full-width section.
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
                <div
                  v-for="breakpoint in breakpointEntries"
                  :key="breakpoint.name"
                  class="demo-kv"
                >
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
          <VfSection surface>
            <VfErrorLayout
              code="404"
              title="Page not found"
              description="The page you requested does not exist or has been moved."
              :fill-viewport="false"
            >
              <template #actions>
                <VfButton variant="primary" type="button">
                  Go to home page
                </VfButton>
              </template>
            </VfErrorLayout>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vf-AppShell</h2>
          </div>

          <VfTabs v-model="activeShellLayout" :items="shellLayoutTabs">
            <template #panel>
              <section v-if="activeShellLayoutConfig" class="demo-shell-layout">
                <div class="demo-shell-layout__header">
                  <div class="demo-shell-layout__title">
                    layout: {{ activeShellLayoutConfig.name }}
                  </div>
                  <VfInline>
                    <VfSwitch v-model="plainShellAreas">Plain columns</VfSwitch>
                    <VfSwitch v-model="showShellSubheader">
                      Show subheader
                    </VfSwitch>
                    <VfSwitch v-model="showShellContentSubheader">
                      Show content subheader
                    </VfSwitch>
                    <VfSwitch v-model="stickyShellHeader">
                      Sticky header
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeShellLayoutConfig.name !== 'content'"
                      v-model="stickyShellSidebar"
                    >
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="
                        activeShellLayoutConfig.name === 'sidebar-content-aside'
                      "
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
                    <article
                      v-if="activeShellBreakpointConfig"
                      class="demo-shell-card"
                    >
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
                            'demo-shell-frame--scroll': true
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
                              plainShellAreas &&
                              !activeShellBreakpointHidesSidebar
                                ? 'plain'
                                : 'default'
                            "
                            :aside-appearance="
                              plainShellAreas ? 'plain' : 'default'
                            "
                            :content-appearance="
                              plainShellAreas ? 'plain' : 'default'
                            "
                            :class="{
                              'demo-shell-app--compact-aside':
                                activeShellLayoutConfig.name ===
                                  'sidebar-content-aside' &&
                                activeShellBreakpointHidesAside,
                              'demo-shell-app--compact-sidebar':
                                activeShellLayoutConfig.name !== 'content' &&
                                activeShellBreakpointHidesSidebar
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

                            <template
                              v-if="activeShellLayoutConfig.name !== 'content'"
                              #sidebar
                            >
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
                                'demo-shell-content-area--plain':
                                  plainShellAreas,
                                'demo-scroll-column': true
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

                            <template
                              v-if="
                                activeShellLayoutConfig.name ===
                                'sidebar-content-aside'
                              "
                              #aside
                            >
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
              <section
                v-if="activeDocumentLayoutConfig"
                class="demo-document-layouts"
              >
                <div class="demo-document-layouts__header">
                  <div class="demo-document-layouts__title">
                    layout: {{ activeDocumentLayoutConfig.name }}
                  </div>
                  <VfInline>
                    <VfSwitch v-model="plainDocumentColumns">
                      Plain columns
                    </VfSwitch>
                    <VfSwitch v-model="showDocumentSubheader">
                      Show subheader
                    </VfSwitch>
                    <VfSwitch v-model="showDocumentContentSubheader">
                      Show content subheader
                    </VfSwitch>
                    <VfSwitch v-model="documentEdgeNotches">
                      Edge notches
                    </VfSwitch>
                    <VfSwitch v-model="stickyDocumentHeader">
                      Sticky header
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeDocumentLayoutConfig.name !== 'content'"
                      v-model="stickyDocumentSidebar"
                    >
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="
                        activeDocumentLayoutConfig.name ===
                        'sidebar-content-aside'
                      "
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
                    <article
                      v-if="activeDocumentBreakpointConfig"
                      class="demo-document-card"
                    >
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
                            'demo-document-preview--compact-container':
                              activeDocumentBreakpointHidesContainerInset
                          }"
                        >
                          <VfSection
                            surface
                            class="demo-document-layout-frame"
                            :class="{
                              'demo-document-layout-frame--scroll': true
                            }"
                          >
                            <VfDocumentLayout
                              :layout="activeDocumentLayoutConfig.name"
                              :edge-notches="documentEdgeNotches"
                              :show-subheader="showDocumentSubheader"
                              :show-content-subheader="
                                showDocumentContentSubheader
                              "
                              :sticky-header="stickyDocumentHeader"
                              :sticky-sidebar="stickyDocumentSidebar"
                              :sticky-aside="stickyDocumentAside"
                              :class="{
                                'demo-document-layout': true,
                                'demo-document-layout--plain-columns':
                                  plainDocumentColumns,
                                'demo-document-layout--compact-aside':
                                  activeDocumentLayoutConfig.name ===
                                    'sidebar-content-aside' &&
                                  activeDocumentBreakpointHidesAside,
                                'demo-document-layout--compact-sidebar':
                                  activeDocumentLayoutConfig.name !==
                                    'content' &&
                                  activeDocumentBreakpointHidesSidebar
                              }"
                            >
                              <template #header>
                                <VfInline
                                  :wrap="false"
                                  class="demo-document-layout__bar"
                                >
                                  <strong>Header</strong>
                                </VfInline>
                              </template>

                              <template #subheader>
                                <VfInline
                                  :wrap="false"
                                  class="demo-document-layout__bar"
                                >
                                  <strong>Subheader</strong>
                                </VfInline>
                              </template>

                              <template #content-subheader>
                                <VfInline
                                  :wrap="false"
                                  class="demo-document-layout__bar"
                                >
                                  <strong>Content subheader</strong>
                                </VfInline>
                              </template>

                              <template
                                v-if="
                                  activeDocumentLayoutConfig.name !== 'content'
                                "
                                #sidebar
                              >
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

                              <template
                                v-if="
                                  activeDocumentLayoutConfig.name ===
                                  'sidebar-content-aside'
                                "
                                #aside
                              >
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
                                <VfInline
                                  :wrap="false"
                                  class="demo-document-layout__bar"
                                >
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
    </VfContainer>
  </div>
</template>

<script setup lang="ts">
import {
  VfBadge,
  VfButton,
  VfCard,
  VfSwitch,
  VfTabs,
  VfThemeSwitch
} from "@codemonster-ru/vueforge-core";
import { computed, ref } from "vue";
import {
  VfAppShell,
  VfContainer,
  VfDocumentLayout,
  VfErrorLayout,
  VfGrid,
  VfInline,
  VfSection,
  VfStack
} from "@codemonster-ru/vueforge-layouts";
import { useCssVarBreakpoints } from "@codemonster-ru/vueforge-layouts/composables/useCssVarBreakpoints";

const resolvedBreakpoints = useCssVarBreakpoints();

function getViewportWidth() {
  return typeof window === "undefined" ? 0 : window.innerWidth;
}

const breakpointEntries = computed(() =>
  Object.entries(resolvedBreakpoints.value).map(([name, value]) => ({
    name,
    value: `${value}px`
  }))
);

const shellLayouts = [
  {
    name: "content" as const
  },
  {
    name: "sidebar-content" as const
  },
  {
    name: "sidebar-content-aside" as const
  }
];

const shellLayoutTabs = shellLayouts.map((layout) => ({
  label: layout.name,
  value: layout.name
}));
const documentLayoutTabs = shellLayoutTabs;

const activeShellLayout = ref<(typeof shellLayouts)[number]["name"]>("content");
const plainShellAreas = ref(false);
const showShellSubheader = ref(false);
const showShellContentSubheader = ref(false);
const stickyShellHeader = ref(false);
const stickyShellSidebar = ref(false);
const stickyShellAside = ref(false);

const activeShellLayoutConfig = computed(() =>
  shellLayouts.find((layout) => layout.name === activeShellLayout.value)
);

const availableShellBreakpoints = computed(() => {
  const viewportWidth = getViewportWidth();

  return breakpointEntries.value.filter(
    (breakpoint) =>
      viewportWidth >=
      resolvedBreakpoints.value[
        breakpoint.name as keyof typeof resolvedBreakpoints.value
      ]
  );
});

const shellBreakpointTabs = computed(() =>
  availableShellBreakpoints.value.map((breakpoint) => ({
    label: breakpoint.name,
    value: breakpoint.name
  }))
);

function isBelowBreakpoint(
  breakpointValue: string | undefined,
  maxWidthExclusive: number
) {
  return Number.parseInt(breakpointValue ?? "0", 10) < maxWidthExclusive;
}

const activeShellBreakpoint = ref<string>("xs");

const activeShellBreakpointConfig = computed(
  () =>
    availableShellBreakpoints.value.find(
      (breakpoint) => breakpoint.name === activeShellBreakpoint.value
    ) ?? availableShellBreakpoints.value[0]
);

const availableDocumentBreakpoints = computed(
  () => availableShellBreakpoints.value
);
const documentBreakpointTabs = computed(() => shellBreakpointTabs.value);
const activeDocumentBreakpoint = ref<string>("xs");
const activeDocumentLayout =
  ref<(typeof shellLayouts)[number]["name"]>("content");
const plainDocumentColumns = ref(false);
const showDocumentSubheader = ref(false);
const showDocumentContentSubheader = ref(false);
const documentEdgeNotches = ref(false);
const stickyDocumentHeader = ref(false);
const stickyDocumentSidebar = ref(false);
const stickyDocumentAside = ref(false);
const activeDocumentLayoutConfig = computed(() =>
  shellLayouts.find((layout) => layout.name === activeDocumentLayout.value)
);
const activeDocumentBreakpointConfig = computed(
  () =>
    availableDocumentBreakpoints.value.find(
      (breakpoint) => breakpoint.name === activeDocumentBreakpoint.value
    ) ?? availableDocumentBreakpoints.value[0]
);

const activeShellBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(
    activeShellBreakpointConfig.value?.value,
    resolvedBreakpoints.value.lg
  )
);

const activeShellBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(
    activeShellBreakpointConfig.value?.value,
    resolvedBreakpoints.value.xl
  )
);

const activeDocumentBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(
    activeDocumentBreakpointConfig.value?.value,
    resolvedBreakpoints.value.lg
  )
);

const activeDocumentBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(
    activeDocumentBreakpointConfig.value?.value,
    resolvedBreakpoints.value.xl
  )
);

const activeDocumentBreakpointHidesContainerInset = computed(() =>
  isBelowBreakpoint(
    activeDocumentBreakpointConfig.value?.value,
    resolvedBreakpoints.value.md
  )
);

const currentBreakpoint = computed(() => {
  const viewportWidth = getViewportWidth();

  if (viewportWidth >= resolvedBreakpoints.value["2xl"]) return "2xl";
  if (viewportWidth >= resolvedBreakpoints.value.xl) return "xl";
  if (viewportWidth >= resolvedBreakpoints.value.lg) return "lg";
  if (viewportWidth >= resolvedBreakpoints.value.md) return "md";
  if (viewportWidth >= resolvedBreakpoints.value.sm) return "sm";
  if (viewportWidth >= resolvedBreakpoints.value.xs) return "xs";
  return "base";
});

const responsiveValue = computed(() => {
  if (currentBreakpoint.value === "2xl" || currentBreakpoint.value === "xl") {
    return "xl layout";
  }

  if (currentBreakpoint.value === "lg") return "lg layout";
  if (currentBreakpoint.value === "md") return "md layout";
  if (currentBreakpoint.value === "sm") return "sm layout";

  return "base layout";
});

function buildDemoItems(section: string, count: number, text: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${section}-${index + 1}`,
    title: `${section} ${index + 1}`,
    text
  }));
}

const demoSidebarItems = buildDemoItems(
  "Sidebar block",
  18,
  "Use this long fixture to validate sticky side column behavior, scrollbar appearance and stable top offsets while scrolling."
);

const demoContentItems = buildDemoItems(
  "Content paragraph",
  26,
  "This is intentionally verbose demo text for stress-testing long scroll areas under sticky header and subheader combinations."
);

const demoAsideItems = buildDemoItems(
  "Aside note",
  16,
  "Auxiliary column content is repeated to guarantee overflow and make sticky alignment regressions immediately visible."
);
</script>
