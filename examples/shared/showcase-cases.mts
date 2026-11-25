import { showcaseCaseVariants, showcaseVariantValue, tones } from './showcase-matrices.mts';
import { layoutExamples, columns as warehouseColumns, rows as warehouseRows } from './showcase-layout-data.mts';

export interface DemoNode {
  component: string;
  props?: Record<string, unknown>;
  slots?: Record<string, DemoContent>;
  scopeAttributes?: string;
}

export type DemoContent = string | DemoNode | (string | DemoNode)[];

export interface ShowcaseCase {
  id: string;
  attributes?: Record<string, unknown>;
  props: Record<string, unknown>;
  slots: Record<string, DemoContent>;
}

interface PublicProperty {
  type: string;
  default?: unknown;
  values?: readonly (string | number | boolean)[];
}

interface ComponentManifest {
  slug: string;
  name: string;
  props: Record<string, PublicProperty>;
}

export interface ShowcaseExample extends ShowcaseCase {
  slug: string;
  label: string;
  buttonStyle?: {
    axis: 'size' | 'variant' | 'state';
    size: string;
    variant: string;
    state: 'default' | 'loading' | 'disabled';
  };
}

const layoutPreviewSlugs = new Set<string>(layoutExamples.map(({ slug }) => slug));
const modalSlugs = new Set(['dialog', 'drawer', 'command-palette']);
const feedbackPalettes = new Set(['alert', 'badge', 'tag', 'progress-bar', 'progress-spinner']);
const alertExamples: Record<string, { icon: string; title: string; text: string }> = {
  neutral: { icon: 'bell', title: 'Project update', text: 'The weekly summary is ready to view.' },
  primary: { icon: 'star', title: 'Featured update', text: 'Explore the new project overview.' },
  success: { icon: 'checkCircle', title: 'Release published', text: 'The new version is live.' },
  info: { icon: 'info', title: 'Scheduled maintenance', text: 'The dashboard will be read-only from 10 to 11 PM.' },
  warning: { icon: 'warning', title: 'Storage nearly full', text: 'Free up space before uploading more files.' },
  help: {
    icon: 'questionCircle',
    title: 'Need help publishing?',
    text: 'Check the release guide for step-by-step instructions.',
  },
  danger: { icon: 'xCircle', title: 'Release failed', text: 'Fix the failed checks and try again.' },
  contrast: {
    icon: 'circleHalf',
    title: 'Dark mode enabled',
    text: 'Change your theme anytime in Appearance settings.',
  },
};
const feedbackFirstExamples: Record<string, string[]> = {
  avatar: ['avatar-image', 'avatar-image--shape-circle'],
  'progress-spinner': [
    'progress-spinner-default--sm',
    'progress-spinner-default',
    'progress-spinner-default--lg',
    'progress-spinner-custom-stroke',
  ],
};
const sizedFormExamples: Record<string, string> = {
  'input-enhanced': 'Password',
  'textarea-default': '',
  'select-clearable': 'Clearable',
  'date-picker-clearable': 'Clearable',
  'checkbox-checked': 'Checked',
  'checkbox-indeterminate': 'Mixed',
  'radio-checked': 'Checked',
  'switch-custom-thumb': 'Thumb icon',
};
const formSizes = ['sm', 'md', 'lg'];
const firstFormSizeGroups = new Set(['input-enhanced', 'select-clearable', 'date-picker-clearable', 'radio-checked']);
export const drawerExampleGroups = [
  { label: 'Sides', ids: ['drawer-open', 'drawer-default', 'drawer-top', 'drawer-bottom'] },
  {
    label: 'Sizes',
    ids: ['drawer-default--size-sm', 'drawer-default--size-lg', 'drawer-default--size-full'],
  },
];
const firstModalExamples: Record<string, string[]> = {
  dialog: ['dialog-default--size-sm', 'dialog-default', 'dialog-default--size-lg'],
  drawer: drawerExampleGroups.flatMap(({ ids }) => ids),
  'command-palette': ['command-palette-default', 'command-palette-idle', 'command-palette-loading'],
};
// These fixtures exercise markup or repeat a difference already shown by another example.
const contractOnlyCases = new Set([
  'accordion-one-open',
  'button-icon-slots',
  'button-link',
  'button-link-disabled',
  'card-article',
  'card-title',
  'command-palette-filtered',
  'container-sized',
  'date-picker-portal',
  'dialog-open',
  'dropdown-composed',
  'input-value',
  'menu-rich-link',
  'nav-menu-routes',
  'popover-open',
  'progress-spinner-danger-lg',
  'skeleton-gate-default',
  'skeleton-static-height',
  'table-of-contents-offset',
  'tabs-custom-ids',
  'textarea-value',
  'tooltip-composed',
  'tooltip-visible',
]);
const component = (component: string, props?: DemoNode['props'], slots?: DemoNode['slots']): DemoNode => ({
  component,
  props,
  slots,
});
const icon = (icon: string): DemoNode => component('icon', { icon });

