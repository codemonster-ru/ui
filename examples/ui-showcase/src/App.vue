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
import ColorsShowcase from './ColorsShowcase.vue';
import { iconIntro, renderOperations } from '../../shared/showcase-reference.mts';
import { actionMatrices, buttonMatrices } from '../../shared/showcase-matrices.mts';
import type { CmButtonProps, CmIconButtonProps, CmLinkProps } from '@codemonster-ru/ui-vue';
import typography from '../../shared/showcase-typography.html?raw';
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, type Component } from 'vue';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { mountOperations } from '../../shared/showcase-reference.js';
import { chevronRight, gear, moon, sun } from '@codemonster-ru/ui-icons';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmButton, CmIcon, CmIconButton, CmLink, useCmTheme } from '@codemonster-ru/ui-vue';

const IconsShowcase = defineAsyncComponent(async () => (await import('./IconsShowcase.vue')) as { default: Component });
const CodeBlockShowcase = defineAsyncComponent(
  async () => (await import('./CodeBlockShowcase.vue')) as { default: Component },
);
const PlaygroundShowcase = defineAsyncComponent(
  async () => (await import('./PlaygroundShowcase.vue')) as { default: Component },
);
const pages = [
  { id: 'core', label: 'Core' },
  { id: 'colors', label: 'Colors' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'icons', label: 'Icons' },
  { id: 'codeblock', label: 'CodeBlock' },
  { id: 'playground', label: 'Playground' },
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
const navigation = ref<HTMLElement>();
const navigationEdges = ref({ start: false, end: false });
let navigationResize: ResizeObserver | undefined;

function updateNavigationEdges(): void {
  const viewport = navigation.value;
  const first = viewport?.querySelector('li:first-child');
  const last = viewport?.querySelector('li:last-child');
  if (!viewport || !first || !last) return;
  const isRtl = viewport.matches(':dir(rtl)');
  const bounds = viewport.getBoundingClientRect();
  const start = first.getBoundingClientRect();
  const end = last.getBoundingClientRect();
  navigationEdges.value = {
    start: isRtl ? start.right - bounds.right > 1 : bounds.left - start.left > 1,
    end: isRtl ? bounds.left - end.left > 1 : end.right - bounds.right > 1,
  };
}

function scrollNavigation(edge: 'start' | 'end', event: MouseEvent): void {
  const viewport = navigation.value;
  if (!viewport) return;
  const direction = (edge === 'start' ? -1 : 1) * (viewport.matches(':dir(rtl)') ? -1 : 1);
  viewport.scrollBy({ left: direction * viewport.clientWidth * 0.75 });
  updateNavigationEdges();
  if (!navigationEdges.value[edge] && event.currentTarget === document.activeElement) {
    viewport
      .querySelector<HTMLElement>(`li:${edge === 'start' ? 'first' : 'last'}-child a`)
      ?.focus({ preventScroll: true });
  }
}

onMounted(() => {
  const viewport = navigation.value;
  const list = viewport?.querySelector('ul');
  if (!viewport || !list) return;
  viewport.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  updateNavigationEdges();
  navigationResize = new ResizeObserver(updateNavigationEdges);
  navigationResize.observe(viewport);
  navigationResize.observe(list);
});
onUnmounted(() => navigationResize?.disconnect());

const buttonExamples = buttonMatrices as Record<
  string,
  Record<string, (Pick<CmButtonProps, 'variant' | 'size' | 'disabled' | 'loading'> & { label: string })[]>
>;
const linkExamples = actionMatrices.link as Record<
  string,
  (Omit<CmLinkProps, 'href'> & { label: string; external?: boolean })[]
>;

const iconButtonExamples = actionMatrices['icon-button'] as Record<string, CmIconButtonProps[]>;

const { theme: themeMode, resolvedTheme, setTheme: selectTheme, toggleTheme } = useCmTheme();
</script>

<template>
  <header class="showcase-topbar">
    <div class="showcase-header">
      <a class="showcase-brand" href="/core/">CodeMonster UI · Vue</a>
      <nav class="showcase-navigation showcase-navigation--scrollable" aria-label="Showcase sections">
        <button
          v-show="navigationEdges.start"
          class="showcase-navigation__scroll showcase-navigation__scroll--start"
          type="button"
          aria-label="Scroll to earlier sections"
          aria-controls="showcase-sections"
          @click="scrollNavigation('start', $event)"
        >
          <CmIcon :icon="chevronRight" :size="12" />
        </button>
        <div
          id="showcase-sections"
          ref="navigation"
          class="showcase-navigation__viewport"
          @scroll.passive="updateNavigationEdges"
        >
          <ul>
            <li v-for="page in pages" :key="page.id">
              <a :href="`/${page.id}/`" :aria-current="currentPage === page.id ? 'page' : undefined">
                {{ page.label }}
              </a>
            </li>
          </ul>
        </div>
        <button
          v-show="navigationEdges.end"
          class="showcase-navigation__scroll showcase-navigation__scroll--end"
          type="button"
          aria-label="Scroll to later sections"
          aria-controls="showcase-sections"
          @click="scrollNavigation('end', $event)"
        >
          <CmIcon :icon="chevronRight" :size="12" />
        </button>
      </nav>
      <CmIconButton class="showcase-theme" label="Toggle color theme" variant="secondary" @click="toggleTheme">
        <CmIcon :icon="resolvedTheme === 'dark' ? moon : sun" />
      </CmIconButton>
    </div>
  </header>
  <main
    class="showcase-content showcase-core"
    :class="{
      'showcase-layouts': currentPage === 'layouts',
      'showcase-content--layout-guide': currentPage === 'layouts',
      'showcase-content--core-guide': currentPage === 'core',
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
    <div v-else-if="currentPage === 'layouts'" class="layout-guide">
      <LayoutShowcase />
    </div>
    <CodeBlockShowcase v-else-if="currentPage === 'codeblock'" :theme="resolvedTheme" />
    <PlaygroundShowcase v-else-if="currentPage === 'playground'" :theme="resolvedTheme" />
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
