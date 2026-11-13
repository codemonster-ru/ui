const ordinal: Record<string, number> = { first: 0, second: 1, third: 2, last: -1 };
const selectors: Record<string, string> = {
  'mobile-toggle': '[data-cm-mobile-sidebar-toggle]',
  'sidebar-toggle': '[data-cm-sidebar-toggle]',
  'header-first': 'th[aria-sort]',
  'sort-first': '[data-cm-data-table-sort]',
  'page-next': '[data-cm-data-table-page-action="next"]',
  'page-size': '[data-cm-data-table-page-size-control]',
  'select-first': '[data-cm-data-table-select-row]',
  'select-last': '[data-cm-data-table-select-row]',
  'branch-first': '[data-cm-nav-menu-branch], [data-cm-menu-bar-branch]',
  'submenu-first': '.cm-menu-bar__submenu',
  'step-first': '[data-cm-stepper-value]',
  'step-second': '[data-cm-stepper-value]',
  'step-third': '[data-cm-stepper-value]',
  'item-active': '.cm-menu__item--active',
  dark: 'input[value="dark"]',
  light: 'input[value="light"]',
};
const events = new Map<string, number>();
export function recordEvent(name: string) {
  events.set(name, (events.get(name) ?? 0) + 1);
}

export function behaviorTarget(slug: string, name: string): HTMLElement | null {
  const root = document.querySelector<HTMLElement>('#visual-root');
  if (!root) return null;
  if (name === 'root') return root.querySelector('.cm-' + slug);
  if (name === 'form' || name === 'outside') return document.querySelector('#behavior-' + name);
  if (name === 'control') return root.querySelector('input:not([type=hidden]), textarea, input[type=hidden]');
  if (name === 'trigger' && ['date-picker', 'select'].includes(slug))
    return root.querySelector('button[role=combobox]');
  const [part, index] = name.split('-');
  const component = slug === 'column-chooser' ? 'popover' : slug;
  const selector =
    selectors[name] ??
    (name.startsWith('item-') ? '[data-cm-menu-item]' : null) ??
    (name === 'close' ? `[data-cm-${slug}-close]` : null) ??
    (name === 'tooltip' ? '.cm-tooltip__content' : null) ??
    `.cm-${component}__${Object.hasOwn(ordinal, index) ? part : name}`;
  const items = [...root.querySelectorAll<HTMLElement>(selector)];
  return items.at(ordinal[index] ?? 0) ?? null;
}

export function initializeBehavior(root: HTMLElement) {
  const form = document.createElement('form');
  form.id = 'behavior-form';
  form.addEventListener('submit', (event) => event.preventDefault());
  root.before(form);
  form.append(root);
  const outside = document.createElement('button');
  outside.id = 'behavior-outside';
  outside.textContent = 'Outside';
  form.after(outside);
  for (const name of ['input', 'change']) root.addEventListener(name, () => recordEvent(name));
  for (const name of [
    'open-change',
    'theme-change',
    'setup-layout-next',
    'setup-layout-back',
    'dialog-open-change',
    'drawer-open-change',
    'popover-open-change',
    'dropdown-open-change',
    'menu-select',
    'tabs-value-change',
    'command-palette-select',
    'command-palette-query-change',
    'data-table-page-change',
    'data-table-page-size-change',
    'data-table-selection-change',
    'data-table-sort-change',
  ])
    root.addEventListener('cm:' + name, () => recordEvent(name));
  Object.assign(window, { behaviorTarget, behaviorEvents: events });
}
