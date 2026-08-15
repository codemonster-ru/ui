<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  CmAccordion,
  CmAvatar as VfAvatar,
  CmAlert as VfAlert,
  CmBadge as VfBadge,
  CmBreadcrumbs as VfBreadcrumbs,
  CmButton,
  CmCard as VfCard,
  CmCheckbox,
  CmCheckbox as VfCheckbox,
  CmDivider as VfDivider,
  CmDialog,
  CmField,
  CmFieldset,
  CmIconButton,
  CmInput,
  CmLink,
  CmMenu,
  CmTooltip,
  CmPopover,
  CmProgressBar,
  CmProgressSpinner,
  CmRadio as VfRadio,
  CmSkeleton as VfSkeleton,
  CmStack as VfStack,
  CmSwitch as VfSwitch,
  CmTable as VfTable,
  CmTextarea,
  CmTextarea as VfTextarea,
  type CmBreadcrumbItem,
} from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import mayaChenAvatar from '../../assets/maya-chen-avatar.png';
import '@codemonster-ru/ui-css/accordion.css';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/alert.css';
import '@codemonster-ru/ui-css/breadcrumbs.css';
import '@codemonster-ru/ui-css/checkbox.css';
import '@codemonster-ru/ui-css/dialog.css';
import '@codemonster-ru/ui-css/dropdown.css';
import '@codemonster-ru/ui-css/field.css';
import '@codemonster-ru/ui-css/fieldset.css';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/input.css';
import '@codemonster-ru/ui-css/link.css';
import '@codemonster-ru/ui-css/menu.css';
import '@codemonster-ru/ui-css/popover.css';
import '@codemonster-ru/ui-css/progress-bar.css';
import '@codemonster-ru/ui-css/progress-spinner.css';
import '@codemonster-ru/ui-css/table.css';
import '@codemonster-ru/ui-css/tooltip.css';
import { VfDatePicker, VfField } from '@codemonster-ru/vueforge-core';
import CoreDataTableRecipe, {
  type CoreDataTableRecipeColumn,
  type CoreDataTableRecipeRow,
} from './CoreDataTableRecipe.vue';
import CoreDataTableStateRecipe from './CoreDataTableStateRecipe.vue';
import CoreCommandPaletteRecipe, {
  type CoreCommandPaletteRecipeItem,
} from './CoreCommandPaletteRecipe.vue';
import CoreDatePickerRecipe from './CoreDatePickerRecipe.vue';
import CoreDialogRecipe from './CoreDialogRecipe.vue';
import CoreDrawerRecipe from './CoreDrawerRecipe.vue';
import CoreExpandableDataTableRecipe from './CoreExpandableDataTableRecipe.vue';
import CoreFloatingFieldRecipe from './CoreFloatingFieldRecipe.vue';
import CoreIconSwitchRecipe from './CoreIconSwitchRecipe.vue';
import CoreInputRecipe from './CoreInputRecipe.vue';
import CoreMenuBarRecipe from './CoreMenuBarRecipe.vue';
import CoreNavMenuRecipe from './CoreNavMenuRecipe.vue';
import CorePaginationDataTableRecipe from './CorePaginationDataTableRecipe.vue';
import CorePinnedDataTableRecipe from './CorePinnedDataTableRecipe.vue';
import CoreResizableDataTableRecipe, {
  type CoreResizableDataTableWidths,
} from './CoreResizableDataTableRecipe.vue';
import CoreReorderableDataTableRecipe from './CoreReorderableDataTableRecipe.vue';
import CoreSelectRecipe from './CoreSelectRecipe.vue';
import CoreSelectableDataTableRecipe, {
  type CoreSelectableDataTableRecipeRow,
} from './CoreSelectableDataTableRecipe.vue';
import CoreSlotsDataTableRecipe from './CoreSlotsDataTableRecipe.vue';
import CoreSortableDataTableRecipe, {
  type CoreSortableDataTableSort,
} from './CoreSortableDataTableRecipe.vue';
import CoreStickyDataTableRecipe from './CoreStickyDataTableRecipe.vue';
import CoreStickyTableRecipe from './CoreStickyTableRecipe.vue';
import CoreTabsRecipe from './CoreTabsRecipe.vue';
import type { CoreNavigationRecipeItem } from './core-navigation-recipes.types';
import ShowcaseThemeSwitch from '../../components/ShowcaseThemeSwitch.vue';
import { useShowcaseTheme } from '../../showcase-theme';

const { themeMode: theme, resolvedTheme, setThemeMode: setTheme, toggleTheme } = useShowcaseTheme();

interface CoreShowcaseDataTableRow {
  [key: string]: string | number;
  id: number;
  member: string;
  role: string;
  status: string;
  tasks: number;
  email: string;
  lastActivity: string;
  note: string;
}

const dialogOpen = ref(false);
const drawerOpen = ref(false);
const drawerFullscreenOpen = ref(false);
const commandPaletteOpen = ref(false);
const confirmDialogOpen = ref(false);
const confirmDialogBusy = ref(false);
const confirmDialogError = ref('');
const confirmDialogResult = ref('No action confirmed yet.');
const commandPaletteQuery = ref('');
const groupBoxCollapsed = ref(false);
const dialogSize = ref<'sm' | 'md' | 'lg'>('md');
const drawerPlacement = ref<'left' | 'right' | 'top' | 'bottom'>('right');
const formStackNameValue = ref('');
const formStackEmailValue = ref('');
const formStackPlanValue = ref('');
const datePickerValue = ref('2026-07-30');
const floatingDatePickerValues = ref<Record<'in' | 'on' | 'over', string>>({
  in: '',
  on: '',
  over: '',
});
const dateTimePickerValue = ref('2026-07-30T14:30');
const multipleDatePickerValue = ref(['2026-07-15', '2026-07-30']);
const rangeDatePickerValue = ref(['2026-08-10', '2026-08-20']);
const monthPickerValue = ref('2026-07');
const yearPickerValue = ref('2026');
const constrainedDatePickerValue = ref('2026-08-12');
const dynamicProgressValue = ref(0);
const navMenuDefaultValue = ref('installation');
const navMenuPillsValue = ref('quick-start');
const navMenuSidebarValue = ref('quick-start');
const navMenuSidebarNoIconsValue = ref('no-icons-accessibility');
const menuBarDefaultValue = ref('pricing');
const menuBarPillsValue = ref('about');
const selectedDataTableRowKeys = ref<Array<string | number>>([]);
const expandedDataTableRowKeys = ref<Array<string | number>>([2]);
const dataTableColumnOrder = ref<string[]>([]);
const dataTableColumnWidths = ref<CoreResizableDataTableWidths>({});
const dataTableSort = ref<CoreSortableDataTableSort[]>([]);
const dataTableError = ref(true);
const visibleDataTableColumnKeys = ref(['member', 'status', 'tasks']);
const dataTableColumnChooserOpen = ref(false);
const defaultDropdownOpen = ref(false);
const pillsDropdownOpen = ref(false);
const contentPopoverOpen = ref(false);
const defaultDropdownRoot = ref<HTMLElement | null>(null);
const pillsDropdownRoot = ref<HTMLElement | null>(null);
const contentPopoverRoot = ref<HTMLElement | null>(null);
let dynamicProgressTimer: ReturnType<typeof setInterval> | undefined;
let confirmDialogPreviousBodyOverflow: string | undefined;

const closedAccordionItems = [{ id: 'closed', title: 'Closed section', content: 'Closed content.' }] as const;
const openAccordionItems = [{ id: 'open', title: 'Open section', content: 'Open content.' }] as const;
const disabledAccordionItems = [
  { id: 'disabled', title: 'Disabled section', content: 'Disabled content.', disabled: true },
] as const;
const defaultDropdownItems = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
] as const;
const pillsDropdownItems = [
  { id: 'action-one', label: 'Action one' },
  { id: 'action-two', label: 'Action two' },
] as const;

type OverlayMenuId = 'default' | 'pills';

function overlayMenuState(id: OverlayMenuId) {
  return id === 'default' ? defaultDropdownOpen : pillsDropdownOpen;
}

function overlayMenuRoot(id: OverlayMenuId): HTMLElement | null {
  return (id === 'default' ? defaultDropdownRoot : pillsDropdownRoot).value;
}

async function setOverlayMenuOpen(id: OverlayMenuId, open: boolean, focusItem = false): Promise<void> {
  overlayMenuState(id).value = open;
  if (!open || !focusItem) return;
  await nextTick();
  overlayMenuRoot(id)?.querySelector<HTMLElement>('[data-cm-menu-item]:not([disabled])')?.focus();
}

function restoreOverlayMenuTrigger(id: OverlayMenuId): void {
  overlayMenuRoot(id)?.querySelector<HTMLButtonElement>('.cm-dropdown__trigger')?.focus();
}

function closeOverlayMenu(id: OverlayMenuId, restoreFocus = false): void {
  overlayMenuState(id).value = false;
  if (restoreFocus) restoreOverlayMenuTrigger(id);
}

function handleOverlayMenuTriggerKeydown(event: KeyboardEvent, id: OverlayMenuId): void {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  void setOverlayMenuOpen(id, true, true).then(() => {
    if (event.key !== 'ArrowUp') return;
    const items = overlayMenuRoot(id)?.querySelectorAll<HTMLElement>('[data-cm-menu-item]:not([disabled])');
    items?.[items.length - 1]?.focus();
  });
}

async function setContentPopoverOpen(open: boolean, focusPanel = false): Promise<void> {
  contentPopoverOpen.value = open;
  if (!open || !focusPanel) return;
  await nextTick();
  contentPopoverRoot.value
    ?.querySelector<HTMLElement>(
      '.cm-popover__panel button:not([disabled]), .cm-popover__panel [tabindex]:not([tabindex="-1"])',
    )
    ?.focus();
}

function closeContentPopover(restoreFocus = false): void {
  contentPopoverOpen.value = false;
  if (restoreFocus) contentPopoverRoot.value?.querySelector<HTMLButtonElement>('.cm-popover__trigger')?.focus();
}

function handleContentPopoverKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && contentPopoverOpen.value) {
    event.preventDefault();
    closeContentPopover(true);
  } else if (
    event.key === 'ArrowDown' &&
    event.target instanceof Element &&
    event.target.matches('.cm-popover__trigger')
  ) {
    event.preventDefault();
    void setContentPopoverOpen(true, true);
  }
}

function handleOverlayDocumentClick(event: MouseEvent): void {
  if (!(event.target instanceof Node)) return;
  if (!defaultDropdownRoot.value?.contains(event.target)) closeOverlayMenu('default');
  if (!pillsDropdownRoot.value?.contains(event.target)) closeOverlayMenu('pills');
  if (!contentPopoverRoot.value?.contains(event.target)) closeContentPopover();
}

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
type ActionVariant = (typeof actionVariants)[number];
type SupportedActionVariant = Extract<ActionVariant, 'primary' | 'secondary' | 'danger' | 'ghost'>;
const supportedActionVariants: ReadonlySet<ActionVariant> = new Set<SupportedActionVariant>([
  'primary',
  'secondary',
  'danger',
  'ghost',
]);
const isSupportedActionVariant = (variant: ActionVariant): variant is SupportedActionVariant =>
  supportedActionVariants.has(variant);
const resolveActionVariant = (variant: ActionVariant): SupportedActionVariant =>
  isSupportedActionVariant(variant) ? variant : 'primary';
const resolveFeedbackActionClass = (variant: ActionVariant): string | undefined =>
  isSupportedActionVariant(variant) ? undefined : `demo-feedback-action--${variant}`;
