<script setup lang="ts">
import { ref } from 'vue';
import {
  alertCircle,
  arrowLeft,
  gear,
  github,
  infoCircle,
  magnifyingGlass,
  plus,
  trash,
} from '@codemonster-ru/ui-icons';
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
  <main class="ui-showcase">
    <header class="ui-showcase__intro">
      <h1>CodeMonster UI showcase</h1>
      <p class="ui-showcase__note">
        Every component and layout in <code>@codemonster-ru/ui-vue</code> and <code>@codemonster-ru/ui-layouts</code>,
        rendered live by the Vue adapter. Some carry a VueForge ancestor and some don't -- that distinction lives in
        each component's own history, not in whether it's demonstrated here.
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

    <section id="demo-accordion" class="ui-showcase__demo">
      <h2>Accordion</h2>
      <p class="ui-showcase__note">Disclosure panels sharing one set of expanded ids, so more than one can open.</p>
      <CmAccordion id="showcase-accordion" v-model:open-items="accordionOpenItems" :items="accordionItems" />
    </section>

    <section id="demo-alert" class="ui-showcase__demo">
      <h2>Alert</h2>
      <p class="ui-showcase__note">An inline, non-dismissable status message with a tone; the icon slot is optional.</p>
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
    </section>

    <section id="demo-avatar" class="ui-showcase__demo">
      <h2>Avatar</h2>
      <p class="ui-showcase__note">A person or entity, by image, then initials, then a fallback slot.</p>
      <div class="ui-showcase__inline">
        <CmAvatar label="KK" shape="circle" />
        <CmAvatar label="AI" shape="square" size="lg" />
      </div>
    </section>

    <section id="demo-badge" class="ui-showcase__demo">
      <h2>Badge</h2>
      <p class="ui-showcase__note">A short status label, meant to sit on or beside another element.</p>
      <div class="ui-showcase__inline">
        <CmBadge tone="primary">New</CmBadge>
        <CmBadge tone="danger">Blocked</CmBadge>
      </div>
    </section>

    <section id="demo-breadcrumbs" class="ui-showcase__demo">
      <h2>Breadcrumbs</h2>
      <p class="ui-showcase__note">A trail back up the hierarchy, with the current page marked, not linked.</p>
      <CmBreadcrumbs :items="breadcrumbItems" />
    </section>

    <section id="demo-button" class="ui-showcase__demo">
      <h2>Button</h2>
      <p class="ui-showcase__note">Variant carries intent, not just color; loading disables the control itself.</p>
      <div class="ui-showcase__inline">
        <CmButton variant="primary">Save</CmButton>
        <CmButton variant="secondary">Cancel</CmButton>
        <CmButton variant="danger">Delete</CmButton>
        <CmButton variant="ghost" loading>Loading</CmButton>
      </div>
    </section>

    <section id="demo-card" class="ui-showcase__demo">
      <h2>Card</h2>
      <p class="ui-showcase__note">A titled surface. Header and footer regions appear only when given content.</p>
      <CmCard title="Deploy preview">
        <p>The last commit built successfully and is ready to review.</p>
        <template #footer>
          <CmButton variant="secondary" size="sm">View build</CmButton>
        </template>
      </CmCard>
    </section>

    <section id="demo-checkbox" class="ui-showcase__demo">
      <h2>Checkbox</h2>
      <p class="ui-showcase__note">A tri-state-capable control; indeterminate is visual only, not a value.</p>
      <CmCheckbox v-model="checkboxValue" label="Email me about product updates" />
    </section>

    <section id="demo-command-palette" class="ui-showcase__demo">
      <h2>Command palette</h2>
      <p class="ui-showcase__note">A searchable action list opened as a modal dialog, filtered as you type.</p>
      <CmButton variant="secondary" @click="commandPaletteOpen = true">Open command palette</CmButton>
      <CmCommandPalette
        id="showcase-command-palette"
        v-model:open="commandPaletteOpen"
        title="Commands"
        placeholder="Type a command..."
        :commands="commandPaletteCommands"
      />
    </section>

    <section id="demo-container" class="ui-showcase__demo">
      <h2>Container</h2>
      <p class="ui-showcase__note">Centers content and caps its width at one of a fixed set of sizes.</p>
      <CmContainer size="md" class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">
        This content is centered and width-capped.
      </CmContainer>
    </section>

    <section id="demo-data-table" class="ui-showcase__demo">
      <h2>Data table</h2>
      <p class="ui-showcase__note">
        Columns, rows, sorting, selection, and pagination as data, not markup you assemble by hand.
      </p>
      <CmDataTable id="showcase-data-table" :columns="dataTableColumns" :rows="dataTableRows" />
    </section>

    <section id="demo-date-picker" class="ui-showcase__demo">
      <h2>Date picker</h2>
      <p class="ui-showcase__note">A native date input styled to match the rest of the control set.</p>
      <CmDatePicker id="showcase-date-picker" v-model="datePickerValue" clearable />
    </section>

    <section id="demo-divider" class="ui-showcase__demo">
      <h2>Divider</h2>
      <p class="ui-showcase__note">A semantic separator; orientation flips both its ARIA role and its geometry.</p>
      <CmDivider />
    </section>

    <section id="demo-dialog" class="ui-showcase__demo">
      <h2>Dialog</h2>
      <p class="ui-showcase__note">A modal built on the native &lt;dialog&gt; element, dismissible by default.</p>
      <CmButton variant="secondary" @click="dialogOpen = true">Open dialog</CmButton>
      <CmDialog id="showcase-dialog" v-model:open="dialogOpen" title="Archive this project?" dismissible>
        <p>Archived projects can be restored for 30 days, then they're deleted.</p>
        <template #footer="{ close }">
          <CmButton variant="secondary" @click="close">Cancel</CmButton>
          <CmButton variant="danger" @click="close">Archive</CmButton>
        </template>
      </CmDialog>
    </section>

    <section id="demo-dropdown" class="ui-showcase__demo">
      <h2>Dropdown</h2>
      <p class="ui-showcase__note">A button that opens a menu, closing on selection, outside click, or Escape.</p>
      <CmDropdown id="showcase-dropdown" v-model:open="dropdownOpen" label="Actions" :items="menuItems" />
    </section>

    <section id="demo-drawer" class="ui-showcase__demo">
      <h2>Drawer</h2>
      <p class="ui-showcase__note">A modal that slides in from a screen edge instead of appearing centered.</p>
      <CmButton variant="secondary" @click="drawerOpen = true">Open drawer</CmButton>
      <CmDrawer id="showcase-drawer" v-model:open="drawerOpen" title="Filters" side="end" dismissible>
        <p>Drawer content goes here -- a form, a list, whatever the side panel needs to hold.</p>
      </CmDrawer>
    </section>

    <section id="demo-field" class="ui-showcase__demo">
      <h2>Field</h2>
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
    </section>

    <section id="demo-fieldset" class="ui-showcase__demo">
      <h2>Fieldset</h2>
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
    </section>

    <section id="demo-grid" class="ui-showcase__demo">
      <h2>Grid</h2>
      <p class="ui-showcase__note">
        A CSS grid primitive that auto-fits columns by default; a <code>cm-grid-cols-*</code> utility fixes the count.
      </p>
      <CmGrid class="cm-grid-cols-3">
        <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">1</div>
        <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">2</div>
        <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">3</div>
      </CmGrid>
    </section>

    <section id="demo-icon-button" class="ui-showcase__demo">
      <h2>Icon button</h2>
      <p class="ui-showcase__note">A square button carrying only an icon; <code>label</code> supplies its name.</p>
      <div class="ui-showcase__inline">
        <CmIconButton label="Add" variant="secondary"><CmIcon :icon="plus" /></CmIconButton>
        <CmIconButton label="Search" variant="ghost"><CmIcon :icon="magnifyingGlass" /></CmIconButton>
        <CmIconButton label="Delete" variant="danger"><CmIcon :icon="trash" /></CmIconButton>
      </div>
    </section>

    <section id="demo-input" class="ui-showcase__demo">
      <h2>Input</h2>
      <p class="ui-showcase__note">Text entry, with an optional clear button and, for passwords, a reveal toggle.</p>
      <CmStack>
        <CmInput v-model="inputValue" type="text" placeholder="Project name" clearable />
        <CmInput v-model="passwordValue" type="password" required clearable password-reveal>
          <template #leading>@</template>
          <template #trailing>required</template>
        </CmInput>
      </CmStack>
    </section>

    <section id="demo-inline" class="ui-showcase__demo">
      <h2>Inline</h2>
      <p class="ui-showcase__note">A flex row primitive for laying out a run of small elements.</p>
      <CmInline>
        <CmTag tone="primary">Platform</CmTag>
        <CmTag tone="success">Stable</CmTag>
        <CmTag>Internal</CmTag>
      </CmInline>
    </section>

    <section id="demo-link" class="ui-showcase__demo">
      <h2>Link</h2>
      <p class="ui-showcase__note">A styled anchor with an underline policy and tone, independent of visited state.</p>
      <div class="ui-showcase__inline">
        <CmLink href="#demo-link">Always underlined</CmLink>
        <CmLink href="#demo-link" underline="hover" tone="muted">Underlines on hover</CmLink>
      </div>
    </section>

    <section id="demo-menu" class="ui-showcase__demo">
      <h2>Menu</h2>
      <p class="ui-showcase__note">A standalone list of actions with roving tabindex; Dropdown renders one of these.</p>
      <CmMenu :items="menuItems" aria-label="Row actions" />
    </section>

    <section id="demo-popover" class="ui-showcase__demo">
      <h2>Popover</h2>
      <p class="ui-showcase__note">An anchored panel for arbitrary content, as opposed to Dropdown's fixed menu.</p>
      <CmPopover id="showcase-popover" v-model:open="popoverOpen" label="Details">
        <p>Anything can go in a popover's panel -- text, a form, another component.</p>
      </CmPopover>
    </section>

    <section id="demo-progress-bar" class="ui-showcase__demo">
      <h2>Progress bar</h2>
      <p class="ui-showcase__note">A determinate or indeterminate horizontal progress meter.</p>
      <CmStack>
        <CmProgressBar label="Uploading" :value="62" show-value />
        <CmProgressBar label="Syncing" indeterminate />
      </CmStack>
    </section>

    <section id="demo-progress-spinner" class="ui-showcase__demo">
      <h2>Progress spinner</h2>
      <p class="ui-showcase__note">An indeterminate circular spinner, for a spot too small for a bar.</p>
      <CmProgressSpinner label="Loading" />
    </section>

    <section id="demo-radio" class="ui-showcase__demo">
      <h2>Radio</h2>
      <p class="ui-showcase__note">A mutually exclusive choice; grouping comes from a shared <code>name</code>.</p>
      <div class="ui-showcase__inline">
        <CmRadio v-model="radioValue" name="showcase-radio" value="email" label="Email" />
        <CmRadio v-model="radioValue" name="showcase-radio" value="sms" label="SMS" />
      </div>
    </section>

    <section id="demo-select" class="ui-showcase__demo">
      <h2>Select</h2>
      <p class="ui-showcase__note">A native select styled to match the rest of the control set.</p>
      <CmSelect id="showcase-select" v-model="selectValue" :options="selectOptions" clearable />
    </section>

    <section id="demo-section" class="ui-showcase__demo">
      <h2>Section</h2>
      <p class="ui-showcase__note">A landmark and vertical-rhythm primitive; <code>surface</code> adds a background.</p>
      <CmSection surface>A section with the surface variant.</CmSection>
    </section>

    <section id="demo-skeleton" class="ui-showcase__demo">
      <h2>Skeleton</h2>
      <p class="ui-showcase__note">A loading placeholder shaped like the content it stands in for.</p>
      <CmStack>
        <CmSkeleton min-height="1rem" />
        <CmSkeleton min-height="1rem" style="inline-size: 60%" />
      </CmStack>
    </section>

    <section id="demo-stack" class="ui-showcase__demo">
      <h2>Stack</h2>
      <p class="ui-showcase__note">A flex column primitive, stretched and gapped by default.</p>
      <CmStack>
        <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">1</div>
        <div class="cm-p-4 cm-bg-surface cm-border cm-border-subtle cm-rounded-surface">2</div>
      </CmStack>
    </section>

    <section id="demo-switch" class="ui-showcase__demo">
      <h2>Switch</h2>
      <p class="ui-showcase__note">
        An on/off control with immediate effect, unlike Checkbox's deferred-until-submit norm.
      </p>
      <CmSwitch v-model="switchValue" label="Enable notifications" />
    </section>

    <section id="demo-table" class="ui-showcase__demo">
      <h2>Table</h2>
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
    </section>

    <section id="demo-tabs" class="ui-showcase__demo">
      <h2>Tabs</h2>
      <p class="ui-showcase__note">One panel visible at a time, switched with a roving-tabindex tablist.</p>
      <CmTabs id="showcase-tabs" v-model="tabsValue" :items="tabItems" />
    </section>

    <section id="demo-textarea" class="ui-showcase__demo">
      <h2>Textarea</h2>
      <p class="ui-showcase__note">Multi-line text entry, sharing Input's size and validation states.</p>
      <CmTextarea v-model="textareaValue" placeholder="Leave a comment" />
    </section>

    <section id="demo-tooltip" class="ui-showcase__demo">
      <h2>Tooltip</h2>
      <p class="ui-showcase__note">Shown on focus or hover, never as the only way to reach information.</p>
      <CmTooltip id="showcase-tooltip" label="Info" content="Tooltips are shown on focus or hover, never tap-only." />
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
