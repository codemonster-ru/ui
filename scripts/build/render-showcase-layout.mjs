import { renderPageLayout } from '../../examples/shared/showcase-layout-samples.mts';
import {
  columns,
  nav,
  regionControls,
  rows,
  steps,
  warehouseNavigation,
  warehouseStockTones,
  warehouseTableCaption,
  initialSetupStep,
  warehousePagination,
} from '../../examples/shared/showcase-layout-data.mts';

const brand =
  '<span class="cm-inline cm-inline--nowrap"><img src="./annabel-logo-icon.svg" width="24" height="24" alt=""><strong>Annabel</strong></span>';

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
  return `<nav class="cm-nav-menu cm-nav-menu--sidebar" aria-label="${label}" data-cm-controller="nav-menu">${list(items)}</nav>`;
}

function shell(slug) {
  const app = slug === 'app-shell';
  const modes = ['content', 'sidebar-content', 'sidebar-content-aside'];
  const labels = ['Content', 'Sidebar + content', 'Sidebar + content + aside'];
  const prefix = 'cm-' + slug;
  const repeat = (count, content) => Array.from({ length: count }, (_, i) => `<p>${content(i + 1)}</p>`).join('');
  return `<div class="cm-container cm-stack"><div class="cm-tabs" data-cm-controller="tabs" data-cm-tabs-value="content">
    <div class="cm-tabs__list" role="tablist">${modes
      .map(
        (mode, i) =>
          `<button id="${slug}-regions-tab-${mode}" class="cm-tabs__tab" type="button" role="tab"
        aria-selected="${i === 0}" aria-controls="${slug}-regions-panel-${mode}" tabindex="${i === 0 ? 0 : -1}">${labels[i]}</button>`,
      )
      .join('')}</div>
    ${modes.map((mode, i) => `<div id="${slug}-regions-panel-${mode}" role="tabpanel" aria-labelledby="${slug}-regions-tab-${mode}" tabindex="0"${i === 0 ? '' : ' hidden'}></div>`).join('')}
  </div>
  <div class="cm-inline">${regionControls
    .filter(({ key }) => (key !== 'notches' || !app) && (key !== 'plain' || app))
    .map(
      ({ key, label }) => `<label class="cm-switch cm-switch--md" data-cm-controller="switch">
      <input class="cm-switch__input" type="checkbox" role="switch" aria-checked="false" data-region-control="${key}">
      <span class="cm-switch__control" aria-hidden="true"><span class="cm-switch__thumb"></span></span>
      <span class="cm-switch__content">${label}</span></label>`,
    )
    .join('')}</div></div>
  <div class="${prefix} ${prefix}--content ${prefix}--fit-content ${prefix}--header-static ${prefix}--sidebar-static ${prefix}--aside-static" data-preview-shell data-cm-controller="${app ? 'app-shell shell-metrics' : 'shell-metrics'}">
    <header class="${prefix}__header" data-cm-sticky-header><strong>Header</strong></header>
    <div class="${prefix}__subheader" data-cm-sticky-subheader hidden><strong>Subheader</strong></div>
    <div class="${prefix}__${app ? 'body' : 'content'}">
      <aside class="${prefix}__sidebar" hidden><div class="cm-stack"><strong>Sidebar</strong>${repeat(8, (n) => 'Navigation section ' + n)}</div></aside>
      <main class="${prefix}__${app ? 'content' : 'main'}"><div class="${prefix}__content-subheader" hidden><strong>Content subheader</strong></div><div class="cm-stack"><strong>Content</strong>${repeat(10, (n) => `Section ${n}. Scroll the preview to see how the regions move with the document.`)}</div></main>
      <aside class="${prefix}__aside" hidden><div class="cm-stack"><strong>Aside</strong>${repeat(8, (n) => 'Related information ' + n)}</div></aside>
    </div><footer class="${prefix}__footer"><strong>Footer</strong></footer>
  </div>`;
}

function warehouse() {
  const alignment = (align) => (align ? ` class="cm-data-table__cell--${align}"` : '');
  const status = (value) => `<span class="cm-tag cm-tag--${warehouseStockTones[value]}">${value}</span>`;
  return `<div id="showcase-warehouse" class="cm-data-table cm-data-table--column-dividers" data-cm-controller="data-table"
      data-cm-data-table-page="1" data-cm-data-table-page-size="5" data-cm-data-table-total-rows="${rows.length}">
  <div class="cm-data-table__scroll" role="region" aria-label="${warehouseTableCaption} table" tabindex="0"><table class="cm-data-table__table">
  <caption class="cm-data-table__caption">${warehouseTableCaption}</caption>
  <thead class="cm-data-table__head"><tr>${columns.map(({ header, align }) => `<th scope="col"${alignment(align)}>${header}</th>`).join('')}</tr></thead>
  <tbody class="cm-data-table__body">${rows
    .map(
      ({ id, cells }, index) =>
        `<tr data-cm-data-table-row="${id}"${index > 4 ? ' hidden' : ''}>${columns.map(({ key, align }) => `<td${alignment(align)}>${key === 'status' ? status(cells.status) : cells[key]}</td>`).join('')}</tr>`,
    )
    .join('')}</tbody>
  </table></div>${warehousePagination()}</div>`;
}

