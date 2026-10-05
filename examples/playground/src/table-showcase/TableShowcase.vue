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

      <div class="input-showcase" data-showcase-platform-current="vue" data-showcase-component="VfTable">
        <header class="input-showcase__intro">
          <h1>VfTable — Vue</h1>
          <p>
            Rendered by the real <code>@codemonster-ru/vueforge-core</code> components from the shared case catalog in
            <code>contracts/table/cases.json</code>. Every case links to the same case in the Razor showcase.
          </p>
          <p>
            Two wrappers and a native <code>table</code>: <code>div.vf-table-wrap</code> carries every consumer
            attribute, <code>div.vf-table-scroll</code> owns the horizontal overflow, and the table carries only its own
            classes - the four modifiers in their fixed order. The caption comes from the prop or the caption slot;
            <code>thead</code>, <code>tbody</code> and <code>tfoot</code> each open for the presence of their slot. The
            sticky header is a class and a stylesheet rule: scroll the height-limited case.
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

        <section class="input-showcase__cases" aria-label="VfTable cases">
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
              <TableInstance
                v-for="(member, index) in membersOf(parityCase)"
                :key="`${parityCase.id}/${index}`"
                :props="member.props"
                :attrs="member.attrs"
                :content="member.content"
              />
              <p
                v-if="parityCase.attrs?.['aria-describedby'] === 'table-consumer-hint'"
                id="table-consumer-hint"
                class="parity-hint"
              >
                Seats renew monthly.
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
// The showcase chrome is the earlier component routes'. Every table on this
// page is the real VfTable; the rows are consumer content, and each slot is
// passed only when the case declares it - rows: 0 is a slot that renders
// nothing, an absent key is no slot. No showcase script of its own.
import { computed, defineComponent, h, type PropType } from 'vue';
import { VfTable, VfThemeProvider, VfThemeSwitch } from '@codemonster-ru/vueforge-core';
import { VfAppShell, VfInline } from '@codemonster-ru/vueforge-layouts';
import caseCatalog from '@vueforge/table-cases';
import showcaseIndex from '@vueforge/showcase-index';

interface TableSlot {
  text?: string;
  markup?: 'rich';
  rows?: number;
  control?: boolean;
}

type TableContent = Partial<Record<'caption' | 'header' | 'body' | 'footer', TableSlot>>;

interface ShowcaseCase {
  id: string;
  title?: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  content?: TableContent;
  group?: Record<string, unknown>[];
}

interface Member {
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
  content: TableContent;
}

type TableProps = InstanceType<typeof VfTable>['$props'];

const MEMBERS = [
  ['Ada Lovelace', 'Owner', 'Active'],
  ['Grace Hopper', 'Admin', 'Active'],
  ['Linus Pauling', 'Editor', 'Invited'],
  ['Mary Somerville', 'Viewer', 'Active'],
  ['Alan Turing', 'Editor', 'Suspended'],
  ['Rosalind Franklin', 'Viewer', 'Active'],
  ['Emmy Noether', 'Admin', 'Invited'],
  ['Carl Gauss', 'Viewer', 'Active'],
];

function membersOf(parityCase: ShowcaseCase): Member[] {
  if (!Array.isArray(parityCase.group)) {
    return [{ props: parityCase.props ?? {}, attrs: parityCase.attrs ?? {}, content: parityCase.content ?? {} }];
  }

  return parityCase.group.map((member) => {
    const { attrs = {}, content = {}, ...props } = member as Record<string, unknown>;
    return { props, attrs: attrs as Record<string, unknown>, content: content as TableContent };
  });
}

function slotChildren(name: string, slot: TableSlot): unknown[] {
  const nodes: unknown[] = [];
  if (name === 'caption') {
    if (slot.text) nodes.push(slot.text);
    if (slot.markup === 'rich') nodes.push(h('strong', 'Team'), ' members');
    return nodes;
  }
  for (let index = 0; index < (slot.rows ?? 0); index += 1) {
    if (name === 'header') nodes.push(h('tr', [h('th', 'Name'), h('th', 'Role'), h('th', 'Status')]));
    if (name === 'body')
      nodes.push(
        h(
          'tr',
          MEMBERS[index % MEMBERS.length].map((cell) => h('td', cell)),
        ),
      );
    if (name === 'footer') nodes.push(h('tr', [h('td', { colspan: 3 }, 'Seats used: 8 of 10')]));
  }
  if (name === 'body' && slot.control) {
    nodes.push(h('tr', [h('td', { colspan: 3 }, [h('button', { type: 'button' }, 'Invite member')])]));
  }
  return nodes;
}

/** One real VfTable. */
const TableInstance = defineComponent({
  props: {
    props: { type: Object as PropType<Record<string, unknown>>, required: true },
    attrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    content: { type: Object as PropType<TableContent>, required: true },
  },
  setup(props) {
    return () => {
      const slots: Record<string, () => unknown> = {};
      for (const [from, to] of [
        ['caption', 'caption'],
        ['header', 'header'],
        ['body', 'default'],
        ['footer', 'footer'],
      ] as const) {
        if (props.content[from] !== undefined) slots[to] = () => slotChildren(from, props.content[from]!);
      }

      return h(VfTable, { ...(props.props as TableProps), ...props.attrs }, slots);
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
  const query = new URLSearchParams({ component: 'VfTable', theme: initialTheme });
  if (caseId) query.set('case', caseId);

  return `${razorOrigin}${razorPlatform.path}?${query.toString()}`;
}
</script>
