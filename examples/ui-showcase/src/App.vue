<script setup lang="ts">
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
import { defineAsyncComponent, nextTick, onUnmounted, ref, type Component } from 'vue';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { mountOperations } from '../../shared/showcase-reference.js';
import { gear, moon, sun } from '@codemonster-ru/ui-icons';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmBadge, CmButton, CmIcon, CmIconButton, CmLink, useCmTheme } from '@codemonster-ru/ui-vue';
import {
  coreShowcaseGroups,
  renderCoreSectionNavigation,
  renderLayoutSectionNavigation,
  renderShowcaseNavigation,
} from '../../shared/showcase-navigation.mts';
import { revealShowcaseLink } from '../../shared/showcase-navigation.js';

const IconsShowcase = defineAsyncComponent(async () => (await import('./IconsShowcase.vue')) as { default: Component });
const ComponentReference = defineAsyncComponent(
  async () => (await import('./ComponentReference.vue')) as { default: Component },
);

const pageId = location.pathname.split('/')[1] || 'core';
const page = showcasePages.find(({ id }) => id === pageId) ?? showcasePages[0];
const currentPage = page.id;
document.title = `${page.label} · CodeMonster UI Vue`;
const navigation = renderShowcaseNavigation(currentPage, location.pathname, '');
const sectionNavigation =
  currentPage === 'core'
    ? renderCoreSectionNavigation('')
    : currentPage === 'layouts'
      ? renderLayoutSectionNavigation('')
      : '';

const coreSections = {
  overlay: CoreOverlay as Component,
  surfaces: CoreSurfaces as Component,
  feedback: CoreFeedback as Component,
  forms: CoreForms as Component,
  navigation: CoreNavigation as Component,
  modals: CoreModals as Component,
};
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
onUnmounted(() => referenceRuntime.stop());

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
  <CmLink class="showcase-skip" href="#showcase-main">Skip to content</CmLink>
  <header class="showcase-topbar">
    <div class="showcase-header">
      <CmLink class="showcase-brand" href="/">CodeMonster UI <CmBadge>Vue</CmBadge></CmLink>
      <!-- eslint-disable-next-line vue/no-v-html -- Shared navigation uses repository-owned route metadata. -->
      <div class="showcase-menu" @focusin="revealShowcaseLink" v-html="navigation" />
      <CmIconButton
        class="showcase-theme"
        :label="resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        variant="secondary"
        size="lg"
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
    <header v-if="page.title" class="showcase-intro">
      <h1>{{ page.title }}</h1>
      <!-- eslint-disable-next-line vue/no-v-html -- Shared navigation uses repository-owned route metadata. -->
      <div v-if="sectionNavigation" v-html="sectionNavigation" />
    </header>
    <template v-if="currentPage === 'core'">
      <CoreTheme :mode="themeMode" :resolved="resolvedTheme" @select="selectTheme" @toggle="toggleTheme" />
      <section id="typography" class="showcase-group" tabindex="-1">
        <header>
          <h2>Typography</h2>
        </header>
        <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
        <div v-html="typography" />
      </section>
      <template v-for="{ id, title, components } in coreShowcaseGroups.slice(1)" :key="id">
        <section :id="id" class="showcase-group" tabindex="-1">
          <header>
            <h2>{{ title }}</h2>
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
    <ColorsShowcase v-else-if="currentPage === 'colors'" />
    <div v-else-if="currentPage === 'layouts'" class="layout-guide">
      <LayoutShowcase />
    </div>
    <template v-else>
      <IconsShowcase />
      <details class="icon-showcase-extras" @toggle="openIconExamples">
        <summary>Icon component and operations examples</summary>
        <section v-if="showIconExamples" id="demo-icon" class="cm-panel showcase-panel">
          <h3>Icon</h3>
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
