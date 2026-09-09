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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfDivider">
        <header class="input-showcase__intro">
          <h1>VfDivider — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/divider/cases.json</code>. Every case links to the same case in the Razor showcase.
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

        <section class="input-showcase__cases" aria-label="VfDivider cases">
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
              <div class="divider-showcase__frame">
                <span class="divider-showcase__side">before</span>
                <VfDivider v-bind="bindings(parityCase)" />
                <span class="divider-showcase__side">after</span>
              </div>
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
import { computed } from 'vue';
import { VfDivider, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/divider-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: { text?: string };
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
  } as unknown as InstanceType<typeof VfDivider>['$props'];
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
  const query = new URLSearchParams({ component: 'VfDivider', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * VfDivider has no size of its own: a vertical one takes its height from a
 * flex parent, so a showcase that dropped it into a bare block would render
 * nothing at all. This frame is the consumer layout the component asks for,
 * and it is scoped here rather than added to the shared showcase stylesheet so
 * the other component routes cannot be affected by it.
 */
.divider-showcase__frame {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-height: 48px;
  padding: 8px 0;
}

.divider-showcase__side {
  color: var(--vf-color-text-secondary);
  font-size: var(--vf-font-size-sm);
  align-self: center;
}
</style>
