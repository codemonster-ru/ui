import { h } from 'vue';
import { CmLink } from '@codemonster-ru/ui-vue';
import pages from './showcase-pages.json' with { type: 'json' };
import groups from './showcase-groups.json' with { type: 'json' };

export const coreShowcaseGroups = groups.filter(({ id }) => id !== 'layouts' && id !== 'icons');

export function renderShowcaseNavigation(current: string, path: string, base: string) {
  return h('nav', { class: 'showcase-navigation', id: 'showcase-navigation', 'aria-label': 'Site navigation' }, [
    h(
      'ul',
      { class: 'showcase-navigation__primary' },
      pages.map(({ id, label }) => {
        const href = `/${id}/`;
        const state =
          path === href || path === href.slice(0, -1) || (id === 'core' && path === '/') ? 'page' : 'location';
        return h('li', [
          h(CmLink, { href: `${base}${href}`, 'aria-current': id === current ? state : undefined }, () => label),
        ]);
      }),
    ),
  ]);
}
