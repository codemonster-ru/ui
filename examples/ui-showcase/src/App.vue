<script setup lang="ts">
import showcaseGroups from '../../shared/showcase-groups.json';
import showcasePages from '../../shared/showcase-pages.json';
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
import { gear, moon, sun } from '@codemonster-ru/ui-icons';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmButton, CmIcon, CmIconButton, CmLink, useCmTheme } from '@codemonster-ru/ui-vue';
import { renderShowcaseNavigation, showcaseActions } from '../../shared/showcase-navigation.mts';
import { mountShowcaseNavigation } from '../../shared/showcase-navigation.js';

const IconsShowcase = defineAsyncComponent(async () => (await import('./IconsShowcase.vue')) as { default: Component });
const CodeBlockShowcase = defineAsyncComponent(
  async () => (await import('./CodeBlockShowcase.vue')) as { default: Component },
);
const PlaygroundShowcase = defineAsyncComponent(
  async () => (await import('./PlaygroundShowcase.vue')) as { default: Component },
);
const ComponentReference = defineAsyncComponent(
  async () => (await import('./ComponentReference.vue')) as { default: Component },
);
const ApplicationExamples = defineAsyncComponent(
  async () => (await import('./ApplicationExamples.vue')) as { default: Component },
);
const DocumentationShowcase = defineAsyncComponent(
  async () => (await import('./DocumentationShowcase.vue')) as { default: Component },
);

const page = showcasePages.find(({ id }) => location.pathname.split('/')[1] === id) ?? showcasePages[0];
const currentPage = page.id;
document.title = `${page.label} · CodeMonster UI Vue`;
const header = ref<HTMLElement>();
const navigation = renderShowcaseNavigation(currentPage, location.pathname, '', true);
let unmountNavigation: (() => void) | undefined;
onMounted(() => {
  if (header.value) unmountNavigation = mountShowcaseNavigation(header.value, '/');
});

const coreSections = {
  overlay: CoreOverlay as Component,
  surfaces: CoreSurfaces as Component,
  feedback: CoreFeedback as Component,
  forms: CoreForms as Component,
  navigation: CoreNavigation as Component,
  modals: CoreModals as Component,
};
const coreGroups = showcaseGroups.filter(({ id }) => id !== 'layouts' && id !== 'icons');
const coreLinks = [...coreGroups.slice(0, 1), { id: 'typography', title: 'Typography' }, ...coreGroups.slice(1)];
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
  unmountNavigation?.();
});

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
  <a class="showcase-skip" href="#showcase-main">Skip to content</a>
  <header ref="header" class="showcase-topbar">
    <div class="showcase-header">
      <a class="showcase-brand" href="/core/">CodeMonster UI <span>Vue</span></a>
      <!-- eslint-disable-next-line vue/no-v-html -- Shared navigation uses repository-owned route metadata. -->
      <div class="showcase-menu" v-html="navigation" />
      <!-- eslint-disable-next-line vue/no-v-html -- Shared navigation controls are static markup. -->
      <div class="showcase-header__actions" v-html="showcaseActions" />
      <CmIconButton
        class="showcase-theme"
        :label="resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        variant="secondary"
        @click="toggleTheme"
      >
        <CmIcon :icon="resolvedTheme === 'dark' ? moon : sun" />
      </CmIconButton>
    </div>
  </header>
  <main
    id="showcase-main"
    class="showcase-content showcase-core"
    :class="{ 'showcase-layouts': currentPage === 'layouts' }"
    tabindex="-1"
  >
    <header v-if="page.title" class="showcase-intro" :class="{ 'showcase-intro--core': currentPage === 'core' }">
      <p class="showcase-intro__eyebrow">{{ page.label }}</p>
      <h1>{{ page.title }}</h1>
      <p>{{ page.description }}</p>
      <div v-if="currentPage === 'core'" class="showcase-intro__actions">
        <a class="showcase-intro__primary" href="/docs/getting-started/">Get started</a>
        <CmLink href="/components/">Browse components</CmLink>
      </div>
    </header>
    <template v-if="currentPage === 'core'">
      <nav class="showcase-jump" aria-label="On this page">
        <p>On this page</p>
        <ul>
          <li v-for="item in coreLinks" :key="item.id">
            <a :href="`#${item.id}`">{{ item.title }}</a>
          </li>
        </ul>
      </nav>
      <CoreTheme :mode="themeMode" :resolved="resolvedTheme" @select="selectTheme" @toggle="toggleTheme" />
      <section id="typography" class="showcase-group">
        <header>
          <h2>Typography</h2>
          <p>Review the heading, body, content, and prose styles shared by CodeMonster UI interfaces.</p>
        </header>
        <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
        <div v-html="typography" />
      </section>
      <template v-for="{ id, title, description, components } in coreGroups.slice(1)" :key="id">
        <section :id="id" class="showcase-group">
          <header>
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
          </header>
          <CoreMatrix v-if="id === 'actions'" title="Button and link variants">
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
    <ComponentReference v-else-if="currentPage === 'components'" />
    <DocumentationShowcase v-else-if="currentPage === 'docs'" />
    <ApplicationExamples v-else-if="currentPage === 'examples'" />
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
