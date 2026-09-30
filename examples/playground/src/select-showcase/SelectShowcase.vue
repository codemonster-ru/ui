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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfSelect">
        <header class="input-showcase__intro">
          <h1>VfSelect — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/select/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A <code>&lt;button&gt;</code> trigger and a <code>role="listbox"</code> of option buttons teleported to
            <code>&lt;body&gt;</code>, positioned by floater.js. Every select here writes its value back, as
            <code>v-model</code> does. The historical behaviour is shown as it is: ArrowDown, ArrowUp, Enter and Space
            open it on the selected option, or the first enabled one; the arrows skip disabled options and wrap; Tab
            does not close it; a pointer selection leaves focus where the click put it and a keyboard selection puts
            it on the trigger; an outside click closes it without moving focus; Escape closes the most recently opened
            one. There is no typeahead and no <code>aria-activedescendant</code>.
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

        <section class="input-showcase__cases" aria-label="VfSelect cases">
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
              <component :is="parityCase.content?.form ? 'form' : 'div'" class="select-showcase__row" @submit.prevent>
                <template v-if="parityCase.content?.popover">
                  <VfSelect v-bind="bindings(parityCase, 'beside')" />
                  <VfPopover disable-teleport aria-label="Filters">
                    <template #trigger>
                      <span>{{ parityCase.content.popover.trigger }}</span>
                    </template>
                    <VfSelect v-bind="bindings(parityCase, 'inside')" />
                  </VfPopover>
                </template>
                <VfField
                  v-else-if="parityCase.content?.field"
                  :label="parityCase.content.field.label"
                  :label-placement="parityCase.content.field.placement ?? 'top'"
                  :description="parityCase.content.field.description"
                  :error="parityCase.content.field.error"
                >
                  <template #default="{ controlId, describedBy, invalid }">
                    <VfSelect
                      v-bind="bindings(parityCase, 0)"
                      :id="controlId"
                      :aria-describedby="describedBy"
                      :invalid="invalid || Boolean(parityCase.props?.invalid)"
                    />
                  </template>
                </VfField>
                <template v-else>
                  <VfSelect
                    v-for="(member, index) in membersOf(parityCase)"
                    :key="`${parityCase.id}/${index}`"
                    v-bind="bindings(parityCase, index)"
                  >
                    <template v-if="parityCase.content?.leading" #leading>
                      <span class="parity-content">{{ parityCase.content.leading.text }}</span>
                    </template>
                    <template v-if="parityCase.content?.trailing" #trailing>
                      <span class="parity-content">{{ parityCase.content.trailing.text }}</span>
                    </template>
                  </VfSelect>
                </template>
                <button v-if="parityCase.content?.after?.control" type="button" class="parity-after-control">
                  {{ parityCase.content.after.control.text }}
                </button>
                <button v-if="parityCase.content?.form?.reset" type="reset" class="parity-reset-control">Reset</button>
              </component>
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
// does: a group is one select per member, a field case binds the select to the
// field's slot scope, a popover case puts a select beside an in-place popover
// and a second one inside it, and a form case wraps the row in a form with a
// native reset button. Every select writes its value back, as v-model does.
import { computed, reactive } from 'vue';
import {
  VfField,
  VfPopover,
  VfSelect,
  VfThemeProvider,
  VfThemeSwitch,
  type VfSelectOption,
} from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/select-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown> & { options?: VfSelectOption[]; modelValue?: string; invalid?: boolean };
  attrs?: Record<string, unknown>;
  group?: (Record<string, unknown> & { options?: VfSelectOption[]; modelValue?: string })[];
  content?: {
    field?: { label: string; placement?: 'top' | 'floating'; description?: string; error?: string };
    form?: { reset?: boolean };
    popover?: { trigger: string };
    after?: { control?: { text: string } };
    leading?: { text: string };
    trailing?: { text: string };
  };
}

const cases = caseCatalog.cases as ShowcaseCase[];
const catalog = showcaseIndex.components;
const razorPlatform = showcaseIndex.urlContract.platforms.razor;
const themeStorageKey = 'codemonster-showcase-theme';

const membersOf = (parityCase: ShowcaseCase) => parityCase.group ?? [parityCase.props ?? {}];

// Every select keeps its value here and gets it written back.
const values = reactive<Record<string, string>>({});

function bindings(parityCase: ShowcaseCase, member: number | 'beside' | 'inside') {
  const props = typeof member === 'number' ? membersOf(parityCase)[member] : (parityCase.props ?? {});
  const key = `${parityCase.id}/${member}`;
  values[key] ??= String(props.modelValue ?? '');

  return {
    ...props,
    ...(parityCase.attrs ?? {}),
    options: (props.options ?? []) as VfSelectOption[],
    modelValue: values[key],
    'onUpdate:modelValue': (value: string) => (values[key] = value),
  };
}

const parameters = new URLSearchParams(window.location.search);
const requestedCaseId = parameters.get('case');
const requestedCase = computed(() => cases.find((parityCase) => parityCase.id === requestedCaseId) ?? null);
const initialTheme = parameters.get('theme') === 'dark' ? 'dark' : 'light';

const razorOrigin = (import.meta.env.VITE_RAZOR_SHOWCASE_ORIGIN ?? '').replace(/\/$/, '');

function razorHref(caseId?: string): string {
  const query = new URLSearchParams({ component: 'VfSelect', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * Room below every case for its listbox, which is fixed-position and lies
 * outside the trigger's box; sibling selects sit in a row so an open listbox
 * does not cover the next trigger, as on the parity page.
 */
.input-showcase__case-body {
  min-height: 14rem;
}

.select-showcase__row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
</style>
