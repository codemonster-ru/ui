export const modalExamples = new Set(['dialog', 'drawer', 'command-palette']);
export const skeletonLoadDelay = 900;

export function showcaseExamplePrefix(id) {
  return `showcase-${id.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}`;
}

const idReferences = new Set([
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'commandfor',
  'for',
  'form',
  'headers',
  'list',
  'popovertarget',
]);

export function scopeShowcaseAttribute(name, value, prefix) {
  if (!value) return value;
  if (['id', 'name', 'control-id', 'data-cm-date-picker-name'].includes(name)) return `${prefix}-${value}`;
  if (idReferences.has(name)) return value.replace(/\S+/gu, (id) => `${prefix}-${id}`);
  if ((name === 'href' || name === 'xlink:href') && value.startsWith('#') && value.length > 1)
    return `#${prefix}-${value.slice(1)}`;
  if (name.endsWith('teleport-to')) {
    if (value === 'body') return `#${prefix}-portal`;
    if (value.startsWith('#')) return `#${prefix}-${value.slice(1)}`;
  }
  return value.replace(/url\(#([^)]+)\)/gu, (_, id) => `url(#${prefix}-${id})`);
}

export function isShowcaseValueValid(slug, value) {
  if (slug === 'checkbox' || slug === 'switch') return value === true;
  if (typeof value !== 'string' || !value.trim()) return false;
  if (slug === 'textarea')
    return (
      value
        .trim()
        .split(/\r?\n/u)
        .filter((line) => line.trim()).length >= 3
    );
  if (slug === 'select') return value !== 'draft';
  return true;
}

export function handleShowcaseDemoClick(demo, event) {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-showcase-skeleton-load]')) {
    const gate = demo.querySelector('.cm-skeleton-gate');
    if (gate.hasAttribute('aria-busy')) return;
    const content = gate.querySelector('.cm-skeleton-gate__content');
    const overlay = gate.querySelector('.cm-skeleton-gate__overlay');
    gate.setAttribute('aria-busy', 'true');
    content.setAttribute('aria-hidden', 'true');
    content.inert = true;
    content.classList.remove('cm-skeleton-gate__content--ready');
    overlay.hidden = false;
    setTimeout(() => {
      gate.removeAttribute('aria-busy');
      content.removeAttribute('aria-hidden');
      content.inert = false;
      content.classList.add('cm-skeleton-gate__content--ready');
      overlay.hidden = true;
    }, skeletonLoadDelay);
    return;
  }
  const link = event.target.closest('a[href]');
  const href = link?.getAttribute('href');
  if (href?.startsWith('#')) {
    event.preventDefault();
    const target = demo.ownerDocument.getElementById(href.slice(1));
    if (demo.contains(target)) target.scrollIntoView({ block: 'nearest' });
  } else if (href?.startsWith('/') && link.origin === demo.ownerDocument.location.origin) {
    event.preventDefault();
  }
}

export function selectShowcaseNavItem(item) {
  if (!item || item.matches(':disabled, [aria-disabled="true"]')) return;
  const menu = item.closest('.cm-nav-menu');
  for (const candidate of menu.querySelectorAll('[data-cm-nav-menu-value]')) {
    const selected = candidate === item;
    if (selected) candidate.setAttribute('aria-current', 'page');
    else candidate.removeAttribute('aria-current');
    candidate.classList.toggle('cm-nav-menu__item--active', selected);
    candidate.closest('.cm-nav-menu__node').classList.toggle('cm-nav-menu__node--active', selected);
  }
}
