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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfFieldset">
        <header class="input-showcase__intro">
          <h1>VfFieldset — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/fieldset/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            A native <code>fieldset</code> with an optional <code>legend</code>, the consumer controls in
            <code>.vf-fieldset__control</code>, then the description and the error the fieldset names through its own
            <code>aria-describedby</code>. <code>disabled</code>, <code>form</code> and <code>name</code> stay native
            attributes, so a disabled fieldset disables every nested control. The default slot is scoped with
            <code>describedBy</code> and <code>invalid</code>; the consumer inputs here bind them, which the Razor page
            cannot - a Razor slot has no scope.
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

        <section class="input-showcase__cases" aria-label="VfFieldset cases">
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
              <FieldsetInstance
                v-for="(member, index) in membersOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                :case-id="parityCase.id"
                :props="member"
                :attrs="parityCase.attrs ?? {}"
                :content="parityCase.content ?? {}"
              />
              <p
                v-if="String(parityCase.attrs?.['aria-describedby'] ?? '').startsWith('fieldset-consumer-hint')"
                :id="String(parityCase.attrs?.['aria-describedby'])"
                class="parity-hint"
              >
                Shown on the invoice.
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
// The showcase chrome is the earlier component routes'. Every fieldset on
// this page is the real VfFieldset; the consumer controls are real inputs and
// buttons, and they bind the scoped describedBy and invalid the way a Vue
// consumer would. No showcase script of its own.
import { computed, defineComponent, h, type PropType } from 'vue';
import { VfFieldset, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/fieldset-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface FieldsetSlot {
  text?: string;
  markup?: 'rich';
  controls?: 'input-and-button' | 'radios';
}

type FieldsetContent = Partial<Record<'label' | 'description' | 'error' | 'body', FieldsetSlot>>;

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: FieldsetContent;
  group?: Record<string, unknown>[];
}

type FieldsetProps = InstanceType<typeof VfFieldset>['$props'];

function membersOf(parityCase: ShowcaseCase): Record<string, unknown>[] {
  return Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props ?? {}];
}

function slotChildren(
  slot: FieldsetSlot,
  caseId: string,
  scope?: { describedBy?: string; invalid: boolean },
): unknown[] {
  const nodes: unknown[] = [];
  const key = caseId.replace(/\//g, '-');

  if (slot.text) nodes.push(slot.text);
  if (slot.markup === 'rich') nodes.push(h('strong', 'Rich'), ' ', h('em', 'content'));
  const bound = { 'aria-describedby': scope?.describedBy, 'aria-invalid': scope?.invalid ? 'true' : undefined };
  if (slot.controls === 'input-and-button') {
    nodes.push(
      h('label', { for: `${key}-email` }, 'Email'),
      h('input', { id: `${key}-email`, type: 'email', name: 'email', ...bound }),
      h('button', { type: 'button' }, 'Verify'),
    );
  }
  if (slot.controls === 'radios') {
    for (const option of ['standard', 'express']) {
      nodes.push(
        h('label', [h('input', { type: 'radio', name: `${key}-delivery`, value: option, ...bound }), ` ${option}`]),
      );
    }
  }

  return nodes;
}

/** One real VfFieldset; only the slots the case declares are passed, because presence is the contract. */
const FieldsetInstance = defineComponent({
  props: {
    caseId: { type: String, required: true },
    props: { type: Object as PropType<Record<string, unknown>>, required: true },
    attrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    content: { type: Object as PropType<FieldsetContent>, required: true },
  },
  setup(props) {
    return () => {
      const slots: Record<string, (scope?: { describedBy?: string; invalid: boolean }) => unknown> = {};
      for (const name of ['label', 'description', 'error'] as const) {
        if (props.content[name] !== undefined) slots[name] = () => slotChildren(props.content[name]!, props.caseId);
      }
      if (props.content.body !== undefined) {
        slots.default = (scope) => slotChildren(props.content.body!, props.caseId, scope);
      }

      return h(VfFieldset, { ...(props.props as FieldsetProps), ...props.attrs }, slots);
    };
  },
});

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
  const query = new URLSearchParams({ component: 'VfFieldset', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>
