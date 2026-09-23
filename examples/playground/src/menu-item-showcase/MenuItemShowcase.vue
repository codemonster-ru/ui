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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfMenuItem">
        <header class="input-showcase__intro">
          <h1>VfMenuItem — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/menu-item/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            One native control per item, carrying <code>role="menuitem"</code>: an anchor when <code>href</code> is
            truthy — so <code>href=""</code> renders the <em>button</em>, where <code>VfLink</code> keeps an empty
            href on its anchor — and a <code>button[type=button]</code> otherwise. <code>rel</code> is written exactly
            as given and is never derived, so <code>target="_blank"</code> without one writes no
            <code>rel</code> at all; that is where this component differs from <code>VfLink</code> and
            <code>VfBreadcrumbs</code>. A disabled anchor drops its href, keeps target and rel, and takes
            <code>aria-disabled</code> and <code>tabindex="-1"</code>; a disabled button takes the native attribute
            and no tabindex. <code>active</code> is a class and no accessibility state. Attrs are bound
            <em>first</em>, so a consumer <code>role</code> cannot replace <code>role="menuitem"</code> — the inverse
            of <code>VfMenu</code>. There is no router branch and no browser controller; the
            <code>select</code> emit is Vue&rsquo;s and has no server counterpart.
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

        <section class="input-showcase__cases" aria-label="VfMenuItem cases">
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
              <VfMenuItem v-bind="bindings(parityCase)" />
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
// Props and attrs are spread onto the component exactly as a consumer would
// write them. There is no slot to pass - the component has none, and its label
// is a prop - and no router to register, because unlike VfLink and
// VfBreadcrumbs this component has no second branch.
//
// Nothing here wraps the items in a VfMenu. That component has its own route
// and its own catalog: an item styles and behaves identically with no menu
// ancestor, because menu.css has no descendant selector, and wrapping them
// would suggest a relationship the reference does not have.
//
// No `@select` listener either. The emit is real and is pinned by the
// characterization suite; a showcase that logged it would be showing Vue-only
// behaviour beside a Razor page that cannot have it.
import { computed } from 'vue';
import { VfMenuItem, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/menu-item-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
}

/**
 * The props a case binds, as the component's own prop type.
 *
 * The catalog is neutral data, so the spread is untyped at the call site; this
 * is the one place the two meet, and naming the component's prop type here is
 * what keeps a catalog value the component would reject from reaching it.
 */
function bindings(parityCase: ShowcaseCase) {
  return {
    ...(parityCase.props ?? {}),
    ...(parityCase.attrs ?? {}),
  } as unknown as InstanceType<typeof VfMenuItem>['$props'];
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
  const query = new URLSearchParams({ component: 'VfMenuItem', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * No layout of its own. A menu item is a full-width flex row that takes its
 * consumer's width; a wrapper here would sit between the component and the
 * geometry the case catalog is meant to show.
 */
</style>