const supplemental: Record<string, Partial<ShowcaseCase>[]> = {
  avatar: [{ id: 'avatar-slot', props: { image: null, label: null }, slots: { default: icon('user') } }],
  'content-area': [{ id: 'content-area-unpadded', props: { as: 'section', padded: false } }],
  stack: [{ id: 'stack-article', props: { as: 'article' } }],
  checkbox: [{ id: 'checkbox-default--invalid-indeterminate', props: { invalid: true, indeterminate: true } }],
  dropdown: [{ id: 'dropdown-disabled', props: { disabled: true, open: false } }],
  fieldset: [{ id: 'fieldset-invalid', props: { invalid: true, error: 'Select at least one notification option.' } }],
  'group-box': [{ id: 'group-box-disabled', props: { disabled: true } }],
  'page-header': [
    {
      id: 'page-header-slots',
      slots: {
        breadcrumbs: component('breadcrumbs', {
          items: [
            { label: 'Home', href: '/' },
            { label: 'Orders', current: true },
          ],
        }),
      },
    },
  ],
  select: [
    {
      id: 'select-adornments',
      props: { teleportTo: 'body', placement: 'bottom-end' },
      slots: { leading: icon('magnifyingGlass'), trailing: icon('filter') },
    },
  ],
};

function extendCase(base: ShowcaseCase, change: Partial<ShowcaseCase>): ShowcaseCase {
  return {
    ...base,
    ...change,
    props: { ...base.props, ...change.props },
    slots: { ...base.slots, ...change.slots },
  };
}

