<template>
  <VfThemeProvider>
    <VfAppShell
      class="showcase-shell"
      layout="sidebar-content"
      sticky-header
      sticky-sidebar
      sidebar-appearance="plain"
      content-appearance="plain"
      :content-padded="false"
      :show-subheader="false"
      :show-content-subheader="true"
    >
      <template #header>
        <VfInline class="showcase-header" :wrap="false">
          <div class="showcase-brand">
            <span class="showcase-brand__mark" aria-hidden="true">VF</span>
            <div>
              <p class="showcase-brand__kicker">VueForge</p>
              <h1 class="showcase-brand__title">Component Showcase</h1>
            </div>
          </div>

          <VfInline class="showcase-header__actions" :wrap="false">
            <VfBadge tone="primary">monorepo</VfBadge>
            <VfThemeSwitch variant="button" button-variant="secondary" />
          </VfInline>
        </VfInline>
      </template>

      <template #sidebar>
        <VfStack class="showcase-sidebar" gap="12">
          <div class="showcase-sidebar__intro">
            <strong>Packages</strong>
            <span>Shared development surface</span>
          </div>

          <VfNavMenu
            v-model="activeSection"
            :items="sectionItems"
            variant="pills"
            aria-label="Showcase packages"
          />

          <VfDivider />

          <VfStack gap="8" class="showcase-sidebar__meta">
            <span>Source-first preview</span>
            <span>Builds against workspace packages</span>
          </VfStack>
        </VfStack>
      </template>

      <template #content-subheader>
        <VfInline class="showcase-subheader" :wrap="false">
          <div>
            <p class="showcase-subheader__eyebrow">
              {{ activeSectionMeta.packageName }}
            </p>
            <h2 class="showcase-subheader__title">
              {{ activeSectionMeta.label }}
            </h2>
          </div>
          <VfBadge :tone="activeSectionMeta.tone">
            {{ activeSectionMeta.badge }}
          </VfBadge>
        </VfInline>
      </template>

      <VfContainer class="showcase-content" fluid>
        <component :is="activeSectionComponent" />
      </VfContainer>
    </VfAppShell>
  </VfThemeProvider>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  VfBadge,
  VfDivider,
  VfNavMenu,
  VfThemeProvider,
  VfThemeSwitch,
  type VfBadgeTone,
  type VfNavMenuItem,
} from "@codemonster-ru/vueforge-core";
import {
  VfAppShell,
  VfContainer,
  VfInline,
  VfStack,
} from "@codemonster-ru/vueforge-layouts";
import PlaygroundShowcase from "./PlaygroundShowcase.vue";
import CodeBlockShowcase from "./sections/codeblock/CodeBlockShowcase.vue";
import CoreShowcase from "./sections/core/CoreShowcase.vue";
import LayoutsShowcase from "./sections/layouts/LayoutsShowcase.vue";

type SectionValue = "core" | "layouts" | "codeblock" | "playground";

interface SectionMeta {
  value: SectionValue;
  label: string;
  packageName: string;
  badge: string;
  tone: VfBadgeTone;
}

const sections: SectionMeta[] = [
  {
    value: "core",
    label: "Core Components",
    packageName: "@codemonster-ru/vueforge-core",
    badge: "UI",
    tone: "primary",
  },
  {
    value: "layouts",
    label: "Layouts",
    packageName: "@codemonster-ru/vueforge-layouts",
    badge: "structure",
    tone: "info",
  },
  {
    value: "codeblock",
    label: "CodeBlock",
    packageName: "@codemonster-ru/vueforge-codeblock",
    badge: "docs",
    tone: "success",
  },
  {
    value: "playground",
    label: "Playground",
    packageName: "@codemonster-ru/vueforge-playground",
    badge: "runtime",
    tone: "help",
  },
];

const sectionItems: VfNavMenuItem[] = sections.map((section) => ({
  value: section.value,
  label: section.label,
}));

const sectionComponents = {
  core: CoreShowcase,
  layouts: LayoutsShowcase,
  codeblock: CodeBlockShowcase,
  playground: PlaygroundShowcase,
} satisfies Record<SectionValue, unknown>;

const activeSection = ref<SectionValue>("core");
const activeSectionMeta = computed(
  () =>
    sections.find((section) => section.value === activeSection.value) ??
    sections[0],
);
const activeSectionComponent = computed(
  () => sectionComponents[activeSection.value],
);
</script>

<style scoped>
.showcase-shell {
  min-height: 100vh;
  background: var(--vf-color-bg);
}

.showcase-shell :deep(.vf-header-area) {
  border-bottom: 1px solid var(--vf-color-border);
  background: color-mix(in srgb, var(--vf-color-surface) 92%, transparent);
  backdrop-filter: blur(12px);
}

.showcase-shell :deep(.vf-content-subheader-area) {
  position: sticky;
  top: var(--vf-sticky-header-offset);
  z-index: 8;
  padding: 14px 20px;
  border-bottom: 1px solid var(--vf-color-border);
  background: color-mix(in srgb, var(--vf-color-bg) 94%, transparent);
  backdrop-filter: blur(12px);
}

.showcase-shell :deep(.vf-sidebar-area__inner) {
  padding: 18px 14px;
}

.showcase-header,
.showcase-subheader {
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.showcase-header {
  min-height: 58px;
}

.showcase-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.showcase-brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  background: var(--vf-color-surface);
  color: var(--vf-color-primary);
  font-size: 12px;
  font-weight: 700;
}

.showcase-brand__kicker,
.showcase-brand__title,
.showcase-subheader__eyebrow,
.showcase-subheader__title {
  margin: 0;
}

.showcase-brand__kicker,
.showcase-subheader__eyebrow {
  color: var(--vf-color-muted);
  font-size: 12px;
  line-height: 1.35;
}

.showcase-brand__title {
  color: var(--vf-color-text);
  font-size: 16px;
  line-height: 1.25;
}

.showcase-header__actions {
  margin-left: auto;
}

.showcase-sidebar__intro {
  display: grid;
  gap: 2px;
  padding: 0 8px;
}

.showcase-sidebar__intro span,
.showcase-sidebar__meta {
  color: var(--vf-color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.showcase-subheader {
  align-items: center;
  gap: 14px;
}

.showcase-subheader__title {
  font-size: 18px;
  line-height: 1.25;
}

.showcase-content {
  min-width: 0;
}

@media (width <= 900px) {
  .showcase-shell :deep(.vf-sidebar-area__inner) {
    padding: 12px;
  }

  .showcase-sidebar__intro,
  .showcase-sidebar__meta {
    display: none;
  }
}

@media (width <= 640px) {
  .showcase-header {
    flex-wrap: wrap;
  }

  .showcase-header__actions {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }

  .showcase-subheader {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
