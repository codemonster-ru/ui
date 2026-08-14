<template>
  <div class="showcase-shell">
    <header class="showcase-shell__header">
      <CmInline class="showcase-header" :wrap="false">
        <div class="showcase-brand">CodeMonster UI</div>

        <CmInline element="nav" class="showcase-navigation" aria-label="Showcase packages" :wrap="false">
          <CmLink
            v-for="section in sections"
            :key="section.value"
            class="showcase-navigation__link"
            :class="{ 'showcase-navigation__link--active': activeSection === section.value }"
            :href="buildPathForSection(section.value)"
            :aria-current="activeSection === section.value ? 'page' : undefined"
            @click="activateSection($event, section.value)"
          >
            {{ section.label }}
          </CmLink>
        </CmInline>

        <CmButton type="button" variant="secondary" :aria-label="themeActionLabel" @click="toggleTheme">
          <template #leading>
            <span aria-hidden="true">{{ theme === 'dark' ? '☾' : '☀' }}</span>
          </template>
          Theme
        </CmButton>
      </CmInline>
    </header>

    <main class="showcase-shell__content">
      <component :is="activeSectionComponent" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CmButton, CmInline, CmLink } from '@codemonster-ru/ui-vue';

import {
  bootstrapShowcaseTheme,
  buildPathForSection,
  persistShowcaseTheme,
  resolveSectionFromPath,
  type ShowcaseSection,
  type ShowcaseTheme,
} from './app-shell';

interface SectionMeta {
  value: ShowcaseSection;
  label: string;
}

const sections: SectionMeta[] = [
  { value: 'core', label: 'Components' },
  { value: 'colors', label: 'Colors' },
  { value: 'layouts', label: 'Layout' },
  { value: 'icons', label: 'Icons' },
  { value: 'codeblock', label: 'CodeBlock' },
  { value: 'playground', label: 'Playground' },
];

const sectionComponents = {
  colors: defineAsyncComponent(() => import('./sections/colors/ColorSystemShowcase.vue')),
  core: defineAsyncComponent(() => import('./sections/core/CoreShowcase.vue')),
  layouts: defineAsyncComponent(() => import('./sections/layouts/LayoutsShowcase.vue')),
  icons: defineAsyncComponent(() => import('./sections/icons/IconsShowcase.vue')),
  codeblock: defineAsyncComponent(() => import('./sections/codeblock/CodeBlockShowcase.vue')),
  playground: defineAsyncComponent(() => import('./PlaygroundShowcase.vue')),
} satisfies Record<ShowcaseSection, unknown>;

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
const theme = ref<ShowcaseTheme>(bootstrapShowcaseTheme(document.documentElement, window.localStorage, prefersDark));
const nextTheme = computed<ShowcaseTheme>(() => (theme.value === 'dark' ? 'light' : 'dark'));
const themeActionLabel = computed(() => `Switch to ${nextTheme.value} theme`);
const activeSection = ref<ShowcaseSection>(resolveSectionFromPath(window.location.pathname));
const activeSectionComponent = computed(() => sectionComponents[activeSection.value]);

function syncSectionFromLocation(): void {
  activeSection.value = resolveSectionFromPath(window.location.pathname);
}

function activateSection(event: MouseEvent, section: ShowcaseSection): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  activeSection.value = section;
}

function toggleTheme(): void {
  theme.value = nextTheme.value;
  persistShowcaseTheme(document.documentElement, window.localStorage, theme.value);
}

onMounted(() => {
  window.addEventListener('popstate', syncSectionFromLocation);

  const activePath = buildPathForSection(activeSection.value);
  if (window.location.pathname !== activePath) {
    window.history.replaceState(null, '', activePath);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncSectionFromLocation);
});

watch(activeSection, (nextSection) => {
  const nextPath = buildPathForSection(nextSection);
  if (window.location.pathname !== nextPath) {
    window.history.pushState(null, '', nextPath);
  }
});
</script>

<style scoped>
.showcase-shell {
  min-height: 100vh;
  background: var(--cm-color-background-canvas);
  color: var(--cm-color-text-primary);
}

.showcase-shell__header {
  position: sticky;
  z-index: 10;
  top: 0;
  padding: var(--cm-space-3) var(--cm-space-4);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-subtle);
  background: var(--cm-color-background-surface);
}

.showcase-header {
  gap: var(--cm-space-4);
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: var(--cm-control-height-md);
}

.showcase-brand {
  min-width: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-lg);
  font-weight: var(--cm-font-weight-semibold);
  line-height: var(--cm-line-height-tight);
  white-space: nowrap;
}

.showcase-navigation {
  flex: 1 1 auto;
  gap: var(--cm-space-1);
  min-width: 0;
}

.showcase-navigation__link {
  padding: var(--cm-space-2) var(--cm-space-3);
  border-radius: var(--cm-radius-control);
  color: var(--cm-color-text-secondary);
  font-weight: var(--cm-font-weight-medium);
  white-space: nowrap;
}

.showcase-navigation__link:hover {
  background: var(--cm-color-background-surface-hover);
  color: var(--cm-color-text-primary);
}

.showcase-navigation__link--active {
  background: var(--cm-color-background-surface-selected);
  color: var(--cm-color-text-primary);
}

.showcase-shell__content {
  min-width: 0;
}

@media (width <= 640px) {
  .showcase-header {
    flex-wrap: wrap;
  }

  .showcase-navigation {
    order: 3;
    flex-basis: 100%;
    overflow-x: auto;
    mask-image: linear-gradient(to right, #000 calc(100% - 1.5rem), transparent);
    scrollbar-width: thin;
  }

  .showcase-header > :last-child {
    margin-left: auto;
  }
}
</style>
