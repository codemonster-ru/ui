<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { VfStack } from '@codemonster-ru/vueforge-layouts';
import mayaChenAvatar from '../../assets/maya-chen-avatar.png';
import {
  VfAccordion,
  VfAlert,
  VfAvatar,
  VfBadge,
  VfBreadcrumbs,
  VfButton,
  VfCard,
  VfCheckbox,
  VfCommandPalette,
  VfDataTable,
  VfDrawer,
  VfDialog,
  VfDivider,
  VfDropdown,
  VfField,
  VfFieldset,
  VfIconButton,
  VfInput,
  VfLink,
  VfMenuBar,
  VfNavMenu,
  VfPanel,
  VfPopover,
  VfProgressBar,
  VfProgressSpinner,
  VfRadio,
  VfSelect,
  VfSkeleton,
  VfSkeletonGate,
  VfStepper,
  VfSwitch,
  VfTable,
  VfTableOfContents,
  VfThemeSwitch,
  VfTag,
  VfTabs,
  VfTextarea,
  VfTooltip,
  useTheme,
} from '@codemonster-ru/vueforge-core';
import type {
  VfBreadcrumbItem,
  VfDataTableColumn,
  VfDataTableRow,
  VfNavMenuItem,
  VfStepperItem,
  VfTableOfContentsItem,
} from '@codemonster-ru/vueforge-core';

const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

const dialogOpen = ref(false);
const drawerOpen = ref(false);
const drawerFullscreenOpen = ref(false);
const commandPaletteOpen = ref(false);
const commandPaletteQuery = ref('');
const dialogSize = ref<'sm' | 'md' | 'lg'>('md');
const drawerPlacement = ref<'left' | 'right' | 'top' | 'bottom'>('right');
const formStackNameValue = ref('');
const formStackEmailValue = ref('');
const formStackPlanValue = ref('');
const dynamicProgressValue = ref(0);
const navMenuDefaultValue = ref('installation');
const navMenuPillsValue = ref('quick-start');
const navMenuSidebarValue = ref('quick-start');
const navMenuSidebarNoIconsValue = ref('no-icons-accessibility');
const menuBarDefaultValue = ref('pricing');
const menuBarPillsValue = ref('about');
let dynamicProgressTimer: ReturnType<typeof setInterval> | undefined;

const formGeometrySizes = ['sm', 'md', 'lg'] as const;
const formGeometryFloatingVariants = ['in', 'on', 'over'] as const;
const actionVariants = [
  'primary',
  'secondary',
  'success',
  'info',
  'warn',
  'help',
  'danger',
  'contrast',
  'ghost',
] as const;
const feedbackTones = ['primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const;
const linkTones = ['default', 'muted'] as const;
const linkUnderlines = ['none', 'hover', 'always'] as const;
const overlayPlacements = ['top', 'bottom'] as const;
const dialogSizes = ['sm', 'md', 'lg'] as const;
const drawerPlacements = ['left', 'right', 'top', 'bottom'] as const;

const releaseTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'api', label: 'API' },
  { value: 'status', label: 'Status' },
  { value: 'changelog', label: 'Changelog' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'examples', label: 'Examples' },
  { value: 'guides', label: 'Guides' },
  { value: 'theming', label: 'Theming' },
  { value: 'accessibility', label: 'A11y' },
  { value: 'community', label: 'Community' },
];

const compactOnboardingSteps: VfStepperItem[] = [
  { value: 'start', label: 'Start', description: 'Create account' },
  { value: 'details', label: 'Details', description: 'Add product info' },
  { value: 'plan', label: 'Plan', description: 'Choose rollout' },
  { value: 'launch', label: 'Launch', description: 'Review and publish' },
];

const onboardingSteps: VfStepperItem[] = [
  { value: 'account', label: 'Account', description: 'Create workspace owner' },
  { value: 'profile', label: 'Profile', description: 'Add product and brand details' },
  { value: 'billing', label: 'Billing', description: 'Choose plan and payment method' },
  { value: 'launch', label: 'Launch', description: 'Review configuration and publish' },
];

interface CommandItem {
  title: string;
  label: string;
  section: string;
  snippet: string;
  type: string;
}

const commandPaletteDataset: CommandItem[] = [
  {
    title: 'Getting Started',
    label: 'Getting Started',
    section: 'Guide / Introduction',
    snippet: 'Project setup, quick bootstrap, and base app wiring.',
    type: 'Guide',
  },
  {
    title: 'Installation',
    label: 'Installation',
    section: 'Guide / Setup',
    snippet: 'Install package, register styles, and configure entry point.',
    type: 'Guide',
  },
  {
    title: 'Theme Provider',
    label: 'Theme Provider',
    section: 'Theming / Core',
    snippet: 'Handle system theme sync and manual theme switching.',
    type: 'Guide',
  },
  {
    title: 'VfDialog',
    label: 'VfDialog',
    section: 'Components / Overlay',
    snippet: 'Modal dialog with header, content, footer, and focus trap.',
    type: 'Component',
  },
  {
    title: 'VfDrawer',
    label: 'VfDrawer',
    section: 'Components / Overlay',
    snippet: 'Side panel with responsive sizes and optional fullscreen mode.',
    type: 'Component',
  },
  {
    title: 'VfCommandPalette',
    label: 'VfCommandPalette',
    section: 'Components / Overlay',
    snippet: 'Keyboard-first search overlay for docs and command actions.',
    type: 'Component',
  },
  {
    title: 'VfNavMenu',
    label: 'VfNavMenu',
    section: 'Components / Navigation',
    snippet: 'Tree and pills variants for compact documentation navigation.',
    type: 'Component',
  },
  {
    title: 'VfTableOfContents',
    label: 'VfTableOfContents',
    section: 'Components / Navigation',
    snippet: 'Auto-generated section index with active heading tracking.',
    type: 'Component',
  },
  {
    title: 'VfStepper',
    label: 'VfStepper',
    section: 'Components / Navigation',
    snippet: 'Horizontal and vertical step progress for setup and wizard flows.',
    type: 'Component',
  },
  {
    title: 'Breakpoints',
    label: 'Breakpoints',
    section: 'Foundation / Layout',
    snippet: 'Design tokens for adaptive component and page layouts.',
    type: 'Foundation',
  },
  {
    title: 'Motion',
    label: 'Motion',
    section: 'Foundation / Animation',
    snippet: 'Timing and easing primitives for consistent transitions.',
    type: 'Foundation',
  },
];

const commandPaletteItems = computed(() => {
  const query = commandPaletteQuery.value.trim().toLowerCase();

  if (!query) {
    return [];
  }

  return commandPaletteDataset.filter(
    (item) =>
      item.label.toLowerCase().includes(query) ||
      item.section.toLowerCase().includes(query) ||
      item.snippet.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query),
  );
});

function handleCommandPaletteSelect(item: unknown) {
  if (item == null) {
    return;
  }
}

