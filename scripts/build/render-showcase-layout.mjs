import {
  columns,
  defaultPreview,
  nav,
  previews,
  regionControls,
  rows,
  steps,
  warehouseNavigation,
  warehouseIconStyle,
  initialSetupStep,
  warehousePagination,
} from '../../examples/shared/showcase-layout-data.mts';

const brand = '<span class="layout-brand"><img src="./annabel-logo-icon.svg" alt=""><strong>Annabel</strong></span>';

function navigation(items, active, label = 'Main navigation') {
  function list(nodes, level = 0) {
    return `<ul class="cm-nav-menu__list${level ? ' cm-nav-menu__list--nested' : ''}">${nodes
      .map(({ value, label, children }) => {
        const selected = value === active;
        const expanded = children?.some((child) => child.value === active);
        return `<li class="cm-nav-menu__node cm-nav-menu__node--level-${level}${selected ? ' cm-nav-menu__node--active' : ''}${expanded ? ' cm-nav-menu__node--expanded' : ''}">
        <button type="button" class="cm-nav-menu__item${level ? '' : ' cm-nav-menu__item--top'}${children ? ' cm-nav-menu__item--branch' : ''}${expanded ? ' cm-nav-menu__item--expanded' : ''}${selected ? ' cm-nav-menu__item--active' : ''}" style="--cm-nav-menu-level:${level}"
        ${children ? `data-cm-nav-menu-branch="${value}" aria-expanded="${Boolean(expanded)}"` : `data-cm-nav-menu-value="${value}"${selected ? ' aria-current="page"' : ''}`}>
        <span class="cm-nav-menu__item-content"><span class="cm-nav-menu__label">${label}</span></span>${children ? '<span class="cm-nav-menu__icon" aria-hidden="true"></span>' : ''}</button>
        ${children ? `<div class="cm-nav-menu__collapse">${list(children, level + 1)}</div>` : ''}</li>`;
      })
      .join('')}</ul>`;
  }
  return `<nav class="cm-nav-menu cm-nav-menu--sidebar" aria-label="${label}"${items === warehouseNavigation ? ` style="${warehouseIconStyle}"` : ''} data-cm-controller="nav-menu">${list(items)}</nav>`;
}

function shell(slug) {
  const app = slug === 'app-shell';
  const modes = ['content', 'sidebar-content', 'sidebar-content-aside'];
  const labels = ['Content', 'Sidebar + content', 'Sidebar + content + aside'];
  const prefix = 'cm-' + slug;
  const repeat = (count, content) => Array.from({ length: count }, (_, i) => `<p>${content(i + 1)}</p>`).join('');
  return `<div class="cm-tabs" data-cm-controller="tabs" data-cm-tabs-value="content">
    <div class="cm-tabs__list" role="tablist">${modes
      .map(
        (mode, i) =>
          `<button id="${slug}-regions-tab-${mode}" class="cm-tabs__tab" type="button" role="tab"
        aria-selected="${i === 0}" aria-controls="${slug}-regions-panel-${mode}" tabindex="${i === 0 ? 0 : -1}">${labels[i]}</button>`,
      )
      .join('')}</div>
    ${modes.map((mode, i) => `<div id="${slug}-regions-panel-${mode}" role="tabpanel" aria-labelledby="${slug}-regions-tab-${mode}" tabindex="0"${i === 0 ? '' : ' hidden'}></div>`).join('')}
  </div>
  <div class="layout-preview__toolbar">${regionControls
    .filter(({ key }) => key !== 'notches' || !app)
    .map(({ key, label }) => `<label><input type="checkbox" data-region-control="${key}"> ${label}</label>`)
    .join('')}</div>
  <div class="layout-preview__frame"><div class="${prefix} ${prefix}--content" data-preview-shell data-cm-controller="shell-metrics">
    <header class="${prefix}__header" data-cm-sticky-header><strong>Header</strong></header>
    <div class="${prefix}__subheader" data-cm-sticky-subheader hidden><strong>Subheader</strong></div>
    <div class="${prefix}__${app ? 'body' : 'content'}">
      <aside class="${prefix}__sidebar" hidden><div class="cm-stack"><strong>Sidebar</strong>${repeat(8, (n) => 'Navigation section ' + n)}</div></aside>
      <main class="${prefix}__${app ? 'content' : 'main'}"><div class="cm-stack"><strong class="layout-content-subheader" hidden>Content subheader</strong><strong>Content</strong>${repeat(10, (n) => `Section ${n}. Scroll the preview to see how the regions move with the document.`)}</div></main>
      <aside class="${prefix}__aside" hidden><div class="cm-stack"><strong>Aside</strong>${repeat(8, (n) => 'Related information ' + n)}</div></aside>
    </div><footer class="${prefix}__footer"><strong>Footer</strong></footer>
  </div></div>`;
}

function warehouse() {
  return `<div id="showcase-warehouse" class="cm-data-table cm-data-table--column-dividers" data-warehouse-static>
  <div class="cm-data-table__scroll"><table class="cm-data-table__table">
  <thead class="cm-data-table__head"><tr>${columns.map(({ header }) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
  <tbody class="cm-data-table__body">${rows
    .map(
      ({ id, cells }, index) =>
        `<tr data-cm-data-table-row="${id}"${index > 4 ? ' hidden' : ''}>${columns.map(({ key }) => `<td>${cells[key]}</td>`).join('')}</tr>`,
    )
    .join('')}</tbody>
  </table></div></div>${warehousePagination()}`;
}

