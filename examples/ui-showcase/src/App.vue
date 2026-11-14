<script setup lang="ts">
import coreSamples from '../../shared/showcase-core-recipes.html?raw';
import { mountCoreRecipes, mountCoreMatrices } from '../../shared/showcase-core-recipes.js';
import { coreComponentTitle, coreRecipesFor } from '../../shared/showcase-core-matrix.mts';
import showcaseGroups from '../../shared/showcase-groups.json';
import historicalLogo from '../../shared/vueforge-logo-icon.svg';
import { layoutSamples, renderLayoutRecipes } from '../../shared/showcase-layout-samples.mts';
import { mountLayoutRecipes } from '../../shared/showcase-layout-recipes.js';
import { copyIcon, filterIcons } from '../../shared/showcase-icon-catalog.js';
import { createRuntime } from '../../vanilla/runtime.mjs';
import ContractExamples from './ContractExamples.vue';
import themeSamples from '../../shared/showcase-theme-samples.html?raw';
import colors from '../../shared/showcase-colors.html?raw';
import { iconIntro, renderColorScales, renderIconCatalog, renderOperations } from '../../shared/showcase-reference.mts';
import { actionMatrices, buttonMatrices } from '../../shared/showcase-matrices.mts';
import type { CmButtonProps, CmIconButtonProps, CmLinkProps } from '@codemonster-ru/ui-vue';
import typography from '../../shared/showcase-typography.html?raw';
import { onMounted, onUnmounted, ref } from 'vue';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { fillContrastTable, mountOperations } from '../../shared/showcase-reference.js';
import { gear } from '@codemonster-ru/ui-icons';
import { followShowcaseTheme, saveShowcaseTheme, readShowcaseTheme } from '../../shared/showcase-theme.js';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmButton, CmIcon, CmIconButton, CmLink, CmThemeSwitch } from '@codemonster-ru/ui-vue';

