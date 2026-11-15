import { renderShowcaseTabs } from './showcase-tabs.mts';
import * as icons from '@codemonster-ru/ui-icons';
import { iconCatalog, iconNames, type IconName } from '@codemonster-ru/ui-icons/catalog';
import { colorHero, contrastRows, families, semanticSwatches } from './showcase-colors.mts';

const themes = ['light', 'dark'] as const;
const surfaces = [
  ['default', 'Default'],
  ['hover', 'Hover'],
  ['active', 'Active'],
  ['selected', 'Selected'],
  ['selected-hover', 'Selected + hover'],
  ['selected-active', 'Selected + active'],
] as const;
const statuses = [
  ['success', icons.checkCircle],
  ['info', icons.info],
  ['warning', icons.warning],
  ['danger', icons.xCircle],
  ['help', icons.questionCircle],
] as const;

export function renderColorScales() {
  const palette = [...families]
    .map(
      ([family, steps]) => `<article class="color-system__family"><h3>${family}</h3>
        <div class="color-system__scale">${steps.map(({ variable, step }) => `<div class="color-system__primitive"><span class="color-system__primitive-color" style="background:var(${variable})" aria-hidden="true"></span><span>${step}</span></div>`).join('')}</div></article>`,
    )
    .join('');
  const semantics = semanticSwatches
    .map(
      ([label, variable]) =>
        `<div class="color-system__semantic" title="${variable}"><span class="color-system__semantic-color" style="background:var(${variable})" aria-hidden="true"></span><span>${label}</span></div>`,
    )
    .join('');
  return `<div class="color-system">
    <header class="color-system__hero">
      <p class="color-system__eyebrow">${colorHero.eyebrow}</p>
      <h1>${colorHero.title}</h1><p>${colorHero.description}</p>
    </header>
    <section class="color-system__section" aria-labelledby="primitive-scales">
      <div class="color-system__section-heading"><h2 id="primitive-scales">Primitive scales</h2>
      <p>Every displayed step has a concrete semantic use in light, dark, or interaction states.</p></div>
      <div class="color-system__families">${palette}</div>
    </section>
    <section class="color-system__section" aria-labelledby="theme-pairings">
      <div class="color-system__section-heading"><h2 id="theme-pairings">Light and dark semantic pairings</h2>
      <p>Both panels use the same roles, but each mode selects materials independently.</p></div>
      <div class="color-system__theme-grid">${themes
        .map(
          (mode) => `<article class="color-system__theme" data-cm-theme="${mode}">
          <header class="color-system__theme-header"><h3>${mode}</h3><span>scoped theme</span></header>
          <div class="color-system__semantic-grid">${semantics}</div>${renderThemeControls(mode)}</article>`,
        )
        .join('')}</div>
    </section>${renderContrastTable()}</div>`;
}

