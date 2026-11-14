const sizes = ['sm', 'md', 'lg'];
const variants = ['primary', 'secondary', 'danger', 'ghost'];
export const tones = ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'];

export const buttonMatrices = {
  'Variants by size': Object.fromEntries(
    sizes.map((size) => [
      size,
      [...variants.map((variant) => ({ label: variant, variant, size })), { label: 'disabled', size, disabled: true }],
    ]),
  ),
  'Loading variants by size': Object.fromEntries(
    sizes.map((size) => [size, variants.map((variant) => ({ label: variant, variant, size, loading: true }))]),
  ),
};

export const actionMatrices = {
  'icon-button': Object.fromEntries(
    sizes.map((size) => [
      `Variants · ${size}`,
      [
        ...variants.map((variant) => ({ label: `${variant} ${size} settings`, variant, size })),
        { label: `Disabled ${size} settings`, size, disabled: true },
      ],
    ]),
  ),
  link: Object.fromEntries(
    ['default', 'muted'].map((tone) => [
      tone,
      [
        ...['none', 'hover', 'always'].map((underline) => ({ label: `${underline} underline`, tone, underline })),
        { label: 'external link', tone, underline: 'hover', external: true },
      ],
    ]),
  ),
};

const stateCases: Record<string, string[]> = {
  input: ['default', 'value', 'invalid', 'disabled', 'readonly', 'enhanced'],
  textarea: ['default', 'invalid', 'value'],
  select: ['default', 'selected', 'clearable'],
  checkbox: ['default', 'checked', 'indeterminate'],
  radio: ['default', 'checked', 'disabled'],
  switch: ['default', 'checked', 'disabled', 'custom-thumb'],
  'progress-spinner': ['default'],
  'date-picker': ['default', 'value', 'clearable'],
};

const legacyOptions: Record<string, Record<string, string[]>> = {
  'icon/default': { family: ['duotone'], variant: ['thin', 'light', 'solid'] },
  'app-shell/default': { layout: ['content', 'sidebar-content'], stickyHeader: ['true'] },
  'document-layout/default': { layout: ['content', 'sidebar-content'] },
  'admin-layout/default': { sidebarCollapsed: ['true'], mobileSidebarOpen: ['true'] },
  'nav-menu/default': { variant: ['inline'], expandMode: ['single'] },
  'dialog/default': { size: sizes, dismissible: ['false'] },
  'drawer/default': { size: [...sizes, 'full'], side: ['start', 'end'], rounded: ['true'], dividers: ['true'] },
  'tooltip/default': { placement: ['top', 'bottom', 'start', 'end'], delay: ['none', 'short', 'long'] },
  'popover/default': { placement: ['top', 'bottom-start', 'bottom-end'], disabled: ['true'] },
  'select/default': { invalid: ['true'], disabled: ['true'] },
  'textarea/default': { readonly: ['true'], disabled: ['true'] },
  'date-picker/default': { invalid: ['true'], readonly: ['true'], disabled: ['true'] },
  'checkbox/default': { invalid: ['true'], disabled: ['true'] },
  'radio/default': { invalid: ['true'] },
  'switch/default': { invalid: ['true'] },
  'stepper/default': { orientation: ['vertical'], contentPosition: ['inline'] },
  'data-table/empty': { loading: ['true'], error: ['true'] },
  'skeleton/default': {
    minHeight: ['2.5rem', '4rem', '6rem'],
    animated: ['false'],
    radius: ['control', 'surface', 'round'],
  },
  'table/default': { density: ['compact'], striped: ['true'], columnDividers: ['true'], stickyHeader: ['true'] },
  'data-table/default': { density: ['compact'], striped: ['true'], columnDividers: ['true'], stickyHeader: ['true'] },
};

export function showcaseVariantValue(value: string) {
  if (value === 'true' || value === 'false') return value === 'true';
  return value;
}

// Each row varies a supported prop on an existing canonical example.
export function showcaseCaseVariants(componentSlug: string, basename: string) {
  if (componentSlug === 'avatar' && ['label', 'image'].includes(basename)) {
    return [
      ...sizes.map((size) => ({ label: size, prop: 'size', value: size })),
      ...['square', 'circle'].map((shape) => ({ label: shape, prop: 'shape', value: shape })),
    ];
  }
  const options = Object.entries(legacyOptions[`${componentSlug}/${basename}`] ?? {}).flatMap(([prop, values]) =>
    values.map((value) => ({
      prop,
      value,
      label:
        value === 'true'
          ? prop.replace(/[A-Z]/g, (char) => ' ' + char.toLowerCase())
          : value === 'false'
            ? 'not ' + prop
            : prop + ' ' + value,
    })),
  );
  if (stateCases[componentSlug]?.includes(basename)) {
    return [...sizes.map((size) => ({ label: size, prop: 'size', value: size })), ...options];
  }
  if (
    ['badge', 'tag', 'alert', 'progress-bar'].includes(componentSlug) &&
    basename === (componentSlug === 'progress-bar' ? 'determinate' : 'default')
  ) {
    return tones.map((tone) => ({ label: tone, prop: 'tone', value: tone }));
  }
  return options;
}
