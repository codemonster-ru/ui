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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfNavMenu">
        <header class="input-showcase__intro">
          <h1>VfNavMenu — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/nav-menu/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A <code>&lt;nav&gt;</code> landmark over a recursive list: a native button per branch, a native button or
            anchor per leaf. The historical behaviour is shown as it is: a branch click opens or closes it and announces
            nothing; closing a branch keeps what was open below it; in single mode opening a branch closes its siblings
            and every branch below them, but not a sibling group; a leaf click makes it current with
            <code>aria-current="page"</code> and announces it, every time; a disabled link keeps its address, leaves the
            tab order and its click is prevented. There is no arrow-key navigation. A sidebar measures itself against a
            breakpoint probe and turns compact when it is no wider. Every link is a hash link.
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

        <section class="input-showcase__cases" aria-label="VfNavMenu cases">
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

            <div class="input-showcase__case-body nav-menu-showcase__row">
              <div
                v-for="(member, index) in membersOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                class="nav-menu-showcase__box"
                :class="{ 'nav-menu-showcase__box--sized': boxOf(parityCase, index) }"
                :style="boxOf(parityCase, index)"
              >
                <VfNavMenu v-bind="bindings(parityCase, index)" />
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
// The showcase chrome is the earlier component routes', as it is on every
// route. The case body renders the shared catalog the way the parity fixture
// does: every instance in its own box, `box` pixels wide or filling the case,
// a group as one menu per member. A case with a modelValue writes its value
// back, as v-model does; every other case is uncontrolled.
import { computed, reactive } from 'vue';
import { VfNavMenu, VfThemeProvider, VfThemeSwitch, type VfNavMenuItem } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/nav-menu-cases';
import showcaseIndex from '@vueforge/showcase-index';

type NavMenuMember = Record<string, unknown> & { items?: VfNavMenuItem[]; modelValue?: string };

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: NavMenuMember;
  attrs?: Record<string, unknown>;
  group?: NavMenuMember[];
  content?: { box?: number; boxes?: number[] };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const membersOf = (parityCase: ShowcaseCase) => parityCase.group ?? [parityCase.props ?? {}];

function boxOf(parityCase: ShowcaseCase, index: number) {
  const width = parityCase.group ? parityCase.content?.boxes?.[index] : parityCase.content?.box;
  return width === undefined ? undefined : { width: `${width}px` };
}

// A controlled menu keeps its value here and gets it written back.
const values = reactive<Record<string, string>>({});

function bindings(parityCase: ShowcaseCase, index: number) {
  const props = membersOf(parityCase)[index];
  const key = `${parityCase.id}/${index}`;
  const controlled = typeof props.modelValue === 'string';
  if (controlled) values[key] ??= props.modelValue as string;

  return {
    ...props,
    ...(parityCase.attrs ?? {}),
    items: (props.items ?? []) as VfNavMenuItem[],
    ...(controlled ? { modelValue: values[key], 'onUpdate:modelValue': (value: string) => (values[key] = value) } : {}),
  };
}

const parameters = new URLSearchParams(window.location.search);
const requestedCaseId = parameters.get('case');
const requestedCase = computed(() => cases.find((parityCase) => parityCase.id === requestedCaseId) ?? null);
const initialTheme = parameters.get('theme') === 'dark' ? 'dark' : 'light';

const razorOrigin = (import.meta.env.VITE_RAZOR_SHOWCASE_ORIGIN ?? '').replace(/\/$/, '');

function razorHref(caseId?: string): string {
  const query = new URLSearchParams({ component: 'VfNavMenu', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/* Sibling menus sit in a row, each in its own measurement box, as on the parity page. */
.nav-menu-showcase__row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.nav-menu-showcase__box {
  flex: 1 1 auto;
  min-width: 0;
}

.nav-menu-showcase__box--sized {
  flex: 0 0 auto;
}
</style>
