<template>
  <VfThemeProvider>
    <VfAppShell
      class="showcase-shell"
      layout="content"
      sticky-header
      content-appearance="plain"
      :show-subheader="false"
      :show-content-subheader="false"
    >
      <template #header>
        <VfInline class="showcase-header" :wrap="false">
          <div class="showcase-brand">
            VueForge
          </div>

          <VfMenuBar
            v-model="activeSection"
            class="showcase-navigation"
            :items="sectionItems"
            variant="default"
            aria-label="Showcase packages"
          />

          <VfInline class="showcase-header__actions" :wrap="false">
            <VfThemeSwitch variant="button" button-variant="secondary" />
          </VfInline>
        </VfInline>
      </template>

      <component :is="activeSectionComponent" />
    </VfAppShell>
  </VfThemeProvider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  VfMenuBar,
  VfThemeProvider,
  VfThemeSwitch,
  type VfNavMenuItem,
} from "@codemonster-ru/vueforge-core";
import {
  VfAppShell,
  VfInline,
} from "@codemonster-ru/vueforge-layouts";

type SectionValue = "core" | "layouts" | "icons" | "codeblock" | "playground";

interface SectionMeta {
  value: SectionValue;
  label: string;
}

const sections: SectionMeta[] = [
  {
    value: "core",
    label: "Core",
  },
  {
    value: "layouts",
    label: "Layouts",
  },
  {
    value: "icons",
    label: "Icons",
  },
  {
    value: "codeblock",
    label: "CodeBlock",
  },
  {
    value: "playground",
    label: "Playground",
  },
];

const sectionItems: VfNavMenuItem[] = sections.map((section) => ({
  value: section.value,
  label: section.label,
}));

const sectionComponents = {
  core: defineAsyncComponent(() => import("./sections/core/CoreShowcase.vue")),
  layouts: defineAsyncComponent(() => import("./sections/layouts/LayoutsShowcase.vue")),
  icons: defineAsyncComponent(() => import("./sections/icons/IconsShowcase.vue")),
  codeblock: defineAsyncComponent(() => import("./sections/codeblock/CodeBlockShowcase.vue")),
  playground: defineAsyncComponent(() => import("./PlaygroundShowcase.vue")),
} satisfies Record<SectionValue, unknown>;

const validSections = new Set<SectionValue>(sections.map((section) => section.value));

function resolveSectionFromPath(pathname: string): SectionValue {
  const normalizedPath = pathname.replace(/\/+$/, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : undefined;

  if (lastSegment && validSections.has(lastSegment as SectionValue)) {
    return lastSegment as SectionValue;
  }

  return "core";
}

function buildPathForSection(section: SectionValue): string {
  return `/${section}`;
}

const activeSection = ref<SectionValue>(
  resolveSectionFromPath(window.location.pathname),
);
const activeSectionComponent = computed(
  () => sectionComponents[activeSection.value],
);

function syncSectionFromLocation() {
  activeSection.value = resolveSectionFromPath(window.location.pathname);
}

onMounted(() => {
  window.addEventListener("popstate", syncSectionFromLocation);

  if (window.location.pathname === "/" || window.location.pathname === "") {
    window.history.replaceState(null, "", buildPathForSection(activeSection.value));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", syncSectionFromLocation);
});

watch(activeSection, (nextSection) => {
  const nextPath = buildPathForSection(nextSection);
  if (window.location.pathname !== nextPath) {
    window.history.pushState(null, "", nextPath);
  }
});
</script>

<style scoped>
.showcase-shell {
  min-height: 100vh;
  background: var(--vf-color-bg);
}

.showcase-header {
  gap: var(--vf-layout-space-layout-base);
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: 2rem;
}

.showcase-brand {
  min-width: 0;
  color: var(--vf-color-text);
  font-size: var(--vf-heading-h-6-font-size);
  font-weight: var(--vf-heading-font-weight);
  line-height: var(--vf-heading-h-6-line-height);
}

.showcase-navigation {
  flex: 1 1 auto;
  margin-left: var(--vf-layout-space-layout-base);
  min-width: 0;
}

.showcase-header__actions {
  flex: 0 0 auto;
}

@media (width <= 640px) {
  .showcase-header {
    flex-wrap: wrap;
  }

  .showcase-navigation {
    order: 3;
    flex-basis: 100%;
    margin-left: 0;
    overflow-x: auto;
  }

  .showcase-header__actions {
    margin-left: auto;
  }
}
</style>
