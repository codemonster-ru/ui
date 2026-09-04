<script setup lang="ts">
import { ref } from 'vue';
import { arrowLeft, gear, github } from '@codemonster-ru/ui-icons';
import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';
import { CmAdminLayout, CmAdminShell, CmAppShell, CmDocumentLayout, CmSetupLayout } from '@codemonster-ru/ui-layouts';
import {
  CmColumnChooser,
  CmIcon,
  CmMenuBar,
  CmNavMenu,
  CmStepper,
  CmTableOfContents,
  CmTag,
  CmThemeSwitch,
} from '@codemonster-ru/ui-vue';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'owner', header: 'Owner' },
  { key: 'size', header: 'Size' },
];
const visibleColumnKeys = ref<string[] | null>(null);
const themeMode = ref<CmThemeMode>('system');

const menuBarItems = [
  {
    value: 'file',
    label: 'File',
    children: [
      { value: 'new', label: 'New' },
      { value: 'recent', label: 'Recent', children: [{ value: 'report', label: 'Report' }] },
    ],
  },
  { value: 'help', label: 'Help', href: '#demo-nav-menu' },
];

const navMenuItems = [
  { value: 'dashboard', label: 'Dashboard', href: '#demo-stepper' },
  {
    value: 'projects',
    label: 'Projects',
    children: [{ value: 'active', label: 'Active', href: '#demo-column-chooser' }],
  },
];

const stepperItems = [
  { value: 'account', label: 'Account' },
  { value: 'billing', label: 'Billing', description: 'Payment details' },
  { value: 'review', label: 'Review' },
];

const tableOfContentsItems = [
  { id: 'demo-tag', label: 'Tag' },
  { id: 'demo-table-of-contents', label: 'Table of contents' },
  { id: 'demo-column-chooser', label: 'Column chooser', level: 2 },
];
</script>

