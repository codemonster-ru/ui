<script setup lang="ts">
import { copyIcon, filterIcons } from '../../shared/showcase-icon-catalog.js';
import ContractExamples from './ContractExamples.vue';
import themeSamples from '../../shared/showcase-theme-samples.html?raw';
import colors from '../../shared/showcase-colors.html?raw';
import { renderColorScales, renderIconCatalog, renderOperations } from '../../shared/showcase-reference.mts';
import { actionMatrices } from '../../shared/showcase-matrices.mts';
import type { CmButtonProps, CmIconButtonProps, CmLinkProps } from '@codemonster-ru/ui-vue';
import typography from '../../shared/showcase-typography.html?raw';
import { onMounted, onUnmounted, ref } from 'vue';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { fillContrastTable, mountOperations } from '../../shared/showcase-reference.js';
import { alertCircle, arrowLeft, gear, github, infoCircle } from '@codemonster-ru/ui-icons';
import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';
import { CmAdminLayout, CmAdminShell, CmAppShell, CmDocumentLayout, CmSetupLayout } from '@codemonster-ru/ui-layouts';
import {
  CmAccordion,
  CmAlert,
  CmAvatar,
  CmBadge,
  CmBreadcrumbs,
  CmButton,
  CmCard,
  CmCheckbox,
  CmColumnChooser,
  CmCommandPalette,
  CmContainer,
  CmDataTable,
  CmDatePicker,
  CmDialog,
  CmDivider,
  CmDropdown,
  CmDrawer,
  CmField,
  CmFieldset,
  CmGrid,
  CmIcon,
  CmIconButton,
  CmInline,
  CmInput,
  CmLink,
  CmMenu,
  CmMenuBar,
  CmNavMenu,
  CmPopover,
  CmProgressBar,
  CmProgressSpinner,
  CmRadio,
  CmSection,
  CmSelect,
  CmSkeleton,
  CmStack,
  CmStepper,
  CmSwitch,
  CmTable,
  CmTableOfContents,
  CmTabs,
  CmTag,
  CmTextarea,
  CmThemeSwitch,
  CmTooltip,
} from '@codemonster-ru/ui-vue';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'owner', header: 'Owner' },
  { key: 'size', header: 'Size' },
];
const visibleColumnKeys = ref<string[] | null>(null);
const pages = [
  { id: 'core', label: 'Core' },
  { id: 'colors', label: 'Colors' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'icons', label: 'Icons' },
];
const referenceContent = ref<HTMLElement | null>(null);
const referenceRuntime = new CmRuntime().register('tabs', createCmTabsController);
onMounted(() => {
  if (!referenceContent.value) return;
  fillContrastTable(referenceContent.value);
  mountOperations(referenceContent.value);
  referenceRuntime.start(referenceContent.value);
});
onUnmounted(() => referenceRuntime.stop());

const currentPage = pages.find(({ id }) => location.pathname.split('/')[1] === id)?.id ?? 'core';
const buttonExamples = actionMatrices.button as Record<
  string,
  (Pick<CmButtonProps, 'variant' | 'size' | 'disabled' | 'loading'> & { label: string })[]
>;
const linkExamples = actionMatrices.link as Record<
  string,
  (Omit<CmLinkProps, 'href'> & { label: string; external?: boolean })[]
>;

const iconButtonExamples = actionMatrices['icon-button'] as Record<string, CmIconButtonProps[]>;

const themeMode = ref<CmThemeMode>('system');

const accordionItems = [
  { id: 'overview', title: 'Overview', content: 'A short summary of the project.' },
  { id: 'access', title: 'Access', content: 'Who can see and edit this workspace.' },
  { id: 'billing', title: 'Billing', content: 'Plan, seats, and payment method.' },
];
const accordionOpenItems = ref<string[]>(['overview']);

const breadcrumbItems = [
  { label: 'Workspace', href: '#demo-breadcrumbs' },
  { label: 'Projects', href: '#demo-breadcrumbs' },
  { label: 'Showcase', current: true },
];

const commandPaletteOpen = ref(false);
const commandPaletteCommands = [
  { id: 'new-file', label: 'New file', keywords: 'create add' },
  { id: 'invite', label: 'Invite teammate', keywords: 'share collaborate' },
  { id: 'archive', label: 'Archive project', keywords: 'delete remove' },
];

