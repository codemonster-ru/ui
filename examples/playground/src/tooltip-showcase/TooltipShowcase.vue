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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfTooltip">
        <header class="input-showcase__intro">
          <h1>VfTooltip — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/tooltip/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A trigger wrapper and a <code>span role="tooltip"</code> teleported to <code>&lt;body&gt;</code>, positioned
            by floater.js. The historical behaviour is shown as it is: hovering the wrapper or focusing a control inside
            it starts one timer of <code>openDelay</code> (80 ms unless set) and the tooltip opens when it fires;
            leaving or losing focus closes it at once - the last event wins, so the pointer leaving closes a focused
            tooltip and focus leaving closes a hovered one. The trigger wrapper is described by the tooltip only while
            it is open, even when there is nothing to render. No key is handled, and Escape belongs to the popover
            beside it.
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

        <section class="input-showcase__cases" aria-label="VfTooltip cases">
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
              <VfPopover v-if="parityCase.content?.popover">
                <template #trigger><span>Host</span></template>
                <VfTooltip v-if="parityCase.content.popover === 'inside'" v-bind="insideBindings(parityCase)">
                  <button type="button" class="parity-trigger-control">Inside</button>
                </VfTooltip>
                <p v-else class="parity-panel-note">Host body</p>
              </VfPopover>
              <VfTooltip
                v-for="(member, index) in membersOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                v-bind="{ ...member, ...(parityCase.attrs ?? {}) }"
              >
                <template v-if="parityCase.content?.trigger?.controls">
                  <button
                    v-for="text in parityCase.content.trigger.controls"
                    :key="text"
                    type="button"
                    class="parity-trigger-control"
                  >
                    {{ text }}
                  </button>
                </template>
                <template v-else>{{ parityCase.content?.trigger?.text }}</template>
                <template v-if="parityCase.content?.body === 'rich'" #content><strong>Rich</strong> body</template>
                <template v-else-if="parityCase.content?.body === 'empty'" #content></template>
              </VfTooltip>
              <button v-if="parityCase.content?.after" type="button" class="parity-after-control">After</button>
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
// The showcase chrome is the earlier component routes', as it is on every
// route. The case body renders the shared catalog the way the parity fixture
// does: a real VfPopover before the roots when asked - holding a note, or a
// tooltip of its own - one tooltip per group member, the trigger slot as real
// consumer buttons or plain text, and the content slot as rich markup or a
// slot that renders nothing. Selector targets exist before the application
// mounts; see main.ts.
import { computed } from 'vue';
import { VfPopover, VfThemeProvider, VfThemeSwitch, VfTooltip } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/tooltip-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  group?: Record<string, unknown>[];
  content?: {
    trigger?: { controls?: string[]; text?: string };
    body?: 'rich' | 'empty';
    after?: boolean;
    popover?: 'beside' | 'inside';
    popoverDelay?: number;
    layout?: string;
  };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const membersOf = (parityCase: ShowcaseCase) => parityCase.group ?? [parityCase.props ?? {}];
const insideBindings = (parityCase: ShowcaseCase): Record<string, unknown> => ({
  text: 'Inside hint',
  ...(parityCase.content?.popoverDelay !== undefined ? { openDelay: parityCase.content.popoverDelay } : {}),
});

const parameters = new URLSearchParams(window.location.search);
const requestedCaseId = parameters.get('case');
const requestedCase = computed(() => cases.find((parityCase) => parityCase.id === requestedCaseId) ?? null);
const initialTheme = parameters.get('theme') === 'dark' ? 'dark' : 'light';

const razorOrigin = (import.meta.env.VITE_RAZOR_SHOWCASE_ORIGIN ?? '').replace(/\/$/, '');

function razorHref(caseId?: string): string {
  const query = new URLSearchParams({ component: 'VfTooltip', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * Room above and beside every trigger for its tooltip: the tooltip is
 * fixed-position and lies outside the trigger's box, and a centred tooltip on a
 * trigger at the left edge would flip or shift.
 */
.input-showcase__case-body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 4.5rem 0 0 7.5rem;
}
</style>
