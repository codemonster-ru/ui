import pages from './showcase-pages.json' with { type: 'json' };
import groups from './showcase-groups.json' with { type: 'json' };
import { layoutExamples } from './showcase-layout-data.mts';

export const coreShowcaseGroups = groups.filter(({ id }) => id !== 'layouts' && id !== 'icons');

function renderSectionNavigation(sections: { id: string; title: string }[], path: string, label: string) {
  return `<nav class="showcase-section-navigation" aria-label="${label}">
    <ul>${sections.map(({ id, title }) => `<li><a class="cm-link cm-link--underline-hover" href="${path}#${id}">${title}</a></li>`).join('')}</ul>
  </nav>`;
}

export function renderCoreSectionNavigation(path: string) {
  const sections = [coreShowcaseGroups[0], { id: 'typography', title: 'Typography' }, ...coreShowcaseGroups.slice(1)];
  return renderSectionNavigation(sections, path, 'Component state sections');
}

export function renderLayoutSectionNavigation(path: string) {
  const sections = [
    ...layoutExamples.map(({ slug, label }) => ({ id: `demo-${slug}`, title: label })),
    { id: 'layout-primitives', title: 'Layout primitives' },
  ];
  return renderSectionNavigation(sections, path, 'Layout examples');
}

export function renderShowcaseNavigation(current: string, path: string, base: string) {
  const available = pages.filter(({ detailOnly }) => !detailOnly);
  const link = ({ id, label }: (typeof pages)[number]) => {
    const href = `/${id}/`;
    const state = path === href || path === href.slice(0, -1) || (id === 'core' && path === '/') ? 'page' : 'location';
    return `<li><a class="cm-link" href="${base}${href}"${id === current ? ` aria-current="${state}"` : ''}>${label}</a></li>`;
  };
  return `<nav class="showcase-navigation" id="showcase-navigation" aria-label="Site navigation">
    <ul class="showcase-navigation__primary">${available.map(link).join('')}</ul>
  </nav>`;
}