function handleGlobalCommandPaletteShortcut(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey)) {
    return;
  }

  if (event.key.toLowerCase() !== 'k') {
    return;
  }

  event.preventDefault();
  commandPaletteOpen.value = true;
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalCommandPaletteShortcut);

  dynamicProgressTimer = setInterval(() => {
    const nextStep = Math.random() * 1.4 + 0.35;
    dynamicProgressValue.value =
      dynamicProgressValue.value >= 100 ? 0 : Math.min(dynamicProgressValue.value + nextStep, 100);
  }, 80);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalCommandPaletteShortcut);

  if (dynamicProgressTimer) {
    clearInterval(dynamicProgressTimer);
    dynamicProgressTimer = undefined;
  }
});

const selectOptions = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'team', label: 'Team' },
  { value: 'business', label: 'Business' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
  { value: 'plus', label: 'Plus' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'premium', label: 'Premium' },
  { value: 'ultimate', label: 'Ultimate' },
  { value: 'startup', label: 'Startup' },
  { value: 'agency', label: 'Agency' },
  { value: 'platform', label: 'Platform' },
  { value: 'custom', label: 'Custom' },
];

const docsMenuSimpleItems: VfNavMenuItem[] = [
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

const docsMenuSidebarItems: VfNavMenuItem[] = docsMenuSimpleItems.map((item, index) => ({
  ...item,
  leadingIcon: ['folderOpen', 'grid', 'layers'][index],
}));

const docsMenuSidebarNoIconItems: VfNavMenuItem[] = [
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

const topMenuItems: VfNavMenuItem[] = [
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
  },
  { value: 'about', label: 'About' },
];

const breadcrumbItems: VfBreadcrumbItem[] = [
  { label: 'Docs', href: '#demo-navigation' },
  { label: 'Components', href: '#demo-navigation' },
  { label: 'Navigation', href: '#demo-navigation' },
  { label: 'Menu Bar', current: true },
];

const tocItems: VfTableOfContentsItem[] = [
  { id: 'demo-theme', label: 'Theme', level: 1 },
  { id: 'demo-typography', label: 'Typography', level: 1 },
  { id: 'demo-actions', label: 'Actions and Links', level: 1 },
  { id: 'demo-overlay', label: 'Overlay', level: 1 },
  { id: 'demo-surfaces', label: 'Surface Components', level: 1 },
  { id: 'demo-feedback', label: 'Feedback', level: 1 },
  { id: 'demo-forms', label: 'Forms', level: 1 },
  { id: 'demo-navigation', label: 'Navigation and Disclosure', level: 1 },
  { id: 'demo-dialog', label: 'Modals and Commands', level: 1 },
];

const dataTableColumns: VfDataTableColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
];

const dataTableMetricColumns: VfDataTableColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
];

const dataTableRows: VfDataTableRow[] = [
  { id: 1, member: 'Alice', role: 'Design', status: 'Available', tasks: 12 },
  { id: 2, member: 'Bob', role: 'Platform', status: 'Busy', tasks: 8 },
  { id: 3, member: 'Carol', role: 'Product', status: 'Available', tasks: 15 },
  { id: 4, member: 'Diego', role: 'Design', status: 'Away', tasks: 5 },
  { id: 5, member: 'Eve', role: 'QA', status: 'Offline', tasks: 3 },
  { id: 6, member: 'Frank', role: 'Support', status: 'Available', tasks: 9 },
  { id: 7, member: 'Grace', role: 'Platform', status: 'Busy', tasks: 11 },
];

const tabContent = computed<Record<string, string>>(() => ({
  overview: 'Overview content.',
  api: 'API content.',
  status: 'Status content.',
  changelog: 'Changelog content.',
  roadmap: 'Roadmap content.',
  examples: 'Examples content.',
  guides: 'Guides content.',
  theming: 'Theming content.',
  accessibility: 'Accessibility content.',
  community: 'Community content.',
}));
</script>