function setup(enhancedInput) {
  const reveal = enhancedInput?.match(/<button\b[^>]*\bdata-cm-input-password\b[^>]*>.*?<\/button>/s)?.[0];
  if (!reveal) throw new Error('Missing password reveal action in enhanced Input case.');
  const password = `<div class="cm-stack"><label for="setup-preview-password">Database password</label>
    <div class="cm-input-wrap" data-cm-controller="input"><input class="cm-input cm-input--md" id="setup-preview-password"
      data-preview-field="password" data-cm-input-control type="password" placeholder="Password">
    ${reveal.replaceAll('Show secret', 'Show password').replaceAll('Hide secret', 'Hide password')}</div></div>`;

  const field = (label, key, value = '', type = 'text') =>
    `<label class="cm-stack">${label}<input class="cm-input cm-input--md" data-preview-field="${key}" value="${value}" type="${type}"${key === 'host' ? ' aria-describedby="setup-host-help"><small id="setup-host-help">Hostname, socket, or private address.</small>' : '>'}</label>`;
  return `<main class="cm-setup-layout cm-setup-layout--fit-content cm-setup-layout--aside-left" data-cm-controller="setup-layout">
    <div class="cm-setup-layout__panel"><div class="cm-setup-layout__brand">${brand}<div class="cm-stack" data-setup-progress>
      <span>Step 2 of ${steps.length}</span>
      <div class="cm-progress-bar" role="progressbar" aria-label="Setup progress" aria-valuemin="0" aria-valuenow="2" aria-valuemax="${steps.length}">
        <span class="cm-progress-bar__value" style="inline-size:${(2 / steps.length) * 100}%"></span>
      </div>
    </div></div>
    <aside class="cm-setup-layout__aside">${navigation(steps, initialSetupStep, 'Installation steps')}</aside>
    <header class="cm-setup-layout__header"><div class="cm-setup-layout__heading"><h1 class="cm-setup-layout__title">${steps[1].label}</h1>
    <p class="cm-setup-layout__description">Configure the CMS environment before the first administrator account is created.</p></div></header>
    <section class="cm-setup-layout__main"><div class="cm-setup-layout__body">
    <label class="cm-checkbox cm-checkbox--md" data-preview-step="license" hidden><input class="cm-checkbox__input" type="checkbox"><span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span><span class="cm-checkbox__content">Accept terms</span></label><div class="cm-stack" data-preview-step="database">${field('Host', 'host', '127.0.0.1')}${field('Port', 'port', '3306')}${field('Database name', 'name', 'annabel')}${field('Database user', 'user', 'annabel_user')}${password}</div>
    <div data-preview-step="admin" hidden>${field('Email', 'email', '', 'email')}</div><p data-preview-step="finish" hidden></p><p data-setup-complete role="status" hidden>Setup preview completed.</p></div>
    <div class="cm-setup-layout__actions"><button class="cm-button cm-button--secondary cm-button--md" type="button" data-preview-back>Back</button>
    <button class="cm-button cm-button--primary cm-button--md" type="button" data-preview-next><span class="cm-button__label">Continue</span></button></div>
    </section></div></main>`;
}

export function renderLayoutExample(slug, markup, enhancedInput) {
  if (slug === 'auth-layout' || slug === 'error-layout') return renderPageLayout(slug);
  if (slug === 'app-shell' || slug === 'document-layout') return shell(slug);
  if (slug === 'setup-layout') return setup(enhancedInput);
  if (slug === 'admin-layout') {
    const dashboard = `<div class="cm-stack"><div class="cm-inline"><strong>Dashboard</strong><button class="cm-button cm-button--primary cm-button--sm" type="button">Create post</button></div>
      <div class="cm-grid">${['Published: 24', 'Drafts: 8', 'Views: 12,480'].map((stat) => `<div class="cm-card"><div class="cm-card__body">${stat}</div></div>`).join('')}</div>
      <article class="cm-card"><header class="cm-card__header">Recent inventory changes</header><div class="cm-card__body"><p>Warehouse A · 24 items received</p><p>Warehouse B · 8 items reserved</p><p>Warehouse C · 3 items returned</p></div></article>
      <article class="cm-card"><header class="cm-card__header">Stock alerts</header><div class="cm-card__body"><p>Wireless keyboard · 2 items remaining</p><p>USB-C dock · out of stock</p><p>Studio monitor · reorder threshold reached</p></div></article></div>`;
    return markup
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
      );
  }
  if (slug === 'admin-shell') {
    return markup
      .replace('>Acme<', `>${brand}<`)
      .replace(
        '</header>',
        '<div class="cm-admin-shell__header-actions"><span class="cm-avatar cm-avatar--md cm-avatar--circle" aria-label="User profile">AK</span></div></header>',
      )
      .replace(
        '>Navigation<',
        `>${navigation(warehouseNavigation, 'warehouse-availability', 'Admin shell navigation')}<`,
      )
      .replace('>Workspace</main>', `><div class="cm-stack">${warehouse()}</div></main>`);
  }
  throw new Error(`Unknown layout example: ${slug}`);
}
