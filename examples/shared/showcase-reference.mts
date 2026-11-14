import iconOrder from './showcase-icon-order.json' with { type: 'json' };
import keywords from './showcase-icon-keywords.json' with { type: 'json' };
import * as icons from '@codemonster-ru/ui-icons';
import {
  cmPrimitiveColorTokens,
  cmSemanticLightColorTokens,
  serializeCmThemeTokensToCssVars,
} from '@codemonster-ru/ui-tokens';

function swatches(variables: readonly string[], semantic = false) {
  return `<ul class="showcase-samples${semantic ? ' showcase-semantic-swatches' : ''}">${variables
    .map(
      (variable) =>
        `<li><span class="showcase-color-chip" style="background:var(${variable})"></span>${semantic ? `<span>${variable.slice('--cm-color-'.length).replace(/(^|-)([a-z])/g, (_, separator: string, letter: string) => (separator ? ' ' : '') + letter.toUpperCase())}</span>` : `<code>${variable}</code>`}</li>`,
    )
    .join('')}</ul>`;
}

export function renderColorScales() {
  const primitives = Object.keys(serializeCmThemeTokensToCssVars(cmPrimitiveColorTokens));
  const families = new Map<string, string[]>();
  for (const variable of primitives) {
    const family = variable.replace(/^--cm-palette-/, '').replace(/-\d+$/, '');
    const values = families.get(family) ?? [];
    values.push(variable);
    families.set(family, values);
  }
  const palette = [...families]
    .map(
      ([family, values]) =>
        `<article class="showcase-panel"><h3>${family}</h3><ul class="showcase-palette-scale">${values.map((variable) => `<li><span class="showcase-color-chip" style="background:var(${variable})"></span><span>${variable.split('-').at(-1)}</span></li>`).join('')}</ul></article>`,
    )
    .join('');
  const semantics = Object.keys(serializeCmThemeTokensToCssVars(cmSemanticLightColorTokens));
  return `<section class="showcase-group" id="primitive-scales">
    <header><h2>Primitive scales</h2></header><div class="showcase-palette-families">${palette}</div>
  </section>
  <section class="showcase-group" id="theme-pairings">
    <header><h2>Light and dark semantic pairings</h2></header>
    <div class="showcase-pairings">${['light', 'dark']
      .map(
        (mode) =>
          `<article class="showcase-panel" data-cm-theme="${mode}"><h3>${mode === 'light' ? 'Light' : 'Dark'}</h3>${swatches(semantics, true)}${renderThemeControls()}</article>`,
      )
      .join('')}</div>
  </section>${renderContrastTable()}`;
}

function renderThemeControls() {
  const surfaces = ['', 'Hover', 'Active', 'Selected', 'SelectedHover', 'SelectedActive'];
  const tones = ['success', 'info', 'warning', 'danger', 'help'];
  return `<div class="showcase-reference-controls">
    <div class="showcase-matrix-row" aria-label="Interactive surface states">${surfaces
      .map((state) => {
        const suffix = state.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
        return `<span class="showcase-swatch" style="background:var(--cm-color-background-surface${suffix})">${state.replace(/([a-z])([A-Z])/g, '$1 + $2') || 'Default'}</span>`;
      })
      .join('')}</div>
    <input class="cm-input cm-input--md" aria-label="Semantic boundary example" value="Semantic boundary">
    <input class="cm-input cm-input--md cm-input--invalid" aria-label="Invalid color state" aria-invalid="true" value="Invalid value">
    <input class="cm-input cm-input--md" aria-label="Read-only color state" readonly value="Read-only value">
    <input class="cm-input cm-input--md" aria-label="Disabled color state" disabled value="Disabled value">
    <label class="cm-checkbox cm-checkbox--md"><input class="cm-checkbox__input" type="checkbox" checked>
    <span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span>
    <span class="cm-checkbox__content">Selected with a non-color cue</span></label>
    <div class="showcase-matrix-row">${['primary', 'secondary', 'danger', 'ghost'].map((variant) => button(variant, variant)).join('')}
    <button class="cm-button cm-button--primary cm-button--md" type="button" disabled aria-busy="true">
      <span class="cm-button__spinner" aria-hidden="true"><svg class="cm-button__spinner-svg" viewBox="0 0 50 50" focusable="false">
        <circle class="cm-button__spinner-track" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        <circle class="cm-button__spinner-value" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg></span><span class="cm-button__label">Loading</span>
    </button>
    ${button('Disabled', 'primary', ' disabled')}</div>
    ${tones.map((tone) => alert(tone, `${tone} status`, 'Separate background, border, and foreground roles.')).join('')}
    <div class="showcase-matrix-row">${tones.map((tone) => `<span class="cm-badge cm-badge--${tone}">${tone}</span> <span class="cm-tag cm-tag--${tone}">${tone}</span>`).join('')}</div>
    <div class="showcase-elevation"><div class="showcase-panel"><strong>Elevated surface</strong><p>Backdrop, elevation, border, and text roles resolve inside the scoped theme.</p></div></div>
  </div>`;
}

