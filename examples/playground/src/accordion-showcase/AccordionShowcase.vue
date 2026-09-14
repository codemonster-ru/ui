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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfAccordion">
        <header class="input-showcase__intro">
          <h1>VfAccordion — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/accordion/cases.json</code>. Every case links to the same case in the Razor showcase.
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

        <section class="input-showcase__cases" aria-label="VfAccordion cases">
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
              <AccordionInstance
                v-for="(liveKey, index) in instanceKeysOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                :instance-key="liveKey"
                :content="parityCase.content ?? {}"
              />
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
// The accordion is the first route whose cases *do* something: every trigger
// on this page is the real component's, wired by the real component, and a
// controlled case is rendered the way a v-model consumer renders it, with
// update:open written back. The showcase adds no handler of its own. A
// consumer control in a slot is a real button or link, unmarked; a nested
// case renders a real second VfAccordion inside the first.
import { computed, defineComponent, h, reactive, type PropType } from 'vue';
import { VfAccordion, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/accordion-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface AccordionSlot {
  text?: string;
  markup?: 'article';
  control?: { text: string };
  accordion?: { title?: string; defaultOpen?: boolean; text?: string };
}

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: { trigger?: AccordionSlot; body?: AccordionSlot };
  group?: Record<string, unknown>[];
}

type AccordionProps = InstanceType<typeof VfAccordion>['$props'];

/** The live props of every instance on the page: a controlled case's `open` is written back here. */
const liveProps = reactive<Record<string, Record<string, unknown>>>({});

function instanceKeysOf(parityCase: ShowcaseCase): string[] {
  const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props ?? {}];

  return members.map((member, index) => {
    const key = `${parityCase.id}/${index}`;
    liveProps[key] ??= reactive({ ...member, ...(parityCase.attrs ?? {}) });

    return key;
  });
}

function slotChildren(slot: AccordionSlot, inTrigger: boolean): unknown[] {
  const nodes: unknown[] = [];

  if (slot.text) nodes.push(slot.text);
  if (slot.markup === 'article') {
    nodes.push(
      h('h4', 'Billing period'),
      h('p', 'Storage, seats and outbound transfer for the current period.'),
      h('ul', [h('li', 'Storage: 42 GB'), h('li', 'Seats: 12')]),
    );
  }
  if (slot.control) {
    nodes.push(
      inTrigger ? h('a', { href: '#' }, slot.control.text) : h('button', { type: 'button' }, slot.control.text),
    );
  }
  if (slot.accordion) {
    const { text, ...props } = slot.accordion;
    nodes.push(h(VfAccordion, props as AccordionProps, text === undefined ? {} : { default: () => text }));
  }

  return nodes;
}

/**
 * One real VfAccordion from one live prop map.
 *
 * A render function rather than a template, because a case's slots are
 * conditional on the catalog and a v-model binding is conditional on the
 * case being controlled - both easier to state exactly here than through
 * nested <template v-if>.
 */
const AccordionInstance = defineComponent({
  props: {
    instanceKey: { type: String, required: true },
    content: { type: Object as PropType<{ trigger?: AccordionSlot; body?: AccordionSlot }>, required: true },
  },
  setup(props) {
    // The live map is the consumer's own state, not a prop: a v-model write
    // lands in it, and the render below reads it back.
    const live = liveProps[props.instanceKey];

    return () => {
      const slots: Record<string, () => unknown> = {};
      if (props.content.trigger !== undefined) slots.trigger = () => slotChildren(props.content.trigger!, true);
      if (props.content.body !== undefined) slots.default = () => slotChildren(props.content.body!, false);

      return h(
        VfAccordion,
        {
          ...(live as AccordionProps),
          ...('open' in live ? { 'onUpdate:open': (open: boolean) => (live.open = open) } : {}),
        },
        slots,
      );
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
  const query = new URLSearchParams({ component: 'VfAccordion', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * No layout of its own. An accordion is a block that fills its container's
 * inline size, and two siblings stack the way two sections stack; the case
 * body is the frame the catalog geometry is measured in.
 */
</style>
