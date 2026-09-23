<template>
  <VfThemeProvider :default-theme="initialTheme" :storage-key="themeStorageKey">
    <VfAppShell
      class="input-showcase-shell"
      layout="content"
      sticky-header
      content-appearance="plain"
      :show-subheader="false"
      :show-content-subheader="false"
    >
      <template #header>
        <VfInline class="input-showcase-header" :wrap="false">
          <div class="input-showcase-brand">VueForge</div>

          <nav class="input-showcase-platforms" aria-label="Platform">
            <span class="input-showcase-platform input-showcase-platform--active" data-showcase-platform="vue">
              Vue
            </span>
            <a
              class="input-showcase-platform"
              data-showcase-platform="razor"
              data-showcase-platform-link="razor"
              :href="razorHref()"
            >
              Razor
            </a>
          </nav>

          <VfInline class="input-showcase-header__actions" :wrap="false">
            <VfThemeSwitch variant="button" button-variant="secondary" />
          </VfInline>
        </VfInline>
      </template>

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfMenu">
        <header class="input-showcase__intro">
          <h1>VfMenu — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/menu/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            One <code>div.vf-menu</code> with <code>role="menu"</code> around whatever a consumer puts in it. It
            declares no props, owns no control and handles no key: there is no arrow-key navigation, no Escape, no
            roving tabindex, no open state and no selection here, because the reference has none — those belong to
            <code>VfDropdown</code>, which owns its own panel and is not migrated. The one decision this component
            makes is that its attrs are bound <em>last</em>, so a consumer <code>role</code> replaces
            <code>role="menu"</code>; that is the exact inverse of <code>VfMenuItem</code>, whose role cannot be
            overridden.
          </p>
        </header>

        <section
          v-if="requestedCaseId && !requestedCase"
          class="input-showcase__unknown"
          data-showcase-unknown-case="true"
          role="alert"
        >
          <h2>Unknown case</h2>
          <p>
            <code>{{ requestedCaseId }}</code> is not in the shared catalog, so there is nothing to render. This is not
            a default case: an address that does not exist has to look like one.
          </p>
        </section>

        <section class="input-showcase__cases" aria-label="VfMenu cases">
          <article
            v-for="parityCase in cases"
            :key="parityCase.id"
            class="input-showcase__case"
            :class="{ 'input-showcase__case--focused': parityCase.id === requestedCaseId }"
            :data-showcase-case="parityCase.id"
          >
            <header class="input-showcase__case-header">
              <h2 class="input-showcase__case-title">{{ parityCase.title ?? parityCase.id }}</h2>
              <code class="input-showcase__case-id">{{ parityCase.id }}</code>
              <a
                class="input-showcase__case-link"
                data-showcase-case-link="razor"
                :data-showcase-case-link-for="parityCase.id"
                :href="razorHref(parityCase.id)"
              >
                Open in Razor
              </a>
            </header>

            <div class="input-showcase__case-body">
              <VfMenu v-bind="bindings(parityCase)">
                <template v-if="parityCase.content?.children === 'text'">
                  <span class="parity-menu-text">Plain content</span>
                </template>
                <template v-else-if="parityCase.content?.children === 'spans'">
                  <span class="parity-menu-child">One</span>
                  <span class="parity-menu-child">Two</span>
                  <span class="parity-menu-child">Three</span>
                </template>
                <template v-else-if="parityCase.content?.children === 'nested'">
                  <div class="parity-menu-group"><span class="parity-menu-child">Deep</span></div>
                </template>
                <template v-else-if="parityCase.content?.children === 'button'">
                  <button type="button" class="consumer-control">Consumer action</button>
                </template>
              </VfMenu>
              <p
                v-if="parityCase.attrs?.['aria-describedby'] === 'aria-described-hint'"
                id="aria-described-hint"
                class="parity-hint"
              >
                Shown in workspace settings.
              </p>
            </div>
          </article>
        </section>

        <section class="input-showcase__catalog" aria-label="Component catalog">
          <h2>Component catalog</h2>
          <p>
            The frozen public catalog of the reference commit. A component without a Razor adapter stays listed and is
            never counted as parity-supported.
          </p>
          <ul class="input-showcase__catalog-list">
            <li
              v-for="entry in catalog"
              :key="entry.name"
              class="input-showcase__catalog-item"
              :data-showcase-catalog-component="entry.name"
              :data-showcase-razor-status="entry.platforms.razor.status"
            >
              <span class="input-showcase__catalog-name">{{ entry.name }}</span>
              <span class="input-showcase__badge input-showcase__badge--ok">Vue</span>
              <span
                class="input-showcase__badge"
                :class="
                  entry.platforms.razor.status === 'implemented'
                    ? 'input-showcase__badge--ok'
                    : 'input-showcase__badge--missing'
                "
              >
                {{ entry.platforms.razor.status === 'implemented' ? 'Razor' : 'Razor not implemented yet' }}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </VfAppShell>
  </VfThemeProvider>
</template>

<script setup lang="ts">
// The showcase chrome - shell, header, catalog list and the input-showcase__*
// class names - is deliberately the same as the earlier component routes'. It
// is the application's page furniture rather than anything about the
// component, and giving each component its own copy is how showcases drift.
//
// Props and attrs are spread onto the component together, because VfMenu
// declares no props at all and every one of them is an attr. The consumer
// content is built from the name the case declares, so this route and the
// Razor one build the same nodes from the same word.
//
// Nothing here renders a VfMenuItem. That component has its own route and its
// own catalog: VfMenu owns no control and knows nothing about it, and a
// showcase that put items in the menu would suggest a relationship the
// reference does not have.
import { computed } from 'vue';
import { VfMenu, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/menu-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: { children?: 'none' | 'text' | 'spans' | 'nested' | 'button' };
}

/** Every case value is an attr: the component declares no props. */
function bindings(parityCase: ShowcaseCase) {
  return {
    ...(parityCase.props ?? {}),
    ...(parityCase.attrs ?? {}),
  };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const parameters = new URLSearchParams(window.location.search);
const requestedCaseId = parameters.get('case');
const requestedCase = computed(() => cases.find((parityCase) => parityCase.id === requestedCaseId) ?? null);
const initialTheme = parameters.get('theme') === 'dark' ? 'dark' : 'light';

const razorOrigin = (import.meta.env.VITE_RAZOR_SHOWCASE_ORIGIN ?? '').replace(/\/$/, '');

function razorHref(caseId?: string): string {
  const query = new URLSearchParams({ component: 'VfMenu', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * No layout of its own. A menu is a flex column that takes its consumer's
 * width; a wrapper here would sit between the component and the geometry the
 * case catalog is meant to show.
 */
</style>
