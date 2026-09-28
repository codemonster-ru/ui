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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfPopover">
        <header class="input-showcase__intro">
          <h1>VfPopover — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/popover/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A trigger wrapper and a <code>section role="dialog" tabindex="-1"</code> teleported to
            <code>&lt;body&gt;</code>, positioned by floater.js. The historical behaviour is shown as it is: Enter and
            Space toggle it and ArrowDown opens it again; every open moves focus into the panel - to the first
            <code>[autofocus]</code> or <code>[data-autofocus]</code>, or the panel itself; a click inside does nothing;
            an outside click and Escape close it and take focus back to the trigger, unless switched off. Escape is one
            stack with every VfDropdown on the page, and closing a popover unmounts a dropdown open inside it. The
            initially open cases are open on load and close on the first click elsewhere on this page, as the reference
            does.
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

        <section class="input-showcase__cases" aria-label="VfPopover cases">
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
              <VfDropdown
                v-if="parityCase.content?.beside?.dropdown"
                v-bind="dropdownBindings(parityCase.content.beside.dropdown)"
              >
                <template #trigger><span>Menu</span></template>
                <button type="button" role="menuitem" class="vf-dropdown__item">Edit</button>
                <button type="button" role="menuitem" class="vf-dropdown__item">Duplicate</button>
              </VfDropdown>
              <VfPopover
                v-for="(member, index) in membersOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                v-bind="bindings(parityCase, index)"
              >
                <template v-if="parityCase.content?.trigger" #trigger>
                  <button v-if="parityCase.content.trigger.control" type="button" class="parity-trigger-control">
                    {{ parityCase.content.trigger.control.text }}
                  </button>
                  <span v-else>{{ parityCase.content.trigger.text }}</span>
                </template>
                <p v-if="parityCase.content?.panel?.note !== undefined" class="parity-panel-note">
                  {{ parityCase.content.panel.note }}
                </p>
                <template v-for="control in parityCase.content?.panel?.controls ?? []" :key="control.text">
                  <span v-if="control.tag === 'span'" class="parity-panel-control" v-bind="autofocus(control)">
                    {{ control.text }}
                  </span>
                  <button v-else type="button" class="parity-panel-control" v-bind="autofocus(control)">
                    {{ control.text }}
                  </button>
                </template>
                <VfDropdown
                  v-if="parityCase.content?.panel?.dropdown"
                  v-bind="dropdownBindings(parityCase.content.panel.dropdown)"
                >
                  <template #trigger><span>Inner</span></template>
                  <button type="button" role="menuitem" class="vf-dropdown__item">Edit</button>
                  <button type="button" role="menuitem" class="vf-dropdown__item">Duplicate</button>
                </VfDropdown>
              </VfPopover>
              <button v-if="parityCase.content?.after?.control" type="button" class="parity-after-control">
                {{ parityCase.content.after.control.text }}
              </button>
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
// does: a real VfDropdown beside the roots when asked, one popover per group
// member, the trigger slot as a plain span or a real consumer button, and the
// panel holding the consumer's own paragraph, buttons (with either autofocus
// form) and a real VfDropdown. A controlled case writes update:open back, as
// v-model does.
import { computed, reactive } from 'vue';
import { VfDropdown, VfPopover, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/popover-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface PanelControl {
  text: string;
  autofocus?: 'attribute' | 'data';
  tag?: 'button' | 'span';
}

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  group?: Record<string, unknown>[];
  content?: {
    trigger?: { text?: string; control?: { text: string } };
    panel?: { note?: string; controls?: PanelControl[]; dropdown?: { inPlace?: boolean } };
    beside?: { dropdown?: { inPlace?: boolean } };
    after?: { control?: { text: string } };
  };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const membersOf = (parityCase: ShowcaseCase) => parityCase.group ?? [parityCase.props ?? {}];
const autofocus = (control: PanelControl): Record<string, string> =>
  control.autofocus === 'attribute' ? { autofocus: '' } : control.autofocus === 'data' ? { 'data-autofocus': '' } : {};
const dropdownBindings = (dropdown: { inPlace?: boolean }): { teleportTo?: false } =>
  dropdown.inPlace ? { teleportTo: false } : {};

// A controlled member keeps its open state here and gets it written back.
const controlled = reactive<Record<string, boolean>>({});

function bindings(parityCase: ShowcaseCase, index: number) {
  const member = membersOf(parityCase)[index];
  const key = `${parityCase.id}/${index}`;
  const props: Record<string, unknown> = { ...member, ...(parityCase.attrs ?? {}) };

  if ('open' in member) {
    controlled[key] ??= Boolean(member.open);
    props.open = controlled[key];
    props['onUpdate:open'] = (open: boolean) => (controlled[key] = open);
  }

  return props;
}

const parameters = new URLSearchParams(window.location.search);
const requestedCaseId = parameters.get('case');
const requestedCase = computed(() => cases.find((parityCase) => parityCase.id === requestedCaseId) ?? null);
const initialTheme = parameters.get('theme') === 'dark' ? 'dark' : 'light';

const razorOrigin = (import.meta.env.VITE_RAZOR_SHOWCASE_ORIGIN ?? '').replace(/\/$/, '');

function razorHref(caseId?: string): string {
  const query = new URLSearchParams({ component: 'VfPopover', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * Room below every case for its panel: the panel is fixed-position and lies
 * outside the trigger's box, and without the space the next case's header
 * would sit under it.
 */
.input-showcase__case-body {
  min-height: 14rem;
}
</style>