function renderContrastTable() {
  const pairs = [
    ['Primary text / surface', 'text-primary', 'background-surface'],
    ['Muted text / canvas', 'text-muted', 'background-canvas'],
    ['Interactive border / surface', 'border-interactive', 'background-surface'],
    ['Focus ring / surface', 'focus-ring', 'background-surface'],
    ['Primary solid / foreground', 'interactive-primary-foreground', 'interactive-primary-background'],
    ['Selected strongest state', 'selected-foreground', 'background-surface-selected-active'],
  ];
  return `<section class="showcase-group" id="contrast-matrix">
    <header><h2>Contrast matrix</h2><p>Ratios use the current theme tokens rendered in sRGB.</p></header>
    <div class="cm-table__scroll" tabindex="0" aria-label="Contrast ratios"><table class="cm-table"><thead class="cm-table__head"><tr><th scope="col">Pairing</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
    <tbody>${pairs
      .map(
        ([label, foreground, background]) => `<tr><th scope="row">${label}</th>
      ${['light', 'dark'].map((mode) => `<td data-cm-theme="${mode}" data-contrast-foreground="--cm-color-${foreground}" data-contrast-background="--cm-color-${background}"></td>`).join('')}</tr>`,
      )
      .join('')}</tbody></table></div>
  </section>`;
}

function button(label: string, variant = 'secondary', attributes = '', size = 'md') {
  return `<button class="cm-button cm-button--${variant} cm-button--${size}" type="button"${attributes}><span class="cm-button__label">${label}</span></button>`;
}

function alert(tone: string, title: string, body: string) {
  return `<div class="cm-alert cm-alert--${tone}"><div class="cm-alert__content"><p class="cm-alert__title">${title}</p><p class="cm-alert__body">${body}</p></div></div>`;
}