function adaptContracts(source: ShowcaseCase[]) {
  return source.map((fixture) => {
    switch (fixture.id) {
      case 'theme-switch-default':
        return {
          ...fixture,
          props: { ...fixture.props, name: 'appearance', legend: 'Theme', cookieName: 'cm-showcase-appearance' },
        };
      case 'badge-default':
      case 'badge-warning':
      case 'badge-danger':
        return { ...fixture, slots: { default: 'Status' } };
      case 'tag-default':
      case 'tag-primary':
      case 'tag-warning':
        return { ...fixture, slots: { default: 'Design' } };
      case 'skeleton-default':
        return { ...fixture, props: { minHeight: '2.5rem' } };
      case 'skeleton-gate-ready': {
        const placeholder = (inlineSize: string, minHeight = '1.5rem') =>
          component('skeleton', {
            radius: 'control',
            minHeight,
            style: { inlineSize: `min(100%, ${inlineSize})` },
          });
        const rows = { style: { gap: 'var(--cm-space-2)' } };
        return {
          ...fixture,
          props: { ...fixture.props, minHeight: undefined },
          slots: {
            default: component('stack', rows, {
              default: [
                '<h4 class="cm-card__title" style="color:var(--cm-color-text-primary)">Invoice INV-1042</h4>',
                '<div>Design subscription</div>',
                component(
                  'inline',
                  { style: { color: 'var(--cm-color-text-primary)' } },
                  {
                    default: ['<strong>$120.00</strong>', component('badge', { tone: 'success' }, { default: 'Paid' })],
                  },
                ),
              ],
            }),
            skeleton: component('stack', rows, {
              default: [
                placeholder('9rem'),
                placeholder('9.5rem'),
                component('inline', undefined, {
                  default: [placeholder('3.5rem'), placeholder('2.25rem', '1.375rem')],
                }),
              ],
            }),
          },
        };
      }
      case 'input-enhanced':
        return {
          ...fixture,
          props: { ...fixture.props, required: true },
          slots: { leading: icon('lock'), trailing: 'Required' },
        };
      case 'textarea-default':
      case 'textarea-invalid':
        return { ...fixture, props: { ...fixture.props, value: 'First line\nSecond line' } };
      case 'select-selected':
        return {
          ...fixture,
          props: {
            ...fixture.props,
            size: 'md',
            options: [
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived', disabled: true },
            ],
          },
        };
      case 'switch-default':
      case 'switch-disabled':
      case 'switch-checked':
        return { ...fixture, props: { ...fixture.props, label: 'Dark mode', size: 'md' } };
      case 'date-picker-clearable':
        return { ...fixture, props: { ...fixture.props, placement: 'bottom-end', teleportTo: 'body' } };
      case 'date-picker-value':
        return { ...fixture, props: { value: fixture.props.value, readonly: true } };
      case 'checkbox-indeterminate':
        return { ...fixture, props: { indeterminate: true, label: fixture.props.label } };
      case 'switch-custom-thumb':
        return { ...fixture, slots: { thumb: icon('moon') } };
      case 'accordion-rich-content':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            panelAccount: ['Manage your ', component('link', { href: '/account' }, { default: 'account' }), '.'],
          },
        };
      case 'menu-states':
        return { ...fixture, slots: { itemOpen: '<strong>Open project</strong>' } };
      case 'menu-bar-default':
      case 'menu-bar-icons':
      case 'menu-bar-compact-edge':
        return { ...fixture, props: { ...fixture.props, openPath: [] } };
      case 'tabs-overflow':
        return { ...fixture, attributes: { ...fixture.attributes, style: 'inline-size: min(100%, 22rem)' } };
      case 'stepper-above':
      case 'stepper-vertical-start': {
        const baseline = source.find(({ id }) => id === 'stepper-default');
        return {
          ...fixture,
          props: {
            ...(baseline?.props ?? fixture.props),
            orientation: fixture.props.orientation,
            contentPosition: fixture.props.contentPosition,
          },
        };
      }
      case 'table-of-contents-default':
        return {
          ...fixture,
          props: {
            ...fixture.props,
            items: [
              { id: 'forms', label: 'Forms' },
              { id: 'demo-input', label: 'Input', level: 2 },
              { id: 'demo-date-picker', label: 'Date Picker', level: 2 },
            ],
            activeId: 'demo-input',
            scrollOffset: 64,
          },
        };
      case 'card-default':
      case 'card-compact':
        return {
          ...fixture,
          props: { ...fixture.props, title: 'Project' },
          slots: { default: 'Project summary' },
        };
      case 'card-regions':
        return {
          ...fixture,
          props: {},
          slots: {
            header: '<h3 class="cm-card__title">Project</h3>',
            default: 'Project summary',
            footer: component('tag', { tone: 'success' }, { default: 'Ready' }),
          },
        };
      case 'command-palette-default':
        return { ...fixture, props: { ...fixture.props, closeOnOverlayClick: true } };
      case 'command-palette-loading':
        return {
          ...fixture,
          slots: { loading: [component('progress-spinner', { size: 'sm', label: 'Loading' }), ' Finding commands…'] },
        };
      case 'dialog-default':
        return {
          ...fixture,
          props: { ...fixture.props, title: 'Project details', description: 'Review the project before publishing.' },
          slots: { default: 'The project is still a draft.' },
        };
      case 'dialog-composed':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            actions: component('tag', {}, { default: 'Draft' }),
            default: component('input', { 'aria-label': 'Release title', modelValue: 'June release' }),
            footer: 'Review the changes before publishing.',
          },
        };
      case 'drawer-open':
      case 'drawer-top':
      case 'drawer-bottom':
        return {
          ...fixture,
          props: { id: fixture.props.id, title: 'Filters', side: fixture.props.side },
          slots: { default: 'Filter controls.' },
        };
      case 'drawer-physical-offset':
        return { ...fixture, props: { ...fixture.props, closable: true } };
      case 'drawer-composed':
        return {
          ...fixture,
          props: { ...fixture.props, dismissible: true },
          slots: {
            ...fixture.slots,
            actions: component('tag', {}, { default: 'Draft' }),
            default: component('input', { 'aria-label': 'Workspace name', modelValue: 'Studio' }),
            footer: 'Changes apply after publishing.',
          },
        };
      case 'dropdown-pills':
        return { ...fixture, slots: { trigger: icon('ellipsis') } };
      case 'dropdown-scoped':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: [
              { value: 'edit', label: 'Edit', iconName: 'pencil' },
              { value: 'rename', label: 'Rename', iconName: 'fileText' },
            ].map(({ value, label, iconName }, index) =>
              component(
                'icon-button',
                {
                  label,
                  title: label,
                  variant: 'ghost',
                  role: 'menuitem',
                  tabindex: index === 0 ? 0 : -1,
                  'data-cm-menu-item': '',
                  'data-cm-menu-value': value,
                },
                { default: icon(iconName) },
              ),
            ),
          },
        };
      case 'field-default':
        return {
          ...fixture,
          slots: { default: component('input', { id: fixture.props.controlId, name: 'email', type: 'email' }) },
        };
      case 'field-help-error': {
        const id = String(fixture.props.controlId);
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: component('input', {
              id,
              name: 'display_name',
              required: true,
              invalid: true,
              'aria-describedby': `${id}-error ${id}-description`,
            }),
          },
        };
      }
      case 'field-floating-on':
      case 'field-floating-in':
      case 'field-floating-over':
        return {
          ...fixture,
          slots: {
            default: component('input', { id: fixture.props.controlId, placeholder: ' ', modelValue: 'Atlas' }),
          },
        };
      case 'fieldset-default':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: component('checkbox', { label: 'Email updates', name: 'email_updates' }),
          },
        };
      case 'fieldset-help-error':
        return {
          ...fixture,
          props: {
            ...fixture.props,
            description: 'Choose your preferred contact method.',
            error: 'Select a contact method.',
          },
          slots: {
            legend: fixture.slots.legend,
            default: component(
              'stack',
              { style: { rowGap: 'var(--cm-space-2)' } },
              {
                default: [
                  component('radio', { label: 'Email', name: 'contact_method', value: 'email' }),
                  component('radio', { label: 'Phone', name: 'contact_method', value: 'phone' }),
                ],
              },
            ),
          },
        };
      case 'group-box-default':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: component(
              'field',
              { controlId: 'group-reference', label: 'Reference', required: true },
              {
                default: component('input', {
                  id: 'group-reference',
                  name: 'reference',
                  modelValue: 'PO-123',
                  required: true,
                }),
              },
            ),
          },
        };
      case 'container-default':
      case 'container-fluid':
        return {
          ...fixture,
          attributes: { style: '--cm-container-max-width: min(80%, 32rem)' },
          slots: { default: component('panel', {}, { default: 'Page content' }) },
        };
      case 'grid-default':
        return {
          ...fixture,
          slots: {
            default: ['Overview', 'Activity', 'Reports', 'Settings'].map((label) =>
              component('panel', {}, { default: label }),
            ),
          },
        };
      case 'inline-default':
      case 'inline-nowrap':
        return {
          ...fixture,
          attributes: fixture.id === 'inline-default' ? { style: 'max-inline-size: 14rem' } : undefined,
          slots: {
            default: ['Save', 'Duplicate', 'Archive'].map((label) =>
              component('button', { variant: 'secondary' }, { default: label }),
            ),
          },
        };
      case 'section-default':
      case 'section-surface':
        return { ...fixture, slots: { default: 'Section content' } };
      case 'stack-default':
        return {
          ...fixture,
          slots: {
            default: ['Overview', 'Details', 'Related notes'].map((label) =>
              component('section', { as: 'div', surface: true }, { default: label }),
            ),
          },
        };
      case 'panel-default':
      case 'panel-subtle':
        return {
          ...fixture,
          props: { ...fixture.props, title: 'Activity' },
          slots: { default: 'Nothing to review yet.' },
        };
      case 'popover-default':
        return {
          ...fixture,
          props: { ...fixture.props, label: 'Shortcuts' },
          slots: { default: 'Press S to save.' },
        };
      case 'popover-composed':
        return { ...fixture, slots: { ...fixture.slots, trigger: [icon('user'), 'Profile'] } };
      case 'popover-explicit-dismissal':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: component('input', {
              'aria-label': 'Display name',
              placeholder: 'Display name',
              'data-autofocus': '',
            }),
          },
        };
      case 'page-header-default':
        return {
          ...fixture,
          slots: { ...fixture.slots, actions: component('button', { href: '/orders/new' }, { default: 'New order' }) },
        };
      case 'tooltip-default':
        return {
          ...fixture,
          props: { id: fixture.props.id, content: 'Copy link', delay: 'none' },
          slots: { default: component('button', { variant: 'secondary', size: 'sm' }, { default: 'Copy' }) },
        };
      case 'tooltip-custom-trigger':
        return {
          ...fixture,
          slots: {
            ...fixture.slots,
            default: component('button', { variant: 'secondary' }, { default: 'Keyboard shortcuts' }),
          },
        };
      case 'nav-menu-compact':
        return { ...fixture, attributes: { ...fixture.attributes, style: 'inline-size: min(100%, 14rem)' } };
      case 'nav-menu-default':
      case 'nav-menu-pills':
        return {
          ...fixture,
          props: {
            ...fixture.props,
            items: [
              ...(fixture.props.items as unknown[]),
              {
                value: 'activity',
                label: 'Activity',
                children: [{ value: 'recent', label: 'Recent activity', href: '/activity/' }],
              },
            ],
          },
        };
      case 'field-floating-date-picker': {
        const id = String(fixture.props.controlId);
        return {
          ...fixture,
          slots: {
            default: component('date-picker', {
              id,
              teleportTo: 'body',
              placeholder: 'Choose a date',
              name: 'release_date',
              ariaDescribedby: `${id}-description`,
            }),
          },
        };
      }
      case 'form-layout-default':
        return {
          ...fixture,
          props: { ...fixture.props, labelWidth: 'minmax(0, min(40%, 12rem))' },
          slots: {
            default: component(
              'field',
              { controlId: 'billing-email', label: 'Billing email', required: true },
              { default: component('input', { id: 'billing-email', type: 'email', required: true }) },
            ),
          },
        };
      case 'icon-button-disabled':
        return {
          ...fixture,
          props: { ...fixture.props, label: 'Search', size: 'md', variant: 'ghost' },
          slots: { default: icon('magnifyingGlass') },
        };
      case 'icon-button-default':
      case 'icon-button-warn':
        return { ...fixture, slots: { default: icon('magnifyingGlass') } };
      case 'data-table-pinned': {
        const details = [
          { key: 'owner', header: 'Owner', width: '176px', cells: { apollo: 'Ada', zephyr: 'Grace' } },
          {
            key: 'milestone',
            header: 'Milestone',
            width: '192px',
            cells: { apollo: 'Beta launch', zephyr: 'Docs review' },
          },
          { key: 'updated', header: 'Updated', width: '192px', cells: { apollo: 'Nov 21', zephyr: 'Nov 19' } },
          { key: 'priority', header: 'Priority', width: '160px', cells: { apollo: 'High', zephyr: 'Normal' } },
        ];
        return {
          ...fixture,
          props: {
            ...fixture.props,
            columnDividers: true,
            columns: [
              ...(fixture.props.columns as Record<string, unknown>[]),
              ...details.map(({ key, header }) => ({ key, header })),
            ].map((column) => ({ ...column, resizable: false })),
            defaultColumnWidths: {
              ...Object.fromEntries(
                Object.entries({
                  ...(fixture.props.defaultColumnWidths as Record<string, string>),
                  ...Object.fromEntries(details.map(({ key, width }) => [key, width])),
                }).map(([key, width]) => [key, `${Number.parseFloat(width) / 16}rem`]),
              ),
            },
            rows: (fixture.props.rows as { id: 'apollo' | 'zephyr'; cells: Record<string, string> }[]).map((row) => ({
              ...row,
              cells: {
                ...row.cells,
                ...Object.fromEntries(details.map(({ key, cells }) => [key, cells[row.id]])),
              },
            })),
          },
        };
      }
      case 'data-table-interactive':
        return {
          ...fixture,
          props: {
            ...fixture.props,
            selectedRowIds: [],
            rows: [
              ...(fixture.props.rows as Record<string, unknown>[]),
              { id: 'luna', cells: { name: 'Luna', balance: '$95' } },
            ],
          },
        };
      case 'data-table-expansion':
        return { ...fixture, props: { ...fixture.props, defaultExpandedRowKeys: [] } };
      case 'data-table-resizable':
        return extendCase(fixture, { props: { columnDividers: true } });
      default:
        return fixture;
    }
  });
}

