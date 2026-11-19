import groups from './showcase-groups.json' with { type: 'json' };
import { coreComponentTitle } from './showcase-core-matrix.mts';

export function renderHomeCopy(path: string, base: string) {
  return `<h1>CodeMonster UI</h1>
    <p class="showcase-home__lead">A design system for Vue and Vanilla HTML.</p>
    <p class="showcase-home__description">Shared CSS, semantic server-rendered markup, and progressive enhancement.</p>
    <div class="showcase-home__links">
      <a class="cm-button cm-button--primary cm-button--md" href="${path}#component-catalog">Browse components</a>
      <a class="cm-link cm-link--underline-hover" href="${base}layouts/#demo-admin-shell">Explore workspaces</a>
    </div>`;
}

export function renderComponentCatalog(base: string) {
  const entriesByGroup = groups
    .map(({ id, title, components }) => {
      const entries =
        id === 'theme'
          ? ['theme-provider', ...components]
          : id === 'modals'
            ? [...components, 'confirm-dialog']
            : components;
      const links = entries.map(
        (slug) =>
          `<li><a class="cm-link cm-link--underline-hover" href="${base}components/${slug}/">${coreComponentTitle(slug)}</a></li>`,
      );
      return `<details><summary>${title}</summary><ul>${links.join('')}</ul></details>`;
    })
    .join('');
  return `<div class="showcase-directory__filter" data-component-filter hidden>
    <label for="component-catalog-search">Find a component</label>
    <input class="cm-input" id="component-catalog-search" type="search" autocomplete="off">
    <p role="status"></p>
  </div>
  <div class="showcase-directory__groups">${entriesByGroup}</div>`;
}
