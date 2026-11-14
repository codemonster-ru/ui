const examples: Record<string, readonly string[]> = {
  tooltip: ['top', 'bottom', 'start', 'end'],
  popover: ['default', 'composed'],
  dropdown: ['default', 'composed'],
  card: ['regions', 'compact'],
  avatar: ['image', 'label'],
  badge: ['default', 'danger'],
  tag: ['default'],
  divider: ['horizontal', 'vertical'],
  fieldset: ['default'],
  table: ['default', 'presentation'],
  'data-table': ['default', 'interactive', 'empty'],
  'column-chooser': ['default'],
  alert: ['default', 'danger-icon'],
  'progress-bar': ['determinate', 'indeterminate'],
  'progress-spinner': ['default', 'danger-lg'],
  skeleton: ['default', 'static-height'],
  field: ['default', 'help-error'],
  input: ['default', 'invalid', 'disabled', 'readonly', 'enhanced'],
  textarea: ['default', 'invalid'],
  select: ['default', 'selected', 'clearable'],
  'date-picker': ['default', 'clearable'],
  checkbox: ['default', 'checked', 'indeterminate'],
  radio: ['default', 'checked', 'disabled'],
  switch: ['default', 'checked', 'disabled'],
  breadcrumbs: ['default'],
  menu: ['default'],
  'menu-bar': ['default'],
  'nav-menu': ['default'],
  'table-of-contents': ['default', 'pills'],
  stepper: ['default'],
  tabs: ['default', 'disabled'],
  accordion: ['one-open', 'multiple-open'],
  dialog: ['default'],
  drawer: ['default'],
  'command-palette': ['default'],
};

export function renderCoreMatrix(slug: string, read: (id: string) => string | undefined, avatar: string) {
  const cases = examples[slug];
  if (!cases) return '';
  return `<div class="core-example-grid">${cases
    .map((name) => {
      const id = `${slug}-${name}`;
      const source =
        slug === 'tooltip'
          ? read('tooltip-default')?.replace('cm-tooltip--top', `cm-tooltip--${name}`)
          : slug === 'table-of-contents' && name === 'pills'
            ? read('table-of-contents-default')?.replace(
                'class="cm-table-of-contents"',
                'class="cm-table-of-contents cm-table-of-contents--pills"',
              )
            : read(id);
      if (source === undefined) throw new Error(`Missing showcase matrix case: ${id}`);
      const ids = new Set([...source.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]));
      const prefix = `matrix-${id}-`;
      const closedSource =
        id === 'dropdown-composed'
          ? source
              .replace(' cm-dropdown--open', '')
              .replace('aria-expanded="true"', 'aria-expanded="false"')
              .replace('data-cm-controller="menu"', 'data-cm-controller="menu" hidden')
          : source;
      const html = closedSource
        .replaceAll('src="/avatar.png"', `src="${avatar}"`)
        .replace(
          /\b(id|name|for|form|list|aria-controls|aria-describedby|aria-labelledby|aria-activedescendant|aria-owns)="([^"]+)"/gu,
          (_, attribute: string, value: string) =>
            `${attribute}="${value
              .split(' ')
              .map((token) => (attribute === 'name' || ids.has(token) ? prefix + token : token))
              .join(' ')}"`,
        )
        .replace(/href="#([^"]+)"/gu, (match, target: string) =>
          ids.has(target) ? `href="#${prefix}${target}"` : match,
        );
      const modal = ['dialog', 'drawer', 'command-palette'].includes(slug);
      return `<div class="core-example"><h4>${name.replaceAll('-', ' ')}</h4>
      ${modal ? `<button type="button" class="cm-button cm-button--secondary cm-button--md" data-matrix-open>Open ${slug.replaceAll('-', ' ')}</button>` : ''}
      ${html}</div>`;
    })
    .join('')}</div>`;
}

export function coreRecipesFor(source: string, group: string) {
  return (
    [...source.matchAll(/<template data-core-group="([^"]+)">([\s\S]*?)<\/template>/gu)].find(
      ([, id]) => id === group,
    )?.[2] ?? ''
  );
}

export function coreComponentTitle(slug: string) {
  return slug.replace(
    /(^|-)([a-z])/gu,
    (_, separator: string, letter: string) => (separator ? ' ' : '') + letter.toUpperCase(),
  );
}