function renderThemeControls(mode: (typeof themes)[number]) {
  const icon = (geometry: icons.CmIconGeometry, id: string) =>
    iconSvg(icons.resolveCmIcon(geometry, 'classic', 'regular')!, 'classic', 'regular', id);
  return `<div class="color-system__state-row" aria-label="Interactive surface states">${surfaces
    .map(([state, label]) => `<span class="color-system__state color-system__state--${state}">${label}</span>`)
    .join('')}</div>
    <div class="color-system__controls">
      <input class="cm-input cm-input--md" aria-label="Semantic boundary example" value="Semantic boundary">
      <div class="color-system__field-states">
        <input class="cm-input cm-input--md cm-input--invalid" aria-label="Invalid color state" aria-invalid="true" value="Invalid value">
        <input class="cm-input cm-input--md" aria-label="Read-only color state" readonly value="Read-only value">
        <input class="cm-input cm-input--md" aria-label="Disabled color state" disabled value="Disabled value">
      </div>
      <label class="cm-checkbox cm-checkbox--md"><input class="cm-checkbox__input" type="checkbox" checked>
      <span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span>
      <span class="cm-checkbox__content">Selected with a non-color cue</span></label>
      <div class="color-system__actions">${['primary', 'secondary', 'danger', 'ghost'].map((variant) => button(variant, variant)).join('')}
        <button class="cm-button cm-button--primary cm-button--md" type="button" disabled aria-busy="true">
          <span class="cm-button__spinner" aria-hidden="true"><svg class="cm-button__spinner-svg" viewBox="0 0 50 50" focusable="false">
            <circle class="cm-button__spinner-track" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            <circle class="cm-button__spinner-value" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg></span><span class="cm-button__label">Loading</span>
        </button>
        ${button('Disabled', 'primary', ' disabled')}
      </div>
    </div>
    <div class="color-system__statuses">
      ${statuses.map(([tone, geometry]) => `<div class="cm-alert cm-alert--${tone}"><div class="cm-alert__icon" aria-hidden="true">${icon(geometry, `color-${mode}-${tone}`)}</div><div class="cm-alert__content"><p class="cm-alert__title">${tone} status</p><p class="cm-alert__body">Separate background, border, icon, and foreground roles.</p></div></div>`).join('')}
      <div class="color-system__chips">
        ${statuses.map(([tone]) => `<span class="cm-badge cm-badge--${tone}">${tone}</span>`).join('')}
        ${statuses.map(([tone]) => `<span class="cm-tag cm-tag--${tone}">${tone}</span>`).join('')}
      </div>
    </div>
    <figure class="color-system__code">
      <figcaption><span>color-system.ts</span>
        <button class="cm-icon-button cm-icon-button--ghost cm-icon-button--sm" type="button" aria-label="Copy code" data-showcase-copy-color disabled>
          <span class="cm-icon-button__icon" aria-hidden="true">${icon(icons.copy, `color-copy-${mode}`)}</span>
        </button>
      </figcaption>
      <pre tabindex="0" aria-label="TypeScript color system sample"><code><span class="showcase-code-keyword">type</span> <span class="showcase-code-type">Release</span> = { version: <span class="showcase-code-type">string</span>; stable: <span class="showcase-code-type">boolean</span>; };
<span class="showcase-code-keyword">const</span> release: <span class="showcase-code-type">Release</span> = { version: <span class="showcase-code-string">'2.0.0'</span>, stable: <span class="showcase-code-keyword">true</span> };
<span class="showcase-code-comment">// Semantic colors stay readable in both themes.</span></code></pre>
      <span class="color-system__copy-status" role="status"></span>
    </figure>
    <div class="color-system__overlay-sample"><div class="color-system__overlay-card"><strong>Elevated surface</strong><span>Backdrop, elevation, border, and text roles resolve inside the same scoped theme.</span></div></div>`;
}

function renderContrastTable() {
  return `<section class="color-system__section" aria-labelledby="contrast-matrix">
    <div class="color-system__section-heading"><h2 id="contrast-matrix">Supported contrast matrix</h2>
      <p>Ratios use the current theme tokens rendered in sRGB.</p></div>
    <div class="color-system__contrast-table-wrap" role="region" tabindex="0" aria-label="Contrast ratios">
      <table class="color-system__contrast-table"><thead><tr><th scope="col">Pairing</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
      <tbody>${contrastRows
        .map(
          ([label, foreground, background]) => `<tr><th scope="row">${label}</th>
          ${themes.map((mode) => `<td><span data-cm-theme="${mode}" data-contrast-foreground="--cm-color-${foreground}" data-contrast-background="--cm-color-${background}"></span></td>`).join('')}</tr>`,
        )
        .join('')}</tbody></table>
    </div>
  </section>`;
}

function button(label: string, variant = 'secondary', attributes = '', size = 'md') {
  return `<button class="cm-button cm-button--${variant} cm-button--${size}" type="button"${attributes}><span class="cm-button__label">${label}</span></button>`;
}

function alert(tone: string, title: string, body: string) {
  return `<div class="cm-alert cm-alert--${tone}"><div class="cm-alert__content"><p class="cm-alert__title">${title}</p><p class="cm-alert__body">${body}</p></div></div>`;
}

function iconSvg(rendering: icons.CmIconRendering, family: string, variant: string, id: string) {
  const body = icons.scopeCmIconIds(rendering.body, id);
  return `<svg class="cm-icon cm-icon--${family} cm-icon--${variant}" aria-hidden="true" viewBox="${rendering.viewBox}">${body}</svg>`;
}

