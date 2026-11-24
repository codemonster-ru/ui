const sizes = ['sm', 'md', 'lg'];
export const tones = ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'];

// Repeat sizes for states with their own indicators or controls that resize.
const sizedCases: Record<string, string[]> = {
  avatar: ['label'],
  input: ['enhanced'],
  textarea: ['default'],
  select: ['clearable'],
  checkbox: ['checked', 'indeterminate'],
  radio: ['checked'],
  switch: ['custom-thumb'],
  'progress-spinner': ['default'],
  'date-picker': ['clearable'],
};

const visualOptions: Record<string, Record<string, string[]>> = {
  'button/default': { variant: ['success', 'info', 'warn', 'help', 'contrast'] },
  'icon-button/default': {
    variant: ['primary', 'secondary', 'success', 'info', 'help', 'danger', 'contrast'],
    size: ['sm', 'lg'],
  },
  'link/default': { tone: ['muted'], underline: ['hover', 'always'] },
  'avatar/image': { shape: ['circle'] },
  'container/default': { size: ['md', 'lg'] },
  'form-layout/default': { mode: ['stacked', 'horizontal'] },
  'sidebar-area/default': { appearance: ['plain'] },
  'aside-area/default': { appearance: ['plain'] },
  'nav-menu/default': { expandMode: ['single'] },
  'table-of-contents/default': { variant: ['pills'] },
  'group-box/default': { collapsible: ['false'] },
  'dialog/default': { size: sizes },
  'drawer/default': {
    size: [...sizes, 'full'],
    rounded: ['true'],
  },
  'tooltip/default': { placement: ['bottom', 'start', 'end'], delay: ['long'] },
  'popover/default': { placement: ['top', 'bottom-end'], disabled: ['true'] },
  'select/default': { disabled: ['true'] },
  'textarea/default': { readonly: ['true'], disabled: ['true'] },
  'date-picker/default': { invalid: ['true'], disabled: ['true'] },
  'checkbox/default': { invalid: ['true'], disabled: ['true'] },
  'radio/default': { invalid: ['true'] },
  'switch/default': { invalid: ['true'] },
  'stepper/default': { orientation: ['vertical'], contentPosition: ['inline'] },
  'progress-spinner/default': { tone: tones },
  'progress-bar/striped': { animated: ['false'] },
  'data-table/empty': { loading: ['true'], error: ['true'] },
  'skeleton/default': {
    animated: ['false'],
    minHeight: ['6rem'],
    radius: ['control', 'surface', 'round'],
  },
  'table/default': { density: ['compact'], striped: ['true'], columnDividers: ['true'] },
  'data-table/default': {
    density: ['compact'],
    striped: ['true'],
    columnDividers: ['true'],
    loadingVariant: ['mask', 'skeleton'],
  },
};

export function showcaseVariantValue(value: string) {
  if (value === 'true' || value === 'false') return value === 'true';
  return value;
}

// Each row varies a supported prop on an existing canonical example.
export function showcaseCaseVariants(componentSlug: string, basename: string) {
  const options = Object.entries(visualOptions[`${componentSlug}/${basename}`] ?? {}).flatMap(([prop, values]) =>
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
  if (sizedCases[componentSlug]?.includes(basename)) {
    return [...sizes.map((size) => ({ label: size, prop: 'size', value: size })), ...options];
  }
  if (
    (['badge', 'tag', 'alert'].includes(componentSlug) && basename === 'default') ||
    (componentSlug === 'progress-bar' && basename === 'determinate')
  ) {
    return tones.map((tone) => ({ label: tone, prop: 'tone', value: tone }));
  }
  return options;
}
