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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfTabs">
        <header class="input-showcase__intro">
          <h1>VfTabs — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/tabs/cases.json</code>. Every case links to the same case in the Razor showcase.
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

        <section class="input-showcase__cases" aria-label="VfTabs cases">
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

            <div class="input-showcase__case-body" :dir="directionOf(parityCase)">
              <button v-if="parityCase.content?.before?.control" type="button" class="input-showcase__before">
                {{ parityCase.content.before.control.text }}
              </button>
              <TabsInstance
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
// The tabs are the third route whose cases do something, and the first whose
// cases own controls of several kinds: every tab, both scroll buttons and the
// panel on this page are the real component's, wired by the real component,
// and a controlled case is rendered the way a v-model consumer renders it,
// with update:modelValue written back. The showcase adds no handler of its
// own. The panel slot renders the catalog's paragraph with the active value
// and, when the case declares one, a real consumer button; the tab slot
// numbers the labels; a `before` control is a real button written before the
// root. The case body carries the case's `dir` so the RTL cases lay out as
// the catalog describes them.
import { computed, defineComponent, h, reactive, type PropType, type VNode } from 'vue';
import { VfTabs, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/tabs-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface ShowcaseContent {
  panel?: { text?: string; control?: { text: string } };
  tab?: { numbered?: boolean };
  before?: { control?: { text: string } };
}

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: ShowcaseContent;
  group?: Record<string, unknown>[];
}

type TabsProps = InstanceType<typeof VfTabs>['$props'];

/** The live props of every instance on the page: a controlled case's `modelValue` is written back here. */
const liveProps = reactive<Record<string, Record<string, unknown>>>({});

function directionOf(parityCase: ShowcaseCase): string | undefined {
  return typeof parityCase.attrs?.dir === 'string' ? parityCase.attrs.dir : undefined;
}

function instanceKeysOf(parityCase: ShowcaseCase): string[] {
  const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props ?? {}];

  return members.map((member, index) => {
    const key = `${parityCase.id}/${index}`;
    // `dir` is placed on the case body rather than on every instance, so the
    // consumer button before the tabs lays out in the same direction.
    const attrs = { ...(parityCase.attrs ?? {}) };
    delete attrs.dir;
    liveProps[key] ??= reactive({ ...member, ...attrs });

    return key;
  });
}

/**
 * One real VfTabs from one live prop map and the case's content.
 *
 * A render function rather than a template, because a v-model binding is
 * conditional on the case being controlled and the two slots are conditional
 * on the content - easier to state exactly here than through a template.
 */
const TabsInstance = defineComponent({
  props: {
    instanceKey: { type: String, required: true },
    content: { type: Object as PropType<ShowcaseContent>, required: true },
  },
  setup(props) {
    // The live map is the consumer's own state, not a prop: a v-model write
    // lands in it, and the render below reads it back.
    const live = liveProps[props.instanceKey];
    const slots: Record<string, (scope: never) => VNode | VNode[]> = {};

    if (props.content.panel !== undefined) {
      const panel = props.content.panel;
      slots.panel = ({ activeValue }: { activeValue: string }) => {
        const nodes = [h('p', `${panel.text ?? ''} ${activeValue}`)];
        if (panel.control)
          nodes.push(h('button', { type: 'button', class: 'input-showcase__panel-control' }, panel.control.text));
        return nodes;
      };
    }
    if (props.content.tab?.numbered) {
      slots.tab = ({ item, index }: { item: { label: string }; index: number }) =>
        h('span', `${index + 1}. ${item.label}`);
    }

    return () =>
      h(
        VfTabs,
        {
          ...(live as unknown as TabsProps),
          ...('modelValue' in live ? { 'onUpdate:modelValue': (value: string) => (live.modelValue = value) } : {}),
        },
        slots,
      );
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
  const query = new URLSearchParams({ component: 'VfTabs', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>

<style scoped>
/*
 * No layout of its own. A tabs is a block that fills its container's inline
 * size, and two siblings stack the way two divs stack; the case body is the
 * frame the catalog geometry is measured in - the same 360px the parity page
 * uses, so the overflow cases overflow here too. The consumer buttons are
 * plain buttons, as a consumer would write them.
 */
.input-showcase__case-body {
  max-width: 360px;
}

.input-showcase__before {
  margin-block-end: 12px;
}
</style>