function iconSvg(rendering: icons.CmIconRendering, family: string, variant: string, id: string) {
  const body = rendering.body
    .replace(/\bid="([^"]+)"/g, `id="${id}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`);
  return `<svg class="cm-icon cm-icon--${family} cm-icon--${variant}" aria-hidden="true" viewBox="${rendering.viewBox}">${body}</svg>`;
}

function tabSet(id: string, label: string, items: readonly { title: string; panel: string }[]) {
  return `<div class="cm-tabs" data-cm-controller="tabs">
    <div class="cm-tabs__list" role="tablist" aria-label="${label}">${items
      .map(
        ({ title }, index) =>
          `<button class="cm-tabs__tab" id="${id}-tab-item-${index}" type="button" role="tab" aria-controls="${id}-panel-item-${index}" aria-selected="${index === 0}" tabindex="${index ? '-1' : '0'}">${title}</button>`,
      )
      .join('')}</div>
    ${items.map(({ panel }, index) => `<div class="cm-tabs__panel" id="${id}-panel-item-${index}" role="tabpanel" aria-labelledby="${id}-tab-item-${index}" tabindex="0"${index ? ' hidden' : ''}>${panel}</div>`).join('')}
  </div>`;
}

export function renderIconCatalog() {
  const order = new Map(iconOrder.map((name, index) => [name, index]));
  const orderedNames = [...icons.cmIconNames].sort(
    (left, right) => (order.get(left) ?? iconOrder.length) - (order.get(right) ?? iconOrder.length),
  );
  const system = orderedNames.filter((name) => 'classic/regular' in icons[name]);
  const brands = orderedNames.filter((name) => !system.includes(name));
  const aliases: Record<string, readonly string[]> = keywords;
  function entries(
    names: readonly (typeof icons.cmIconNames)[number][],
    family: icons.CmIconFamily,
    variants = icons.cmIconVariants,
  ) {
    return `<div class="showcase-icon-scroll" tabindex="0" aria-label="${family} icon table">
      <table class="showcase-icon-table${variants.length === 1 ? ' showcase-icon-table--brands' : ''}"><thead><tr><th scope="col">Icon</th>${variants.map((variant) => `<th scope="col">${variant}</th>`).join('')}</tr></thead><tbody>
      ${names
        .map((name) => {
          const geometry: icons.CmIconGeometry = icons[name];
          const search = [name.replace(/([a-z])([A-Z])/g, '$1 $2'), ...(aliases[name] ?? [])]
            .join(' ')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;');
          return `<tr data-icon-name="${name}" data-icon-search="${search}">
          <th scope="row">${name} ${button('Copy', 'secondary', ` data-copy-icon aria-label="Copy ${name} icon name"`, 'sm')}</th>
          ${variants
            .map((variant) => {
              const rendering = geometry[`${family}/${variant}`];
              return `<td>${rendering ? iconSvg(rendering, family, variant, `catalog-${name}-${family}-${variant}`) : '—'}</td>`;
            })
            .join('')}</tr>`;
        })
        .join('')}</tbody></table></div>`;
  }
  return `<section class="showcase-group" id="icon-catalog">
    <header><h2>System and brand icons</h2></header>
    <div class="showcase-icon-toolbar"><label for="icon-catalog-search">Search by name or keyword</label>
    <input class="cm-input" id="icon-catalog-search" type="search" placeholder="Search by name or keyword">
    <p role="status" data-icon-count data-total="${icons.cmIconNames.length}">${icons.cmIconNames.length} of ${icons.cmIconNames.length} icons</p></div>
    <p data-icon-empty hidden>No matching icons.</p>
    <p role="status" data-icon-copy-status></p>
    ${tabSet(
      'catalog',
      'Icon families',
      icons.cmIconFamilies.map((family) => ({
        title: family === 'classic' ? 'Classic' : 'Duotone',
        panel: entries(system, family),
      })),
    )}
    <section><h3>Brands</h3>${entries(brands, 'classic', ['solid'])}</section>
  </section>`;
}

export function renderOperations() {
  const navigation = ['Overview', 'Customers', 'Projects', 'Reports', 'Settings'];
  const rows = [
    ['Atlas migration', 'M. Chen', 'Healthy', 'active', 'file'],
    ['Lifecycle email', 'S. Rivera', 'Healthy', 'active', 'mail'],
    ['Billing portal', 'A. Lovelace', 'In review', 'active', 'folder'],
    ['Legacy reports', 'M. Chen', 'Archived', 'archived', 'chartBar'],
  ] as const;

  return `<section id="operations" class="showcase-group">
    <header><h2>Operations dashboard</h2></header>
    ${['md', 'sm']
      .flatMap((size) =>
        ['light', 'dark'].map((mode) => {
          const id = `operations-${mode}-${size}`;
          const compact = size === 'sm';
          const symbol = (name: (typeof icons.cmIconNames)[number], slot: string) =>
            iconSvg(icons.resolveCmIcon(icons[name], 'classic', 'regular')!, 'classic', 'regular', `${id}-${slot}`);
          const command = (label: string, name: (typeof icons.cmIconNames)[number], slot: string = name) =>
            `<button type="button" class="cm-icon-button cm-icon-button--secondary cm-icon-button--${size}" aria-label="${label}" data-operation-action="${label}">${symbol(name, slot)}</button>`;
          const projects = `<section class="showcase-panel">
        <div class="showcase-matrix-row"><h4>Projects</h4><label for="${id}-filter">Status</label>
          <select id="${id}-filter" class="cm-input cm-input--${size}" data-operation-filter><option value="active">Active</option><option value="archived">Archived</option></select>
        </div>
        <div class="cm-table__scroll" tabindex="0" aria-label="Project rows"><table class="cm-table${compact ? ' cm-table--compact' : ''}">
          <thead class="cm-table__head"><tr><th scope="col">Project</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
          <tbody class="cm-table__body">${rows
            .map(
              ([name, owner, status, state, icon], index) =>
                `<tr data-operation-row="${state}"${index > 1 ? ' hidden' : ''}><td>${symbol(icon, `project-${index}`)} ${name}</td>
              <td>${owner}</td><td><span class="cm-tag cm-tag--${status === 'Healthy' ? 'success' : status === 'Archived' ? 'neutral' : 'info'}">${status}</span></td>
              <td>${command(`Edit ${name}`, 'pencil', `edit-${index}`)} ${command(`Delete ${name}`, 'trash', `delete-${index}`)}</td></tr>`,
            )
            .join('')}</tbody>
        </table></div>
        <div class="showcase-matrix-row"><span data-operation-count aria-live="polite">1–2 of 3</span>
          ${button('Previous page', 'secondary', ' data-operation-page="previous" disabled', size)}
          ${button('Next page', 'secondary', ' data-operation-page="next"', size)}
        </div>
      </section>`;
          return `<article id="${id}" class="showcase-panel showcase-operation" data-cm-theme="${mode}" data-operation>
        <h3>${mode === 'light' ? 'Light' : 'Dark'} · ${compact ? 'compact' : 'regular'}</h3>
        <div class="cm-app-shell cm-app-shell--sidebar-content">
          <header class="cm-app-shell__header showcase-operation-toolbar">
            <strong>${symbol('grid', 'brand')} CodeMonster UI</strong>
            <input class="cm-input cm-input--${size}" type="search" aria-label="Search projects" placeholder="Search projects" data-operation-search>
            ${command('Notifications', 'bell')}${button('New project', 'secondary', ' data-operation-action="New project"', size)}
          </header>
          <div class="cm-app-shell__body">
            <aside class="cm-app-shell__sidebar"><nav class="showcase-operation-nav" aria-label="Workspace navigation">
              ${navigation.map((label, index) => `<button class="cm-button cm-button--ghost cm-button--${size}" type="button" data-operation-nav${index === 0 ? ' aria-current="page"' : ''}>${symbol((['house', 'users', 'folder', 'chartBar', 'gear'] as const)[index], `nav-${index}`)} <span>${label}</span></button>`).join('')}
            </nav><p>${symbol('user', 'user')} Ada Lovelace</p></aside>
            <div class="cm-app-shell__content showcase-reference-controls">
              <div class="showcase-matrix-row"><h4 data-operation-heading>Operations overview</h4>${command('Download report', 'download')}</div>
              ${tabSet(id, 'Operations views', [
                {
                  title: `${symbol('grid', 'tab-overview')} Overview`,
                  panel: `<div class="showcase-operation-metrics">
                  <div class="showcase-panel">${symbol('users', 'metric-users')} Active users <strong>12,480</strong></div>
                  <div class="showcase-panel">${symbol('database', 'metric-storage')} Storage <strong>68%</strong></div>
                  <div class="showcase-panel">${symbol('cloud', 'metric-uptime')} Uptime <strong>99.98%</strong></div>
                </div>${alert('warning', 'Backup', 'Backup requires attention.')}${alert('info', 'Updates', '3 updates are ready.')}`,
                },
                {
                  title: `${symbol('chartBar', 'tab-analytics')} Analytics`,
                  panel: '<p>12,480 active users across all projects.</p>',
                },
                {
                  title: `${symbol('columns', 'tab-data')} Data`,
                  panel: '<p>Project owners, status and actions are listed below.</p>',
                },
              ])}
              ${projects}
              <div class="showcase-panel showcase-matrix-row">${symbol('message', 'empty')} <strong>No pending messages</strong> ${command('Upload a message', 'upload')}</div>
              <p role="status" data-operation-status></p>
            </div>
          </div>
        </div>
      </article>`;
        }),
      )
      .join('')}
  </section>`;
}
