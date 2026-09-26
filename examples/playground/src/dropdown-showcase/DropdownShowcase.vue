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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfDropdown">
        <header class="input-showcase__intro">
          <h1>VfDropdown — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/dropdown/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A trigger wrapper and a <code>role="menu"</code> panel teleported to <code>&lt;body&gt;</code>, positioned
            by floater.js. The historical behaviour is shown as it is: ArrowDown, Enter and Space open it and ArrowUp
            does not; the arrow keys walk disabled items too, and a disabled button stops the walk; Tab does not close
            it; any click inside the panel closes it; an outside click closes it and takes focus back to the trigger;
            Escape closes the most recently opened one; nothing stops two from being open at once. The initially open
            cases are open on load and close on the first click elsewhere on this page, as the reference does.
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

        <section class="input-showcase__cases" aria-label="VfDropdown cases">
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
                <input
                  v-if="parityCase.content?.menu?.control"
                  class="parity-menu-control"
                  :aria-label="parityCase.content.menu.control.text"
                />
                <button
                  v-for="item in parityCase.content?.menu?.items ?? []"
                  :key="item.label"
                  type="button"
                  role="menuitem"
                  :class="['vf-dropdown__item', item.active && 'vf-dropdown__item--active']"
                >
                  {{ item.label }}
                </button>
                <VfMenu v-if="parityCase.content?.menu?.menuItems">
                  <VfMenuItem v-for="item in parityCase.content.menu.menuItems" :key="item.label" v-bind="item" />
                </VfMenu>
                <p v-if="parityCase.content?.menu?.note !== undefined" class="parity-menu-note">
                  {{ parityCase.content.menu.note }}
                </p>
              </VfDropdown>
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
// does: a group is one dropdown per member, the trigger slot is a plain span
// or a real consumer button, and the menu holds the consumer's own items -
// raw role=menuitem buttons, a real VfMenu of VfMenuItems, a consumer input or
// a paragraph. A controlled case writes update:open back, as v-model does.
import { computed, reactive } from 'vue';
import { VfDropdown, VfMenu, VfMenuItem, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/dropdown-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface DropdownMenuContent {
  control?: { text: string };
  items?: { label: string; active?: boolean }[];
  menuItems?: { label: string; disabled?: boolean; href?: string; tone?: 'default' | 'danger' }[];
  note?: string;
}

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  group?: Record<string, unknown>[];
  content?: {
    trigger?: { text?: string; control?: { text: string } };
    menu?: DropdownMenuContent;
    after?: { control?: { text: string } };
  };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const membersOf = (parityCase: ShowcaseCase) => parityCase.group ?? [parityCase.props ?? {}];

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
  const query = new URLSearchParams({ component: 'VfDropdown', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * Room below every case for its menu: the panel is fixed-position and lies
 * outside the trigger's box, and without the space the next case's header
 * would sit under it.
 */
.input-showcase__case-body {
  min-height: 12rem;
}
</style>
