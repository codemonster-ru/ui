<script setup lang="ts">
import showcasePages from '../../shared/showcase-pages.json';
import ContractExamples from './ContractExamples';
import ConfirmDialogExamples from './ConfirmDialogExamples.vue';
import ColorsShowcase from './ColorsShowcase.vue';
import { renderShowcaseTypography } from '../../shared/showcase-typography.mts';
import { defineAsyncComponent, type Component } from 'vue';
import { moon, sun } from '@codemonster-ru/ui-icons';
import LayoutShowcase from './LayoutShowcase.vue';
import { CmBadge, CmGrid, CmIcon, CmIconButton, CmLink, CmSection, useCmTheme } from '@codemonster-ru/ui-vue';
import { coreShowcaseGroups, renderShowcaseNavigation } from '../../shared/showcase-navigation.mts';
import { revealShowcaseLink } from '../../shared/showcase-navigation.js';

const IconsShowcase = defineAsyncComponent(async () => (await import('./IconsShowcase.vue')) as { default: Component });
const pageId = location.pathname.split('/')[1];
const page = showcasePages.find(({ id }) => id === pageId) ?? showcasePages[0];
const currentPage = page.id;
document.title = `${page.label} · CodeMonster UI Vue`;
const Navigation = () => renderShowcaseNavigation(currentPage, location.pathname, '');
const Typography = () => renderShowcaseTypography();

const { resolvedTheme, toggleTheme } = useCmTheme();
</script>

<template>
  <CmLink class="showcase-skip" href="#showcase-main">Skip to content</CmLink>
  <header class="showcase-topbar">
    <div class="showcase-header">
      <CmLink class="showcase-brand" href="/">CodeMonster UI <CmBadge>Vue</CmBadge></CmLink>
      <div class="showcase-menu" @focusin="revealShowcaseLink"><Navigation /></div>
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
    <h1 v-if="currentPage === 'core' || currentPage === 'layouts'" class="showcase-page-heading">{{ page.label }}</h1>
    <template v-if="currentPage === 'core'">
      <template v-for="{ id, title, components } in coreShowcaseGroups" :key="id">
        <Typography v-if="id === 'actions'" />
        <CmSection :id="id" surface class="showcase-group" :aria-labelledby="`group-${id}`" tabindex="-1">
          <h2 :id="`group-${id}`" class="showcase-group-label">{{ title }}</h2>
          <CmGrid class="showcase-component-list">
            <ContractExamples v-for="slug in components" :key="slug" :slug="slug" />
            <ConfirmDialogExamples v-if="id === 'modals'" />
          </CmGrid>
        </CmSection>
      </template>
    </template>
    <ColorsShowcase v-else-if="currentPage === 'colors'" />
    <div v-else-if="currentPage === 'layouts'" class="layout-guide">
      <LayoutShowcase />
    </div>
    <IconsShowcase v-else />
  </main>
</template>