const feedbackTones = ['primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const;
const alertIconByTone = {
  primary: 'infoCircle',
  success: 'checkCircle',
  info: 'infoCircle',
  warn: 'alertCircle',
  help: 'questionCircle',
  danger: 'xCircle',
  contrast: 'infoCircle',
} as const;
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

interface DemoStepperItem {
  value: string;
  label: string;
  description: string;
  disabled?: boolean;
}

type DemoStepperState = 'complete' | 'current' | 'disabled' | 'upcoming';

interface DemoStepperSummaryItem extends DemoStepperItem {
  state: DemoStepperState;
}

const compactOnboardingSteps: DemoStepperItem[] = [
  { value: 'start', label: 'Start', description: 'Create account' },
  { value: 'details', label: 'Details', description: 'Add product info' },
  { value: 'plan', label: 'Plan', description: 'Choose rollout' },
  { value: 'launch', label: 'Launch', description: 'Review and publish' },
];

const onboardingSteps: DemoStepperItem[] = [
  { value: 'account', label: 'Account', description: 'Create workspace owner' },
  { value: 'profile', label: 'Profile', description: 'Add product and brand details' },
  { value: 'billing', label: 'Billing', description: 'Choose plan and payment method' },
  { value: 'launch', label: 'Launch', description: 'Review configuration and publish' },
];

function createStepperSummary(items: DemoStepperItem[], activeValue: string): DemoStepperSummaryItem[] {
  const activeIndex = items.findIndex((item) => item.value === activeValue);

  return items.map((item, index) => ({
    ...item,
    state: item.disabled
      ? 'disabled'
      : index === activeIndex
        ? 'current'
        : index < activeIndex
          ? 'complete'
          : 'upcoming',
  }));
}

const compactOnboardingAboveSteps = createStepperSummary(compactOnboardingSteps, 'details');
const compactOnboardingBelowSteps = createStepperSummary(compactOnboardingSteps, 'plan');
const onboardingVerticalSteps = createStepperSummary(onboardingSteps, 'billing');

const commandPaletteDataset: CoreCommandPaletteRecipeItem[] = [
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

function resetDataTableColumnOrder() {
  dataTableColumnOrder.value = [];
}

function isDataTableRowSelectable(row: CoreShowcaseDataTableRow) {
  return (row as { status?: string }).status !== 'Offline';
}

function cancelExampleDeletion(): void {
  if (confirmDialogBusy.value) return;
  confirmDialogOpen.value = false;
  confirmDialogError.value = '';
}

function handleConfirmDialogOpenChange(open: boolean): void {
  if (!open && confirmDialogBusy.value) return;
  confirmDialogOpen.value = open;
  if (!open) confirmDialogError.value = '';
}

async function confirmExampleDeletion(): Promise<void> {
  if (confirmDialogBusy.value) return;

  confirmDialogBusy.value = true;
  confirmDialogError.value = '';
  try {
    await Promise.resolve();
    confirmDialogResult.value = 'Example user deleted.';
    confirmDialogOpen.value = false;
  } catch {
    confirmDialogError.value = 'The example user could not be deleted. Try again.';
  } finally {
    confirmDialogBusy.value = false;
  }
}

watch(
  confirmDialogOpen,
  (open) => {
    if (typeof document === 'undefined') return;
    if (open) {
      confirmDialogPreviousBodyOverflow ??= document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return;
    }
    if (confirmDialogPreviousBodyOverflow !== undefined) {
      document.body.style.overflow = confirmDialogPreviousBodyOverflow;
      confirmDialogPreviousBodyOverflow = undefined;
    }
  },
  { flush: 'sync' },
);

onMounted(() => {
  window.addEventListener('keydown', handleGlobalCommandPaletteShortcut);
  document.addEventListener('click', handleOverlayDocumentClick);

  dynamicProgressTimer = setInterval(() => {
    const nextStep = Math.random() * 1.4 + 0.35;
    dynamicProgressValue.value =
      dynamicProgressValue.value >= 100 ? 0 : Math.min(dynamicProgressValue.value + nextStep, 100);
  }, 80);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalCommandPaletteShortcut);
  document.removeEventListener('click', handleOverlayDocumentClick);

  if (confirmDialogPreviousBodyOverflow !== undefined) {
    document.body.style.overflow = confirmDialogPreviousBodyOverflow;
    confirmDialogPreviousBodyOverflow = undefined;
  }

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

const docsMenuSimpleItems: CoreNavigationRecipeItem[] = [
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

const docsMenuSidebarItems: CoreNavigationRecipeItem[] = docsMenuSimpleItems.map((item, index) => ({
  ...item,
  leadingIcon: ['folderOpen', 'grid', 'layers'][index],
}));

const docsMenuSidebarNoIconItems: CoreNavigationRecipeItem[] = [
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

const topMenuItems: CoreNavigationRecipeItem[] = [
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

const breadcrumbItems: CmBreadcrumbItem[] = [
  { label: 'Docs', href: '#demo-navigation' },
  { label: 'Components', href: '#demo-navigation' },
  { label: 'Navigation', href: '#demo-navigation' },
  { label: 'Menu Bar', current: true },
];

const tocItems = [
  { id: 'demo-theme', label: 'Theme', level: 1 },
  { id: 'demo-typography', label: 'Typography', level: 1 },
  { id: 'demo-actions', label: 'Actions and Links', level: 1 },
  { id: 'demo-overlay', label: 'Overlay', level: 1 },
  { id: 'demo-surfaces', label: 'Surface Components', level: 1 },
  { id: 'demo-feedback', label: 'Feedback', level: 1 },
  { id: 'demo-forms', label: 'Forms', level: 1 },
  { id: 'demo-navigation', label: 'Navigation and Disclosure', level: 1 },
  { id: 'demo-dialog', label: 'Modals and Commands', level: 1 },
] as const;

function normalizeTocLevel(level: number): number {
  return Math.min(Math.max(level, 1), 6);
}

const dataTableColumns: CoreDataTableRecipeColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
];

const dataTableMetricColumns: CoreDataTableRecipeColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
];

const dataTableSortLabel = computed(() =>
  dataTableSort.value.length
    ? dataTableSort.value.map(({ key, direction }) => `${key} ${direction}`).join(', ')
    : 'none',
);

const dataTableConfigurableColumns: CoreDataTableRecipeColumn[] = [
  { key: 'member', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
  { key: 'tasks', header: 'Tasks', align: 'end' },
];

const requiredDataTableColumnKeys = new Set(['member']);
const optionalDataTableColumns = computed(() =>
  dataTableConfigurableColumns.filter((column) => !requiredDataTableColumnKeys.has(column.key)),
);
const visibleOptionalDataTableColumnCount = computed(
  () => optionalDataTableColumns.value.filter((column) => visibleDataTableColumnKeys.value.includes(column.key)).length,
);
const allDataTableColumnsVisible = computed(
  () => visibleOptionalDataTableColumnCount.value === optionalDataTableColumns.value.length,
);
const someDataTableColumnsVisible = computed(
  () => visibleOptionalDataTableColumnCount.value > 0 && !allDataTableColumnsVisible.value,
);

function commitVisibleDataTableColumns(keys: Iterable<string>): void {
  const visibleKeys = new Set([...keys, ...requiredDataTableColumnKeys]);
  visibleDataTableColumnKeys.value = dataTableConfigurableColumns
    .map((column) => column.key)
    .filter((key) => visibleKeys.has(key));
}

function toggleAllDataTableColumns(checked: boolean): void {
  commitVisibleDataTableColumns(checked ? dataTableConfigurableColumns.map((column) => column.key) : []);
}

function toggleDataTableColumn(key: string, checked: boolean): void {
  const visibleKeys = new Set(visibleDataTableColumnKeys.value);
  if (checked) visibleKeys.add(key);
  else visibleKeys.delete(key);
  commitVisibleDataTableColumns(visibleKeys);
}

function handleDataTableColumnChooserOpenChange(open: boolean): void {
  dataTableColumnChooserOpen.value = open;
  if (!open) {
    void nextTick(() => document.getElementById('data-table-column-chooser-trigger')?.focus());
  }
}

function handleDataTableColumnChooserKeydown(event: KeyboardEvent): void {
  const root = event.currentTarget as HTMLElement | null;
  if (event.key !== 'ArrowDown' || event.target !== root?.querySelector('button')) return;
  event.preventDefault();
  event.stopPropagation();
  dataTableColumnChooserOpen.value = true;
}

const dataTableRows: CoreShowcaseDataTableRow[] = [
  {
    id: 1,
    member: 'Alice',
    role: 'Design',
    status: 'Available',
    tasks: 12,
    email: 'alice@example.com',
    lastActivity: '10 minutes ago',
    note: 'Reviewing the new dashboard flow.',
  },
  {
    id: 2,
    member: 'Bob',
    role: 'Platform',
    status: 'Busy',
    tasks: 8,
    email: 'bob@example.com',
    lastActivity: '25 minutes ago',
    note: 'Preparing the next infrastructure release.',
  },
  {
    id: 3,
    member: 'Carol',
    role: 'Product',
    status: 'Available',
    tasks: 15,
    email: 'carol@example.com',
    lastActivity: '1 hour ago',
    note: 'Collecting feedback for the roadmap.',
  },
  {
    id: 4,
    member: 'Diego',
    role: 'Design',
    status: 'Away',
    tasks: 5,
    email: 'diego@example.com',
    lastActivity: 'Yesterday',
    note: 'Out for a customer research session.',
  },
  {
    id: 5,
    member: 'Eve',
    role: 'QA',
    status: 'Offline',
    tasks: 3,
    email: 'eve@example.com',
    lastActivity: '2 days ago',
    note: 'Documenting regression scenarios.',
  },
  {
    id: 6,
    member: 'Frank',
    role: 'Support',
    status: 'Available',
    tasks: 9,
    email: 'frank@example.com',
    lastActivity: '5 minutes ago',
    note: 'Following up on priority tickets.',
  },
  {
    id: 7,
    member: 'Grace',
    role: 'Platform',
    status: 'Busy',
    tasks: 11,
    email: 'grace@example.com',
    lastActivity: '40 minutes ago',
    note: 'Investigating deployment metrics.',
  },
];

function createCoreDataTableColumns(columns: readonly CoreDataTableRecipeColumn[]): CoreDataTableRecipeColumn[] {
  return columns.map(({ align, header, key }) => ({
    key,
    header: header || key,
    ...(align ? { align } : {}),
  }));
}

function createCoreDataTableRows(
  columns: readonly CoreDataTableRecipeColumn[],
  rows: readonly CoreShowcaseDataTableRow[],
): CoreDataTableRecipeRow[] {
  return rows.map((row) => {
    const source = row as Record<string, unknown>;
    const rowId = source.id;
    const cells = Object.fromEntries(
      columns.map(({ key }) => {
        const value = source[key];
        return [key, typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : null];
      }),
    );

    return { id: typeof rowId === 'string' || typeof rowId === 'number' ? rowId : String(rowId), cells };
  });
}

const coreDataTableColumns = createCoreDataTableColumns(dataTableColumns);
const coreDataTableRows = createCoreDataTableRows(coreDataTableColumns, dataTableRows);
const coreSelectableDataTableRows: CoreSelectableDataTableRecipeRow[] = coreDataTableRows.map((row, index) => ({
  ...row,
  selectable: isDataTableRowSelectable(dataTableRows[index]),
}));
const coreDataTableMetricColumns = createCoreDataTableColumns(dataTableMetricColumns);
const coreDataTableMetricRows = createCoreDataTableRows(coreDataTableMetricColumns, dataTableRows);
const coreDataTableConfigurableColumns = createCoreDataTableColumns(dataTableConfigurableColumns);
const coreDataTableConfigurableRows = createCoreDataTableRows(coreDataTableConfigurableColumns, dataTableRows);

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
          <p class="demo-text">Provide color-mode state and let users switch between system, light, and dark themes.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-example">
            <p class="demo-label">VfThemeProvider</p>
            <div class="demo-stack demo-form-stack">
              <div class="demo-inline">
                <CmButton size="sm" variant="secondary" @click="setTheme('light')">Light</CmButton>
                <CmButton size="sm" variant="secondary" @click="setTheme('dark')">Dark</CmButton>
                <CmButton size="sm" variant="secondary" @click="setTheme('system')">System</CmButton>
                <CmButton size="sm" @click="toggleTheme">Toggle</CmButton>
              </div>
              <div class="demo-inline">
                <span class="demo-application-tag demo-application-tag--primary">mode: {{ theme }}</span>
                <span class="demo-application-tag demo-application-tag--contrast">resolved: {{ resolvedTheme }}</span>
              </div>
            </div>
          </div>
          <div class="demo-example">
            <p class="demo-label">VfThemeSwitch</p>
            <div class="demo-stack demo-form-stack">
              <div class="demo-inline">
                <ShowcaseThemeSwitch />
                <ShowcaseThemeSwitch static-track />
                <ShowcaseThemeSwitch static-track inverse-thumb />
                <ShowcaseThemeSwitch appearance="icon-button" />
                <ShowcaseThemeSwitch appearance="icon-button" button-tone="ghost" />
                <ShowcaseThemeSwitch appearance="icon-button" size="sm" />
                <ShowcaseThemeSwitch appearance="button">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </ShowcaseThemeSwitch>
                <ShowcaseThemeSwitch appearance="button" button-tone="ghost">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </ShowcaseThemeSwitch>
                <ShowcaseThemeSwitch appearance="button" size="lg">
                  {{ resolvedTheme === 'dark' ? 'Dark' : 'Light' }}
                </ShowcaseThemeSwitch>
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
          <p class="demo-text">Review the heading, body, content, and prose styles shared by VueForge interfaces.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-example">
            <p class="demo-label">h1-h6 headings</p>
            <div class="demo-stack demo-form-stack">
              <h1 class="demo-typography-heading demo-typography-heading--h1">Heading H1</h1>
              <h2 class="demo-typography-heading demo-typography-heading--h2">Heading H2</h2>
              <h3 class="demo-typography-heading demo-typography-heading--h3">Heading H3</h3>
              <h4 class="demo-typography-heading demo-typography-heading--h4">Heading H4</h4>
              <h5 class="demo-typography-heading demo-typography-heading--h5">Heading H5</h5>
              <h6 class="demo-typography-heading demo-typography-heading--h6">Heading H6</h6>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">text utilities</p>
            <div class="demo-stack">
              <p class="demo-typography-body demo-m-0">Body text utility</p>
              <p class="demo-typography-label demo-m-0">Label text utility</p>
              <p class="demo-typography-caption demo-m-0">Caption text utility</p>
              <p class="demo-typography-body demo-typography-muted demo-m-0">Muted body text utility</p>
              <p class="demo-typography-body demo-typography-primary demo-m-0">Primary body text utility</p>
              <p class="demo-typography-body demo-typography-success demo-m-0">Success body text utility</p>
              <p class="demo-typography-body demo-typography-info demo-m-0">Info body text utility</p>
              <p class="demo-typography-body demo-typography-warn demo-m-0">Warn body text utility</p>
              <p class="demo-typography-body demo-typography-help demo-m-0">Help body text utility</p>
              <p class="demo-typography-body demo-typography-danger demo-m-0">Danger body text utility</p>
              <p class="demo-typography-body demo-typography-contrast demo-m-0">Contrast body text utility</p>
              <p class="demo-typography-body demo-m-0">
                Link utility:
                <CmLink href="#demo-typography">Open typography section</CmLink>
              </p>
              <p class="demo-typography-body demo-m-0">
                Link utility muted:
                <CmLink href="#demo-typography" tone="muted">Open typography section</CmLink>
              </p>
              <p class="demo-typography-body demo-m-0">
                Link utility underline hover:
                <CmLink href="#demo-typography" underline="hover">Open typography section</CmLink>
              </p>
              <p class="demo-typography-body demo-m-0">
                Link utility underline always:
                <CmLink href="#demo-typography" underline="always">Open typography section</CmLink>
              </p>
              <p class="demo-typography-body demo-m-0">
                Inline code utility:
                <code class="demo-typography-code">npm run check</code>
              </p>
              <p class="demo-typography-body demo-m-0">
                Mono text utility:
                <span class="demo-typography-mono">theme.tokens.headingH1FontSize</span>
              </p>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">content utilities</p>
            <div class="demo-stack">
              <ul class="demo-content-list demo-content-list--disc">
                <li>Disc list item one</li>
                <li>Disc list item two</li>
              </ul>
              <ol class="demo-content-list demo-content-list--decimal">
                <li>Decimal list item one</li>
                <li>Decimal list item two</li>
              </ol>
              <ul class="demo-content-list--reset demo-inline">
                <li><span class="demo-typography-code">reset</span></li>
                <li><span class="demo-typography-code">list</span></li>
                <li><span class="demo-typography-code">utility</span></li>
              </ul>
              <blockquote class="demo-content-blockquote">
                Utility-driven content rhythm keeps docs and UI copy consistent.
              </blockquote>
              <p class="demo-typography-body demo-typography-truncate demo-m-0 demo-max-w-16">
                This line demonstrates truncation behavior for long text content in constrained UI areas.
              </p>
              <p class="demo-typography-body demo-typography-nowrap demo-m-0 demo-nowrap-preview">
                No-wrap utility keeps short status labels on a single line.
              </p>
              <p class="demo-typography-body demo-typography-balance demo-m-0 demo-max-w-20">
                Balanced wrapping improves heading and summary rhythm in narrow content columns.
              </p>
              <p class="demo-typography-body demo-m-0">
                <span class="demo-visually-hidden">Utility text for screen readers.</span>
                <span aria-hidden="true">SR-only utility is active.</span>
              </p>
            </div>
          </div>

          <div class="demo-example">
            <p class="demo-label">vf-prose</p>
            <article class="demo-prose">
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

            <article class="demo-prose">
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

            <article class="demo-prose">
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
          <p class="demo-text">Use buttons for actions and links for navigation to another location or resource.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Actions visual QA matrix</p>
            <div class="demo-component-matrix" data-test="action-geometry-matrix">
              <div class="demo-component-matrix__section">
                <p class="demo-text">VfButton · variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div v-for="size in formGeometrySizes" :key="`button-${size}`" class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <template v-for="variant in actionVariants" :key="`${size}-${variant}`">
                        <CmButton
                          :class="resolveFeedbackActionClass(variant)"
                          :size="size"
                          :variant="resolveActionVariant(variant)"
                        >
                          {{ variant }}
                        </CmButton>
                      </template>
                      <CmButton :size="size" disabled>disabled</CmButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">VfButton · loading variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`button-loading-${size}`"
                    class="demo-component-matrix__cell"
                  >
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <template v-for="variant in actionVariants" :key="`${size}-${variant}-loading`">
                        <CmButton
                          :class="resolveFeedbackActionClass(variant)"
                          :size="size"
                          :variant="resolveActionVariant(variant)"
                          loading
                        >
                          {{ variant }}
                        </CmButton>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">VfIconButton · variants by size</p>
                <div class="demo-component-matrix__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`icon-button-${size}`"
                    class="demo-component-matrix__cell"
                  >
                    <p class="demo-component-matrix__label">{{ size }}</p>
                    <div class="demo-inline">
                      <template v-for="variant in actionVariants" :key="`${size}-${variant}`">
                        <CmIconButton
                          :class="resolveFeedbackActionClass(variant)"
                          :label="`${variant} ${size} settings`"
                          :size="size"
                          :variant="resolveActionVariant(variant)"
                        >
                          <VueIconify :icon="icons.gear" :size="`var(--cm-icon-size-${size})`" />
                        </CmIconButton>
                      </template>
                      <CmIconButton label="Disabled settings" :size="size" disabled>
                        <VueIconify :icon="icons.gear" :size="`var(--cm-icon-size-${size})`" />
                      </CmIconButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">VfLink · tone and underline states</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div v-for="tone in linkTones" :key="`link-${tone}`" class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">{{ tone }}</p>
                    <CmLink
                      v-for="underline in linkUnderlines"
                      :key="`${tone}-${underline}`"
                      href="#demo-actions"
                      :tone="tone"
                      :underline="underline"
                    >
                      {{ underline }} underline
                    </CmLink>
                    <CmLink href="https://example.com" target="_blank" :tone="tone" underline="hover">
                      external link
                    </CmLink>
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
          <p class="demo-text">Attach contextual help, menus, and compact interactive content to a trigger.</p>
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
                  <p class="demo-component-matrix__label">VfTooltip · {{ placement }}</p>
                  <CmTooltip
                    :id="`demo-${placement}-tooltip`"
                    class="demo-application-overlay-trigger"
                    :label="`${placement} tooltip`"
                    :content="`Tooltip placement: ${placement}`"
                    :placement="placement"
                  >
                    <template #trigger>{{ placement }}</template>
                  </CmTooltip>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDropdown + VfMenu + VfMenuItem · default</p>
                  <div
                    id="demo-default-dropdown"
                    ref="defaultDropdownRoot"
                    class="cm-dropdown demo-application-dropdown"
                    :class="{ 'cm-dropdown--open': defaultDropdownOpen }"
                    data-cm-controller="dropdown"
                  >
                    <button
                      id="demo-default-dropdown-trigger"
                      class="cm-dropdown__trigger"
                      type="button"
                      aria-haspopup="menu"
                      aria-controls="demo-default-dropdown-menu"
                      :aria-expanded="defaultDropdownOpen"
                      @click="defaultDropdownOpen = !defaultDropdownOpen"
                      @keydown="handleOverlayMenuTriggerKeydown($event, 'default')"
                    >
                      Open menu
                    </button>
                    <CmMenu
                      id="demo-default-dropdown-menu"
                      class="cm-dropdown__menu"
                      :items="defaultDropdownItems"
                      aria-labelledby="demo-default-dropdown-trigger"
                      :hidden="!defaultDropdownOpen"
                      @select="closeOverlayMenu('default', true)"
                      @close-request="closeOverlayMenu('default', true)"
                    >
                      <template #itemEdit>
                        <span class="demo-application-menu-item-content">
                          <VueIconify :icon="icons.pencil" size="var(--cm-icon-size-md)" aria-hidden="true" />
                          <span>Edit</span>
                        </span>
                      </template>
                      <template #itemDelete>
                        <span class="demo-application-menu-item-content">
                          <VueIconify :icon="icons.trash" size="var(--cm-icon-size-md)" aria-hidden="true" />
                          <span>Delete</span>
                        </span>
                      </template>
                    </CmMenu>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDropdown · pills</p>
                  <div
                    id="demo-pills-dropdown"
                    ref="pillsDropdownRoot"
                    class="cm-dropdown demo-application-dropdown demo-application-dropdown--pills"
                    :class="{ 'cm-dropdown--open': pillsDropdownOpen }"
                    data-cm-controller="dropdown"
                  >
                    <button
                      id="demo-pills-dropdown-trigger"
                      class="cm-dropdown__trigger"
                      type="button"
                      aria-haspopup="menu"
                      aria-controls="demo-pills-dropdown-menu"
                      :aria-expanded="pillsDropdownOpen"
                      @click="pillsDropdownOpen = !pillsDropdownOpen"
                      @keydown="handleOverlayMenuTriggerKeydown($event, 'pills')"
                    >
                      Open menu
                    </button>
                    <CmMenu
                      id="demo-pills-dropdown-menu"
                      class="cm-dropdown__menu"
                      :items="pillsDropdownItems"
                      aria-labelledby="demo-pills-dropdown-trigger"
                      :hidden="!pillsDropdownOpen"
                      @select="closeOverlayMenu('pills', true)"
                      @close-request="closeOverlayMenu('pills', true)"
                    />
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfPopover · content</p>
                  <div
                    id="demo-content-popover"
                    ref="contentPopoverRoot"
                    class="cm-popover demo-application-popover"
                    :class="{ 'cm-popover--open': contentPopoverOpen }"
                    data-cm-controller="popover"
                    @keydown="handleContentPopoverKeydown"
                  >
                    <button
                      id="demo-content-popover-trigger"
                      class="cm-popover__trigger"
                      type="button"
                      aria-controls="demo-content-popover-panel"
                      :aria-expanded="contentPopoverOpen"
                      @click="contentPopoverOpen = !contentPopoverOpen"
                    >
                      Open popover
                    </button>
                    <div
                      id="demo-content-popover-panel"
                      class="cm-popover__panel"
                      role="dialog"
                      aria-labelledby="demo-content-popover-trigger"
                      :hidden="!contentPopoverOpen"
                    >
                      <div class="demo-stack">
                        <p class="demo-text">Compact content block.</p>
                        <CmButton size="sm">Apply</CmButton>
                      </div>
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
          <h2 id="demo-surfaces">Surface Components</h2>
          <p class="demo-text">Structure related content, data, and controls on bounded surfaces.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Surfaces visual QA matrix</p>
            <div class="demo-component-matrix" data-test="surface-geometry-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfCard · default</p>
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
                  <p class="demo-component-matrix__label">VfCard · compact</p>
                  <VfCard title="Compact Release" compact>
                    <p class="demo-m-0">Compact card spacing for dense surfaces.</p>
                    <template #footer>
                      <span class="demo-application-tag demo-application-tag--info">Dense</span>
                    </template>
                  </VfCard>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfPanel · default</p>
                  <section class="demo-application-panel">
                    <header>
                      <h3 class="demo-application-panel__title">Supporting Context</h3>
                    </header>
                    <p class="demo-m-0">Panel content with regular treatment.</p>
                  </section>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfPanel · subtle</p>
                  <section class="demo-application-panel demo-application-panel--subtle">
                    <header>
                      <h3 class="demo-application-panel__title">Subtle Context</h3>
                    </header>
                    <p class="demo-m-0">Subtle panel treatment for quiet grouping.</p>
                  </section>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfGroupBox · default</p>
                  <fieldset class="demo-application-group-box">
                    <legend class="demo-application-group-box__legend">
                      <span class="demo-application-group-box__title">Shipping address</span>
                    </legend>
                    <div class="demo-application-group-box__content">
                      <p class="demo-m-0">1234 Elm Street, San Francisco, CA 94102</p>
                    </div>
                  </fieldset>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfGroupBox · collapsible</p>
                  <fieldset
                    class="demo-application-group-box demo-application-group-box--collapsible"
                    :class="{ 'demo-application-group-box--collapsed': groupBoxCollapsed }"
                  >
                    <legend class="demo-application-group-box__legend">
                      <button
                        id="invoice-details-toggle"
                        class="demo-application-group-box__trigger"
                        type="button"
                        aria-controls="invoice-details-content"
                        :aria-expanded="!groupBoxCollapsed"
                        @click="groupBoxCollapsed = !groupBoxCollapsed"
                      >
                        <span class="demo-application-group-box__icon" aria-hidden="true">
                          <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
                        </span>
                        <span class="demo-application-group-box__title">Invoice details</span>
                      </button>
                    </legend>
                    <div
                      v-if="!groupBoxCollapsed"
                      id="invoice-details-content"
                      class="demo-application-group-box__content demo-application-group-box__content--collapsible"
                      role="region"
                      aria-labelledby="invoice-details-toggle"
                    >
                      <p class="demo-m-0">Invoice #1024 · Design service · $120.00</p>
                    </div>
                  </fieldset>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfTable · caption and footer</p>
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
                  <p class="demo-component-matrix__label">VfTable · striped</p>
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
                  <p class="demo-component-matrix__label">VfTable · compact</p>
                  <VfTable density="compact">
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
                  <p class="demo-component-matrix__label">VfTable · column dividers</p>
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
                  <p class="demo-component-matrix__label">VfTable · sticky header</p>
                  <CoreStickyTableRecipe />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · default</p>
                  <CoreDataTableRecipe
                    id="core-data-table-default"
                    caption="Team roster"
                    :columns="coreDataTableColumns"
                    :rows="coreDataTableRows"
                    striped
                    column-dividers
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · compact aligned</p>
                  <CoreDataTableRecipe
                    id="core-data-table-compact"
                    label="Team metrics"
                    :columns="coreDataTableMetricColumns"
                    :rows="coreDataTableMetricRows"
                    density="compact"
                    striped
                    column-dividers
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable + VfDataTableColumnChooser</p>
                  <div class="demo-stack">
                    <div class="demo-inline">
                      <CmPopover
                        id="data-table-column-chooser"
                        class="demo-application-column-chooser"
                        label="Configure columns"
                        title="Configure columns"
                        :open="dataTableColumnChooserOpen"
                        placement="bottom-start"
                        @keydown.capture="handleDataTableColumnChooserKeydown"
                        @update:open="handleDataTableColumnChooserOpenChange"
                      >
                        <template #trigger>
                          <VueIconify :icon="icons.gear" size="var(--cm-icon-size-sm)" />
                        </template>
                        <span class="demo-application-column-chooser__arrow" aria-hidden="true" />
                        <div class="demo-application-column-chooser__options">
                          <div class="demo-application-column-chooser__all">
                            <CmCheckbox
                              :model-value="allDataTableColumnsVisible"
                              :indeterminate="someDataTableColumnsVisible"
                              label="All columns"
                              @update:model-value="toggleAllDataTableColumns"
                            />
                          </div>
                          <CmCheckbox
                            v-for="column in dataTableConfigurableColumns"
                            :key="column.key"
                            :model-value="visibleDataTableColumnKeys.includes(column.key)"
                            :label="column.header || column.key"
                            :disabled="requiredDataTableColumnKeys.has(column.key)"
                            @update:model-value="toggleDataTableColumn(column.key, $event)"
                          />
                        </div>
                      </CmPopover>
                      <span class="demo-text">Member is always visible</span>
                    </div>
                    <CoreDataTableRecipe
                      id="core-data-table-column-chooser"
                      :visible-column-keys="visibleDataTableColumnKeys"
                      caption="Configurable team roster"
                      :columns="coreDataTableConfigurableColumns"
                      :rows="coreDataTableConfigurableRows"
                      striped
                      column-dividers
                    />
                  </div>
                </div>

                <div class="demo-component-matrix__cell demo-item--full">
                  <p class="demo-component-matrix__label">VfDataTable · resizable columns</p>
                  <CoreResizableDataTableRecipe v-model:widths="dataTableColumnWidths" />
                </div>

                <div class="demo-component-matrix__cell demo-item--full">
                  <p class="demo-component-matrix__label">VfDataTable · reorderable columns</p>
                  <div class="demo-stack">
                    <div class="demo-inline">
                      <CmButton
                        size="sm"
                        variant="secondary"
                        :disabled="dataTableColumnOrder.length === 0"
                        @click="resetDataTableColumnOrder"
                      >
                        Reset order
                      </CmButton>
                    </div>
                    <p class="demo-text">
                      Drag anywhere in a column header to preview the animated new order, then release to commit. You
                      can also focus a header and press Left or Right Arrow. Reset restores the declared column order.
                    </p>
                    <CoreReorderableDataTableRecipe
                      v-model:column-order="dataTableColumnOrder"
                      :columns="coreDataTableConfigurableColumns"
                      :rows="coreDataTableConfigurableRows"
                    />
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · selection</p>
                  <CoreSelectableDataTableRecipe
                    id="core-selectable-data-table"
                    v-model:selected-row-ids="selectedDataTableRowKeys"
                    label="Selectable team roster"
                    :columns="coreDataTableColumns"
                    :rows="coreSelectableDataTableRows"
                    striped
                    column-dividers
                  />
                  <div class="demo-inline">
                    <span class="demo-text">{{ selectedDataTableRowKeys.length }} rows selected</span>
                    <span class="demo-text">Offline rows are unavailable</span>
                    <CmButton
                      size="sm"
                      variant="secondary"
                      :disabled="selectedDataTableRowKeys.length === 0"
                      @click="selectedDataTableRowKeys = []"
                    >
                      Clear selection
                    </CmButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · slots and footer</p>
                  <CoreSlotsDataTableRecipe />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · expandable rows</p>
                  <CoreExpandableDataTableRecipe v-model:expanded-ids="expandedDataTableRowKeys" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · sticky header</p>
                  <CoreStickyDataTableRecipe />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · pinned columns</p>
                  <div class="demo-stack">
                    <p class="demo-text">Scroll horizontally to keep Member and Actions visible.</p>
                    <CorePinnedDataTableRecipe />
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · loading</p>
                  <CoreDataTableStateRecipe variant="loading" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · skeleton</p>
                  <CoreDataTableStateRecipe variant="skeleton" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · error</p>
                  <div class="demo-stack">
                    <CoreDataTableStateRecipe
                      variant="error"
                      :error="dataTableError"
                      @retry="dataTableError = false"
                    />
                    <div v-if="!dataTableError" class="demo-inline">
                      <CmButton size="sm" variant="secondary" @click="dataTableError = true">
                        Show error state
                      </CmButton>
                    </div>
                  </div>
                </div>

                <div class="demo-component-matrix__cell demo-item--full">
                  <p class="demo-component-matrix__label">VfDataTable · sorting</p>
                  <div class="demo-stack">
                    <p class="demo-text">
                      Click headers to add sort columns in priority order. Sorting is applied to all rows before
                      pagination.
                    </p>
                    <CoreSortableDataTableRecipe v-model:sort="dataTableSort" />
                    <p class="demo-text" aria-live="polite">
                      Sort: <code>{{ dataTableSortLabel }}</code>
                    </p>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · pagination</p>
                  <CorePaginationDataTableRecipe />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDataTable · empty</p>
                  <CoreDataTableRecipe
                    id="core-data-table-empty"
                    label="Empty team roster"
                    :columns="coreDataTableColumns"
                    empty-text="No team members found"
                  />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDivider · rhythm</p>
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
          <p class="demo-text">
            Communicate status, identity, progress, and loading state without interrupting the task.
          </p>
        </div>

        <div class="demo-grid demo-grid--two">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Feedback visual QA matrix</p>
            <div class="demo-component-matrix" data-test="feedback-geometry-matrix">
              <div class="demo-component-matrix__section">
                <p class="demo-text">VfAlert · tones</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <VfAlert
                    v-for="tone in feedbackTones"
                    :key="`alert-${tone}`"
                    :tone="tone === 'warn' ? 'warning' : tone"
                    :title="`${tone} alert`"
                    role="alert"
                  >
                    <template #icon>
                      <VueIconify :icon="alertIconByTone[tone]" size="var(--cm-icon-size-lg)" />
                    </template>
                    Consistent icon, border, and content spacing.
                  </VfAlert>
                  <VfAlert tone="primary" title="without icon" role="alert">
                    Text-first alert content alignment.
                  </VfAlert>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">VfAvatar</p>
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
                        <VfAvatar class="demo-avatar--slate" size="lg" shape="circle" aria-label="User">
                          <VueIconify class="cm-avatar__icon" icon="user" aria-hidden="true" />
                        </VfAvatar>
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
                <p class="demo-text">VfBadge + VfTag · tones</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfBadge</p>
                    <div class="demo-inline">
                      <VfBadge>neutral</VfBadge>
                      <VfBadge
                        v-for="tone in feedbackTones"
                        :key="`badge-${tone}`"
                        :tone="tone === 'warn' ? 'warning' : tone"
                      >
                        {{ tone }}
                      </VfBadge>
                    </div>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfTag</p>
                    <div class="demo-inline">
                      <span class="demo-application-tag">neutral</span>
                      <span
                        v-for="tone in feedbackTones"
                        :key="`tag-${tone}`"
                        class="demo-application-tag"
                        :class="`demo-application-tag--${tone}`"
                      >
                        {{ tone }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Progress indicators</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfProgressBar</p>
                    <CmProgressBar :value="42" label="Import progress" />
                    <CmProgressBar
                      class="demo-application-progress-bar--tall"
                      :value="7"
                      :max="12"
                      show-value
                      label="Step progress"
                    />
                    <CmProgressBar
                      class="demo-application-progress-bar--tall"
                      :value="dynamicProgressValue"
                      show-value
                      tone="success"
                      label="Dynamic progress"
                    />
                    <CmProgressBar
                      class="cm-progress-bar--striped demo-application-progress-bar--tall"
                      :value="64"
                      tone="info"
                      label="Striped progress"
                    />
                    <CmProgressBar
                      class="cm-progress-bar--striped cm-progress-bar--animated demo-application-progress-bar--tall"
                      :value="64"
                      tone="info"
                      label="Animated striped progress"
                    />
                    <CmProgressBar
                      class="cm-progress-bar--striped cm-progress-bar--animated demo-application-progress-bar--tall"
                      :value="dynamicProgressValue"
                      show-value
                      tone="info"
                      label="Installing module progress"
                    />
                    <CmProgressBar indeterminate tone="info" label="Background sync progress" />
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfProgressSpinner</p>
                    <div class="demo-inline">
                      <CmProgressSpinner label="Loading preview" />
                      <CmProgressSpinner
                        class="demo-application-progress-spinner--large-warning"
                        label="Loading large preview"
                        tone="warning"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-component-matrix__section">
                <p class="demo-text">Skeleton loading states</p>
                <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfSkeleton · sizes</p>
                    <VfSkeleton min-height="2.5rem" />
                    <VfSkeleton min-height="4rem" />
                    <VfSkeleton min-height="6rem" :animated="false" />
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">VfSkeletonGate</p>
                    <div class="demo-application-busy" aria-busy="true">
                      <div class="demo-application-busy__content" aria-hidden="true" inert>
                        <section class="demo-application-panel">
                          <header>
                            <h3 class="demo-application-panel__title">Loaded panel</h3>
                          </header>
                          <p class="demo-m-0">Loaded content preserves geometry.</p>
                        </section>
                      </div>
                      <div class="demo-application-busy__overlay" aria-hidden="true">
                        <VfSkeleton min-height="6rem" />
                      </div>
                    </div>
                    <div class="demo-application-busy">
                      <div class="demo-application-busy__content demo-application-busy__content--ready">
                        <section class="demo-application-panel">
                          <header>
                            <h3 class="demo-application-panel__title">Ready panel</h3>
                          </header>
                          <p class="demo-m-0">Ready content replaces the skeleton.</p>
                        </section>
                      </div>
                      <div class="demo-application-busy__overlay" aria-hidden="true" hidden>
                        <VfSkeleton min-height="6rem" />
                      </div>
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
          <h2 id="demo-forms">Forms</h2>
          <p class="demo-text">Collect, label, validate, and arrange user input with consistent control geometry.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">VfStack + VfField · recommended form stack</p>
            <VfStack class="demo-form-stack">
              <p class="demo-text">
                Use a vertical layout container for form spacing. <code>VfField</code> owns internal label, control,
                description, and error spacing; the form layout should own the gap between fields.
              </p>

              <CmField control-id="core-form-stack-workspace-name" label="Workspace name" required>
                <template #default="{ controlId, describedBy, invalid, required }">
                  <CmInput
                    :id="controlId"
                    v-model="formStackNameValue"
                    required
                    :aria-required="required ? 'true' : undefined"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="Acme Cloud"
                  />
                </template>
              </CmField>

              <CoreFloatingFieldRecipe label="Billing email" required>
                <template #default="{ controlId, describedBy, floating, invalid, required }">
                  <CoreInputRecipe
                    :id="controlId"
                    v-model="formStackEmailValue"
                    :floating="floating"
                    required
                    :aria-required="required ? 'true' : undefined"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="team@acme.test"
                  />
                </template>
              </CoreFloatingFieldRecipe>

              <CoreFloatingFieldRecipe label="Plan" variant="over">
                <template #default="{ controlId, describedBy, invalid }">
                  <CoreSelectRecipe
                    :id="controlId"
                    v-model="formStackPlanValue"
                    :invalid="invalid"
                    :aria-describedby="describedBy"
                    placeholder="Choose a plan"
                    :options="selectOptions"
                  />
                </template>
              </CoreFloatingFieldRecipe>
            </VfStack>
          </div>

          <div class="demo-item demo-item--full">
            <p class="demo-label">VfFormLayout · responsive</p>
            <VfCard title="Workspace settings">
              <div class="demo-application-form-layout demo-application-form-layout--wide-label">
                <CmField
                  control-id="core-form-layout-workspace-name"
                  label="Workspace name"
                  description="Shown to every workspace member."
                  required
                >
                  <template #default="{ controlId, describedBy, invalid, required }">
                    <CmInput
                      :id="controlId"
                      v-model="formStackNameValue"
                      :aria-describedby="describedBy"
                      :aria-required="required ? 'true' : undefined"
                      :invalid="invalid"
                      required
                      placeholder="Acme Cloud"
                    />
                  </template>
                </CmField>

                <CmField control-id="core-form-layout-billing-email" label="Billing email" required>
                  <template #default="{ controlId, describedBy, invalid, required }">
                    <CmInput
                      :id="controlId"
                      v-model="formStackEmailValue"
                      type="email"
                      :aria-describedby="describedBy"
                      :aria-required="required ? 'true' : undefined"
                      :invalid="invalid"
                      required
                      placeholder="team@acme.test"
                    />
                  </template>
                </CmField>

                <CmField control-id="core-form-layout-plan" label="Plan">
                  <template #default="{ controlId, describedBy, invalid }">
                    <CoreSelectRecipe
                      :id="controlId"
                      v-model="formStackPlanValue"
                      :aria-describedby="describedBy"
                      :invalid="invalid"
                      :options="selectOptions"
                      placeholder="Choose a plan"
                    />
                  </template>
                </CmField>
              </div>
            </VfCard>
          </div>

          <div class="demo-item demo-item--full">
            <p class="demo-label">VfDatePicker</p>
            <div class="demo-component-matrix">
              <div class="demo-component-matrix__section">
                <p class="demo-text">
                  Localized display with stable ISO model values, date and month selection, constraints, and form
                  states.
                </p>
                <div class="demo-component-matrix__grid">
                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Interactive</p>
                    <CmField control-id="core-date-picker-release-date" label="Release date">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="datePickerValue"
                          today="2026-08-15"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Choose a date"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ datePickerValue || 'empty' }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Date and time</p>
                    <CmField control-id="core-date-picker-starts-at" label="Starts at">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfDatePicker
                          :id="controlId"
                          v-model="dateTimePickerValue"
                          locale="en-US"
                          show-time
                          display-format="MM/dd/yy HH:mm"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ dateTimePickerValue || 'empty' }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Min and max</p>
                    <CmField
                      control-id="core-date-picker-booking-date"
                      label="Booking date"
                      description="Available from August 10 through August 20, 2026."
                    >
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="constrainedDatePickerValue"
                          today="2026-08-15"
                          min="2026-08-10"
                          max="2026-08-20"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ constrainedDatePickerValue || 'empty' }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Multiple</p>
                    <CmField control-id="core-date-picker-release-dates" label="Release dates">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="multipleDatePickerValue"
                          selection-mode="multiple"
                          today="2026-08-15"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ JSON.stringify(multipleDatePickerValue) }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Range</p>
                    <CmField control-id="core-date-picker-booking-period" label="Booking period">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="rangeDatePickerValue"
                          selection-mode="range"
                          today="2026-08-15"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ JSON.stringify(rangeDatePickerValue) }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Month</p>
                    <CmField control-id="core-date-picker-billing-month" label="Billing month">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="monthPickerValue"
                          picker-mode="month"
                          today="2026-08-15"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ monthPickerValue || 'empty' }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">Year</p>
                    <CmField control-id="core-date-picker-fiscal-year" label="Fiscal year">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreDatePickerRecipe
                          :id="controlId"
                          v-model="yearPickerValue"
                          picker-mode="year"
                          today="2026-08-15"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                        />
                      </template>
                    </CmField>
                    <p class="demo-text">
                      Model: <code>{{ yearPickerValue || 'empty' }}</code>
                    </p>
                  </div>

                  <div
                    v-for="variant in formGeometryFloatingVariants"
                    :key="`date-picker-floating-${variant}`"
                    class="demo-component-matrix__cell"
                  >
                    <p class="demo-component-matrix__label">Floating {{ variant }}</p>
                    <VfField label="Release date" label-placement="floating" :floating-variant="variant">
                      <template #default="{ controlId, describedBy, invalid }">
                        <VfDatePicker
                          :id="controlId"
                          v-model="floatingDatePickerValues[variant]"
                          locale="en-US"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Choose a date"
                        />
                      </template>
                    </VfField>
                    <p class="demo-text">
                      Model: <code>{{ floatingDatePickerValues[variant] || 'empty' }}</code>
                    </p>
                  </div>

                  <div class="demo-component-matrix__cell">
                    <p class="demo-component-matrix__label">States</p>
                    <CoreDatePickerRecipe
                      id="core-date-picker-invalid"
                      model-value=""
                      today="2026-08-15"
                      invalid
                      placeholder="Invalid date"
                      aria-label="Invalid date"
                    />
                    <CoreDatePickerRecipe
                      id="core-date-picker-disabled"
                      model-value="2026-07-30"
                      today="2026-08-15"
                      disabled
                      aria-label="Disabled date"
                    />
                    <CoreDatePickerRecipe
                      id="core-date-picker-readonly"
                      model-value="2026-07-30"
                      today="2026-08-15"
                      readonly
                      aria-label="Readonly date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="demo-item demo-item--full">
            <p class="demo-label">Forms visual QA matrix</p>
            <div class="demo-form-geometry" data-test="form-geometry-matrix">
              <div class="demo-form-geometry__section">
                <p class="demo-text">VfInput + VfSelect + VfTextarea · controls</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`text-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <CoreInputRecipe
                      :size="size"
                      model-value="Search query"
                      leading-icon="magnifyingGlass"
                      clearable
                      placeholder="Search"
                    />
                    <CoreInputRecipe
                      :size="size"
                      model-value="Filtered result"
                      trailing-icon="filter"
                      clearable
                      placeholder="Filter"
                    />
                    <CoreSelectRecipe
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
                <p class="demo-text">VfInput + VfSelect + VfTextarea · states</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`text-states-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <CmInput :size="size" model-value="Default value" placeholder="Default" />
                    <CmInput :size="size" model-value="Invalid value" invalid placeholder="Invalid" />
                    <CmInput :size="size" model-value="Disabled value" disabled placeholder="Disabled" />
                    <CmInput :size="size" model-value="Readonly value" readonly placeholder="Readonly" />
                    <CoreInputRecipe
                      :size="size"
                      model-value="secret-value"
                      type="password"
                      password-reveal
                      placeholder="Password"
                    />
                    <CoreSelectRecipe :size="size" model-value="pro" placeholder="Default select" :options="selectOptions" />
                    <CoreSelectRecipe
                      :size="size"
                      model-value=""
                      invalid
                      placeholder="Invalid select"
                      :options="selectOptions"
                    />
                    <CoreSelectRecipe
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
                <p class="demo-text">VfInput + VfSelect · adornments and actions</p>
                <div class="demo-form-geometry__grid">
                  <div v-for="size in formGeometrySizes" :key="`adornments-${size}`" class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <CoreInputRecipe :size="size" model-value="Leading" leading-icon="magnifyingGlass" />
                    <CoreInputRecipe :size="size" model-value="Trailing" trailing-icon="filter" />
                    <CoreInputRecipe :size="size" model-value="Clear" clearable />
                    <CoreInputRecipe
                      :size="size"
                      model-value="Lead clear"
                      leading-icon="magnifyingGlass"
                      clearable
                    />
                    <CoreInputRecipe
                      :size="size"
                      model-value="Trail clear"
                      trailing-icon="filter"
                      clearable
                    />
                    <CoreInputRecipe
                      :size="size"
                      model-value="all-actions"
                      type="password"
                      leading-icon="key"
                      trailing-icon="filter"
                      password-reveal
                      clearable
                    />
                    <CoreSelectRecipe
                      :size="size"
                      model-value="starter"
                      leading-icon="layers"
                      placeholder="Leading"
                      :options="selectOptions"
                    />
                    <CoreSelectRecipe
                      :size="size"
                      model-value="team"
                      trailing-icon="filter"
                      placeholder="Trailing"
                      :options="selectOptions"
                    />
                    <CoreSelectRecipe
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
                <p class="demo-text">VfField · floating labels</p>
                <div class="demo-form-geometry__grid">
                  <div
                    v-for="variant in formGeometryFloatingVariants"
                    :key="`floating-${variant}`"
                    class="demo-form-geometry__cell"
                  >
                    <p class="demo-form-geometry__label">{{ variant }}</p>
                    <CoreFloatingFieldRecipe label="Search" :variant="variant" required>
                      <template #default="{ controlId, describedBy, floating, invalid, required }">
                        <CoreInputRecipe
                          :id="controlId"
                          model-value="Search query"
                          :floating="floating"
                          required
                          :aria-required="required ? 'true' : undefined"
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Search"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Plan" :variant="variant">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreSelectRecipe
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
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Notes" :variant="variant">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CmTextarea
                          :id="controlId"
                          model-value="Textarea baseline check"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Notes"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">VfField · floating labels by size and fill state</p>
                <div class="demo-form-geometry__grid">
                  <div
                    v-for="size in formGeometrySizes"
                    :key="`floating-size-${size}`"
                    class="demo-form-geometry__cell"
                  >
                    <p class="demo-form-geometry__label">{{ size }}</p>
                    <CoreFloatingFieldRecipe label="Empty input">
                      <template #default="{ controlId, describedBy, floating, invalid }">
                        <CoreInputRecipe
                          :id="controlId"
                          :size="size"
                          model-value=""
                          :floating="floating"
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Empty"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Filled input">
                      <template #default="{ controlId, describedBy, floating, invalid }">
                        <CoreInputRecipe
                          :id="controlId"
                          :size="size"
                          model-value="Filled"
                          :floating="floating"
                          leading-icon="magnifyingGlass"
                          clearable
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Filled"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Invalid input" error="Invalid">
                      <template #default="{ controlId, describedBy, floating, invalid }">
                        <CoreInputRecipe
                          :id="controlId"
                          :size="size"
                          model-value="Invalid"
                          :floating="floating"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Invalid"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Empty select">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreSelectRecipe
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
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Filled select">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CoreSelectRecipe
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
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Empty textarea">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CmTextarea
                          :id="controlId"
                          :size="size"
                          model-value=""
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Empty"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                    <CoreFloatingFieldRecipe label="Filled textarea">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CmTextarea
                          :id="controlId"
                          :size="size"
                          model-value="Filled textarea"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Filled"
                        />
                      </template>
                    </CoreFloatingFieldRecipe>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">VfCheckbox + VfRadio + VfSwitch · sizes</p>
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
                      <CoreIconSwitchRecipe :size="size" :model-value="true">
                        <template #thumb="{ checked }">
                          <VueIconify :icon="checked ? icons.check : icons.xmark" />
                        </template>
                        Icon switch
                      </CoreIconSwitchRecipe>
                    </div>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">VfField + VfFieldset · containers</p>
                <div class="demo-form-geometry__grid demo-form-geometry__grid--two">
                  <div class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">VfField</p>
                    <CmField
                      control-id="core-form-geometry-default-field"
                      label="Default field"
                      description="Description text"
                      required
                    >
                      <template #default="{ controlId, describedBy, invalid, required }">
                        <CmInput
                          :id="controlId"
                          model-value="Field value"
                          required
                          :aria-required="required ? 'true' : undefined"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Default field"
                        />
                      </template>
                    </CmField>
                    <CmField control-id="core-form-geometry-invalid-field" label="Invalid field" error="Error text">
                      <template #default="{ controlId, describedBy, invalid }">
                        <CmInput
                          :id="controlId"
                          model-value="Invalid value"
                          :invalid="invalid"
                          :aria-describedby="describedBy"
                          placeholder="Invalid field"
                        />
                      </template>
                    </CmField>
                  </div>

                  <div class="demo-form-geometry__cell">
                    <p class="demo-form-geometry__label">VfFieldset</p>
                    <CmFieldset
                      id="core-form-geometry-notification-channels"
                      label="Notification channels"
                      description="Grouped checkbox controls"
                    >
                      <template #default="{ invalid }">
                        <div class="demo-selection-list">
                          <VfCheckbox :model-value="true" :invalid="invalid"> Email alerts </VfCheckbox>
                          <VfCheckbox :invalid="invalid">Slack alerts</VfCheckbox>
                        </div>
                      </template>
                    </CmFieldset>
                    <CmFieldset id="core-form-geometry-workspace-plan" label="Workspace plan" error="Select one option">
                      <template #default="{ invalid }">
                        <div class="demo-selection-list">
                          <VfRadio model-value="pro" name="fieldset-plan" value="starter" :invalid="invalid">
                            Starter
                          </VfRadio>
                          <VfRadio model-value="pro" name="fieldset-plan" value="pro" :invalid="invalid"> Pro </VfRadio>
                        </div>
                      </template>
                    </CmFieldset>
                  </div>
                </div>
              </div>

              <div class="demo-form-geometry__section">
                <p class="demo-text">VfCheckbox + VfRadio + VfSwitch · states and multiline labels</p>
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
                      <VfSwitch :size="size" class="demo-switch--static">Static switch</VfSwitch>
                      <VfSwitch :size="size" class="demo-switch--static demo-switch--inverse">
                        Static inverse switch
                      </VfSwitch>
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
          <p class="demo-text">Move between destinations, peer views, document sections, and progressive steps.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Navigation visual QA matrix</p>
            <div class="demo-component-matrix" data-test="navigation-geometry-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfBreadcrumbs</p>
                  <VfBreadcrumbs :items="breadcrumbItems">
                    <template #separator>
                      <VueIconify :icon="icons.chevronRight" size="var(--cm-icon-size-sm)" />
                    </template>
                  </VfBreadcrumbs>
                  <VfBreadcrumbs
                    :items="[
                      { label: 'Docs', href: '#demo-navigation' },
                      { label: 'Core', href: '#demo-navigation' },
                      { label: 'Forms', href: '#demo-forms' },
                      { label: 'Field geometry', current: true },
                    ]"
                  >
                    <template #separator>
                      <VueIconify :icon="icons.chevronRight" size="var(--cm-icon-size-sm)" />
                    </template>
                  </VfBreadcrumbs>
                  <VfBreadcrumbs :items="breadcrumbItems">
                    <template #separator>/</template>
                  </VfBreadcrumbs>
                </div>

                <div class="demo-component-matrix__cell demo-item--full">
                  <p class="demo-component-matrix__label">VfPageHeader</p>
                  <header class="demo-application-page-header">
                    <div class="demo-application-page-header__breadcrumbs">
                      <VfBreadcrumbs
                        :items="[
                          { label: 'Administration', href: '#demo-navigation' },
                          { label: 'Users', current: true },
                        ]"
                      >
                        <template #separator>
                          <VueIconify :icon="icons.chevronRight" size="var(--cm-icon-size-sm)" />
                        </template>
                      </VfBreadcrumbs>
                    </div>
                    <div class="demo-application-page-header__row">
                      <div class="demo-application-page-header__content">
                        <h1 class="demo-application-page-header__title">Team members</h1>
                        <div class="demo-application-page-header__description">
                          Manage workspace access, roles, and account status.
                        </div>
                      </div>
                      <div class="demo-application-page-header__actions">
                        <CmButton variant="secondary">Export</CmButton>
                        <CmButton>New user</CmButton>
                      </div>
                    </div>
                  </header>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfTabs</p>
                  <CoreTabsRecipe model-value="overview" :items="releaseTabs.slice(0, 4)">
                    <template #panel="{ activeValue }">
                      <p class="demo-text">{{ tabContent[activeValue] }}</p>
                    </template>
                  </CoreTabsRecipe>
                  <CoreTabsRecipe model-value="status" :items="releaseTabs">
                    <template #panel="{ activeValue }">
                      <p class="demo-text">{{ tabContent[activeValue] }}</p>
                    </template>
                  </CoreTabsRecipe>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfStepper · horizontal</p>
                  <nav
                    class="demo-application-stepper demo-application-stepper--horizontal demo-application-stepper--content-above"
                    aria-label="Matrix horizontal stepper above"
                  >
                    <ol class="demo-application-stepper__list">
                      <li
                        v-for="(item, index) in compactOnboardingAboveSteps"
                        :key="item.value"
                        class="demo-application-stepper__item"
                        :data-state="item.state"
                        :aria-current="item.state === 'current' ? 'step' : undefined"
                        :aria-disabled="item.state === 'disabled' ? 'true' : undefined"
                      >
                        <div class="demo-application-stepper__summary">
                          <span class="demo-application-stepper__rail" aria-hidden="true">
                            <span
                              class="demo-application-stepper__connector demo-application-stepper__connector--before"
                            />
                            <span class="demo-application-stepper__marker">{{ index + 1 }}</span>
                            <span
                              class="demo-application-stepper__connector demo-application-stepper__connector--after"
                            />
                          </span>
                          <span class="demo-application-stepper__content">
                            <span class="demo-application-stepper__label">{{ item.label }}</span>
                            <span class="demo-application-stepper__description">{{ item.description }}</span>
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                  <nav
                    class="demo-application-stepper demo-application-stepper--horizontal demo-application-stepper--content-below"
                    aria-label="Matrix horizontal stepper below"
                  >
                    <ol class="demo-application-stepper__list">
                      <li
                        v-for="(item, index) in compactOnboardingBelowSteps"
                        :key="item.value"
                        class="demo-application-stepper__item"
                        :data-state="item.state"
                        :aria-current="item.state === 'current' ? 'step' : undefined"
                        :aria-disabled="item.state === 'disabled' ? 'true' : undefined"
                      >
                        <div class="demo-application-stepper__summary">
                          <span class="demo-application-stepper__rail" aria-hidden="true">
                            <span
                              class="demo-application-stepper__connector demo-application-stepper__connector--before"
                            />
                            <span class="demo-application-stepper__marker">{{ index + 1 }}</span>
                            <span
                              class="demo-application-stepper__connector demo-application-stepper__connector--after"
                            />
                          </span>
                          <span class="demo-application-stepper__content">
                            <span class="demo-application-stepper__label">{{ item.label }}</span>
                            <span class="demo-application-stepper__description">{{ item.description }}</span>
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfStepper · vertical</p>
                  <nav
                    class="demo-application-stepper demo-application-stepper--vertical demo-application-stepper--content-end"
                    aria-label="Matrix vertical stepper"
                  >
                    <ol class="demo-application-stepper__list">
                      <li
                        v-for="(item, index) in onboardingVerticalSteps"
                        :key="item.value"
                        class="demo-application-stepper__item"
                        :data-state="item.state"
                        :aria-current="item.state === 'current' ? 'step' : undefined"
                        :aria-disabled="item.state === 'disabled' ? 'true' : undefined"
                      >
                        <div class="demo-application-stepper__summary">
                          <span class="demo-application-stepper__rail" aria-hidden="true">
                            <span class="demo-application-stepper__marker">{{ index + 1 }}</span>
                          </span>
                          <span class="demo-application-stepper__content">
                            <span class="demo-application-stepper__label">{{ item.label }}</span>
                            <span class="demo-application-stepper__description">{{ item.description }}</span>
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfAccordion · states</p>
                  <CmAccordion
                    id="demo-closed-accordion"
                    class="demo-application-accordion"
                    :items="closedAccordionItems"
                  >
                    <template #triggerClosed="{ open }">
                      <span>Closed section</span>
                      <span
                        class="demo-application-accordion__icon"
                        :class="{ 'demo-application-accordion__icon--open': open }"
                        aria-hidden="true"
                      >
                        <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
                      </span>
                    </template>
                  </CmAccordion>
                  <CmAccordion
                    id="demo-open-accordion"
                    class="demo-application-accordion"
                    :items="openAccordionItems"
                    :default-open-items="['open']"
                  >
                    <template #triggerOpen="{ open }">
                      <span>Open section</span>
                      <span
                        class="demo-application-accordion__icon"
                        :class="{ 'demo-application-accordion__icon--open': open }"
                        aria-hidden="true"
                      >
                        <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
                      </span>
                    </template>
                  </CmAccordion>
                  <CmAccordion
                    id="demo-disabled-accordion"
                    class="demo-application-accordion"
                    :items="disabledAccordionItems"
                  >
                    <template #triggerDisabled="{ open }">
                      <span>Disabled section</span>
                      <span
                        class="demo-application-accordion__icon"
                        :class="{ 'demo-application-accordion__icon--open': open }"
                        aria-hidden="true"
                      >
                        <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
                      </span>
                    </template>
                  </CmAccordion>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfNavMenu + VfMenuBar</p>
                  <CoreNavMenuRecipe v-model="navMenuDefaultValue" :items="docsMenuSimpleItems" />
                  <CoreNavMenuRecipe v-model="navMenuPillsValue" :items="docsMenuSimpleItems" variant="pills" />
                  <div class="demo-component-matrix__grid demo-nav-menu-variants-grid">
                    <div class="demo-component-matrix__cell">
                      <p class="demo-component-matrix__label">VfNavMenu · sidebar with icons</p>
                      <CoreNavMenuRecipe
                        v-model="navMenuSidebarValue"
                        :items="docsMenuSidebarItems"
                        variant="sidebar"
                      />
                    </div>
                    <div class="demo-component-matrix__cell">
                      <p class="demo-component-matrix__label">VfNavMenu · collapsed</p>
                      <div class="demo-nav-menu-collapsed-frame">
                        <CoreNavMenuRecipe
                          v-model="navMenuSidebarValue"
                          :items="docsMenuSidebarItems"
                          variant="sidebar"
                          aria-label="Collapsed sidebar navigation"
                        />
                      </div>
                    </div>
                    <div class="demo-component-matrix__cell demo-nav-menu-wrapping-labels">
                      <p class="demo-component-matrix__label">VfNavMenu · wrapping labels without icons</p>
                      <CoreNavMenuRecipe
                        v-model="navMenuSidebarNoIconsValue"
                        :items="docsMenuSidebarNoIconItems"
                        variant="sidebar"
                        wrap-labels
                      />
                    </div>
                  </div>
                  <CoreMenuBarRecipe v-model="menuBarDefaultValue" :items="topMenuItems" />
                  <CoreMenuBarRecipe v-model="menuBarPillsValue" :items="topMenuItems" variant="pills" />
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfTableOfContents</p>
                  <nav class="demo-application-toc" aria-label="Table of contents">
                    <ol class="demo-application-toc__list">
                      <li
                        v-for="item in tocItems.slice(0, 5)"
                        :key="item.id"
                        class="demo-application-toc__item"
                        :data-level="normalizeTocLevel(item.level)"
                      >
                        <a
                          :href="`#${item.id}`"
                          class="demo-application-toc__link"
                          :class="{ 'demo-application-toc__link--active': item.id === 'demo-actions' }"
                          :aria-current="item.id === 'demo-actions' ? 'location' : undefined"
                        >
                          {{ item.label }}
                        </a>
                      </li>
                    </ol>
                  </nav>
                  <nav class="demo-application-toc demo-application-toc--pills" aria-label="Table of contents">
                    <ol class="demo-application-toc__list">
                      <li
                        v-for="item in tocItems.slice(0, 5)"
                        :key="item.id"
                        class="demo-application-toc__item"
                        :data-level="normalizeTocLevel(item.level)"
                      >
                        <a
                          :href="`#${item.id}`"
                          class="demo-application-toc__link"
                          :class="{ 'demo-application-toc__link--active': item.id === 'demo-actions' }"
                          :aria-current="item.id === 'demo-actions' ? 'location' : undefined"
                        >
                          {{ item.label }}
                        </a>
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-block">
        <div class="demo-block__header">
          <h2 id="demo-dialog">Modals and Commands</h2>
          <p class="demo-text">Focus attention on modal tasks, confirmations, drawers, and keyboard-first commands.</p>
        </div>

        <div class="demo-grid demo-grid--three">
          <div class="demo-item demo-item--full">
            <p class="demo-label">Modal visual QA matrix</p>
            <div class="demo-component-matrix" data-test="modal-launcher-matrix">
              <div class="demo-component-matrix__grid demo-component-matrix__grid--two">
                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDialog · sizes</p>
                  <div class="demo-inline">
                    <CmButton
                      v-for="size in dialogSizes"
                      :key="`dialog-${size}`"
                      :size="size"
                      @click="
                        dialogSize = size;
                        dialogOpen = true;
                      "
                    >
                      {{ size }} dialog
                    </CmButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfDrawer · placements</p>
                  <div class="demo-inline">
                    <CmButton
                      v-for="placement in drawerPlacements"
                      :key="`drawer-${placement}`"
                      variant="secondary"
                      @click="
                        drawerPlacement = placement;
                        drawerOpen = true;
                      "
                    >
                      {{ placement }}
                    </CmButton>
                    <CmButton variant="secondary" @click="drawerFullscreenOpen = true"> fullscreen </CmButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfCommandPalette · states</p>
                  <div class="demo-inline">
                    <CmButton variant="secondary" @click="commandPaletteOpen = true"> empty query </CmButton>
                    <CmButton
                      variant="secondary"
                      @click="
                        commandPaletteQuery = 'theme';
                        commandPaletteOpen = true;
                      "
                    >
                      matched query
                    </CmButton>
                  </div>
                </div>

                <div class="demo-component-matrix__cell">
                  <p class="demo-component-matrix__label">VfConfirmDialog</p>
                  <div class="demo-stack">
                    <CmButton variant="danger" @click="confirmDialogOpen = true">Delete example user</CmButton>
                    <p class="demo-text" aria-live="polite">{{ confirmDialogResult }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <CoreDialogRecipe v-model:open="dialogOpen" :size="dialogSize" />

    <CmDialog
      id="delete-example-user"
      class="demo-application-confirm-dialog"
      :open="confirmDialogOpen"
      title="Delete example user?"
      description="This action cannot be undone."
      size="sm"
      dividers
      :dismissible="!confirmDialogBusy"
      @update:open="handleConfirmDialogOpenChange"
    >
      <p v-if="confirmDialogError" class="demo-m-0" role="alert">{{ confirmDialogError }}</p>
      <template #actions="{ close }">
        <CmIconButton label="Close dialog" variant="ghost" :disabled="confirmDialogBusy" @click="close">
          <VueIconify :icon="icons.xmark" size="var(--cm-icon-size-md)" />
        </CmIconButton>
      </template>
      <template #footer>
        <div class="demo-application-confirm-dialog__actions">
          <CmButton variant="secondary" :disabled="confirmDialogBusy" autofocus @click="cancelExampleDeletion">
            Cancel
          </CmButton>
          <CmButton variant="danger" :loading="confirmDialogBusy" @click="confirmExampleDeletion">
            Delete user
          </CmButton>
        </div>
      </template>
    </CmDialog>

    <CoreDrawerRecipe v-model:open="drawerOpen" :placement="drawerPlacement" />

    <CoreDrawerRecipe v-model:open="drawerFullscreenOpen" placement="left" fullscreen />

    <CoreCommandPaletteRecipe
      v-model:open="commandPaletteOpen"
      v-model="commandPaletteQuery"
      title="Search Documentation"
      placeholder="Search components, guides, and API..."
      :items="commandPaletteDataset"
      @select="handleCommandPaletteSelect"
    />
  </div>
</template>