<template>
  <div class="demo-page">
    <div class="demo-container">
      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-theme">Theme</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-example">
            <p class="demo-label">vf-theme-provider</p>
            <div class="demo-stack demo-form-stack">
              <div class="demo-inline">
                <VfButton size="sm" variant="secondary" @click="setTheme('light')">Light</VfButton>
                <VfButton size="sm" variant="secondary" @click="setTheme('dark')">Dark</VfButton>
                <VfButton size="sm" variant="secondary" @click="setTheme('system')">System</VfButton>
                <VfButton size="sm" @click="toggleTheme">Toggle</VfButton>
              </div>
              <div class="demo-inline">
                <VfTag tone="primary">mode: {{ theme }}</VfTag>
                <VfTag tone="contrast">resolved: {{ resolvedTheme }}</VfTag>
              </div>
            </div>
          </div>
          <div class="demo-example">
            <p class="demo-label">vf-theme-switch</p>
            <div class="demo-stack demo-form-stack">
              <div class="demo-inline">
                <VfThemeSwitch />
                <VfThemeSwitch static />
                <VfThemeSwitch static thumb-contrast="inverse" />
                <VfThemeSwitch variant="button" />
                <VfThemeSwitch variant="button" button-variant="ghost" />
                <VfThemeSwitch variant="button" size="sm" />
                <VfThemeSwitch variant="button">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </VfThemeSwitch>
                <VfThemeSwitch variant="button" button-variant="ghost">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </VfThemeSwitch>
                <VfThemeSwitch variant="button" size="lg">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </VfThemeSwitch>
              </div>
              <p class="demo-text">
                The switch reflects the resolved theme and turns system mode into an explicit light or dark choice after
                interaction.
              </p>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">Theme utilities</p>
            <p class="demo-text">
              Use the controls above to switch theme mode and verify component contrast in light, dark, and system
              states.
            </p>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-typography">Typography</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-example">
            <p class="demo-label">h1-h6 headings</p>
            <div class="demo-stack demo-form-stack">
              <h1 class="vf-heading vf-heading-h1">Heading H1</h1>
              <h2 class="vf-heading vf-heading-h2">Heading H2</h2>
              <h3 class="vf-heading vf-heading-h3">Heading H3</h3>
              <h4 class="vf-heading vf-heading-h4">Heading H4</h4>
              <h5 class="vf-heading vf-heading-h5">Heading H5</h5>
              <h6 class="vf-heading vf-heading-h6">Heading H6</h6>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">text utilities</p>
            <div class="demo-stack">
              <p class="vf-text-body demo-m-0">Body text utility</p>
              <p class="vf-text-label demo-m-0">Label text utility</p>
              <p class="vf-text-caption demo-m-0">Caption text utility</p>
              <p class="vf-text-body vf-text-muted demo-m-0">Muted body text utility</p>
              <p class="vf-text-body vf-text-primary demo-m-0">Primary body text utility</p>
              <p class="vf-text-body vf-text-success demo-m-0">Success body text utility</p>
              <p class="vf-text-body vf-text-info demo-m-0">Info body text utility</p>
              <p class="vf-text-body vf-text-warn demo-m-0">Warn body text utility</p>
              <p class="vf-text-body vf-text-help demo-m-0">Help body text utility</p>
              <p class="vf-text-body vf-text-danger demo-m-0">Danger body text utility</p>
              <p class="vf-text-body vf-text-contrast demo-m-0">Contrast body text utility</p>
              <p class="vf-text-body demo-m-0">
                Link utility:
                <a href="#demo-typography" class="vf-text-link">Open typography section</a>
              </p>
              <p class="vf-text-body demo-m-0">
                Link utility muted:
                <a href="#demo-typography" class="vf-text-link vf-text-link--muted">Open typography section</a>
              </p>
              <p class="vf-text-body demo-m-0">
                Link utility underline hover:
                <a href="#demo-typography" class="vf-text-link vf-text-link--underline-hover"
                  >Open typography section</a
                >
              </p>
              <p class="vf-text-body demo-m-0">
                Link utility underline always:
                <a href="#demo-typography" class="vf-text-link vf-text-link--underline-always"
                  >Open typography section</a
                >
              </p>
              <p class="vf-text-body demo-m-0">
                Inline code utility:
                <code class="vf-text-code">npm run check</code>
              </p>
              <p class="vf-text-body demo-m-0">
                Mono text utility:
                <span class="vf-text-mono">theme.tokens.headingH1FontSize</span>
              </p>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">content utilities</p>
            <div class="demo-stack">
              <ul class="vf-list-disc">
                <li>Disc list item one</li>
                <li>Disc list item two</li>
              </ul>
              <ol class="vf-list-decimal">
                <li>Decimal list item one</li>
                <li>Decimal list item two</li>
              </ol>
              <ul class="vf-list-reset demo-inline">
                <li><span class="vf-text-code">reset</span></li>
                <li><span class="vf-text-code">list</span></li>
                <li><span class="vf-text-code">utility</span></li>
              </ul>
              <blockquote class="vf-blockquote">
                Utility-driven content rhythm keeps docs and UI copy consistent.
              </blockquote>
              <p class="vf-text-body vf-text-truncate demo-m-0 demo-max-w-16">
                This line demonstrates truncation behavior for long text content in constrained UI areas.
              </p>
              <p class="vf-text-body vf-text-nowrap demo-m-0">
                No-wrap utility keeps short status labels on a single line.
              </p>
              <p class="vf-text-body vf-text-balance demo-m-0 demo-max-w-20">
                Balanced wrapping improves heading and summary rhythm in narrow content columns.
              </p>
              <p class="vf-text-body demo-m-0">
                <span class="vf-sr-only">Utility text for screen readers.</span>
                <span aria-hidden="true">SR-only utility is active.</span>
              </p>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">vf-prose</p>
            <article class="vf-prose">
              <h3>Baseline Example</h3>
              <p>Prose container keeps content rhythm consistent for documentation and text-heavy screens.</p>
              <p>Use <code>vf-prose</code> when regular semantic HTML should look polished by default.</p>
              <ul>
                <li>Aligned heading scale</li>
                <li>Stable paragraph rhythm</li>
                <li>Styled links and inline code</li>
              </ul>
              <blockquote>Typography should feel intentional without manual per-element styling.</blockquote>
              <p>
                Read more in
                <a href="#demo-typography">typography section</a>.
              </p>
            </article>

            <article class="vf-prose">
              <h3>Spacing Matrix</h3>
              <p>
                This matrix intentionally places many neighboring block combinations to reveal where vertical spacing
                feels too tight.
              </p>

              <h4>Heading followed by list</h4>
              <ul>
                <li>Unordered item one</li>
                <li>Unordered item two</li>
              </ul>

              <h4>Heading followed by ordered list</h4>
              <ol>
                <li>Ordered item one</li>
                <li>Ordered item two</li>
              </ol>

              <h4>Heading followed by blockquote</h4>
              <blockquote>Blockquote directly after heading is a common docs pattern.</blockquote>

              <h4>Heading followed by code block</h4>
              <pre><code>npm install vueforge-core</code></pre>

              <h4>Paragraph followed by list</h4>
              <p>Paragraph text should comfortably separate from the list below.</p>
              <ul>
                <li>Paragraph to unordered list</li>
                <li>Second item for rhythm check</li>
              </ul>

              <h4>List followed by heading</h4>
              <ul>
                <li>List content line one</li>
                <li>List content line two</li>
              </ul>
              <h5>Heading after list</h5>
              <p>Subheading after list should not stick to the previous block.</p>

              <h4>Paragraph followed by blockquote</h4>
              <p>Intro sentence before quote.</p>
              <blockquote>Quoted content can look cramped without enough top margin.</blockquote>

              <h4>Blockquote followed by paragraph</h4>
              <blockquote>Another quote to inspect spacing from quote to regular text.</blockquote>
              <p>Body text after quote.</p>

              <h4>Paragraph followed by horizontal rule</h4>
              <p>Some content before separator line.</p>
              <hr />
              <p>Some content after separator line.</p>

              <h4>Mixed list content</h4>
              <ul>
                <li>
                  Item with nested paragraph to inspect inner flow.
                  <p>
                    Nested paragraph in list item with
                    <a href="#demo-actions">inline link</a> and <code>inlineCode()</code>.
                  </p>
                </li>
                <li>Simple sibling item.</li>
              </ul>
            </article>

            <article class="vf-prose">
              <h3>Heading Scale Matrix (H1-H6)</h3>
              <p>
                This block covers all heading levels with common neighboring prose elements for visual rhythm checks.
              </p>

              <h1>Heading 1 followed by paragraph</h1>
              <p>Paragraph after H1 should feel visually connected to heading.</p>

              <h2>Heading 2 followed by list</h2>
              <ul>
                <li>List item one after H2</li>
                <li>List item two after H2</li>
              </ul>

              <h3>Heading 3 followed by code block</h3>
              <pre><code>const headingLevel = 3;</code></pre>

              <h4>Heading 4 followed by blockquote</h4>
              <blockquote>Blockquote after heading should keep balanced separation.</blockquote>

              <h5>Heading 5 followed by paragraph</h5>
              <p>Smaller heading keeps the same typographic rhythm model.</p>

              <h6>Heading 6 followed by paragraph</h6>
              <p>Lowest heading level remains distinct from body text.</p>

              <p>Paragraph followed by H2 for reverse transition check.</p>
              <h2>Heading 2 after paragraph</h2>
              <p>Top heading spacing from body text should feel consistent.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-actions">Actions and Links</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Actions visual QA matrix</p>
            <div class="demo-component-matrix" data-test="action-geometry-matrix">
              <div class="demo-component-matrix__section">
                <p class="demo-text">Button variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div v-for="size in formGeometrySizes" :key="`button-${size}`" class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <VfButton
                        v-for="variant in actionVariants"
                        :key="`${size}-${variant}`"
                        :size="size"
                        :variant="variant"
                      >
                        {{ variant }}
                      </VfButton>
                      <VfButton :size="size" disabled>disabled</VfButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Button loading variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`button-loading-${size}`"
                    class="demo-component-matrix__cell"
                  >
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <VfButton
                        v-for="variant in actionVariants"
                        :key="`${size}-${variant}-loading`"
                        :size="size"
                        :variant="variant"
                        loading
                      >
                        {{ variant }}
                      </VfButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Icon button variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`icon-button-${size}`"
                    class="demo-component-matrix__cell"
                  >
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <VfIconButton
                        v-for="variant in actionVariants"
                        :key="`${size}-${variant}`"
                        :icon="icons.gear"
                        :size="size"
                        :variant="variant"
                        :aria-label="`${variant} ${size} settings`"
                      />
                      <VfIconButton :icon="icons.gear" :size="size" aria-label="Disabled settings" disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Link tone and underline states</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div v-for="tone in linkTones" :key="`link-${tone}`" class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">{{ tone }}</p>
                    <VfLink
                      v-for="underline in linkUnderlines"
                      :key="`${tone}-${underline}`"
                      href="#demo-actions"
                      :tone="tone"
                      :underline="underline"
                    >
                      {{ underline }} underline
                    </VfLink>
                    <VfLink href="https://example.com" target="_blank" :tone="tone" underline="hover">
                      external link
                    </VfLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-overlay">Overlay</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Overlay visual QA matrix</p>
            <div class="demo-component-matrix" data-test="overlay-trigger-matrix">
              <div class="demo-component-matrix__grid">
                <div
                  v-for="placement in overlayPlacements"
                  :key="`tooltip-${placement}`"
                  class="demo-component-matrix__cell"
                >
                  <p class="demo-component-matrix__label">tooltip {{ placement }}</p>
                  <VfTooltip :text="`Tooltip placement: ${placement}`" :placement="placement">
                    <VfButton variant="secondary">{{ placement }}</VfButton>
                  </VfTooltip>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">dropdown default</p>
                  <VfDropdown>
                    <template #trigger>
                      <VfButton tabindex="-1" variant="secondary">Open menu</VfButton>
                    </template>
                    <button class="vf-dropdown__item" role="menuitem">Action one</button>
                    <button class="vf-dropdown__item" role="menuitem">Action two</button>
                  </VfDropdown>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">dropdown pills</p>
                  <VfDropdown variant="pills">
                    <template #trigger>
                      <VfButton tabindex="-1" variant="secondary">Open menu</VfButton>
                    </template>
                    <button class="vf-dropdown__item" role="menuitem">Action one</button>
                    <button class="vf-dropdown__item" role="menuitem">Action two</button>
                  </VfDropdown>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">popover content</p>
                  <VfPopover>
                    <template #trigger>
                      <VfButton tabindex="-1" variant="secondary">Open popover</VfButton>
                    </template>
                    <div class="demo-stack">
                      <p class="demo-text">Compact content block.</p>
                      <VfButton size="sm">Apply</VfButton>
                    </div>
                  </VfPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-surfaces">Surface Components</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Surfaces visual QA matrix</p>
            <div class="demo-component-matrix" data-test="surface-geometry-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">card default</p>
                  <VfCard title="Release Summary">
                    <p class="demo-m-0">Default card spacing with body and footer.</p>
                    <template #footer>
                      <div class="demo-inline">
                        <VfBadge tone="success">Stable</VfBadge>
                        <VfBadge tone="primary">Core</VfBadge>
                      </div>
                    </template>
                  </VfCard>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">card compact</p>
                  <VfCard title="Compact Release" compact>
                    <p class="demo-m-0">Compact card spacing for dense surfaces.</p>
                    <template #footer>
                      <VfTag tone="info">Dense</VfTag>
                    </template>
                  </VfCard>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">panel default</p>
                  <VfPanel title="Supporting Context">
                    <p class="demo-m-0">Panel content with regular treatment.</p>
                  </VfPanel>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">panel subtle</p>
                  <VfPanel title="Subtle Context" subtle>
                    <p class="demo-m-0">Subtle panel treatment for quiet grouping.</p>
                  </VfPanel>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table caption and footer</p>
                  <VfTable caption="Team availability">
                    <template #header>
                      <tr>
                        <th>Member</th>
                        <th>Status</th>
                      </tr>
                    </template>
                    <tr>
                      <td>Alice</td>
                      <td>Available</td>
                    </tr>
                    <tr>
                      <td>Bob</td>
                      <td>Busy</td>
                    </tr>
                    <tr>
                      <td>Carol</td>
                      <td>Available</td>
                    </tr>
                    <tr>
                      <td>Diego</td>
                      <td>Away</td>
                    </tr>
                    <tr>
                      <td>Eve</td>
                      <td>Offline</td>
                    </tr>
                    <template #footer>
                      <tr>
                        <td colspan="2">Total: 5 members</td>
                      </tr>
                    </template>
                  </VfTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table striped</p>
                  <VfTable striped>
                    <template #header>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </template>
                    <tr>
                      <td>Navigation</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Overlay</td>
                      <td>Review</td>
                    </tr>
                    <tr>
                      <td>Forms</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Feedback</td>
                      <td>Testing</td>
                    </tr>
                    <tr>
                      <td>Surfaces</td>
                      <td>Planned</td>
                    </tr>
                  </VfTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table compact</p>
                  <VfTable compact>
                    <template #header>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </template>
                    <tr>
                      <td>Core</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Forms</td>
                      <td>Review</td>
                    </tr>
                    <tr>
                      <td>Navigation</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Overlay</td>
                      <td>Testing</td>
                    </tr>
                    <tr>
                      <td>Feedback</td>
                      <td>Planned</td>
                    </tr>
                  </VfTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table column dividers</p>
                  <VfTable column-dividers>
                    <template #header>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Owner</th>
                      </tr>
                    </template>
                    <tr>
                      <td>Core</td>
                      <td>Stable</td>
                      <td>Design</td>
                    </tr>
                    <tr>
                      <td>Forms</td>
                      <td>Review</td>
                      <td>Product</td>
                    </tr>
                    <tr>
                      <td>Navigation</td>
                      <td>Stable</td>
                      <td>Platform</td>
                    </tr>
                    <tr>
                      <td>Overlay</td>
                      <td>Testing</td>
                      <td>Design</td>
                    </tr>
                    <tr>
                      <td>Feedback</td>
                      <td>Planned</td>
                      <td>Product</td>
                    </tr>
                  </VfTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table sticky header</p>
                  <VfTable class="demo-table-scroll-y" sticky-header>
                    <template #header>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </template>
                    <tr>
                      <td>Core</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Forms</td>
                      <td>Review</td>
                    </tr>
                    <tr>
                      <td>Navigation</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Overlay</td>
                      <td>Testing</td>
                    </tr>
                    <tr>
                      <td>Feedback</td>
                      <td>Planned</td>
                    </tr>
                    <tr>
                      <td>Surfaces</td>
                      <td>Stable</td>
                    </tr>
                    <tr>
                      <td>Progress</td>
                      <td>Review</td>
                    </tr>
                  </VfTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table</p>
                  <VfDataTable
                    caption="Team roster"
                    :columns="dataTableColumns"
                    :rows="dataTableRows"
                    row-key="id"
                    striped
                    column-dividers
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table compact aligned</p>
                  <VfDataTable
                    :columns="dataTableMetricColumns"
                    :rows="dataTableRows"
                    row-key="id"
                    density="compact"
                    striped
                    column-dividers
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table slots and footer</p>
                  <VfDataTable :columns="dataTableMetricColumns" :rows="dataTableRows.slice(0, 5)" row-key="id">
                    <template #header-tasks="{ column }"> {{ column.header }} open </template>
                    <template #cell-status="{ value }">
                      <VfBadge :tone="value === 'Available' ? 'success' : value === 'Busy' ? 'warn' : 'neutral'">
                        {{ value }}
                      </VfBadge>
                    </template>
                    <template #footer>
                      <tr>
                        <td colspan="3">Total: 43 open tasks</td>
                      </tr>
                    </template>
                  </VfDataTable>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table sticky header</p>
                  <VfDataTable
                    class="demo-table-scroll-y"
                    :columns="dataTableColumns"
                    :rows="dataTableRows"
                    row-key="id"
                    sticky-header
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table loading</p>
                  <VfDataTable :columns="dataTableColumns" :rows="dataTableRows.slice(0, 5)" row-key="id" loading />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table skeleton</p>
                  <VfDataTable :columns="dataTableMetricColumns" loading loading-variant="skeleton" :loading-rows="4" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table pagination</p>
                  <VfDataTable
                    :columns="dataTableMetricColumns"
                    :rows="dataTableRows"
                    row-key="id"
                    pagination
                    :default-page-size="3"
                    :page-size-options="[3, 5, 10]"
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">data table empty</p>
                  <VfDataTable :columns="dataTableColumns" empty-text="No team members found" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">divider rhythm</p>
                  <div class="demo-stack">
                    <span class="demo-text">Above</span>
                    <VfDivider />
                    <div class="demo-inline">
                      <span class="demo-text">Left</span>
                      <VfDivider orientation="vertical" />
                      <span class="demo-text">Right</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-feedback">Feedback</h2>
        </div>

        <div class="demo-grid demo-grid--two">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Feedback visual QA matrix</p>
            <div class="demo-component-matrix" data-test="feedback-geometry-matrix">
              <div class="demo-component-matrix__section">
                <p class="demo-text">Alert tones</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <VfAlert v-for="tone in feedbackTones" :key="`alert-${tone}`" :tone="tone" :title="`${tone} alert`">
                    Consistent icon, border, and content spacing.
                  </VfAlert>
                  <VfAlert title="without icon" hide-icon> Text-first alert content alignment. </VfAlert>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Avatars</p>
                <div class="demo-avatar-showcase">
                  <section class="demo-avatar-panel" aria-label="Team member avatars">
                    <div class="demo-avatar-panel__header">
                      <div>
                        <p class="demo-avatar-panel__eyebrow">Project team</p>
                        <p class="demo-avatar-panel__title">Reviewers</p>
                      </div>
                      <VfBadge tone="success">3 online</VfBadge>
                    </div>

                    <div class="demo-avatar-team">
                      <div class="demo-avatar-person">
                        <VfAvatar :image="mayaChenAvatar" image-alt="Maya Chen" shape="circle" />
                        <div class="demo-avatar-person__details">
                          <span class="demo-avatar-person__name">Maya Chen</span>
                          <span class="demo-avatar-person__role">Product design</span>
                        </div>
                        <span
                          class="demo-avatar-person__presence demo-avatar-person__presence--online"
                          aria-label="Online"
                        />
                      </div>

                      <div class="demo-avatar-person">
                        <VfAvatar class="demo-avatar--amber" label="JD" shape="circle" aria-label="Jordan Davis" />
                        <div class="demo-avatar-person__details">
                          <span class="demo-avatar-person__name">Jordan Davis</span>
                          <span class="demo-avatar-person__role">Frontend engineering</span>
                        </div>
                        <span
                          class="demo-avatar-person__presence demo-avatar-person__presence--online"
                          aria-label="Online"
                        />
                      </div>

                      <div class="demo-avatar-person">
                        <VfAvatar class="demo-avatar--teal" label="SR" shape="circle" aria-label="Sam Rivera" />
                        <div class="demo-avatar-person__details">
                          <span class="demo-avatar-person__name">Sam Rivera</span>
                          <span class="demo-avatar-person__role">Quality assurance</span>
                        </div>
                        <span class="demo-avatar-person__presence" aria-label="Away" />
                      </div>
                    </div>
                  </section>

                  <section class="demo-avatar-panel" aria-label="Avatar content variants">
                    <div class="demo-avatar-panel__header">
                      <div>
                        <p class="demo-avatar-panel__eyebrow">Content variants</p>
                        <p class="demo-avatar-panel__title">Flexible fallbacks</p>
                      </div>
                    </div>

                    <div class="demo-avatar-variants">
                      <div class="demo-avatar-variant">
                        <VfAvatar :image="mayaChenAvatar" image-alt="Maya Chen" size="lg" shape="circle" />
                        <span>Image</span>
                      </div>
                      <div class="demo-avatar-variant">
                        <VfAvatar class="demo-avatar--slate" icon="user" size="lg" shape="circle" aria-label="User" />
                        <span>Icon</span>
                      </div>
                      <div class="demo-avatar-variant">
                        <VfAvatar class="demo-avatar--rose" size="lg" shape="circle" aria-label="Unknown user"
                          >?</VfAvatar
                        >
                        <span>Slot</span>
                      </div>
                    </div>

                    <div class="demo-avatar-size-scale" aria-label="Avatar sizes">
                      <VfAvatar
                        class="demo-avatar--violet"
                        label="MC"
                        size="sm"
                        shape="circle"
                        aria-label="Maya Chen"
                      />
                      <VfAvatar
                        class="demo-avatar--violet"
                        label="MC"
                        size="md"
                        shape="circle"
                        aria-label="Maya Chen"
                      />
                      <VfAvatar
                        class="demo-avatar--violet"
                        label="MC"
                        size="lg"
                        shape="circle"
                        aria-label="Maya Chen"
                      />
                      <span>sm · md · lg</span>
                    </div>
                  </section>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Badges and tags</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">badges</p>
                    <div class="demo-inline">
                      <VfBadge>neutral</VfBadge>
                      <VfBadge v-for="tone in feedbackTones" :key="`badge-${tone}`" :tone="tone">
                        {{ tone }}
                      </VfBadge>
                    </div>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">tags</p>
                    <div class="demo-inline">
                      <VfTag>neutral</VfTag>
                      <VfTag v-for="tone in feedbackTones" :key="`tag-${tone}`" :tone="tone">
                        {{ tone }}
                      </VfTag>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Progress indicators</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">progress bars</p>
                    <VfProgressBar :value="42" label="Import progress" />
                    <VfProgressBar :value="7" :max="12" show-value label="Step progress" height="1rem" />
                    <VfProgressBar
                      :value="dynamicProgressValue"
                      show-value
                      tone="success"
                      label="Dynamic progress"
                      height="1rem"
                    />
                    <VfProgressBar :value="64" striped tone="info" label="Striped progress" height="1rem" />
                    <VfProgressBar
                      :value="64"
                      striped
                      animated
                      tone="info"
                      label="Animated striped progress"
                      height="1rem"
                    />
                    <VfProgressBar
                      :value="dynamicProgressValue"
                      striped
                      animated
                      show-value
                      tone="info"
                      label="Installing module progress"
                      height="1rem"
                    />
                    <VfProgressBar indeterminate tone="info" label="Background sync progress" />
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">progress spinners</p>
                    <div class="demo-inline">
                      <VfProgressSpinner label="Loading preview" />
                      <VfProgressSpinner label="Loading large preview" tone="warn" size="2.5rem" :stroke-width="3" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Skeleton loading states</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">skeleton sizes</p>
                    <VfSkeleton min-height="2.5rem" />
                    <VfSkeleton min-height="4rem" radius="var(--vf-radius-surface)" />
                    <VfSkeleton min-height="6rem" :animated="false" />
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">skeleton gate</p>
                    <VfSkeletonGate :ready="false" min-height="6rem" reserve-height="6rem">
                      <VfPanel title="Loaded panel">
                        <p class="demo-m-0">Loaded content preserves geometry.</p>
                      </VfPanel>
                    </VfSkeletonGate>
                    <VfSkeletonGate ready min-height="6rem" reserve-height="6rem">
                      <VfPanel title="Ready panel">
                        <p class="demo-m-0">Ready content replaces the skeleton.</p>
                      </VfPanel>
                    </VfSkeletonGate>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-forms">Forms</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Recommended form stack</p>
            <VfStack class="demo-form-stack">
              <p class="demo-text">
                Use a vertical layout container for form spacing. <code>VfField</code> owns internal label, control,
                description, and error spacing; the form layout should own the gap between fields.
              </p>

              <VfField label="Workspace name" required>
                <template #default="{ controlId, describedBy, invalid, required }">
                  <VfInput
                    :id="controlId"
                    v-model="formStackNameValue"
                    required
                    :aria-required="required ? 'true' : undefined"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="Acme Cloud"
                  />
                </template>
              </VfField>

              <VfField label="Billing email" label-placement="floating" required>
                <template #default="{ controlId, describedBy, invalid, required }">
                  <VfInput
                    :id="controlId"
                    v-model="formStackEmailValue"
                    required
                    :aria-required="required ? 'true' : undefined"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="team@acme.test"
                  />
                </template>
              </VfField>

              <VfField label="Plan" label-placement="floating" floating-variant="over">
                <template #default="{ controlId, describedBy, invalid }">
                  <VfSelect
                    :id="controlId"
                    v-model="formStackPlanValue"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="Choose a plan"
                    :options="selectOptions"
                  />
                </template>
              </VfField>
            </VfStack>
          </div>

          <div class="demo-item demo-item--full">
            <p class="demo-label">Forms visual QA matrix</p>
            <div class="demo-form-geometry" data-test="form-geometry-matrix">
              <div class="demo-form-geometry__section">
                <p class="demo-text">Text controls</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`text-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <VfInput
                      :size="size"
                      model-value="Search query"
                      leading-icon="magnifyingGlass"
                      clearable
                      placeholder="Search"
                    />
                    <VfInput
                      :size="size"
                      model-value="Filtered result"
                      trailing-icon="filter"
                      clearable
                      placeholder="Filter"
                    />
                    <VfSelect
                      :size="size"
                      model-value="pro"
                      leading-icon="layers"
                      trailing-icon="filter"
                      clearable
                      placeholder="Plan"
                      :options="selectOptions"
                    />
                    <VfTextarea
                      :size="size"
                      model-value="A concise multiline value for baseline and padding inspection."
                      placeholder="Notes"
                    />
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Text control states</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`text-states-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <VfInput :size="size" model-value="Default value" placeholder="Default" />
                    <VfInput :size="size" model-value="Invalid value" invalid placeholder="Invalid" />
                    <VfInput :size="size" model-value="Disabled value" disabled placeholder="Disabled" />
                    <VfInput :size="size" model-value="Readonly value" readonly placeholder="Readonly" />
                    <VfInput
                      :size="size"
                      model-value="secret-value"
                      type="password"
                      password-reveal
                      placeholder="Password"
                    />
                    <VfSelect :size="size" model-value="pro" placeholder="Default select" :options="selectOptions" />
                    <VfSelect
                      :size="size"
                      model-value=""
                      invalid
                      placeholder="Invalid select"
                      :options="selectOptions"
                    />
                    <VfSelect
                      :size="size"
                      model-value="team"
                      disabled
                      placeholder="Disabled select"
                      :options="selectOptions"
                    />
                    <VfTextarea :size="size" model-value="Default textarea value" placeholder="Default textarea" />
                    <VfTextarea
                      :size="size"
                      model-value="Invalid textarea value"
                      invalid
                      placeholder="Invalid textarea"
                    />
                    <VfTextarea
                      :size="size"
                      model-value="Disabled textarea value"
                      disabled
                      placeholder="Disabled textarea"
                    />
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Adornments and actions</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`adornments-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <VfInput :size="size" model-value="Leading" leading-icon="magnifyingGlass" />
                    <VfInput :size="size" model-value="Trailing" trailing-icon="filter" />
                    <VfInput :size="size" model-value="Clear" clearable />
                    <VfInput :size="size" model-value="Lead clear" leading-icon="magnifyingGlass" clearable />
                    <VfInput :size="size" model-value="Trail clear" trailing-icon="filter" clearable />
                    <VfInput
                      :size="size"
                      model-value="all-actions"
                      type="password"
                      leading-icon="key"
                      trailing-icon="filter"
                      password-reveal
                      clearable
                    />
                    <VfSelect
                      :size="size"
                      model-value="starter"
                      leading-icon="layers"
                      placeholder="Leading"
                      :options="selectOptions"
                    />
                    <VfSelect
                      :size="size"
                      model-value="team"
                      trailing-icon="filter"
                      placeholder="Trailing"
                      :options="selectOptions"
                    />
                    <VfSelect
                      :size="size"
                      model-value="enterprise"
                      leading-icon="layers"
                      trailing-icon="filter"
                      clearable
                      placeholder="Leading trailing clear"
                      :options="selectOptions"
                    />
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Floating labels</p>
                <div class="demo-form-geometry__grid">
                  <div
                    v-for="variant in formGeometryFloatingVariants"
                    :key="`floating-${variant}`"
                    class="demo-form-geometry__cell"
                  >
                    <p class="demo-form-geometry__label">{{ variant }}</p>
                    <VfField label="Search" label-placement="floating" :floating-variant="variant" required>
                      <template #default="{ controlId, describedBy, invalid, required }">
                        <VfInput
                          :id="controlId"
                          model-value="Search query"
                          required
                          :aria-required="required ? 'true' : undefined"
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Search"
                        />
                      </template>
                    </VfField>
                    <VfField label="Plan" label-placement="floating" :floating-variant="variant">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfSelect
                          :id="controlId"
                          model-value="team"
                          leading-icon="layers"
                          trailing-icon="filter"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Plan"
                          :options="selectOptions"
                        />
                      </template>
                    </VfField>
                    <VfField label="Notes" label-placement="floating" :floating-variant="variant">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfTextarea
                          :id="controlId"
                          model-value="Textarea baseline check"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Notes"
                        />
                      </template>
                    </VfField>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Floating labels by size and fill state</p>
                <div class="demo-form-geometry__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`floating-size-${size}`"
                    class="demo-form-geometry__cell"
                  >
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <VfField label="Empty input" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfInput
                          :id="controlId"
                          :size="size"
                          model-value=""
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Empty"
                        />
                      </template>
                    </VfField>
                    <VfField label="Filled input" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfInput
                          :id="controlId"
                          :size="size"
                          model-value="Filled"
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Filled"
                        />
                      </template>
                    </VfField>
                    <VfField label="Invalid input" label-placement="floating" error="Invalid">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfInput
                          :id="controlId"
                          :size="size"
                          model-value="Invalid"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Invalid"
                        />
                      </template>
                    </VfField>
                    <VfField label="Empty select" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfSelect
                          :id="controlId"
                          :size="size"
                          model-value=""
                          leading-icon="layers"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Empty"
                          :options="selectOptions"
                        />
                      </template>
                    </VfField>
                    <VfField label="Filled select" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfSelect
                          :id="controlId"
                          :size="size"
                          model-value="pro"
                          leading-icon="layers"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Filled"
                          :options="selectOptions"
                        />
                      </template>
                    </VfField>
                    <VfField label="Empty textarea" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfTextarea
                          :id="controlId"
                          :size="size"
                          model-value=""
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Empty"
                        />
                      </template>
                    </VfField>
                    <VfField label="Filled textarea" label-placement="floating">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfTextarea
                          :id="controlId"
                          :size="size"
                          model-value="Filled textarea"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Filled"
                        />
                      </template>
                    </VfField>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Selection controls</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`selection-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <div class="demo-selection-list">
                      <VfCheckbox :size="size" :model-value="true">Checked option</VfCheckbox>
                      <VfCheckbox :size="size" invalid>Invalid option</VfCheckbox>
                      <VfRadio :size="size" model-value="active" value="active" :name="`geometry-radio-${size}`">
                        Active radio
                      </VfRadio>
                      <VfSwitch :size="size" :model-value="true"> Active switch </VfSwitch>
                      <VfSwitch :size="size" :model-value="true">
                        <template #thumb="{ checked }">
                          <VueIconify :icon="checked ? icons.check : icons.xmark" />
                        </template>
                        Icon switch
                      </VfSwitch>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Field containers</p>
                <div class="demo-form-geometry__grid demo-form-geometry__grid--two">
                  <div class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">field</p>
                    <VfField label="Default field" description="Description text" required>
                      <template #default="{ controlId, describedBy, invalid, required }">
                        <VfInput
                          :id="controlId"
                          model-value="Field value"
                          required
                          :aria-required="required ? 'true' : undefined"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Default field"
                        />
                      </template>
                    </VfField>
                    <VfField label="Invalid field" error="Error text">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfInput
                          :id="controlId"
                          model-value="Invalid value"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Invalid field"
                        />
                      </template>
                    </VfField>
                  </div>

                  <div class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">fieldset</p>
                    <VfFieldset label="Notification channels" description="Grouped checkbox controls">
                      <template #default="{ invalid }">
                        <div class="demo-selection-list">
                          <VfCheckbox :model-value="true" :invalid="invalid"> Email alerts </VfCheckbox>
                          <VfCheckbox :invalid="invalid">Slack alerts</VfCheckbox>
                        </div>
                      </template>
                    </VfFieldset>
                    <VfFieldset label="Workspace plan" error="Select one option">
                      <template #default="{ invalid }">
                        <div class="demo-selection-list">
                          <VfRadio model-value="pro" name="fieldset-plan" value="starter" :invalid="invalid">
                            Starter
                          </VfRadio>
                          <VfRadio model-value="pro" name="fieldset-plan" value="pro" :invalid="invalid"> Pro </VfRadio>
                        </div>
                      </template>
                    </VfFieldset>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">Selection states and multiline labels</p>
                <div class="demo-form-geometry__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`selection-states-${size}`"
                    class="demo-form-geometry__cell"
                  >
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <div class="demo-selection-list">
                      <VfCheckbox :size="size">Unchecked checkbox</VfCheckbox>
                      <VfCheckbox :size="size" :model-value="true">Checked checkbox</VfCheckbox>
                      <VfCheckbox :size="size" invalid>Invalid checkbox</VfCheckbox>
                      <VfCheckbox :size="size" disabled>Disabled checkbox</VfCheckbox>
                      <VfCheckbox :size="size" :model-value="true" disabled>Disabled checked checkbox</VfCheckbox>
                      <VfCheckbox :size="size">
                        Multiline checkbox label that wraps to expose control alignment against body copy.
                      </VfCheckbox>
                    </div>
                    <div class="demo-selection-list">
                      <VfRadio :size="size" value="unchecked" :name="`radio-state-${size}`"> Unchecked radio </VfRadio>
                      <VfRadio :size="size" model-value="checked" value="checked" :name="`radio-state-${size}`">
                        Checked radio
                      </VfRadio>
                      <VfRadio :size="size" value="invalid" :name="`radio-invalid-${size}`" invalid>
                        Invalid radio
                      </VfRadio>
                      <VfRadio :size="size" value="disabled" :name="`radio-disabled-${size}`" disabled>
                        Disabled radio
                      </VfRadio>
                      <VfRadio
                        :size="size"
                        model-value="disabled-checked"
                        value="disabled-checked"
                        :name="`radio-disabled-checked-${size}`"
                        disabled
                      >
                        Disabled checked radio
                      </VfRadio>
                      <VfRadio :size="size" value="wrap" :name="`radio-wrap-${size}`">
                        Multiline radio label that wraps to expose control alignment against body copy.
                      </VfRadio>
                    </div>
                    <div class="demo-selection-list">
                      <VfSwitch :size="size">Unchecked switch</VfSwitch>
                      <VfSwitch :size="size" :model-value="true">Checked switch</VfSwitch>
                      <VfSwitch :size="size" invalid>Invalid switch</VfSwitch>
                      <VfSwitch :size="size" static>Static switch</VfSwitch>
                      <VfSwitch :size="size" static thumb-contrast="inverse">Static inverse switch</VfSwitch>
                      <VfSwitch :size="size" disabled>Disabled switch</VfSwitch>
                      <VfSwitch :size="size" :model-value="true" disabled>Disabled checked switch</VfSwitch>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-navigation">Navigation and Disclosure</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Navigation visual QA matrix</p>
            <div class="demo-component-matrix" data-test="navigation-geometry-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">breadcrumbs</p>
                  <VfBreadcrumbs :items="breadcrumbItems" />
                  <VfBreadcrumbs
                    :items="[
                      { label: 'Docs', href: '#demo-navigation' },
                      { label: 'Core', href: '#demo-navigation' },
                      { label: 'Forms', href: '#demo-forms' },
                      { label: 'Field geometry', current: true },
                    ]"
                  />
                  <VfBreadcrumbs :items="breadcrumbItems">
                    <template #separator>/</template>
                  </VfBreadcrumbs>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">tabs</p>
                  <VfTabs model-value="overview" :items="releaseTabs.slice(0, 4)">
                    <template #panel="{ activeValue }">
                      <p class="demo-text">{{ tabContent[activeValue] }}</p>
                    </template>
                  </VfTabs>
                  <VfTabs model-value="status" :items="releaseTabs">
                    <template #panel="{ activeValue }">
                      <p class="demo-text">{{ tabContent[activeValue] }}</p>
                    </template>
                  </VfTabs>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">stepper horizontal</p>
                  <VfStepper
                    model-value="details"
                    :items="compactOnboardingSteps"
                    content-position="above"
                    aria-label="Matrix horizontal stepper above"
                  />
                  <VfStepper
                    model-value="plan"
                    :items="compactOnboardingSteps"
                    content-position="below"
                    aria-label="Matrix horizontal stepper below"
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">stepper vertical</p>
                  <VfStepper
                    model-value="billing"
                    :items="onboardingSteps"
                    orientation="vertical"
                    content-position="end"
                    aria-label="Matrix vertical stepper"
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">accordion states</p>
                  <VfAccordion title="Closed section">Closed content.</VfAccordion>
                  <VfAccordion title="Open section" open>Open content.</VfAccordion>
                  <VfAccordion title="Disabled section" disabled> Disabled content. </VfAccordion>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">menus and toc</p>
                  <VfNavMenu v-model="navMenuDefaultValue" :items="docsMenuSimpleItems" />
                  <VfNavMenu v-model="navMenuPillsValue" :items="docsMenuSimpleItems" variant="pills" />
                  <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                    <div class="demo-component-matrix__cell">
                      <p class="demo-component-matrix__label">sidebar with icons</p>
                      <VfNavMenu v-model="navMenuSidebarValue" :items="docsMenuSidebarItems" variant="sidebar" />
                    </div>
                    <div class="demo-component-matrix__cell">
                      <p class="demo-component-matrix__label">sidebar without icons and wrapping labels</p>
                      <VfNavMenu
                        v-model="navMenuSidebarNoIconsValue"
                        :items="docsMenuSidebarNoIconItems"
                        variant="sidebar"
                      />
                    </div>
                  </div>
                  <VfMenuBar v-model="menuBarDefaultValue" :items="topMenuItems" />
                  <VfMenuBar v-model="menuBarPillsValue" :items="topMenuItems" variant="pills" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">table of contents</p>
                  <VfTableOfContents :items="tocItems.slice(0, 5)" active-id="demo-actions" />
                  <VfTableOfContents :items="tocItems.slice(0, 5)" active-id="demo-actions" variant="pills" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-dialog">Modals and Commands</h2>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Modal visual QA matrix</p>
            <div class="demo-component-matrix" data-test="modal-launcher-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">dialog sizes</p>
                  <div class="demo-inline">
                    <VfButton
                      v-for="size in dialogSizes"
                      :key="`dialog-${size}`"
                      :size="size"
                      @click="
                        dialogSize = size;
                        dialogOpen = true;
                      "
                    >
                      {{ size }} dialog
                    </VfButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">drawer placements</p>
                  <div class="demo-inline">
                    <VfButton
                      v-for="placement in drawerPlacements"
                      :key="`drawer-${placement}`"
                      variant="secondary"
                      @click="
                        drawerPlacement = placement;
                        drawerOpen = true;
                      "
                    >
                      {{ placement }}
                    </VfButton>
                    <VfButton variant="secondary" @click="drawerFullscreenOpen = true"> fullscreen </VfButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">command palette states</p>
                  <div class="demo-inline">
                    <VfButton variant="secondary" @click="commandPaletteOpen = true"> empty query </VfButton>
                    <VfButton
                      variant="secondary"
                      @click="
                        commandPaletteQuery = 'theme';
                        commandPaletteOpen = true;
                      "
                    >
                      matched query
                    </VfButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <VfDialog v-model:open="dialogOpen" title="Dialog" :size="dialogSize" dividers>
      <template #default>
        <div class="demo-stack">
          <p>Dialog content.</p>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="demo-inline">
          <VfButton data-autofocus @click="close">Looks good</VfButton>
          <VfButton variant="secondary" @click="dialogOpen = false">Close</VfButton>
        </div>
      </template>
    </VfDialog>

    <VfDrawer v-model:open="drawerOpen" title="Drawer" :placement="drawerPlacement" dividers>
      <template #default>
        <div class="demo-stack">
          <p class="demo-mt-0">Drawer content.</p>
          <VfInput placeholder="Search in drawer" />
        </div>
      </template>
      <template #footer="{ close }">
        <div class="demo-inline">
          <VfButton data-autofocus @click="close">Apply</VfButton>
          <VfButton variant="secondary" @click="drawerOpen = false">Close</VfButton>
        </div>
      </template>
    </VfDrawer>

    <VfDrawer v-model:open="drawerFullscreenOpen" title="Fullscreen Drawer" size="full" placement="left" dividers>
      <template #default>
        <div class="demo-stack">
          <p class="demo-mt-0">Fullscreen drawer content.</p>
          <VfInput placeholder="Search in fullscreen drawer" />
        </div>
      </template>
      <template #footer="{ close }">
        <div class="demo-inline">
          <VfButton data-autofocus @click="close">Apply</VfButton>
          <VfButton variant="secondary" @click="drawerFullscreenOpen = false">Close</VfButton>
        </div>
      </template>
    </VfDrawer>

    <VfCommandPalette
      v-model:open="commandPaletteOpen"
      v-model="commandPaletteQuery"
      title="Search Documentation"
      placeholder="Search components, guides, and API..."
      :items="commandPaletteItems"
      @select="handleCommandPaletteSelect"
    />
  </div>
</template>
