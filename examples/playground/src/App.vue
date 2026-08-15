<template>
  <div class="showcase-shell">
    <header class="showcase-shell__header">
      <div class="showcase-shell__container">
        <VfInline class="showcase-header" :wrap="false">
          <div class="showcase-brand">VueForge</div>

          <nav class="showcase-navigation" aria-label="Showcase packages">
            <button
              class="showcase-navigation__scroll-control showcase-navigation__scroll-control--left"
              :class="{ 'showcase-navigation__scroll-control--hidden': !canScrollNavigationLeft }"
              type="button"
              aria-label="Scroll menu left"
              :aria-hidden="!canScrollNavigationLeft"
              :tabindex="canScrollNavigationLeft ? 0 : -1"
              :disabled="!canScrollNavigationLeft"
              @click="scrollNavigation('left')"
            >
              <VueIconify :icon="icons.chevronLeft" aria-hidden="true" size="1em" />
            </button>

            <div
              ref="navigationViewportRef"
              class="showcase-navigation__viewport"
              @scroll="updateNavigationScrollState"
            >
              <ul class="showcase-navigation__list">
                <li v-for="section in sections" :key="section.value" class="showcase-navigation__item">
                  <a
                    class="showcase-navigation__link"
                    :class="{ 'showcase-navigation__link--active': activeSection === section.value }"
                    :href="buildPathForSection(section.value)"
                    :aria-current="activeSection === section.value ? 'page' : undefined"
                    @click="activateSection($event, section.value)"
                  >
                    <span>{{ section.label }}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div
              v-if="canScrollNavigationLeft"
              class="showcase-navigation__fade showcase-navigation__fade--left"
              aria-hidden="true"
            />
            <div
              v-if="canScrollNavigationRight"
              class="showcase-navigation__fade showcase-navigation__fade--right"
              aria-hidden="true"
            />

            <button
              class="showcase-navigation__scroll-control showcase-navigation__scroll-control--right"
              :class="{ 'showcase-navigation__scroll-control--hidden': !canScrollNavigationRight }"
              type="button"
              aria-label="Scroll menu right"
              :aria-hidden="!canScrollNavigationRight"
              :tabindex="canScrollNavigationRight ? 0 : -1"
              :disabled="!canScrollNavigationRight"
              @click="scrollNavigation('right')"
            >
              <VueIconify :icon="icons.chevronRight" aria-hidden="true" size="1em" />
            </button>
          </nav>

          <VfInline class="showcase-header__actions" :wrap="false">
            <ShowcaseThemeSwitch appearance="icon-button" />
          </VfInline>
        </VfInline>
      </div>
    </header>

    <div class="showcase-shell__body">
      <div class="showcase-shell__container showcase-shell__body-container">
        <main class="showcase-shell__content">
          <div class="showcase-shell__content-body">
            <component :is="activeSectionComponent" />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CmInline as VfInline } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import ShowcaseThemeSwitch from './components/ShowcaseThemeSwitch.vue';
import {
  buildPathForSection,
  resolveSectionFromPath,
  shouldHandleShowcaseNavigation,
  type ShowcaseSection,
} from './app-shell';
import { provideShowcaseTheme } from './showcase-theme';

type SectionValue = ShowcaseSection;

interface SectionMeta {
  value: SectionValue;
  label: string;
}

provideShowcaseTheme();

const sections: SectionMeta[] = [
  {
    value: 'core',
    label: 'Core',
  },
  {
    value: 'colors',
    label: 'Colors',
  },
  {
    value: 'layouts',
    label: 'Layouts',
  },
  {
    value: 'icons',
    label: 'Icons',
  },
  {
    value: 'codeblock',
    label: 'CodeBlock',
  },
  {
    value: 'playground',
    label: 'Playground',
  },
];

const sectionComponents = {
  colors: defineAsyncComponent(() => import('./sections/colors/ColorSystemShowcase.vue')),
  core: defineAsyncComponent(() => import('./sections/core/CoreShowcase.vue')),
  layouts: defineAsyncComponent(() => import('./sections/layouts/LayoutsShowcase.vue')),
  icons: defineAsyncComponent(() => import('./sections/icons/IconsShowcase.vue')),
  codeblock: defineAsyncComponent(() => import('./sections/codeblock/CodeBlockShowcase.vue')),
  playground: defineAsyncComponent(() => import('./PlaygroundShowcase.vue')),
} satisfies Record<SectionValue, unknown>;

const activeSection = ref<SectionValue>(resolveSectionFromPath(window.location.pathname));
const activeSectionComponent = computed(() => sectionComponents[activeSection.value]);
const navigationViewportRef = ref<HTMLElement | null>(null);
const canScrollNavigationLeft = ref(false);
const canScrollNavigationRight = ref(false);
let navigationResizeObserver: ResizeObserver | null = null;

function syncSectionFromLocation() {
  activeSection.value = resolveSectionFromPath(window.location.pathname);
}

function activateSection(event: MouseEvent, section: SectionValue): void {
  if (!shouldHandleShowcaseNavigation(event)) {
    return;
  }

  event.preventDefault();
  activeSection.value = section;
}

