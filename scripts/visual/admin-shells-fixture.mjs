import { h } from 'vue';
import { CmAdminLayout, CmAdminShell } from '@codemonster-ru/ui-layouts';

export function fixtureOptions(parameters) {
  return {
    component: parameters.get('component') === 'layout' ? 'layout' : 'shell',
    platform: parameters.get('platform') === 'vanilla' ? 'vanilla' : 'vue',
    theme: parameters.get('theme') === 'dark' ? 'dark' : 'light',
    header: parameters.get('header') === '120' ? 120 : 64,
    zoom: parameters.get('zoom') === '2' ? 2 : 1,
    nested: parameters.get('nested') === 'true',
    open: parameters.get('open') === 'true',
    safe: parameters.get('safe') === 'true',
  };
}

const links = ['Overview', 'Commerce', 'Products', 'Inventory', 'Availability', 'Settings'];
const topbar = '<span class="fixture-header">Workspace</span>';
const body = (id) =>
  `<p>Workspace content</p><div class="fixture-spacer"></div><button type="button" id="${id}-next" class="cm-button cm-button--primary cm-button--md">Next page</button><div class="fixture-tail"></div>`;
const navigation = (id, component) => {
  const items = component === 'layout' ? ['First item', 'Second item'] : links;
  return `<nav class="fixture-navigation" aria-label="${id} navigation">${items.map((item, index) => `<a class="cm-link" href="#picked-${id}-${index + 1}" id="${id}-link-${index + 1}">${item}</a>`).join('')}</nav>`;
};
const outerHeader = 'style="--fixture-header-height: 64px"';
const host = '<div class="fixture-scroll-spacer"></div>';

export function fixtureVue(config) {
  const layout = config.component === 'layout';
  const Component = layout ? CmAdminLayout : CmAdminShell;
  const header = () => h('span', { class: 'fixture-header' }, 'Workspace');
  const nav = (id, component) => () => h('div', { innerHTML: navigation(id, component) });
  return () => {
    const id = 'subject';
    const props = {
      'data-fixture-subject': '',
      ...(layout ? { id: 'subject-aside', defaultMobileSidebarOpen: config.open } : {}),
    };
    const subject = h(Component, props, {
      header,
      [layout ? 'aside' : 'sidebar']: nav(id, config.component),
      default: () => h('div', { innerHTML: body(id) }),
    });
    if (!config.nested) return subject;
    return h('div', { class: 'fixture-scroll' }, [
      h('div', { class: 'fixture-scroll-spacer' }),
      h(
        CmAdminShell,
        { 'data-fixture-outer': '', style: '--fixture-header-height:64px' },
        {
          header,
          default: () =>
            h('div', { class: 'fixture-nested', style: `--fixture-header-height:${config.header}px` }, [subject]),
        },
      ),
    ]);
  };
}

export function fixtureVanilla(config, { shell, layout }) {
  const id = 'subject';
  const isLayout = config.component === 'layout';
  let markup = isLayout ? layout : shell;
  markup = markup.replace('class="cm-admin-', 'data-fixture-subject class="cm-admin-');
  markup = markup.replace('>Navigation<', `><div>${navigation(id, config.component)}</div><`);
  markup = markup.replace(isLayout ? '>Dashboard<' : '>Workspace<', `><div>${body(id)}</div><`);
  if (isLayout) {
    markup = markup.replace('>Projects<', `>${topbar}<`).replaceAll('"workspace"', '"subject-aside"');
    markup = markup.replace(/<div class="cm-admin-layout__brand">Acme<\/div>/u, '');
    if (config.open) {
      markup = markup
        .replace('data-cm-mobile-sidebar-open="false"', 'data-cm-mobile-sidebar-open="true"')
        .replace('aria-expanded="false"', 'aria-expanded="true"')
        .replace('Open navigation', 'Close navigation');
    }
  } else {
    markup = markup
      .replace('>Acme<', `>${topbar}<`)
      .replace('class="cm-admin-shell__brand"', 'class="cm-admin-shell__header"');
  }
  if (!config.nested) return markup;
  const nested = `<div class="fixture-nested" style="--fixture-header-height:${config.header}px">${markup}</div>`;
  const outer = shell
    .replace('class="cm-admin-shell"', `data-fixture-outer ${outerHeader} class="cm-admin-shell"`)
    .replace(/<aside class="cm-admin-shell__sidebar">.*?<\/aside>/u, '')
    .replace('>Workspace<', `>${nested}<`)
    .replace('class="cm-admin-shell__brand">Acme', `class="cm-admin-shell__header">${topbar}`);
  return `<div class="fixture-scroll">${host}${outer}</div>`;
}