const dataTableColumns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'owner', header: 'Owner' },
  { key: 'size', header: 'Size', align: 'end' as const },
];
const dataTableRows = [
  { id: 'a', cells: { name: 'Report.pdf', owner: 'Kirill', size: '2.1 MB' } },
  { id: 'b', cells: { name: 'Roadmap.md', owner: 'Aisha', size: '18 KB' } },
];

const datePickerValue = ref('2026-08-13');

const dialogOpen = ref(false);
const drawerOpen = ref(false);
const dropdownOpen = ref(false);
const popoverOpen = ref(false);

const menuItems = [
  { id: 'edit', label: 'Edit' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'delete', label: 'Delete', tone: 'danger' as const },
];

const selectOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'published', label: 'Published' },
];
const selectValue = ref('review');

const tabItems = [
  { value: 'overview', label: 'Overview', content: 'A summary of recent activity.' },
  { value: 'activity', label: 'Activity', content: 'A chronological log of every change.' },
  { value: 'settings', label: 'Settings', content: 'Project name, visibility, and danger zone.' },
];
const tabsValue = ref('overview');

const checkboxValue = ref(true);
const switchValue = ref(true);
const radioValue = ref('email');
const inputValue = ref('');
const passwordValue = ref('correct-horse');
const displayNameValue = ref('');
const textareaValue = ref('');

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
  <header class="showcase-topbar">
    <span class="showcase-brand">CodeMonster UI · Vue</span>
    <nav class="showcase-navigation" aria-label="Showcase sections">
      <a
        v-for="page in pages"
        :key="page.id"
        class="cm-link"
        :href="`/${page.id}/`"
        :aria-current="currentPage === page.id ? 'page' : undefined"
        >{{ page.label }}</a
      >
    </nav>
    <CmThemeSwitch v-model="themeMode" name="showcase-theme" />
  </header>
  <main class="showcase-content">
    <template v-if="currentPage === 'core'">
      <section id="theme" class="showcase-group">
        <header>
          <h2>Theme</h2>
          <p>Check components in light, dark, and system themes.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-theme-switch" class="ui-showcase__demo showcase-panel">
            <h3>Theme switch</h3>
            <p class="ui-showcase__note">
              A three-state preference: an explicit light, an explicit dark, or deferring to the operating system.
              Native radios carry the semantics, so it works inside a form with no JavaScript. The choice is written to
              the document root and to a cookie the server reads, which is what lets the first paint already be right.
            </p>
            <CmThemeSwitch v-model="themeMode" />
            <ContractExamples slug="theme-switch" />
          </section>
          <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
          <div class="showcase-grid-fragment" v-html="themeSamples" />
        </div>
      </section>
      <section id="typography" class="showcase-group">
        <header>
          <h2>Typography</h2>
          <p>Review heading and body styles.</p>
        </header>
        <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
        <div v-html="typography" />
      </section>
      <section id="actions" class="showcase-group">
        <header>
          <h2>Actions and Links</h2>
          <p>Compare buttons, icon buttons, and links.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-button" class="ui-showcase__demo showcase-panel">
            <h3>Button</h3>
            <p class="ui-showcase__note">
              Variant carries intent, not just color; loading disables the control itself.
            </p>
            <div v-for="(examples, label) in buttonExamples" :key="label" class="showcase-matrix">
              <p class="showcase-label">{{ label }}</p>
              <div class="showcase-matrix-row">
                <CmButton v-for="{ label: text, ...props } in examples" :key="text" v-bind="props">{{ text }}</CmButton>
              </div>
            </div>
            <ContractExamples slug="button" />
          </section>
          <section id="demo-icon-button" class="ui-showcase__demo showcase-panel">
            <h3>Icon button</h3>
            <p class="ui-showcase__note">
              A square button carrying only an icon; <code>label</code> supplies its name.
            </p>
            <div v-for="(examples, label) in iconButtonExamples" :key="label" class="showcase-matrix">
              <p class="showcase-label">{{ label }}</p>
              <div class="showcase-matrix-row">
                <CmIconButton v-for="props in examples" :key="props.label" v-bind="props"
                  ><CmIcon :icon="gear"
                /></CmIconButton>
              </div>
            </div>
            <ContractExamples slug="icon-button" />
          </section>
          <section id="demo-link" class="ui-showcase__demo showcase-panel">
            <h3>Link</h3>
            <p class="ui-showcase__note">
              A styled anchor with an underline policy and tone, independent of visited state.
            </p>
            <div v-for="(examples, label) in linkExamples" :key="label" class="showcase-matrix">
              <p class="showcase-label">{{ label }}</p>
              <div class="showcase-matrix-row">
                <CmLink
                  v-for="{ label: text, external, ...props } in examples"
                  :key="text"
                  :href="external ? 'https://example.com' : '#demo-link'"
                  :target="external ? '_blank' : undefined"
                  :rel="external ? 'noopener noreferrer' : undefined"
                  v-bind="props"
                  >{{ text }}</CmLink
                >
              </div>
            </div>
            <ContractExamples slug="link" />
          </section>
        </div>
      </section>
      <section id="overlay" class="showcase-group">
        <header>
          <h2>Overlay</h2>
          <p>Open floating panels and check their placement and focus.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-tooltip" class="ui-showcase__demo showcase-panel">
            <h3>Tooltip</h3>
            <p class="ui-showcase__note">Shown on focus or hover, never as the only way to reach information.</p>
            <CmTooltip
              id="showcase-tooltip"
              label="Info"
              content="Tooltips are shown on focus or hover, never tap-only."
            />
            <ContractExamples slug="tooltip" />
          </section>
          <section id="demo-popover" class="ui-showcase__demo showcase-panel">
            <h3>Popover</h3>
            <p class="ui-showcase__note">
              An anchored panel for arbitrary content, as opposed to Dropdown's fixed menu.
            </p>
            <CmPopover id="showcase-popover" v-model:open="popoverOpen" label="Details">
              <p>Anything can go in a popover's panel -- text, a form, another component.</p>
            </CmPopover>
            <ContractExamples slug="popover" />
          </section>
          <section id="demo-dropdown" class="ui-showcase__demo showcase-panel">
            <h3>Dropdown</h3>
            <p class="ui-showcase__note">A button that opens a menu, closing on selection, outside click, or Escape.</p>
            <CmDropdown id="showcase-dropdown" v-model:open="dropdownOpen" label="Actions" :items="menuItems" />
            <ContractExamples slug="dropdown" />
          </section>
        </div>
      </section>
      <section id="surfaces" class="showcase-group">
        <header>
          <h2>Surface Components</h2>
          <p>Explore content, grouping, and table surfaces.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-card" class="ui-showcase__demo showcase-panel">
            <h3>Card</h3>
            <p class="ui-showcase__note">A titled surface. Header and footer regions appear only when given content.</p>
            <CmCard title="Deploy preview">
              <p>The last commit built successfully and is ready to review.</p>
              <template #footer>
                <CmButton variant="secondary" size="sm">View build</CmButton>
              </template>
            </CmCard>
            <ContractExamples slug="card" />
          </section>
          <section id="demo-avatar" class="ui-showcase__demo showcase-panel">
            <h3>Avatar</h3>
            <p class="ui-showcase__note">A person or entity, by image, then initials, then a fallback slot.</p>
            <div class="ui-showcase__inline">
              <CmAvatar label="KK" shape="circle" />
              <CmAvatar label="AI" shape="square" size="lg" />
            </div>
            <ContractExamples slug="avatar" />
          </section>
          <section id="demo-badge" class="ui-showcase__demo showcase-panel">
            <h3>Badge</h3>
            <p class="ui-showcase__note">A short status label, meant to sit on or beside another element.</p>
            <div class="ui-showcase__inline">
              <CmBadge tone="primary">New</CmBadge>
              <CmBadge tone="danger">Blocked</CmBadge>
            </div>
            <ContractExamples slug="badge" />
          </section>
          <section id="demo-tag" class="ui-showcase__demo showcase-panel">
            <h3>Tag</h3>
            <p class="ui-showcase__note">A label with a tone, sized to its text.</p>
            <div class="ui-showcase__inline">
              <CmTag tone="primary">Platform</CmTag>
              <CmTag tone="success">Stable</CmTag>
              <CmTag>Internal</CmTag>
            </div>
            <ContractExamples slug="tag" />
          </section>
          <section id="demo-divider" class="ui-showcase__demo showcase-panel">
            <h3>Divider</h3>
            <p class="ui-showcase__note">
              A semantic separator; orientation flips both its ARIA role and its geometry.
            </p>
            <CmDivider />
            <ContractExamples slug="divider" />
          </section>
          <section id="demo-fieldset" class="ui-showcase__demo showcase-panel">
            <h3>Fieldset</h3>
            <p class="ui-showcase__note">Groups related controls -- checkboxes, radios -- under one required legend.</p>
            <CmFieldset id="showcase-fieldset" label="Contact method" description="Choose every acceptable method.">
              <template #default="{ describedBy, invalid }">
                <CmRadio
                  v-model="radioValue"
                  name="showcase-contact-method"
                  value="email"
                  label="Email"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid || undefined"
                />
                <CmRadio
                  v-model="radioValue"
                  name="showcase-contact-method"
                  value="sms"
                  label="SMS"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid || undefined"
                />
              </template>
            </CmFieldset>
            <ContractExamples slug="fieldset" />
          </section>
          <section id="demo-table" class="ui-showcase__demo showcase-panel showcase-panel--wide">
            <h3>Table</h3>
            <p class="ui-showcase__note">
              Plain markup in header/body/footer slots; DataTable builds this from data instead.
            </p>
            <CmTable id="showcase-table" striped>
              <template #header>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Owner</th>
                </tr>
              </template>
              <tr>
                <td>Report.pdf</td>
                <td>Kirill</td>
              </tr>
              <tr>
                <td>Roadmap.md</td>
                <td>Aisha</td>
              </tr>
            </CmTable>
            <ContractExamples slug="table" />
          </section>
          <section id="demo-data-table" class="ui-showcase__demo showcase-panel showcase-panel--wide">
            <h3>Data table</h3>
            <p class="ui-showcase__note">
              Columns, rows, sorting, selection, and pagination as data, not markup you assemble by hand.
            </p>
            <CmDataTable id="showcase-data-table" :columns="dataTableColumns" :rows="dataTableRows" />
            <ContractExamples slug="data-table" />
          </section>
          <section id="demo-column-chooser" class="ui-showcase__demo showcase-panel">
            <h3>Column chooser</h3>
            <p class="ui-showcase__note">
              Chooses which columns a table shows. The first column is required and cannot be cleared.
            </p>
            <CmColumnChooser
              id="showcase-columns"
              v-model:visible-column-keys="visibleColumnKeys"
              :columns="columns"
              :required-column-keys="['name']"
            />
            <ContractExamples slug="column-chooser" />
          </section>
        </div>
      </section>
      <section id="feedback" class="showcase-group">
        <header>
          <h2>Feedback</h2>
          <p>Compare status, progress, and loading states.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-alert" class="ui-showcase__demo showcase-panel">
            <h3>Alert</h3>
            <p class="ui-showcase__note">
              An inline, non-dismissable status message with a tone; the icon slot is optional.
            </p>
            <CmStack>
              <CmAlert tone="info" title="Heads up">
                <template #icon><CmIcon :icon="infoCircle" /></template>
                A new version of this workspace is available.
              </CmAlert>
              <CmAlert tone="danger" title="Submission failed">
                <template #icon><CmIcon :icon="alertCircle" /></template>
                Review the failed fields.
              </CmAlert>
            </CmStack>
            <ContractExamples slug="alert" />
          </section>
          <section id="demo-progress-bar" class="ui-showcase__demo showcase-panel">
            <h3>Progress bar</h3>
            <p class="ui-showcase__note">A determinate or indeterminate horizontal progress meter.</p>
            <CmStack>
              <CmProgressBar label="Uploading" :value="62" show-value />
              <CmProgressBar label="Syncing" indeterminate />
            </CmStack>
            <ContractExamples slug="progress-bar" />
          </section>
          <section id="demo-progress-spinner" class="ui-showcase__demo showcase-panel">
            <h3>Progress spinner</h3>
            <p class="ui-showcase__note">An indeterminate circular spinner, for a spot too small for a bar.</p>
            <CmProgressSpinner label="Loading" />
            <ContractExamples slug="progress-spinner" />
          </section>
          <section id="demo-skeleton" class="ui-showcase__demo showcase-panel">
            <h3>Skeleton</h3>
            <p class="ui-showcase__note">A loading placeholder shaped like the content it stands in for.</p>
            <CmStack>
              <CmSkeleton min-height="1rem" />
              <CmSkeleton min-height="1rem" style="inline-size: 60%" />
            </CmStack>
            <ContractExamples slug="skeleton" />
          </section>
        </div>
      </section>
      <section id="forms" class="showcase-group">
        <header>
          <h2>Forms</h2>
          <p>Try input, selection, and validation states.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-field" class="ui-showcase__demo showcase-panel">
            <h3>Field</h3>
            <p class="ui-showcase__note">
              Wraps one control with a label, description, and error, wiring their ids together as
              <code>aria-describedby</code>.
            </p>
            <CmField
              control-id="showcase-field-display-name"
              label="Display name"
              description="Shown to other members."
              error="Enter a display name."
              required
            >
              <template #default="{ controlId, describedBy, invalid, required }">
                <CmInput
                  :id="controlId"
                  v-model="displayNameValue"
                  :aria-describedby="describedBy"
                  :invalid="invalid"
                  :required="required"
                />
              </template>
            </CmField>
            <ContractExamples slug="field" />
          </section>
          <section id="demo-input" class="ui-showcase__demo showcase-panel">
            <h3>Input</h3>
            <p class="ui-showcase__note">
              Text entry, with an optional clear button and, for passwords, a reveal toggle.
            </p>
            <CmStack>
              <CmInput v-model="inputValue" type="text" placeholder="Project name" clearable />
              <CmInput v-model="passwordValue" type="password" required clearable password-reveal>
                <template #leading>@</template>
                <template #trailing>required</template>
              </CmInput>
            </CmStack>
            <ContractExamples slug="input" />
          </section>
          <section id="demo-textarea" class="ui-showcase__demo showcase-panel">
            <h3>Textarea</h3>
            <p class="ui-showcase__note">Multi-line text entry, sharing Input's size and validation states.</p>
            <CmTextarea v-model="textareaValue" placeholder="Leave a comment" />
            <ContractExamples slug="textarea" />
          </section>
          <section id="demo-select" class="ui-showcase__demo showcase-panel">
            <h3>Select</h3>
            <p class="ui-showcase__note">A native select styled to match the rest of the control set.</p>
            <CmSelect id="showcase-select" v-model="selectValue" :options="selectOptions" clearable />
            <ContractExamples slug="select" />
          </section>
          <section id="demo-date-picker" class="ui-showcase__demo showcase-panel">
            <h3>Date picker</h3>
            <p class="ui-showcase__note">A native date input styled to match the rest of the control set.</p>
            <CmDatePicker id="showcase-date-picker" v-model="datePickerValue" clearable />
            <ContractExamples slug="date-picker" />
          </section>
          <section id="demo-checkbox" class="ui-showcase__demo showcase-panel">
            <h3>Checkbox</h3>
            <p class="ui-showcase__note">A tri-state-capable control; indeterminate is visual only, not a value.</p>
            <CmCheckbox v-model="checkboxValue" label="Email me about product updates" />
            <ContractExamples slug="checkbox" />
          </section>
          <section id="demo-radio" class="ui-showcase__demo showcase-panel">
            <h3>Radio</h3>
            <p class="ui-showcase__note">
              A mutually exclusive choice; grouping comes from a shared <code>name</code>.
            </p>
            <div class="ui-showcase__inline">
              <CmRadio v-model="radioValue" name="showcase-radio" value="email" label="Email" />
              <CmRadio v-model="radioValue" name="showcase-radio" value="sms" label="SMS" />
            </div>
            <ContractExamples slug="radio" />
          </section>
          <section id="demo-switch" class="ui-showcase__demo showcase-panel">
            <h3>Switch</h3>
            <p class="ui-showcase__note">
              An on/off control with immediate effect, unlike Checkbox's deferred-until-submit norm.
            </p>
            <CmSwitch v-model="switchValue" label="Enable notifications" />
            <ContractExamples slug="switch" />
          </section>
        </div>
      </section>
      <section id="navigation" class="showcase-group">
        <header>
          <h2>Navigation and Disclosure</h2>
          <p>Explore navigation, disclosure, and keyboard interaction.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-breadcrumbs" class="ui-showcase__demo showcase-panel">
            <h3>Breadcrumbs</h3>
            <p class="ui-showcase__note">A trail back up the hierarchy, with the current page marked, not linked.</p>
            <CmBreadcrumbs :items="breadcrumbItems" />
            <ContractExamples slug="breadcrumbs" />
          </section>
          <section id="demo-menu" class="ui-showcase__demo showcase-panel">
            <h3>Menu</h3>
            <p class="ui-showcase__note">
              A standalone list of actions with roving tabindex; Dropdown renders one of these.
            </p>
            <CmMenu :items="menuItems" aria-label="Row actions" />
            <ContractExamples slug="menu" />
          </section>
          <section id="demo-menu-bar" class="ui-showcase__demo showcase-panel">
            <h3>Menu bar</h3>
            <p class="ui-showcase__note">An application menu bar showing one open path at a time.</p>
            <CmMenuBar :items="menuBarItems" />
            <ContractExamples slug="menu-bar" />
          </section>
          <section id="demo-nav-menu" class="ui-showcase__demo showcase-panel">
            <h3>Nav menu</h3>
            <p class="ui-showcase__note">A navigation tree whose branches expand in place.</p>
            <CmNavMenu :items="navMenuItems" value="active" />
            <ContractExamples slug="nav-menu" />
          </section>
          <section id="demo-table-of-contents" class="ui-showcase__demo showcase-panel">
            <h3>Table of contents</h3>
            <p class="ui-showcase__note">Nested headings with the active entry marked.</p>
            <CmTableOfContents :items="tableOfContentsItems" active-id="demo-tag" />
            <ContractExamples slug="table-of-contents" />
          </section>
          <section id="demo-stepper" class="ui-showcase__demo showcase-panel">
            <h3>Stepper</h3>
            <p class="ui-showcase__note">A workflow position, with arrow keys moving between steps.</p>
            <CmStepper :items="stepperItems" value="billing" />
            <ContractExamples slug="stepper" />
          </section>
          <section id="demo-tabs" class="ui-showcase__demo showcase-panel">
            <h3>Tabs</h3>
            <p class="ui-showcase__note">One panel visible at a time, switched with a roving-tabindex tablist.</p>
            <CmTabs id="showcase-tabs" v-model="tabsValue" :items="tabItems" />
            <ContractExamples slug="tabs" />
          </section>
          <section id="demo-accordion" class="ui-showcase__demo showcase-panel">
            <h3>Accordion</h3>
            <p class="ui-showcase__note">
              Disclosure panels sharing one set of expanded ids, so more than one can open.
            </p>
            <CmAccordion id="showcase-accordion" v-model:open-items="accordionOpenItems" :items="accordionItems" />
            <ContractExamples slug="accordion" />
          </section>
        </div>
      </section>
      <section id="modals" class="showcase-group">
        <header>
          <h2>Modals and Commands</h2>
          <p>Open each overlay and check keyboard dismissal and focus.</p>
        </header>
        <div class="showcase-grid">
          <section id="demo-dialog" class="ui-showcase__demo showcase-panel">
            <h3>Dialog</h3>
            <p class="ui-showcase__note">A modal built on the native &lt;dialog&gt; element, dismissible by default.</p>
            <CmButton variant="secondary" @click="dialogOpen = true">Open dialog</CmButton>
            <CmDialog id="showcase-dialog" v-model:open="dialogOpen" title="Archive this project?" dismissible>
              <p>Archived projects can be restored for 30 days, then they're deleted.</p>
              <template #footer="{ close }">
                <CmButton variant="secondary" @click="close">Cancel</CmButton>
                <CmButton variant="danger" @click="close">Archive</CmButton>
              </template>
            </CmDialog>
            <ContractExamples slug="dialog" />
          </section>
          <section id="demo-drawer" class="ui-showcase__demo showcase-panel">
            <h3>Drawer</h3>
            <p class="ui-showcase__note">A modal that slides in from a screen edge instead of appearing centered.</p>
            <CmButton variant="secondary" @click="drawerOpen = true">Open drawer</CmButton>
            <CmDrawer id="showcase-drawer" v-model:open="drawerOpen" title="Filters" side="end" dismissible>
              <p>Drawer content goes here -- a form, a list, whatever the side panel needs to hold.</p>
            </CmDrawer>
            <ContractExamples slug="drawer" />
          </section>
          <section id="demo-command-palette" class="ui-showcase__demo showcase-panel">
            <h3>Command palette</h3>
            <p class="ui-showcase__note">A searchable action list opened as a modal dialog, filtered as you type.</p>
            <CmButton variant="secondary" @click="commandPaletteOpen = true">Open command palette</CmButton>
            <CmCommandPalette
              id="showcase-command-palette"
              v-model:open="commandPaletteOpen"
              title="Commands"
              placeholder="Type a command..."
              :commands="commandPaletteCommands"
            />
            <ContractExamples slug="command-palette" />
          </section>
        </div>
      </section>
    </template>
    <!-- eslint-disable-next-line vue/no-v-html -- Static showcase markup bundled from the repository. -->
    <div v-else-if="currentPage === 'colors'" ref="referenceContent" v-html="colors + renderColorScales()" />
    <section v-else-if="currentPage === 'layouts'" id="layouts" class="showcase-group">
      <header>
        <h2>Layouts</h2>
        <p>Review layout primitives and full-page shells.</p>
      </header>
      <div class="showcase-grid">
        <section id="demo-container" class="ui-showcase__demo showcase-panel">
          <h3>Container</h3>
          <p class="ui-showcase__note">Centers content and caps its width at one of a fixed set of sizes.</p>
          <CmContainer size="md" class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">
            This content is centered and width-capped.
          </CmContainer>
          <ContractExamples slug="container" />
        </section>
        <section id="demo-grid" class="ui-showcase__demo showcase-panel">
          <h3>Grid</h3>
          <p class="ui-showcase__note">
            A CSS grid primitive that auto-fits columns by default; a <code>cm-grid-cols-*</code> utility fixes the
            count.
          </p>
          <CmGrid class="cm-grid-cols-3">
            <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">1</div>
            <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">2</div>
            <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">3</div>
          </CmGrid>
          <ContractExamples slug="grid" />
        </section>
        <section id="demo-inline" class="ui-showcase__demo showcase-panel">
          <h3>Inline</h3>
          <p class="ui-showcase__note">A flex row primitive for laying out a run of small elements.</p>
          <CmInline>
            <CmTag tone="primary">Platform</CmTag>
            <CmTag tone="success">Stable</CmTag>
            <CmTag>Internal</CmTag>
          </CmInline>
          <ContractExamples slug="inline" />
        </section>
        <section id="demo-section" class="ui-showcase__demo showcase-panel">
          <h3>Section</h3>
          <p class="ui-showcase__note">
            A landmark and vertical-rhythm primitive; <code>surface</code> adds a background.
          </p>
          <CmSection surface>A section with the surface variant.</CmSection>
          <ContractExamples slug="section" />
        </section>
        <section id="demo-stack" class="ui-showcase__demo showcase-panel">
          <h3>Stack</h3>
          <p class="ui-showcase__note">A flex column primitive, stretched and gapped by default.</p>
          <CmStack>
            <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">1</div>
            <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">2</div>
          </CmStack>
          <ContractExamples slug="stack" />
        </section>
        <section id="demo-app-shell" class="ui-showcase__demo showcase-panel showcase-panel--wide">
          <h3>App shell</h3>
          <p class="ui-showcase__note">
            An application frame. Sticky offsets are published as custom properties that read from declared heights, so
            the frame is correct before any script runs; a controller narrows them to the observed heights afterwards.
            The collapse control is marked, not rendered by the layout.
          </p>
          <div class="ui-showcase__frame">
            <CmAppShell layout="sidebar-content" sticky-header>
              <template #header>Product</template>
              <template #sidebar>
                <button
                  type="button"
                  class="cm-button cm-button--ghost cm-button--sm"
                  data-cm-sidebar-toggle
                  aria-expanded="true"
                >
                  Collapse
                </button>
              </template>
              Content
            </CmAppShell>
          </div>
          <ContractExamples slug="app-shell" />
        </section>
        <section id="demo-document-layout" class="ui-showcase__demo showcase-panel showcase-panel--wide">
          <h3>Document layout</h3>
          <p class="ui-showcase__note">A reading frame with chapter navigation and a contextual panel.</p>
          <div class="ui-showcase__frame">
            <CmDocumentLayout>
              <template #header>Guide</template>
              <template #sidebar>Chapters</template>
              <template #aside>On this page</template>
              Body
            </CmDocumentLayout>
          </div>
          <ContractExamples slug="document-layout" />
        </section>
        <section id="demo-admin-layout" class="ui-showcase__demo showcase-panel showcase-panel--wide">
          <h3>Admin layout</h3>
          <p class="ui-showcase__note">
            Regions plus a collapsible sidebar. State lives on the root as <code>data-cm-*</code>, so Vanilla HTML and
            the runtime controller read the same thing Vue binds. A collapsed sidebar still opens on hover or keyboard
            focus, without leaving the collapsed state.
          </p>
          <div class="ui-showcase__frame">
            <CmAdminLayout id="showcase-admin-layout">
              <template #brand>CodeMonster</template>
              <template #aside>Navigation</template>
              <template #header>
                <button type="button" class="cm-button cm-button--ghost cm-button--sm" data-cm-sidebar-toggle>
                  Collapse
                </button>
                Workspace
              </template>
              Layout content
            </CmAdminLayout>
          </div>
          <ContractExamples slug="admin-layout" />
        </section>
        <section id="demo-admin-shell" class="ui-showcase__demo showcase-panel showcase-panel--wide">
          <h3>Admin shell</h3>
          <p class="ui-showcase__note">The same regions without the sidebar behaviour.</p>
          <div class="ui-showcase__frame">
            <CmAdminShell>
              <template #brand>CodeMonster</template>
              <template #sidebar>Navigation</template>
              Workspace
            </CmAdminShell>
          </div>
          <ContractExamples slug="admin-shell" />
        </section>
        <section id="demo-setup-layout" class="ui-showcase__demo showcase-panel showcase-panel--wide">
          <h3>Setup layout</h3>
          <p class="ui-showcase__note">
            A single-task page for onboarding steps. Given an aside, it sits beside the form rather than above it once
            there's room -- <code>aside-position</code> picks which side.
          </p>
          <div class="ui-showcase__frame">
            <CmSetupLayout title="Create your workspace" description="This takes a minute.">
              <template #aside>Invite your team once you're set up -- they'll see this workspace immediately.</template>
              Workspace name
              <template #actions>Continue</template>
            </CmSetupLayout>
          </div>
          <ContractExamples slug="setup-layout" />
        </section>
      </div>
    </section>
    <section v-else id="icons" class="showcase-group">
      <header>
        <h2>Icons</h2>
        <p>Review icon geometry and accessible labels.</p>
      </header>
      <div class="showcase-grid">
        <section id="demo-icon" class="ui-showcase__demo showcase-panel">
          <h3>Icon</h3>
          <p class="ui-showcase__note">
            Geometry is precomputed from one source and emitted by both adapters, so neither draws anything. A brand
            mark has one canonical form, and asking for another falls back to the one that exists rather than failing.
          </p>
          <div class="ui-showcase__inline">
            <CmIcon :icon="arrowLeft" label="Back" />
            <CmIcon :icon="gear" variant="solid" label="Settings" />
            <CmIcon :icon="gear" family="duotone" label="Settings, duotone" />
            <CmIcon :icon="github" variant="thin" label="GitHub" />
          </div>
          <ContractExamples slug="icon" />
        </section>
      </div>
      <div
        ref="referenceContent"
        @input="filterIcons"
        @click="copyIcon"
        v-html="renderIconCatalog() + renderOperations()"
      />
    </section>
  </main>
</template>
