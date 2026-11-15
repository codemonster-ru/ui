<script setup lang="ts">
import {
  CmAccordion,
  CmBreadcrumbs,
  CmButton,
  CmMenuBar,
  CmNavMenu,
  CmPageHeader,
  CmStepper,
  CmTableOfContents,
  CmTabs,
} from '@codemonster-ru/ui-vue';
import { folderOpen, grid, layers } from '@codemonster-ru/ui-icons';
import { defineComponent, h, ref, watchPostEffect, type PropType } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const GuideLink = defineComponent({
  props: {
    to: { type: [String, Object] as PropType<string | { path: string; hash?: string }>, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        { href: typeof props.to === 'string' ? props.to : props.to.path + (props.to.hash ?? '') },
        slots.default?.(),
      );
  },
});
const guideValue = ref('grid');
const guideItems = [
  { value: 'overview', label: 'Overview', to: '/core/#actions' },
  {
    value: 'guides',
    label: 'Guides',
    children: [
      { value: 'grid', label: 'Grid', to: { path: '/layouts/', hash: '#demo-grid' } },
      { value: 'billing', label: 'Billing', to: '/billing/', disabled: true },
    ],
  },
  { value: 'icons', label: 'Icons', href: '/icons/', target: '_blank' },
];

const links = [
  { label: 'Docs', href: '/core/' },
  { label: 'Components', href: '#navigation' },
  { label: 'Navigation', href: '#navigation' },
  { label: 'Menu Bar', current: true },
];
const tabs = [
  'Overview',
  'API',
  'Status',
  'Changelog',
  'Roadmap',
  'Examples',
  'Guides',
  'Theming',
  'A11y',
  'Community',
].map((label) => ({
  value: label.toLowerCase(),
  label,
  content: (label === 'A11y' ? 'Accessibility' : label) + ' content.',
}));
const steps = [
  { value: 'start', label: 'Start', description: 'Create account' },
  { value: 'details', label: 'Details', description: 'Add product info' },
  { value: 'plan', label: 'Plan', description: 'Choose rollout' },
  { value: 'launch', label: 'Launch', description: 'Review and publish' },
];

const extendedSteps = [
  { value: 'account', label: 'Account', description: 'Create workspace owner' },
  { value: 'profile', label: 'Profile', description: 'Add product and brand details' },
  { value: 'billing', label: 'Billing', description: 'Choose plan and payment method' },
  { value: 'launch', label: 'Launch', description: 'Review configuration and publish' },
];

const menu = [
  {
    value: 'getting-started',
    label: 'Getting Started',
    children: [
      { value: 'installation', label: 'Installation' },
      { value: 'quick-start', label: 'Quick Start' },
      { value: 'migration', label: 'Migration' },
      { value: 'faq', label: 'FAQ' },
    ],
  },
  {
    value: 'components',
    label: 'Components',
    children: [
      { value: 'button', label: 'Button' },
      { value: 'icon-button', label: 'Icon Button' },
      {
        value: 'tabs',
        label: 'Tabs',
        children: [
          {
            value: 'overview-tab',
            label: 'Overview Tab',
            children: [
              { value: 'overview-anatomy', label: 'Anatomy' },
              { value: 'overview-accessibility', label: 'Accessibility' },
            ],
          },
          { value: 'status-tab', label: 'Status Tab' },
        ],
      },
      { value: 'stepper', label: 'Stepper' },
      { value: 'accordion', label: 'Accordion' },
      { value: 'dialog', label: 'Dialog' },
      { value: 'drawer', label: 'Drawer' },
      { value: 'popover', label: 'Popover' },
      { value: 'tooltip', label: 'Tooltip' },
    ],
  },
  {
    value: 'foundation',
    label: 'Foundation',
    children: [
      { value: 'tokens', label: 'Tokens' },
      { value: 'theme', label: 'Theme' },
      { value: 'breakpoints', label: 'Breakpoints' },
      { value: 'motion', label: 'Motion' },
    ],
  },
];

const wrappingMenu = [
  {
    value: 'no-icons-getting-started',
    label: 'Getting started with workspace configuration',
    children: [
      { value: 'no-icons-installation', label: 'Installation and initial project configuration' },
      { value: 'no-icons-quick-start', label: 'Quick start for new application contributors' },
    ],
  },
  {
    value: 'no-icons-components',
    label: 'Components and reusable interface patterns',
    children: [
      { value: 'no-icons-button', label: 'Button and action control guidelines' },
      {
        value: 'no-icons-navigation',
        label: 'Navigation for complex application structures',
        children: [
          { value: 'no-icons-anatomy', label: 'Anatomy and visual hierarchy of nested navigation items' },
          {
            value: 'no-icons-accessibility',
            label: 'Keyboard and screen reader accessibility',
          },
        ],
      },
      { value: 'no-icons-overlays', label: 'Dialogs, drawers, popovers, and contextual overlays' },
    ],
  },
  {
    value: 'no-icons-foundation',
    label: 'Foundation tokens and responsive design principles',
    children: [
      { value: 'no-icons-theme', label: 'Theme configuration and semantic color tokens' },
      { value: 'no-icons-motion', label: 'Motion preferences and reduced animation behavior' },
    ],
  },
];