export const iconIntro = {
  description:
    'Compare classic and duotone icons. Brand marks use their canonical form when a requested weight is unavailable.',
  samples: [
    { icon: icons.arrowLeft, label: 'Back', family: 'classic', variant: 'regular' },
    { icon: icons.gear, label: 'Settings', family: 'classic', variant: 'solid' },
    { icon: icons.gear, label: 'Settings, duotone', family: 'duotone', variant: 'regular' },
    { icon: icons.github, label: 'GitHub', family: 'classic', variant: 'thin' },
  ],
} as const;

export function renderIconIntro() {
  return `<p class="showcase-icon-intro-note">${iconIntro.description}</p>
    <div class="showcase-matrix-row">${iconIntro.samples
      .map(({ icon, label, family, variant }, index) => {
        const supportsRequestedStyle = Object.hasOwn(icon, `${family}/${variant}`);
        const rendering = icons.resolveCmIcon(icon, family, variant);
        if (!rendering) throw new Error(`Missing showcase icon: ${label}`);
        return iconSvg(
          rendering,
          supportsRequestedStyle ? family : 'classic',
          supportsRequestedStyle ? variant : 'solid',
          `icon-intro-${index}`,
        ).replace('aria-hidden="true"', `role="img" aria-label="${label}" focusable="false"`);
      })
      .join('')}</div>`;
}

export function renderIconCatalog() {
  const system = iconNames.filter((name) => !iconCatalog[name].brand);
  const brands = iconNames.filter((name) => iconCatalog[name].brand);
  function entries(names: readonly IconName[], family: icons.CmIconFamily, variants = icons.cmIconVariants) {
    return `<div class="showcase-icon-scroll" tabindex="0" aria-label="${family} icon table">
      <table class="showcase-icon-table${variants.length === 1 ? ' showcase-icon-table--brands' : ''}"><thead><tr><th scope="col">Icon</th>${variants.map((variant) => `<th scope="col">${variant}</th>`).join('')}</tr></thead><tbody>
      ${names
        .map((name) => {
          const geometry: icons.CmIconGeometry = icons[name];
          const { keywords, title } = iconCatalog[name];
          const search = [name, title, ...keywords]
            .join(' ')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;');
          return `<tr data-icon-name="${name}" data-icon-search="${search}">
          <th scope="row"><span class="showcase-icon-name">${name} ${button('Copy', 'secondary', ` data-copy-icon aria-label="Copy ${name} icon name"`, 'sm')}</span></th>
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
    <header><h2>System and brand icons</h2><p>Find an icon, compare every system weight at 32 px, and copy its catalog name.</p></header>
    <div class="showcase-icon-toolbar"><label for="icon-catalog-search">Search by name or keyword</label>
    <input class="cm-input" id="icon-catalog-search" type="search" placeholder="Search by name or keyword">
    <p role="status" data-icon-count data-total="${iconNames.length}">${iconNames.length} of ${iconNames.length} icons</p></div>
    <p data-icon-empty hidden>No matching icons.</p>
    <p role="status" data-icon-copy-status></p>
    ${renderShowcaseTabs(
      'catalog',
      'Icon families',
      icons.cmIconFamilies.map((family) => ({
        title: family === 'classic' ? 'Classic' : 'Duotone',
        panel: `<h3>${family === 'classic' ? 'Classic' : 'Duotone'}</h3><p>${family === 'classic' ? 'Original single-color family.' : 'Two-tone icon family.'}</p>${entries(system, family)}`,
      })),
    )}
    <section><h3>Brands</h3>${entries(brands, 'classic', ['solid'])}</section>
  </section>`;
}

const operationIcons = {
  bell: icons.bell,
  chartBar: icons.chartBar,
  cloud: icons.cloud,
  columns: icons.columns,
  database: icons.database,
  download: icons.download,
  file: icons.file,
  folder: icons.folder,
  gear: icons.gear,
  grid: icons.grid,
  house: icons.house,
  mail: icons.mail,
  message: icons.message,
  pencil: icons.pencil,
  trash: icons.trash,
  upload: icons.upload,
  user: icons.user,
  users: icons.users,
};

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
          const symbol = (name: keyof typeof operationIcons, slot: string) =>
            iconSvg(
              icons.resolveCmIcon(operationIcons[name], 'classic', 'regular')!,
              'classic',
              'regular',
              `${id}-${slot}`,
            );
          const command = (label: string, name: keyof typeof operationIcons, slot: string = name) =>
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
              ${renderShowcaseTabs(id, 'Operations views', [
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