<template>
  <main class="ui-showcase">
    <header class="ui-showcase__intro">
      <h1>CodeMonster UI showcase</h1>
      <p class="ui-showcase__note">
        Components and layouts with no VueForge ancestor. The VueForge playground stays frozen against its reference
        commit, so anything without a predecessor to match is demonstrated here instead.
      </p>
    </header>

    <section id="demo-icon" class="ui-showcase__demo">
      <h2>Icon</h2>
      <p class="ui-showcase__note">
        Geometry is precomputed from one source and emitted by both adapters, so neither draws anything. A brand mark
        has one canonical form, and asking for another falls back to the one that exists rather than failing.
      </p>
      <div class="ui-showcase__inline">
        <CmIcon :icon="arrowLeft" label="Back" />
        <CmIcon :icon="gear" variant="solid" label="Settings" />
        <CmIcon :icon="gear" family="duotone" label="Settings, duotone" />
        <CmIcon :icon="github" variant="thin" label="GitHub" />
      </div>
    </section>

    <section id="demo-tag" class="ui-showcase__demo">
      <h2>Tag</h2>
      <p class="ui-showcase__note">A label with a tone, sized to its text.</p>
      <div class="ui-showcase__inline">
        <CmTag tone="primary">Platform</CmTag>
        <CmTag tone="success">Stable</CmTag>
        <CmTag>Internal</CmTag>
      </div>
    </section>

    <section id="demo-table-of-contents" class="ui-showcase__demo">
      <h2>Table of contents</h2>
      <p class="ui-showcase__note">Nested headings with the active entry marked.</p>
      <CmTableOfContents :items="tableOfContentsItems" active-id="demo-tag" />
    </section>

    <section id="demo-column-chooser" class="ui-showcase__demo">
      <h2>Column chooser</h2>
      <p class="ui-showcase__note">
        Chooses which columns a table shows. The first column is required and cannot be cleared.
      </p>
      <CmColumnChooser
        id="showcase-columns"
        v-model:visible-column-keys="visibleColumnKeys"
        :columns="columns"
        :required-column-keys="['name']"
      />
    </section>

    <section id="demo-stepper" class="ui-showcase__demo">
      <h2>Stepper</h2>
      <p class="ui-showcase__note">A workflow position, with arrow keys moving between steps.</p>
      <CmStepper :items="stepperItems" value="billing" />
    </section>

    <section id="demo-nav-menu" class="ui-showcase__demo">
      <h2>Nav menu</h2>
      <p class="ui-showcase__note">A navigation tree whose branches expand in place.</p>
      <CmNavMenu :items="navMenuItems" value="active" />
    </section>

    <section id="demo-menu-bar" class="ui-showcase__demo">
      <h2>Menu bar</h2>
      <p class="ui-showcase__note">An application menu bar showing one open path at a time.</p>
      <CmMenuBar :items="menuBarItems" />
    </section>

    <section id="demo-theme-switch" class="ui-showcase__demo">
      <h2>Theme switch</h2>
      <p class="ui-showcase__note">
        A three-state preference: an explicit light, an explicit dark, or deferring to the operating system. Native
        radios carry the semantics, so it works inside a form with no JavaScript. The choice is written to the document
        root and to a cookie the server reads, which is what lets the first paint already be right.
      </p>
      <CmThemeSwitch v-model="themeMode" />
    </section>

    <section id="demo-app-shell" class="ui-showcase__demo">
      <h2>App shell</h2>
      <p class="ui-showcase__note">
        An application frame. Sticky offsets are published as custom properties that read from declared heights, so the
        frame is correct before any script runs; a controller narrows them to the observed heights afterwards. The
        collapse control is marked, not rendered by the layout.
      </p>
      <div class="ui-showcase__frame">
        <CmAppShell layout="sidebar-content" sticky-header>
          <template #header>Product</template>
          <template #sidebar>
            <button type="button" class="cm-button cm-button--ghost cm-button--sm" data-cm-sidebar-toggle aria-expanded="true">
              Collapse
            </button>
          </template>
          Content
        </CmAppShell>
      </div>
    </section>

    <section id="demo-document-layout" class="ui-showcase__demo">
      <h2>Document layout</h2>
      <p class="ui-showcase__note">A reading frame with chapter navigation and a contextual panel.</p>
      <div class="ui-showcase__frame">
        <CmDocumentLayout>
          <template #header>Guide</template>
          <template #sidebar>Chapters</template>
          <template #aside>On this page</template>
          Body
        </CmDocumentLayout>
      </div>
    </section>

    <section id="demo-admin-layout" class="ui-showcase__demo">
      <h2>Admin layout</h2>
      <p class="ui-showcase__note">
        Regions plus a collapsible sidebar. State lives on the root as <code>data-cm-*</code>, so the Razor adapter and
        the runtime controller read the same thing Vue binds.
      </p>
      <div class="ui-showcase__frame">
        <CmAdminLayout id="showcase-admin-layout">
          <template #brand>CodeMonster</template>
          <template #aside>Navigation</template>
          <template #header>Workspace</template>
          Layout content
        </CmAdminLayout>
      </div>
    </section>

    <section id="demo-admin-shell" class="ui-showcase__demo">
      <h2>Admin shell</h2>
      <p class="ui-showcase__note">The same regions without the sidebar behaviour.</p>
      <div class="ui-showcase__frame">
        <CmAdminShell>
          <template #brand>CodeMonster</template>
          <template #sidebar>Navigation</template>
          Workspace
        </CmAdminShell>
      </div>
    </section>

    <section id="demo-setup-layout" class="ui-showcase__demo">
      <h2>Setup layout</h2>
      <p class="ui-showcase__note">A single-task page for onboarding steps.</p>
      <div class="ui-showcase__frame">
        <CmSetupLayout title="Create your workspace" description="This takes a minute.">
          Workspace name
          <template #actions>Continue</template>
        </CmSetupLayout>
      </div>
    </section>
  </main>
</template>
