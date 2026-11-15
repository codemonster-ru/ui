import { bars, chevronDown, magnifyingGlass, resolveCmIcon } from '@codemonster-ru/ui-icons';
import pages from './showcase-pages.json' with { type: 'json' };

type ShowcaseIcon = typeof bars;

function icon(geometry: ShowcaseIcon) {
  const rendering = resolveCmIcon(geometry, 'classic', 'regular');
  if (!rendering) throw new Error('Missing showcase navigation icon');
  const { viewBox, body } = rendering;
  return `<svg class="cm-icon cm-icon--regular cm-icon--classic" viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const showcaseActions = `
  <button class="showcase-header-button" data-showcase-search-open type="button" aria-label="Search components and guides" aria-haspopup="dialog">${icon(magnifyingGlass)}<span>Search</span></button>
  <button class="showcase-header-button showcase-menu-toggle" data-showcase-menu-toggle type="button" aria-label="Menu" aria-expanded="false" aria-controls="showcase-navigation">${icon(bars)}</button>
`;

export function renderShowcaseNavigation(current: string, path: string, base: string, vue: boolean) {
  const available = pages.filter(({ vueOnly }) => vue || !vueOnly);
  const active = (id: string) => id === current;
  const link = ({ id, label }: (typeof pages)[number]) => {
    const href = `/${id}/`;
    const state = path === href || path === href.slice(0, -1) || (id === 'core' && path === '/') ? 'page' : 'location';
    return `<li><a href="${base}${href}"${active(id) ? ` aria-current="${state}"` : ''}>${label}</a></li>`;
  };
  const resources = available.filter(({ resource }) => resource);
  return `<nav class="showcase-navigation" id="showcase-navigation" aria-label="Site navigation">
    <ul class="showcase-navigation__primary">
      ${available
        .filter(({ resource }) => !resource)
        .map(link)
        .join('')}
      <li>
        <details class="showcase-resources">
          <summary${resources.some(({ id }) => active(id)) ? ' data-current' : ''}>Resources ${icon(chevronDown)}</summary>
          <ul>${resources.map(link).join('')}</ul>
        </details>
      </li>
    </ul>
  </nav>`;
}
