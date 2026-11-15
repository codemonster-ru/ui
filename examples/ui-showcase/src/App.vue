<script setup lang="ts">
import showcaseGroups from '../../shared/showcase-groups.json';
import CoreFeedback from './CoreFeedback.vue';
import CoreForms from './CoreForms.vue';
import CoreMatrix from './CoreMatrix.vue';
import CoreModals from './CoreModals.vue';
import CoreNavigation from './CoreNavigation.vue';
import CoreOverlay from './CoreOverlay.vue';
import CoreSurfaces from './CoreSurfaces.vue';
import CoreTheme from './CoreTheme.vue';
import ContractExamples from './ContractExamples.vue';
import IconsShowcase from './IconsShowcase.vue';
import ColorsShowcase from './ColorsShowcase.vue';
import { iconIntro, renderOperations } from '../../shared/showcase-reference.mts';
import { actionMatrices, buttonMatrices } from '../../shared/showcase-matrices.mts';
import type { CmButtonProps, CmIconButtonProps, CmLinkProps } from '@codemonster-ru/ui-vue';
import typography from './core-typography.html?raw';
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, type Component } from 'vue';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { mountOperations } from '../../shared/showcase-reference.js';
import { gear, moon, sun } from '@codemonster-ru/ui-icons';
import { followShowcaseTheme, saveShowcaseTheme, readShowcaseTheme } from '../../shared/showcase-theme.js';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmButton, CmIcon, CmIconButton, CmLink } from '@codemonster-ru/ui-vue';

const CodeBlockShowcase = defineAsyncComponent(
  async () => (await import('./CodeBlockShowcase.vue')) as { default: Component },
);
const pages = [
  { id: 'core', label: 'Core' },
  { id: 'colors', label: 'Colors' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'icons', label: 'Icons' },
  { id: 'codeblock', label: 'CodeBlock' },
];
const coreDescriptions: Record<string, string> = {
  actions: 'Use buttons for actions and links for navigation to another location or resource.',
  overlay: 'Attach contextual help, menus, and compact interactive content to a trigger.',
  surfaces: 'Structure related content, data, and controls on bounded surfaces.',
  feedback: 'Communicate status, identity, progress, and loading state without interrupting the task.',
  forms: 'Collect, label, validate, and arrange user input with consistent control geometry.',
  navigation: 'Move between destinations, peer views, document sections, and progressive steps.',
  modals: 'Focus attention on modal tasks, confirmations, drawers, and keyboard-first commands.',
};
const coreSections = {
  overlay: CoreOverlay as Component,
  surfaces: CoreSurfaces as Component,
  feedback: CoreFeedback as Component,
  forms: CoreForms as Component,
  navigation: CoreNavigation as Component,
  modals: CoreModals as Component,
};
const coreGroups = showcaseGroups.filter(({ id }) => id in coreDescriptions);
const referenceContent = ref<HTMLElement | null>(null);
const referenceRuntime = new CmRuntime().register('tabs', createCmTabsController);
const showIconExamples = ref(false);
async function openIconExamples(event: Event) {
  if (!(event.currentTarget instanceof HTMLDetailsElement) || !event.currentTarget.open || showIconExamples.value)
    return;
  showIconExamples.value = true;
  await nextTick();
  if (!referenceContent.value) return;
  mountOperations(referenceContent.value);
  referenceRuntime.start(referenceContent.value);
}
onUnmounted(() => {
  referenceRuntime.stop();
});

const currentPage = pages.find(({ id }) => location.pathname.split('/')[1] === id)?.id ?? 'core';
const buttonExamples = buttonMatrices as Record<
  string,
  Record<string, (Pick<CmButtonProps, 'variant' | 'size' | 'disabled' | 'loading'> & { label: string })[]>
>;
const linkExamples = actionMatrices.link as Record<
  string,
  (Omit<CmLinkProps, 'href'> & { label: string; external?: boolean })[]
>;

const iconButtonExamples = actionMatrices['icon-button'] as Record<string, CmIconButtonProps[]>;

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const prefersDark = ref(systemDark.matches);
const defaultTheme = 'system';
const themeMode = ref(readShowcaseTheme(defaultTheme));
const resolvedTheme = computed(() =>
  themeMode.value === 'system' ? (prefersDark.value ? 'dark' : 'light') : themeMode.value,
);
function syncSystemTheme(event: MediaQueryListEvent) {
  prefersDark.value = event.matches;
}
function selectTheme(mode: typeof themeMode.value) {
  themeMode.value = mode;
  saveShowcaseTheme(mode);
}
function toggleTheme() {
  selectTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark');
}
let stopTheme: (() => void) | undefined;
onMounted(() => {
  systemDark.addEventListener('change', syncSystemTheme);
  stopTheme = followShowcaseTheme((mode) => {
    themeMode.value = mode;
  }, defaultTheme);
});
onUnmounted(() => {
  systemDark.removeEventListener('change', syncSystemTheme);
  stopTheme?.();
});
</script>