function adaptDataTableCase(fixture: ShowcaseCase): ShowcaseCase {
  const props: ShowcaseCase['props'] = { ...fixture.props, pagination: false };
  for (const key of ['page', 'pageCount', 'pageSize', 'pageSizeOptions', 'totalRows']) delete props[key];
  if (fixture.id !== 'data-table-interactive') {
    delete props.selectable;
    delete props.selectedRowIds;
  }
  if (props.sortingMode !== 'client') {
    delete props.sort;
    props.columns = (props.columns as Record<string, unknown>[]).map((column) => ({ ...column, sortable: false }));
  }
  return { ...fixture, props };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

const caseLabels: Record<string, string> = {
  'column-chooser-default': 'Column visibility',
  'theme-switch-default': '',
  'accordion-default': 'Single open',
  'accordion-disabled': 'Disabled panel',
  'accordion-multiple-open': 'Multiple open',
  'accordion-rich-content': 'Rich content',
  'avatar-image': 'Photo',
  'avatar-image--shape-circle': 'Circle',
  'avatar-label': 'sm',
  'avatar-label--md': 'md',
  'avatar-label--lg': 'lg',
  'avatar-slot': 'Icon',
  'breadcrumbs-default': 'Default',
  'breadcrumbs-disabled': 'Disabled link',
  'card-default': 'Default',
  'card-compact': 'Compact',
  'card-regions': 'Header & footer',
  'checkbox-default': 'Unchecked',
  'checkbox-default--disabled': 'Disabled',
  'checkbox-default--invalid': 'Invalid',
  'checkbox-default--invalid-indeterminate': 'Invalid · mixed',
  'command-palette-default': 'Search commands',
  'command-palette-idle': 'Idle',
  'command-palette-loading': 'Loading',
  'command-palette-external-results': 'External results',
  'command-palette-rich-content': 'Rich content',
  'aside-area-default': 'Default',
  'aside-area-default--appearance-plain': 'Plain',
  'container-default': 'Custom max width',
  'container-default--size-md': 'md',
  'container-default--size-lg': 'lg',
  'container-fluid': 'Fluid',
  'content-area-default': 'Padded',
  'content-area-unpadded': 'Unpadded',
  'footer-area-default': 'Footer',
  'grid-default': 'Auto-fit',
  'header-area-default': 'Header',
  'inline-default': 'Wrap',
  'inline-nowrap': 'No wrap',
  'section-default': 'Plain',
  'section-surface': 'Surface',
  'sidebar-area-default': 'Default',
  'sidebar-area-default--appearance-plain': 'Plain',
  'stack-default': 'Vertical',
  'stack-article': 'Article',
  'data-table-empty': 'emptyText',
  'data-table-expansion': 'Row details',
  'data-table-interactive': 'Row selection',
  'data-table-pagination': 'Pagination',
  'data-table-pinned': 'Pinned columns',
  'data-table-raw-rows': 'sortingMode=client',
  'data-table-resizable': 'Column resize',
  'dialog-default': 'md',
  'dialog-default--size-sm': 'sm',
  'dialog-default--size-lg': 'lg',
  'dialog-composed': 'Custom sections',
  'dialog-escape-disabled': 'Close button only',
  'drawer-default': 'End',
  'drawer-open': 'Start',
  'drawer-top': 'Top',
  'drawer-bottom': 'Bottom',
  'drawer-default--size-sm': 'sm',
  'drawer-default--size-lg': 'lg',
  'drawer-default--size-full': 'Full',
  'drawer-default--rounded': 'Rounded',
  'drawer-composed': 'Custom sections',
  'drawer-physical-offset': 'Top offset',
  'dropdown-default': 'Default',
  'dropdown-open': 'Bottom end',
  'dropdown-pills': 'Pills',
  'dropdown-scoped': 'Custom items',
  'dropdown-disabled': 'Disabled',
  'date-picker-default': 'Single date',
  'date-picker-default--invalid': 'Invalid',
  'date-picker-value': 'Read-only',
  'date-picker-default--disabled': 'Disabled',
  'date-picker-month': 'Month',
  'date-picker-multiple': 'Multiple dates',
  'date-picker-range': 'Date range',
  'date-picker-time': 'Date and time',
  'date-picker-year': 'Year',
  'field-default': 'Default',
  'field-help-error': 'Help and error',
  'field-floating-date-picker': 'Floating date',
  'field-floating-in': 'Floating · in',
  'field-floating-on': 'Floating · on',
  'field-floating-over': 'Floating · over',
  'fieldset-invalid': 'Invalid',
  'fieldset-help-error': 'Help and error',
  'form-layout-default': 'Responsive',
  'form-layout-default--mode-stacked': 'Stacked',
  'form-layout-default--mode-horizontal': 'Horizontal',
  'group-box-default': 'Collapsible',
  'group-box-default--not-collapsible': 'Static',
  'group-box-disabled': 'Toggle disabled',
  'input-default': 'Default',
  'input-disabled': 'Disabled',
  'input-invalid': 'Invalid',
  'input-number': 'Number',
  'input-readonly': 'Read-only',
  'link-external': 'External link',
  'menu-default': 'Default',
  'menu-states': 'Item states',
  'menu-bar-default': 'Nested',
  'menu-bar-compact-edge': 'Constrained width',
  'menu-bar-groups': 'Groups',
  'menu-bar-icons': 'Icons',
  'menu-bar-pills': 'Pills',
  'nav-menu-default': 'Sidebar',
  'nav-menu-compact': 'Compact',
  'nav-menu-pills': 'Pills',
  'nav-menu-default--expandMode-single': 'Single branch',
  'page-header-default': 'Title and action',
  'page-header-slots': 'With breadcrumbs',
  'panel-default': 'Default',
  'panel-subtle': 'Subtle',
  'popover-default': 'Bottom start',
  'popover-default--placement-top': 'Top',
  'popover-default--placement-bottom-end': 'Bottom end',
  'popover-default--disabled': 'Disabled',
  'popover-composed': 'Custom trigger',
  'popover-explicit-dismissal': 'Manual dismiss',
  'progress-bar-indeterminate': 'Indeterminate',
  'progress-bar-striped': 'Moving stripes',
  'progress-bar-striped--not-animated': 'Static stripes',
  'progress-spinner-default': 'md',
  'progress-spinner-default--sm': 'sm',
  'progress-spinner-default--lg': 'lg',
  'progress-spinner-custom-stroke': 'Thick stroke',
  'radio-default': 'Unchecked',
  'radio-default--invalid': 'Invalid',
  'radio-disabled': 'Disabled',
  'select-default': 'Default',
  'select-default--disabled': 'Disabled',
  'select-selected': 'Invalid',
  'select-adornments': 'With icons',
  'skeleton-default': 'Shimmer',
  'skeleton-default--minHeight-6rem': 'Tall',
  'skeleton-default--not-animated': 'No animation',
  'skeleton-default--radius-control': 'Control corners',
  'skeleton-default--radius-round': 'Rounded',
  'skeleton-gate-ready': '',
  'stepper-default': 'Horizontal',
  'stepper-above': 'Labels above',
  'stepper-default--contentPosition-inline': 'Inline labels',
  'stepper-default--orientation-vertical': 'Vertical',
  'stepper-vertical-start': 'Vertical start',
  'switch-default': 'Off',
  'switch-checked': 'On',
  'switch-default--invalid': 'Invalid',
  'switch-disabled': 'Disabled',
  'table-of-contents-default': 'Default',
  'table-of-contents-default--variant-pills': 'Pills',
  'tabs-default': 'Default',
  'tabs-disabled': 'Disabled tab',
  'tabs-overflow': 'Scrollable',
  'tabs-rich-content': 'Rich content',
  'textarea-invalid': 'Invalid',
  'textarea-default--readonly': 'Read-only',
  'textarea-default--disabled': 'Disabled',
  'tooltip-default': 'Top',
  'tooltip-default--placement-bottom': 'Bottom',
  'tooltip-default--placement-start': 'Start',
  'tooltip-default--placement-end': 'End',
  'tooltip-default--delay-long': 'Long delay',
  'tooltip-custom-trigger': 'Rich content',
};

function describeVariant(
  fixture: ShowcaseCase,
  base: ShowcaseCase,
  defaults: Record<string, unknown>,
  origin?: ShowcaseCase,
) {
  if (Object.hasOwn(caseLabels, fixture.id)) return caseLabels[fixture.id];
  const [caseId, variant] = fixture.id.split('--');
  if (Object.hasOwn(sizedFormExamples, caseId) && (!variant || formSizes.includes(variant))) {
    const group = sizedFormExamples[caseId];
    const size = String(fixture.props.size ?? defaults.size);
    return group ? `${group} · ${size}` : size;
  }

  const properties = Object.entries(fixture.props).filter(([name]) => !['id', 'name', 'controlId'].includes(name));
  const propertyLabel = ([name, value]: [string, unknown]) =>
    typeof value === 'number' || value === false || (typeof value === 'string' && /^[\w.%/-]{1,16}$/u.test(value))
      ? `${name}=${value}`
      : name;

  const primary = origin
    ? properties.filter(([name, value]) => stable(value) !== stable(origin.props[name] ?? defaults[name]))
    : [];
  const differences = properties.filter(
    ([name, value]) => stable(value) !== stable(base.props[name] ?? defaults[name]),
  );
  const slots = Object.entries(fixture.slots)
    .filter(([name, content]) => stable(content) !== stable(base.slots[name]))
    .map(([name]) => `#${name}`);
  const labels = [
    ...primary.map(propertyLabel),
    ...slots.filter((slot) => slot !== '#default'),
    ...differences.map(propertyLabel),
  ];
  return [...new Set(labels)].slice(0, 3).join(' · ') || slots[0] || 'default';
}

function showcasePropValue(slug: string, prop: string, value: unknown) {
  if (prop === 'tone' && (slug === 'badge' || slug === 'tag') && value === 'warn') return 'warning';
  if (slug === 'stepper' && prop === 'contentPosition' && (value === 'below' || value === 'end')) return 'bottom';
  return value;
}

export function showcaseComponentCases(
  slug: string,
  source: ShowcaseCase[],
  manifest: ComponentManifest,
): ShowcaseExample[] {
  // Application layouts have complete, responsive previews.
  if (layoutPreviewSlugs.has(slug)) return [];
  const fixtures = adaptContracts(source.filter(({ id }) => !contractOnlyCases.has(id)));
  const cases = (slug === 'data-table' ? fixtures.map(adaptDataTableCase) : fixtures).sort((a, b) =>
    a.id === `${slug}-default` ? -1 : b.id === `${slug}-default` ? 1 : a.id.localeCompare(b.id),
  );
  const base = cases[0];
  if (!base) throw new Error(`Missing showcase cases for ${slug}`);
  if (slug === 'data-table') {
    const selectionIndex = cases.findIndex(({ id }) => id === 'data-table-interactive');
    const [selection] = cases.splice(selectionIndex, 1);
    const expansionIndex = cases.findIndex(({ id }) => id === 'data-table-expansion');
    const [expansion] = cases.splice(expansionIndex, 1);
    const sortingIndex = cases.findIndex(({ id }) => id === 'data-table-raw-rows');
    cases.splice(
      sortingIndex + 1,
      0,
      extendCase(base, {
        id: 'data-table-pagination',
        attributes: { 'data-showcase-client-pagination': '' },
        props: {
          id: 'warehouse-pages',
          caption: 'Warehouse inventory',
          columns: warehouseColumns.filter(({ key }) => key === 'product' || key === 'available'),
          rows: warehouseRows.map(({ id, cells }) => ({
            id,
            cells: { product: cells.product, available: cells.available },
          })),
          pagination: true,
          paginationMode: 'client',
          pageSize: 5,
          pageSizeOptions: [5, 10],
        },
      }),
      selection,
      expansion,
    );
  }
  const added: ShowcaseCase[] = [];
  const isButton = slug === 'button' || slug === 'icon-button';
  for (const fixture of cases) {
    for (const { prop, value, label } of showcaseCaseVariants(slug, fixture.id.slice(slug.length + 1))) {
      if (
        ['alert', 'badge', 'tag'].includes(slug) &&
        prop === 'tone' &&
        cases.some((entry) => showcasePropValue(slug, prop, entry.props.tone) === value)
      )
        continue;
      const props: Record<string, unknown> = { [prop]: showcaseVariantValue(value) };
      if (prop === 'loadingVariant') props.loading = true;
      added.push(extendCase(fixture, { id: `${fixture.id}--${label.replaceAll(' ', '-')}`, props }));
    }
  }
  for (const fixture of supplemental[slug] ?? []) added.push(extendCase(base, fixture));
  const defaults = Object.fromEntries(
    Object.entries(manifest.props).flatMap(([key, prop]) =>
      'default' in prop ? [[key, prop.default]] : prop.type === 'boolean' ? [[key, false]] : [],
    ),
  );
  const seen = new Set<string>();
  const sources = new Map(cases.map((fixture) => [fixture.id, fixture]));
  const examples = [...cases, ...added].flatMap((fixture): ShowcaseExample[] => {
    const effectiveProps = { ...defaults, ...fixture.props };
    // Native overlays share the same launcher; having a second launcher for the same open state is redundant.
    if (modalSlugs.has(slug)) {
      delete effectiveProps.open;
      delete effectiveProps.defaultOpen;
    }
    if (slug === 'theme-switch') delete effectiveProps.modelValue;
    if (slug === 'stepper') {
      effectiveProps.contentPosition = showcasePropValue(slug, 'contentPosition', effectiveProps.contentPosition);
    }
    const { size, variant, loading, disabled } = effectiveProps;
    const buttonStyle =
      isButton &&
      typeof size === 'string' &&
      typeof variant === 'string' &&
      (!disabled || variant === defaults.variant) &&
      Object.keys(fixture.attributes ?? {}).length === 0 &&
      Object.keys(fixture.slots).every((slot) => slot === 'default') &&
      ((slug === 'button' && typeof fixture.slots.default === 'string' && !fixture.slots.default.includes('<')) ||
        stable(fixture.slots.default) === stable(base.slots.default)) &&
      Object.entries(effectiveProps).every(
        ([name, value]) =>
          ['size', 'variant', 'loading', 'disabled', 'label'].includes(name) ||
          stable(value) === stable(defaults[name]),
      )
        ? ({
            axis: disabled || loading ? 'state' : variant === defaults.variant ? 'size' : 'variant',
            size,
            variant,
            state: disabled ? 'disabled' : loading ? 'loading' : 'default',
          } as const)
        : undefined;
    // Use the same content when comparing size, variant, and state.
    const tone = feedbackPalettes.has(slug) ? showcasePropValue(slug, 'tone', effectiveProps.tone) : undefined;
    const alert = slug === 'alert' && typeof tone === 'string' ? alertExamples[tone] : undefined;
    const slots: ShowcaseCase['slots'] = buttonStyle && slug === 'button' ? { default: 'OK' } : { ...fixture.slots };
    if (alert) {
      slots.title = alert.title;
      slots.default = alert.text;
      slots.icon = icon(alert.icon);
    }
    const key = stable(buttonStyle ?? [effectiveProps, slots, fixture.attributes ?? {}]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        ...fixture,
        props:
          fixture.id === 'stepper-default--contentPosition-inline' && Array.isArray(fixture.props.items)
            ? { ...fixture.props, items: fixture.props.items.map((item) => ({ ...item, description: undefined })) }
            : fixture.props,
        slug,
        slots,
        buttonStyle,
        label:
          typeof tone === 'string' && !Object.hasOwn(caseLabels, fixture.id)
            ? tone[0].toUpperCase() + tone.slice(1)
            : describeVariant(
                fixture,
                base,
                defaults,
                fixture.id.includes('--') ? sources.get(fixture.id.split('--')[0]) : undefined,
              ),
      },
    ];
  });
  if (slug === 'tooltip') {
    examples.sort((a, b) => Number(a.id === 'tooltip-custom-trigger') - Number(b.id === 'tooltip-custom-trigger'));
  }
  if (slug === 'menu-bar') {
    examples.sort((a, b) => Number(a.id === 'menu-bar-compact-edge') - Number(b.id === 'menu-bar-compact-edge'));
  }
  const modalOrder = firstModalExamples[slug];
  if (modalOrder) {
    const rank = ({ id }: ShowcaseExample) => {
      const index = modalOrder.indexOf(id);
      return index === -1 ? modalOrder.length : index;
    };
    examples.sort((a, b) => rank(a) - rank(b));
  }
  if (slug === 'popover') {
    const isPlacement = ({ id }: ShowcaseExample) =>
      id === 'popover-default' || id.startsWith('popover-default--placement-');
    examples.sort((a, b) => Number(isPlacement(b)) - Number(isPlacement(a)));
  }
  if (cases.some(({ id }) => Object.hasOwn(sizedFormExamples, id))) {
    const caseOrder = new Map(cases.map(({ id }, index) => [id, index]));
    const rank = ({ id, props }: ShowcaseExample) => {
      const [caseId, variant] = id.split('--');
      const group = firstFormSizeGroups.has(caseId) ? -1 : (caseOrder.get(caseId) ?? cases.length);
      const size =
        Object.hasOwn(sizedFormExamples, caseId) && (!variant || formSizes.includes(variant))
          ? formSizes.indexOf(String(props.size ?? defaults.size))
          : formSizes.length;
      return group * (formSizes.length + 1) + size;
    };
    examples.sort((a, b) => rank(a) - rank(b));
  }
  const firstExamples = feedbackFirstExamples[slug] ?? [];
  if (feedbackPalettes.has(slug) || firstExamples.length > 0) {
    const rank = ({ id, props }: ShowcaseExample) => {
      const first = firstExamples.indexOf(id);
      if (first !== -1) return first;
      const tone = showcasePropValue(slug, 'tone', props.tone ?? defaults.tone);
      const color = typeof tone === 'string' && !Object.hasOwn(caseLabels, id) ? tones.indexOf(tone) : -1;
      return firstExamples.length + (color === -1 ? tones.length : color);
    };
    examples.sort((a, b) => rank(a) - rank(b));
  }
  if (slug === 'container') {
    const variants = [
      'container-default',
      'container-default--size-md',
      'container-default--size-lg',
      'container-fluid',
    ];
    return variants.map((id) => examples.find((example) => example.id === id)!);
  }
  if (!isButton) return examples;

  const sizes = manifest.props.size.values ?? [];
  const variants = manifest.props.variant.values ?? [];
  const axes = ['variant', 'size', 'state'];
  const styles = examples.flatMap((example) => (example.buttonStyle ? [{ example, style: example.buttonStyle }] : []));
  styles.sort(
    ({ style: a }, { style: b }) =>
      axes.indexOf(a.axis) - axes.indexOf(b.axis) ||
      variants.indexOf(a.variant) - variants.indexOf(b.variant) ||
      sizes.indexOf(a.size) - sizes.indexOf(b.size) ||
      Number(a.state === 'disabled') - Number(b.state === 'disabled'),
  );
  return [...styles.map(({ example }) => example), ...examples.filter((example) => !example.buttonStyle)];
}

export function showcasePanelExamples(slug: string, examplesFor: (slug: string) => ShowcaseExample[]) {
  const examples = examplesFor(slug);
  if (slug !== 'data-table') return examples;

  const columnVisibility = examplesFor('column-chooser').find(({ id }) => id === 'column-chooser-default');
  if (!columnVisibility) return examples;
  const resize = examples.findIndex(({ id }) => id === 'data-table-resizable');
  const index = resize < 0 ? examples.length : resize + 1;
  return [...examples.slice(0, index), columnVisibility, ...examples.slice(index)];
}