const pages = [
  { id: 'core', label: 'Core' },
  { id: 'colors', label: 'Colors' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'icons', label: 'Icons' },
];
const coreContent = ref<HTMLElement | null>(null);
const matrixRuntime = createRuntime();
const coreGroups = showcaseGroups.filter(({ id }) => id !== 'layouts' && id !== 'icons');
const layoutRecipes = ref<HTMLElement | null>(null);
let unmountRecipes: (() => void) | undefined;
const referenceContent = ref<HTMLElement | null>(null);
const referenceRuntime = new CmRuntime().register('tabs', createCmTabsController);
onMounted(() => {
  if (currentPage === 'core' && coreContent.value) {
    mountCoreRecipes(coreContent.value);
    mountCoreMatrices(coreContent.value, matrixRuntime);
  }
  if (layoutRecipes.value) unmountRecipes = mountLayoutRecipes(layoutRecipes.value);
  if (!referenceContent.value) return;
  fillContrastTable(referenceContent.value);
  mountOperations(referenceContent.value);
  referenceRuntime.start(referenceContent.value);
});
onUnmounted(() => {
  unmountRecipes?.();
  referenceRuntime.stop();
  matrixRuntime.stop();
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

const themeMode = ref(readShowcaseTheme());
let stopTheme: (() => void) | undefined;
onMounted(() => {
  stopTheme = followShowcaseTheme((mode) => {
    themeMode.value = mode;
  });
});
onUnmounted(() => stopTheme?.());
</script>

<template>
  <header class="showcase-topbar">
    <span class="showcase-brand">CodeMonster UI · Vue</span>
    <nav class="showcase-navigation" aria-label="Showcase sections">
      <a
        v-for="page in pages"
        :key="page.id"
        class="cm-link"
        :href="`/${page.id}/`"
        :aria-current="currentPage === page.id ? 'page' : undefined"
        >{{ page.label }}</a
      >
    </nav>
    <CmThemeSwitch v-model="themeMode" @theme-change="saveShowcaseTheme" name="showcase-theme" />
  </header>
  <main ref="coreContent" class="showcase-content" :class="{ 'showcase-core': currentPage === 'core' }">
    <template v-if="currentPage === 'core'">
      <template v-for="{ id, title, description, components } in coreGroups" :key="id">
        <section v-if="id === 'actions'" id="typography" class="showcase-group">
          <header>
            <h2>Typography</h2>
            <p>Review heading and body styles.</p>
          </header>
          <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
          <div v-html="typography" />
        </section>
        <section :id="id" class="showcase-group">
          <header>
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
          </header>
          <div class="showcase-grid">
            <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
            <div class="showcase-grid-fragment" v-html="coreRecipesFor(coreSamples, id)" />
            <section
              v-for="slug in components"
              :id="'demo-' + slug"
              :key="slug"
              class="core-component showcase-panel"
              :class="{ 'showcase-panel--wide': ['button', 'table', 'data-table'].includes(slug) }"
            >
              <h3>{{ coreComponentTitle(slug) }}</h3>
              <CmThemeSwitch v-if="slug === 'theme-switch'" v-model="themeMode" @theme-change="saveShowcaseTheme" />
              <template v-else-if="slug === 'button'">
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
              </template>
              <template v-else-if="slug === 'icon-button'">
                <div v-for="(examples, label) in iconButtonExamples" :key="label" class="showcase-matrix">
                  <p class="showcase-label">{{ label }}</p>
                  <div class="showcase-matrix-row">
                    <CmIconButton v-for="props in examples" :key="props.label" v-bind="props"
                      ><CmIcon :icon="gear"
                    /></CmIconButton>
                  </div>
                </div>
              </template>
              <template v-else-if="slug === 'link'">
                <div v-for="(examples, label) in linkExamples" :key="label" class="showcase-matrix">
                  <p class="showcase-label">{{ label }}</p>
                  <div class="showcase-matrix-row">
                    <CmLink
                      v-for="{ label: text, external, ...props } in examples"
                      :key="text"
                      :href="external ? 'https://example.com' : '#demo-link'"
                      :target="external ? '_blank' : undefined"
                      :rel="external ? 'noopener noreferrer' : undefined"
                      v-bind="props"
                      >{{ text }}</CmLink
                    >
                  </div>
                </div>
              </template>
              <ContractExamples :slug="slug" />
            </section>
            <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned showcase markup. -->
            <div v-if="id === 'theme'" class="showcase-grid-fragment" v-html="themeSamples" />
          </div>
        </section>
      </template>
    </template>
    <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
    <div v-else-if="currentPage === 'colors'" ref="referenceContent" v-html="colors + renderColorScales()" />
    <section v-else-if="currentPage === 'layouts'" id="layouts" class="showcase-group">
      <header>
        <h2>Layouts</h2>
        <p>Review layout primitives and full-page shells.</p>
      </header>
      <div class="showcase-grid">
        <section
          v-for="(sample, slug) in layoutSamples"
          :id="'demo-' + slug"
          :key="slug"
          class="ui-showcase__demo showcase-panel showcase-panel--wide"
        >
          <h3>{{ slug.charAt(0).toUpperCase() + slug.slice(1) }}</h3>
          <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
          <div v-html="sample" />
          <ContractExamples :slug="slug" />
        </section>
        <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
        <div
          ref="layoutRecipes"
          class="layout-recipes"
          v-html="renderLayoutRecipes().replace('/vueforge-logo-icon.svg', historicalLogo)"
        />
        <LayoutShowcase />
      </div>
    </section>
    <section v-else id="icons" class="showcase-group">
      <header>
        <h2>Icons</h2>
        <p>Review icon geometry and accessible labels.</p>
      </header>
      <div class="showcase-grid">
        <section id="demo-icon" class="showcase-panel">
          <h3 class="showcase-icon-intro-heading">Icon</h3>
          <p class="showcase-icon-intro-note">{{ iconIntro.description }}</p>
          <div class="showcase-matrix-row">
            <CmIcon v-for="sample in iconIntro.samples" :key="sample.label" v-bind="sample" />
          </div>
          <ContractExamples slug="icon" />
        </section>
      </div>
      <div
        ref="referenceContent"
        @input="filterIcons"
        @click="copyIcon"
        v-html="renderIconCatalog() + renderOperations()"
      />
    </section>
  </main>
</template>