const sidebarIcons = new Map([
  ['getting-started', folderOpen],
  ['components', grid],
  ['foundation', layers],
]);
const sidebarMenu = menu.map((item) => ({ ...item, leadingIcon: sidebarIcons.get(item.value) }));
const sidebarExpanded = ref<readonly string[]>(['getting-started']);
const sidebarSelected = ref('quick-start');
const pillMenu = ref('quick-start');
const wrappingSelected = ref('no-icons-accessibility');
const menuBar = [
  {
    value: 'products',
    label: 'Products',
    children: [
      {
        value: 'foundations',
        label: 'Foundations',
        children: [
          { value: 'tokens', label: 'Tokens' },
          { value: 'theme', label: 'Theme' },
          { value: 'motion', label: 'Motion' },
        ],
      },
      {
        value: 'components-suite',
        label: 'Components',
        children: [
          { value: 'actions', label: 'Actions' },
          { value: 'forms-menu', label: 'Forms' },
          { value: 'navigation-menu', label: 'Navigation' },
          {
            value: 'storybook-menu',
            label: 'Storybook',
            href: 'https://storybook.js.org',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        ],
      },
    ],
  },
  {
    value: 'docs-top',
    label: 'Docs',
    children: [
      { value: 'getting-started-top', label: 'Getting Started' },
      { value: 'api-top', label: 'API Reference' },
      {
        value: 'guides-top',
        label: 'Guides',
        children: [
          { value: 'theming-guide', label: 'Theming' },
          { value: 'composition-guide', label: 'Composition' },
        ],
      },
    ],
  },
  { value: 'pricing', label: 'Pricing' },
  {
    value: 'github',
    label: 'GitHub',
    href: 'https://github.com/codemonster-ru',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  { value: 'about', label: 'About' },
];
const sections = [
  { id: 'theme', label: 'Theme', href: '#theme' },
  { id: 'typography', label: 'Typography', href: '#typography' },
  { id: 'actions', label: 'Actions and Links', href: '#actions' },
  { id: 'overlay', label: 'Overlay', href: '#overlay' },
  { id: 'surfaces', label: 'Surface Components', href: '#surfaces' },
];
const accordion = [
  { id: 'getting-started', title: 'Open section', content: 'Open content.' },
  { id: 'troubleshooting', title: 'Closed section', content: 'Closed content.' },
  { id: 'archived', title: 'Disabled section', content: 'Disabled content.', disabled: true },
];
const selectedMenu = ref('installation');
const horizontalStep = ref('details');
const belowStep = ref('plan');
const verticalStep = ref('billing');

const overflowTabs = ref<HTMLElement | null>(null);
const canScrollBack = ref(false);
const canScrollForward = ref(false);

watchPostEffect((onCleanup) => {
  const tabList = overflowTabs.value?.querySelector<HTMLElement>('.cm-tabs__list');
  if (!tabList) return;

  const list = tabList;
  const updateControls = () => {
    const offset = Math.abs(list.scrollLeft);
    canScrollBack.value = offset > 1;
    canScrollForward.value = list.scrollWidth - list.clientWidth - offset > 1;
  };

  const resize = new ResizeObserver(updateControls);
  resize.observe(list);
  for (const tab of list.children) resize.observe(tab);
  list.addEventListener('scroll', updateControls, { passive: true });
  updateControls();
  onCleanup(() => {
    resize.disconnect();
    list.removeEventListener('scroll', updateControls);
  });
});

function scrollTabs(direction: -1 | 1) {
  const list = overflowTabs.value?.querySelector<HTMLElement>('.cm-tabs__list');
  if (!list) return;
  const rtl = getComputedStyle(list).direction === 'rtl';
  list.scrollBy({
    left: direction * (rtl ? -1 : 1) * list.clientWidth * 0.75,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

const menuBarExamples = [
  { label: 'Menu bar', variant: 'default', selected: ref('pricing') },
  { label: 'Pill menu bar', variant: 'pills', selected: ref('about') },
] as const;
</script>

<template>
  <CoreMatrix title="Navigation visual QA matrix" :columns="2">
    <div class="core-matrix-cell">
      <h4>Breadcrumbs</h4>
      <CmBreadcrumbs :items="links"><template #separator>›</template></CmBreadcrumbs>
      <CmBreadcrumbs
        :items="[
          links[0],
          { label: 'Core', href: '#navigation' },
          { label: 'Forms', href: '#forms' },
          { label: 'Field geometry', current: true },
        ]"
      >
        <template #separator>›</template>
      </CmBreadcrumbs>
      <CmBreadcrumbs :items="links" />
    </div>
    <div class="core-matrix-cell core-matrix-wide">
      <h4>Page header</h4>
      <CmPageHeader
        title="Team members"
        description="Manage workspace access, roles, and account status."
        :heading-level="5"
        :breadcrumbs="[
          { label: 'Administration', href: '#navigation' },
          { label: 'Users', current: true },
        ]"
      >
        <template #actions>
          <CmButton variant="secondary" href="#surfaces">Export</CmButton>
          <CmButton href="#forms">New user</CmButton>
        </template>
      </CmPageHeader>
    </div>
    <div class="core-matrix-cell">
      <h4>Tabs</h4>
      <CmTabs id="core-release-tabs" :items="tabs.slice(0, 4)" default-value="overview" />
      <div ref="overflowTabs" class="core-tabs-overflow">
        <CmTabs id="core-release-tabs-overflow" :items="tabs" default-value="status" />
        <button
          v-show="canScrollBack"
          class="core-tabs-scroll core-tabs-scroll--back"
          type="button"
          aria-label="Scroll to earlier tabs"
          @click="scrollTabs(-1)"
        />
        <button
          v-show="canScrollForward"
          class="core-tabs-scroll core-tabs-scroll--forward"
          type="button"
          aria-label="Scroll to later tabs"
          @click="scrollTabs(1)"
        />
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Stepper · horizontal</h4>
      <div class="core-stepper-scroll" tabindex="0" role="region" aria-label="Horizontal stepper examples">
        <CmStepper
          v-model="horizontalStep"
          :items="steps"
          content-position="above"
          aria-label="Horizontal stepper with labels above"
        />
        <CmStepper
          v-model:value="belowStep"
          :items="steps"
          content-position="below"
          aria-label="Horizontal stepper with labels below"
        />
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Stepper · vertical</h4>
      <CmStepper v-model:value="verticalStep" :items="extendedSteps" orientation="vertical" content-position="start" />
    </div>
    <div class="core-matrix-cell">
      <h4>Accordion · states</h4>
      <CmAccordion
        v-for="item in [accordion[1], accordion[0], accordion[2]]"
        :id="'core-accordion-' + item.id"
        :key="item.id"
        :items="[item]"
        :default-open-items="item.id === 'getting-started' ? [item.id] : []"
      />
    </div>
    <div class="core-matrix-cell">
      <h4>Navigation menu and menu bar</h4>
      <CmNavMenu v-model:value="selectedMenu" variant="inline" :items="menu" class="core-nav-plain" />
      <CmNavMenu v-model:value="pillMenu" variant="pills" :items="menu" aria-label="Pill navigation" />
      <CmNavMenu
        v-model="guideValue"
        variant="pills"
        :items="guideItems"
        :link-component="GuideLink"
        aria-label="Product guides"
      />
      <div class="core-matrix-grid core-nav-variants">
        <div class="core-matrix-cell">
          <h5>Sidebar with icons</h5>
          <CmNavMenu
            v-model:value="sidebarSelected"
            v-model:expanded-values="sidebarExpanded"
            variant="sidebar"
            :items="sidebarMenu"
            :compact="false"
            class="core-nav-with-icons"
            aria-label="Sidebar navigation"
          />
        </div>
        <div class="core-matrix-cell">
          <h5>Collapsed</h5>
          <CmNavMenu
            v-model:value="sidebarSelected"
            v-model:expanded-values="sidebarExpanded"
            variant="sidebar"
            :items="sidebarMenu"
            compact
            class="core-nav-with-icons core-compact-nav"
            aria-label="Collapsed sidebar navigation"
          />
        </div>
        <div class="core-matrix-cell">
          <h5>Wrapping labels</h5>
          <CmNavMenu
            v-model:value="wrappingSelected"
            variant="sidebar"
            :items="wrappingMenu"
            :compact="false"
            class="core-nav-wrapping"
          />
        </div>
      </div>
      <div v-for="example in menuBarExamples" :key="example.label">
        <CmMenuBar
          v-model="example.selected.value"
          :items="menuBar"
          :variant="example.variant"
          :aria-label="example.label"
        />
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Table of contents</h4>
      <CmTableOfContents :items="sections" active-id="actions" />
      <CmTableOfContents :items="sections" active-id="actions" variant="pills" />
    </div>
  </CoreMatrix>
</template>