function updateNavigationScrollState(): void {
  const viewport = navigationViewportRef.value;

  if (!viewport) {
    canScrollNavigationLeft.value = false;
    canScrollNavigationRight.value = false;
    return;
  }

  const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
  canScrollNavigationLeft.value = viewport.scrollLeft > 1;
  canScrollNavigationRight.value = maxScrollLeft - viewport.scrollLeft > 1;
}

function scrollNavigation(direction: 'left' | 'right'): void {
  const viewport = navigationViewportRef.value;

  if (!viewport) {
    return;
  }

  const delta = Math.max(120, Math.round(viewport.clientWidth * 0.6));
  viewport.scrollTo({
    left: viewport.scrollLeft + (direction === 'left' ? -delta : delta),
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

onMounted(() => {
  window.addEventListener('popstate', syncSectionFromLocation);
  window.addEventListener('resize', updateNavigationScrollState);
  requestAnimationFrame(updateNavigationScrollState);

  if (typeof ResizeObserver !== 'undefined' && navigationViewportRef.value) {
    navigationResizeObserver = new ResizeObserver(updateNavigationScrollState);
    navigationResizeObserver.observe(navigationViewportRef.value);
  }

  const activePath = buildPathForSection(activeSection.value);
  if (window.location.pathname !== activePath) {
    window.history.replaceState(null, '', activePath);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncSectionFromLocation);
  window.removeEventListener('resize', updateNavigationScrollState);
  navigationResizeObserver?.disconnect();
  navigationResizeObserver = null;
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
  display: grid;
  grid-template: 'header' auto 'body' minmax(0, 1fr) / minmax(0, 1fr);
  min-width: 20rem;
  min-height: 100vh;
  background: var(--cm-color-background-canvas);
  color: var(--cm-color-text-primary);
}

.showcase-shell__header {
  position: sticky;
  z-index: 20;
  top: 0;
  grid-area: header;
  display: flex;
  align-items: center;
  block-size: var(--cm-space-16);
  padding-block: var(--cm-space-3);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.showcase-shell__container {
  width: 100%;
  max-width: var(--cm-breakpoint-xl);
  margin-inline: auto;
  padding-inline: var(--cm-space-4);
}

.showcase-shell__body {
  grid-area: body;
  min-width: 0;
  min-height: 0;
}

.showcase-shell__body-container {
  min-height: 100%;
  padding-inline: 0;
}

.showcase-shell__content {
  display: grid;
  align-content: start;
  min-width: 0;
  min-height: 100%;
  padding: var(--cm-space-4);
  background: transparent;
}

.showcase-shell__content-body {
  min-width: 0;
  min-height: 0;
}

.showcase-header {
  gap: var(--cm-space-4);
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: var(--cm-space-8);
}

.showcase-brand {
  min-width: 0;
  color: var(--cm-color-text-primary);
  font-size: var(--cm-font-size-md);
  font-weight: var(--cm-font-weight-semibold);
  line-height: 1.45;
}

.showcase-navigation {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  margin-left: var(--cm-space-4);
  min-width: 0;
}

.showcase-navigation__list {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  width: max-content;
  min-width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.showcase-navigation__viewport {
  width: 100%;
  min-width: 0;
  overflow: auto visible;
  scrollbar-width: none;
}

.showcase-navigation__viewport::-webkit-scrollbar {
  display: none;
}

.showcase-navigation__scroll-control {
  position: absolute;
  z-index: 4;
  top: 0;
  bottom: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cm-control-height-sm);
  padding: 0;
  border: none;
  border-radius: 0;
  background: var(--cm-color-background-surface);
  color: var(--cm-color-icon-secondary);
  font-size: var(--cm-control-font-size-md);
  line-height: 0;
  cursor: pointer;
}

.showcase-navigation__scroll-control--left {
  left: 0;
}

.showcase-navigation__scroll-control--right {
  right: 0;
}

.showcase-navigation__scroll-control--hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.showcase-navigation__scroll-control:hover {
  color: var(--cm-color-icon-primary);
}

.showcase-navigation__scroll-control:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.showcase-navigation__fade {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  width: var(--cm-space-8);
  pointer-events: none;
}

.showcase-navigation__fade--left {
  left: var(--cm-control-height-sm);
  background: linear-gradient(to right, var(--cm-color-background-surface), transparent);
}

.showcase-navigation__fade--right {
  right: var(--cm-control-height-sm);
  background: linear-gradient(to left, var(--cm-color-background-surface), transparent);
}

.showcase-navigation__item {
  position: relative;
  flex: 0 0 auto;
  min-width: 0;
}

.showcase-navigation__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cm-space-2);
  width: auto;
  min-width: 0;
  min-height: var(--cm-control-height-md);
  padding: var(--cm-field-padding-block-md) var(--cm-space-2);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  background: transparent;
  color: var(--cm-color-text-secondary);
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  text-align: start;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.showcase-navigation__link--active {
  color: var(--cm-color-selected-foreground);
}

.showcase-navigation__link:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  color: var(--cm-color-selected-foreground);
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.showcase-navigation__link:hover:not(.showcase-navigation__link--active) {
  color: var(--cm-color-text-primary);
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
    mask-image: linear-gradient(to right, #000 calc(100% - 1.5rem), transparent);
    scrollbar-width: thin;
  }

  .showcase-header__actions {
    margin-left: auto;
  }
}
</style>
