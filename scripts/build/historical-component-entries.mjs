// Component and layout subpaths from VueForge d9879116. Re-export the current adapters
// and their existing style dependencies without copying either implementation.
export const historicalComponentPattern = './historical/*';

const vueEntries = {
  accordion: ['historical', 'VfAccordion'],
  alert: ['historical', 'VfAlert', ['icon']],
  avatar: ['historical', 'VfAvatar', ['icon']],
  badge: ['historical', 'VfBadge'],
  breadcrumbs: ['historical', 'VfBreadcrumbs', ['icon']],
  button: ['index', 'VfButton'],
  card: ['index', 'VfCard'],
  checkbox: ['historical', 'VfCheckbox'],
  'command-palette': ['index', 'VfCommandPalette'],
  'confirm-dialog': ['index', 'VfConfirmDialog', ['button', 'dialog']],
  'data-table': ['historical', 'VfDataTable', ['icon-button', 'icon', 'progress-spinner', 'skeleton']],
  'data-table-column-chooser': [
    'historical',
    'VfDataTableColumnChooser',
    ['popover', 'icon-button', 'icon', 'checkbox'],
  ],
  'date-picker': ['historical', 'VfDatePicker'],
  dialog: ['historical', 'VfDialog'],
  divider: ['index', 'VfDivider'],
  drawer: ['historical', 'VfDrawer'],
  dropdown: ['historical', 'VfDropdown', ['menu']],
  field: ['index', 'VfField'],
  fieldset: ['historical', 'VfFieldset'],
  'form-layout': ['index', 'VfFormLayout'],
  'group-box': ['index', 'VfGroupBox', ['button', 'icon']],
  'icon-button': ['historical', 'VfIconButton', ['icon']],
  input: ['historical', 'VfInput', ['icon']],
  link: ['index', 'VfLink'],
  'menu-bar': ['historical', 'VfMenuBar', ['icon']],
  menu: ['historical', 'VfMenu, VfMenuItem', ['icon']],
  'nav-menu': ['historical', 'VfNavMenu', ['icon'], 'VfNavMenuProps'],
  panel: ['index', 'VfPanel'],
  'page-header': ['index', 'VfPageHeader', ['breadcrumbs', 'icon']],
  popover: ['historical', 'VfPopover'],
  'progress-bar': ['index', 'VfProgressBar'],
  'progress-spinner': ['historical', 'VfProgressSpinner'],
  radio: ['historical', 'VfRadio'],
  select: ['historical', 'VfSelect', ['icon']],
  skeleton: ['index', 'VfSkeleton'],
  'skeleton-gate': ['index', 'VfSkeletonGate', ['skeleton']],
  stepper: ['index', 'VfStepper'],
  switch: ['historical', 'VfSwitch'],
  table: ['index', 'VfTable'],
  'table-of-contents': ['historical', 'VfTableOfContents'],
  tabs: ['index', 'VfTabs'],
  tag: ['historical', 'VfTag'],
  textarea: ['historical', 'VfTextarea'],
  'theme-switch': ['index', 'VfThemeSwitch', ['button', 'icon-button', 'icon', 'switch']],
  tooltip: ['index', 'VfTooltip'],
  async: ['index', 'createAsyncWithSkeleton', ['skeleton'], 'CreateAsyncWithSkeletonOptions'],
};

const layoutEntries = {
  container: ['VfContainer'],
  stack: ['VfStack'],
  inline: ['VfInline'],
  section: ['VfSection'],
  grid: ['VfGrid'],
  'app-shell': ['VfAppShell'],
  'admin-layout': [
    'VfAdminLayout',
    [],
    'VfAdminLayoutExposed, VfAdminLayoutMobileSidebarScope, VfAdminLayoutMobileToggleAttrs, VfAdminLayoutProps, VfAdminLayoutScope',
  ],
  'admin-shell': ['VfAdminShell'],
  'document-layout': ['VfDocumentLayout', ['container']],
  'auth-layout': ['VfAuthLayout', ['container']],
  'error-layout': ['VfErrorLayout'],
  'setup-layout': ['VfSetupLayout', ['container']],
  'header-area': ['VfHeaderArea'],
  'sidebar-area': ['VfSidebarArea'],
  'content-area': ['VfContentArea'],
  'aside-area': ['VfAsideArea'],
  'footer-area': ['VfFooterArea'],
};

const styleEntryBySlug = {
  async: 'skeleton',
  'data-table-column-chooser': 'column-chooser',
  'auth-layout': 'page-layouts',
  'error-layout': 'page-layouts',
  'header-area': 'layout-areas',
  'sidebar-area': 'layout-areas',
  'content-area': 'layout-areas',
  'aside-area': 'layout-areas',
  'footer-area': 'layout-areas',
};

export function historicalComponentEntries(packageName) {
  const isLayouts = packageName === '@codemonster-ru/ui-layouts';
  const entries = isLayouts ? layoutEntries : packageName === '@codemonster-ru/ui-vue' ? vueEntries : {};
  return Object.entries(entries).map(([slug, entry]) => {
    const [moduleName, names, dependencies = [], types] = isLayouts ? ['index', ...entry] : entry;
    const style = styleEntryBySlug[slug] ?? slug;
    return {
      slug,
      moduleName,
      names,
      types,
      styles: [...new Set([style, ...dependencies])],
      defaultName: isLayouts ? names : undefined,
    };
  });
}
