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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfField">
        <header class="input-showcase__intro">
          <h1>VfField — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/field/cases.json</code>. Every case links to the same case in the Razor showcase.
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

        <section class="input-showcase__cases" aria-label="VfField cases">
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
              <VfField
                v-bind="parityCase.fieldAttrs ?? {}"
                :label="parityCase.field?.label"
                :label-placement="parityCase.field?.placement"
                :floating-variant="parityCase.field?.variant"
                :description="parityCase.field?.description"
                :error="parityCase.field?.error"
                :invalid="parityCase.field?.invalid"
                :required="parityCase.field?.required"
              >
                <template #default="{ controlId, describedBy, invalid }">
                  <VfInput
                    v-bind="parityCase.attrs"
                    :id="controlId"
                    :aria-describedby="describedBy"
                    :invalid="invalid"
                    :model-value="parityCase.control?.modelValue"
                    :clearable="parityCase.control?.clearable"
                    :leading-icon="parityCase.control?.leadingIcon"
                  />
                </template>
              </VfField>
            </div>

            <p v-if="parityCase.interaction" class="input-showcase__case-note">
              Interactive scenario:
              {{ parityCase.interaction.steps.map((step) => step.action).join(' → ') }}. Try it directly on the field
              above: clicking the label focuses its own control.
            </p>
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
// class names - is deliberately the same as the Input and IconButton routes'.
// It is the application's page furniture rather than anything about the
// component, and giving each component its own copy is how showcases drift.
//
// The field is composed the way a consumer composes it: the default slot binds
// the control id and the described-by value the field hands it. Nothing here
// wires those by hand, which is what makes this page a real use of the
// component rather than a picture of one.
import { computed } from 'vue';
import { VfField, VfInput, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/field-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseCase {
  id: string;
  title?: string;
  field?: {
    label?: string;
    placement?: 'top' | 'floating';
    variant?: 'in' | 'on' | 'over';
    description?: string;
    error?: string;
    invalid?: boolean;
    required?: boolean;
  };
  control?: { modelValue?: string; clearable?: boolean; leadingIcon?: string };
  fieldAttrs?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  interaction?: { steps: { action: string }[] };
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
  const query = new URLSearchParams({ component: 'VfField', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>