function setup() {
  const field = (label, key, value = '', type = 'text') =>
    `<label>${label}<input class="cm-input cm-input--md" data-preview-field="${key}" value="${value}" type="${type}"${key === 'host' ? ' aria-describedby="setup-host-help"><small id="setup-host-help">Hostname, socket, or private address.</small>' : '>'}</label>`;
  return `<main class="cm-setup-layout cm-setup-layout--aside-left" data-cm-controller="setup-layout">
    <div class="cm-setup-layout__panel"><div class="cm-setup-layout__brand">${brand}<div class="setup-preview-progress" hidden><span>Step 2 of ${steps.length}</span><progress value="2" max="${steps.length}" aria-label="Setup progress"></progress></div></div>
    <aside class="cm-setup-layout__aside">${navigation(steps, initialSetupStep, 'Installation steps')}</aside>
    <header class="cm-setup-layout__header"><div class="cm-setup-layout__heading"><h1 class="cm-setup-layout__title">${steps[1].label}</h1>
    <p class="cm-setup-layout__description">Configure the CMS environment before the first administrator account is created.</p></div></header>
    <section class="cm-setup-layout__main"><div class="cm-setup-layout__body">
    <label data-preview-step="license" hidden><input type="checkbox"> Accept terms</label><div class="cm-stack setup-preview-fields" data-preview-step="database">${field('Host', 'host', '127.0.0.1')}${field('Port', 'port', '3306')}${field('Database name', 'name', 'annabel')}${field('Database user', 'user', 'annabel_user')}${field('Database password', 'password', '', 'password')}</div>
    <div data-preview-step="admin" hidden>${field('Email', 'email', '', 'email')}</div><p data-preview-step="finish" hidden></p><p data-setup-complete role="status" hidden>Setup preview completed.</p></div>
    <div class="cm-setup-layout__actions"><button class="cm-button cm-button--secondary cm-button--md" type="button" data-preview-back>Back</button>
    <button class="cm-button cm-button--primary cm-button--md" type="button" data-preview-next><span class="cm-button__label">Continue</span></button></div>
    </section></div></main>`;
}

export function renderLayoutPreview(slug, markup) {
  const sizes = `<fieldset class="layout-preview__sizes"><legend>Preview width</legend>${previews
    .map(
      ({ value, width }) =>
        `<label><input type="radio" name="${slug}-preview" value="${value}" data-preview-width="${width}"${value === defaultPreview ? ' checked' : ''}><span>${value}</span></label>`,
    )
    .join('')}</fieldset>`;
  let content;
  if (slug === 'app-shell' || slug === 'document-layout') content = shell(slug);
  if (slug === 'setup-layout') content = `<div class="layout-preview__frame">${setup()}</div>`;
  if (slug === 'admin-layout') {
    const dashboard = `<div class="cm-stack"><div class="layout-preview__toolbar"><strong>Dashboard</strong><button class="cm-button cm-button--primary cm-button--sm" type="button">Create post</button></div>
      <div class="cm-grid">${['Published: 24', 'Drafts: 8', 'Views: 12,480'].map((stat) => `<div class="cm-card"><div class="cm-card__body">${stat}</div></div>`).join('')}</div>
      <article class="cm-card"><header class="cm-card__header">Recent inventory changes</header><div class="cm-card__body"><p>Warehouse A · 24 items received</p><p>Warehouse B · 8 items reserved</p><p>Warehouse C · 3 items returned</p></div></article>
      <article class="cm-card"><header class="cm-card__header">Stock alerts</header><div class="cm-card__body"><p>Wireless keyboard · 2 items remaining</p><p>USB-C dock · out of stock</p><p>Studio monitor · reorder threshold reached</p></div></article></div>`;
    content = `<div class="layout-preview__frame">${markup
      .replaceAll('workspace', 'showcase-admin-layout')
      .replace('>Acme<', `>${brand}<`)
      .replace('>Navigation<', `>${navigation(nav, 'dashboard')}<`)
      .replace(
        '<div class="cm-admin-layout__header-content">Projects</div>',
        `<div class="cm-admin-layout__mobile-brand">${brand}</div><div class="cm-admin-layout__header-content"><button class="cm-button cm-button--ghost cm-button--sm" type="button" data-cm-sidebar-toggle>Toggle sidebar</button></div>`,
      )
      .replace(
        '>Dashboard</main>',
        `>${dashboard}</main><footer class="cm-admin-layout__footer">Inventory workspace</footer>`,
      )}</div>`;
  }
  if (slug === 'admin-shell') {
    content = `<div class="layout-preview__frame">${markup
      .replace('>Acme<', `>${brand}<`)
      .replace(
        '</header>',
        '<div class="cm-admin-shell__header-actions"><span class="cm-avatar cm-avatar--md cm-avatar--circle" aria-label="User profile">AK</span></div></header>',
      )
      .replace(
        '>Navigation<',
        `>${navigation(warehouseNavigation, 'warehouse-availability', 'Admin shell navigation')}<`,
      )
      .replace(
        '>Workspace</main>',
        `><div class="cm-stack"><h4>Warehouse availability</h4>${warehouse()}</div></main>`,
      )}</div>`;
  }
  return `${sizes}<p class="layout-preview__caption"></p><div class="layout-preview" style="max-inline-size:1280px">${content}</div>`;
}