<template>
  <header class="showcase-topbar vue-showcase-topbar">
    <div class="vue-showcase-header">
      <a class="vue-showcase-brand" href="/core/">CodeMonster UI · Vue</a>
      <nav class="vue-showcase-navigation" aria-label="Showcase sections">
        <ul>
          <li v-for="page in pages" :key="page.id">
            <a :href="`/${page.id}/`" :aria-current="currentPage === page.id ? 'page' : undefined">
              {{ page.label }}
            </a>
          </li>
        </ul>
      </nav>
      <CmIconButton class="vue-showcase-theme" label="Toggle color theme" variant="secondary" @click="toggleTheme">
        <CmIcon :icon="resolvedTheme === 'dark' ? moon : sun" />
      </CmIconButton>
    </div>
  </header>
  <main
    class="showcase-content showcase-core"
    :class="{
      'showcase-layouts': currentPage === 'layouts',
    }"
  >
    <template v-if="currentPage === 'core'">
      <CoreTheme :mode="themeMode" :resolved="resolvedTheme" @select="selectTheme" @toggle="toggleTheme" />
      <section id="typography" class="showcase-group">
        <header>
          <h2>Typography</h2>
          <p>Review the heading, body, content, and prose styles shared by VueForge interfaces.</p>
        </header>
        <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
        <div v-html="typography" />
      </section>
      <template v-for="{ id, title, components } in coreGroups" :key="id">
        <section :id="id" class="showcase-group">
          <header>
            <h2>{{ title }}</h2>
            <p>{{ coreDescriptions[id] }}</p>
          </header>
          <CoreMatrix v-if="id === 'actions'" title="Actions visual QA matrix">
            <div class="core-matrix-wide core-matrix-cell">
              <section v-for="(sizes, matrixTitle) in buttonExamples" :key="matrixTitle" class="core-button-section">
                <h4>Button · {{ matrixTitle }}</h4>
                <div class="core-button-matrix">
                  <div v-for="(examples, size) in sizes" :key="size" class="showcase-matrix">
                    <p class="showcase-label">{{ size }}</p>
                    <div class="showcase-matrix-row">
                      <CmButton v-for="{ label: text, ...props } in examples" :key="text" v-bind="props">{{
                        text
                      }}</CmButton>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <section class="core-matrix-wide core-matrix-cell">
              <h4>Icon button · variants by size</h4>
              <div class="core-matrix-grid">
                <div v-for="(examples, label) in iconButtonExamples" :key="label" class="showcase-matrix">
                  <p class="showcase-label">{{ label.replace('Variants · ', '') }}</p>
                  <div class="showcase-matrix-row">
                    <CmIconButton v-for="props in examples" :key="props.label" v-bind="props"
                      ><CmIcon :icon="gear"
                    /></CmIconButton>
                  </div>
                </div>
              </div>
            </section>
            <section class="core-matrix-wide core-matrix-cell">
              <h4>Link · tone and underline states</h4>
              <div class="core-matrix-grid core-matrix-grid--two">
                <div v-for="(examples, label) in linkExamples" :key="label" class="showcase-matrix">
                  <p class="showcase-label">{{ label }}</p>
                  <div class="core-link-samples">
                    <CmLink
                      v-for="{ label: text, external, ...props } in examples"
                      :key="text"
                      :href="external ? 'https://example.com' : '#actions'"
                      :target="external ? '_blank' : undefined"
                      :rel="external ? 'noopener noreferrer' : undefined"
                      v-bind="props"
                      >{{ text }}</CmLink
                    >
                  </div>
                </div>
              </div>
            </section>
          </CoreMatrix>
          <component :is="coreSections[id as keyof typeof coreSections]" v-else />
          <details class="core-contracts">
            <summary>Contract examples</summary>
            <ContractExamples v-for="slug in components" :key="slug" :slug="slug" show-title />
          </details>
        </section>
      </template>
    </template>
    <ColorsShowcase v-else-if="currentPage === 'colors'" />
    <LayoutShowcase v-else-if="currentPage === 'layouts'" />
    <CodeBlockShowcase v-else-if="currentPage === 'codeblock'" :theme="resolvedTheme" />
    <template v-else>
      <IconsShowcase />
      <details class="icon-showcase-extras" @toggle="openIconExamples">
        <summary>Icon component and operations examples</summary>
        <section v-if="showIconExamples" id="demo-icon" class="showcase-panel">
          <h3>Icon</h3>
          <p>{{ iconIntro.description }}</p>
          <div class="showcase-matrix-row">
            <CmIcon v-for="sample in iconIntro.samples" :key="sample.label" v-bind="sample" />
          </div>
          <ContractExamples slug="icon" />
        </section>
        <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned shared operations examples. -->
        <div v-if="showIconExamples" ref="referenceContent" v-html="renderOperations()" />
      </details>
    </template>
  </main>
</template>
