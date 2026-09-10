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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfSkeletonGate">
        <header class="input-showcase__intro">
          <h1>VfSkeletonGate — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/skeleton-gate/cases.json</code>. Every case links to the same case in the Razor showcase.
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

        <section class="input-showcase__cases" aria-label="VfSkeletonGate cases">
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
              <VfSkeletonGate v-bind="bindings(parityCase)" :ready="readyFor(parityCase)">
                <template v-if="parityCase.content?.body !== undefined" #default>
                  <template v-if="parityCase.content.body.text">{{ parityCase.content.body.text }}</template>
                  <SkeletonGateSlotMarkup v-if="parityCase.content.body.markup" :shape="parityCase.content.body.markup" />
                  <button v-if="parityCase.content.body.control" type="button">
                    {{ parityCase.content.body.control.text }}
                  </button>
                </template>
                <template v-if="parityCase.content?.skeleton !== undefined" #skeleton>
                  <template v-if="parityCase.content.skeleton.text">{{ parityCase.content.skeleton.text }}</template>
                  <SkeletonGateSlotMarkup
                    v-if="parityCase.content.skeleton.markup"
                    :shape="parityCase.content.skeleton.markup"
                  />
                </template>
              </VfSkeletonGate>

              <p v-if="parityCase.transition" class="skeleton-gate-showcase__transition">
                <button
                  type="button"
                  class="skeleton-gate-showcase__toggle"
                  :data-showcase-transition-for="parityCase.id"
                  @click="toggle(parityCase)"
                >
                  {{ readyFor(parityCase) ? 'Show the skeleton again' : 'Mark this gate ready' }}
                </button>
                <span class="skeleton-gate-showcase__hint">
                  The gate is the same element throughout: nothing is unmounted, and the consumer's content survives
                  the change.
                </span>
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
import { computed, reactive } from 'vue';
import { VfSkeletonGate, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/skeleton-gate-cases';
import showcaseIndex from '@vueforge/showcase-index';
import SkeletonGateSlotMarkup from './SkeletonGateSlotMarkup.vue';

interface GateSlot {
  text?: string;
  markup?: 'paragraphs' | 'article' | 'bars';
  control?: { text: string };
}

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown> & { ready?: boolean };
  attrs?: Record<string, unknown>;
  content?: { body?: GateSlot; skeleton?: GateSlot };
  transition?: { to: Record<string, unknown>; matches: string };
}

/**
 * The props a case binds, as the component's own prop type.
 *
 * The catalog is neutral data, so the spread is untyped at the call site; this
 * is the one place the two meet, and naming the component's prop type here is
 * what keeps a catalog value the component would reject from reaching it.
 */
function bindings(parityCase: ShowcaseCase) {
  // `ready` is deliberately stripped and re-supplied by readyFor(). A gate is
  // the first showcase component whose state a visitor can change, and binding
  // the catalog value straight onto the prop would make the toggle below do
  // nothing. Every other prop comes from the catalog untouched.
  const { ready: unusedReady, ...props } = parityCase.props ?? {};

  return {
    ...props,
    ...(parityCase.attrs ?? {}),
  } as unknown as InstanceType<typeof VfSkeletonGate>['$props'];
}

/** The state a case is currently in: the catalog's, unless a visitor changed it. */
function readyFor(parityCase: ShowcaseCase): boolean {
  return overrides[parityCase.id] ?? parityCase.props?.ready === true;
}

function toggle(parityCase: ShowcaseCase): void {
  overrides[parityCase.id] = !readyFor(parityCase);
}

/**
 * Which cases a visitor has toggled, keyed by case id.
 *
 * The catalog value is the starting state and this is the override, so a route
 * reloaded from a link shows the case the catalog describes and the toggle
 * still works afterwards.
 */
const overrides = reactive<Record<string, boolean>>({});

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
  const query = new URLSearchParams({ component: 'VfSkeletonGate', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * The gate reserves its own space through minHeight and reserveHeight, so
 * unlike the VfSkeleton route this one needs no frame around each case: a case
 * that reserves nothing and holds nothing is a zero-height box, and that is the
 * component's actual behaviour rather than something to hide behind a wrapper.
 *
 * Only the transition control below is styled here, and it is showcase chrome
 * rather than anything about the component.
 */
.skeleton-gate-showcase__transition {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-block-start: 12px;
}

.skeleton-gate-showcase__toggle {
  padding: 4px 10px;
  border: 1px solid var(--vf-color-border-default);
  border-radius: var(--vf-radius-surface);
  background: var(--vf-color-background-surface);
  color: var(--vf-color-text-primary);
  font: inherit;
  cursor: pointer;
}

.skeleton-gate-showcase__hint {
  color: var(--vf-color-text-secondary);
  font-size: 0.85em;
}
</style>
