import { coreComponentTitle, coreRecipesFor, renderCoreMatrix } from '../../examples/shared/showcase-core-matrix.mts';
import { layoutSamples, renderLayoutRecipes } from '../../examples/shared/showcase-layout-samples.mts';
import { renderLayoutPreview } from './render-showcase-layout.mjs';
import { panels } from '../../examples/shared/showcase-layout-data.mts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderColorScales, renderIconCatalog, renderOperations } from '../../examples/shared/showcase-reference.mts';
import { actionMatrices, showcaseCaseVariants } from '../../examples/shared/showcase-matrices.mts';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';

function escapeHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function page(title, content, script, base = '') {
  return `<!doctype html>
<html lang="en" data-cm-theme="light">
<head>
  <meta charset="utf-8" />
  ${base ? `<base href="${base}" />` : ''}
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="data:," />
  <link rel="stylesheet" href="./css/showcase.css" />
  <script type="module" src="./${script}"></script>
</head>
<body>
  ${content}
</body>
</html>
`;
}

function renderExample({ id, basename, componentSlug, data, canonicalHtml }, name) {
  const title = basename.replaceAll('-', ' ');
  const modal = ['dialog', 'drawer', 'command-palette'].includes(componentSlug);
  const layout = ['admin-layout', 'admin-shell', 'app-shell', 'document-layout', 'setup-layout'].includes(
    componentSlug,
  );
  const floating = ['date-picker', 'dropdown', 'menu-bar', 'popover', 'select', 'tooltip'].includes(componentSlug);
  const frameSize = modal || layout ? ' showcase-frame--tall' : floating ? ' showcase-frame--floating' : '';
  const demo = page(
    `${name} · ${title}`,
    `<main class="showcase-demo" inert>
      ${modal ? `<button class="cm-button cm-button--primary cm-button--md" type="button" id="showcase-open">Open ${escapeHtml(name)}</button>` : ''}
      ${canonicalHtml.replaceAll('src="/avatar.png"', 'src="./avatar.png"')}
    </main>`,
    'showcase-demo.js',
  );
  return `<article class="showcase-example" id="${id}">
    <h4>${escapeHtml(title)}</h4>
    ${data.description ? `<p>${escapeHtml(data.description)}</p>` : ''}
    <iframe title="${escapeHtml(id)}" loading="lazy"
      class="showcase-frame${frameSize}"
      srcdoc="${escapeHtml(demo)}"></iframe>
  </article>`;
}

function applyShowcaseOption(html, slug, prop, value) {
  const modifier = (name) =>
    html.replace(new RegExp(`class="cm-${slug}(?=[ "])`), `class="cm-${slug} cm-${slug}--${name}`);
  switch (prop) {
    case 'dismissible':
      return html
        .replace(`data-cm-${slug}-dismissible="true"`, `data-cm-${slug}-dismissible="false"`)
        .replace(` data-cm-${slug}-close`, ` disabled data-cm-${slug}-close`);
    case 'side':
      return html.replace('cm-drawer--end', `cm-drawer--${value}`);
    case 'orientation':
      return modifier('vertical');
    case 'contentPosition':
      return modifier('content-inline');
    case 'loading':
      return html.replace('No audit events', 'Loading...');
    case 'error':
      return html.replace('No audit events', 'Failed to load data');
    case 'minHeight':
      return html.replace('<div class="cm-skeleton', `<div style="min-height: ${value}" class="cm-skeleton`);
    case 'animated':
      return html.replace(' cm-skeleton--animated', '');
    case 'radius':
      return html.replace('cm-skeleton--radius-surface', `cm-skeleton--radius-${value}`);
    case 'density':
      return modifier(value);
    case 'columnDividers':
      return modifier('column-dividers');
    case 'stickyHeader':
      return modifier(slug === 'app-shell' ? 'header-sticky' : 'sticky-header');
    case 'layout': {
      const withoutAside = html.replace(new RegExp(`<aside class="cm-${slug}__aside">[^<]*</aside>`, 'u'), '');
      const regions =
        value === 'content'
          ? withoutAside.replace(new RegExp(`<aside class="cm-${slug}__sidebar">[^<]*</aside>`, 'u'), '')
          : withoutAside;
      return regions.replace(`cm-${slug}--sidebar-content-aside`, `cm-${slug}--${value}`);
    }
    case 'sidebarCollapsed':
      return html.replace('data-cm-sidebar-collapsed="false"', 'data-cm-sidebar-collapsed="true"');
    case 'mobileSidebarOpen':
      return html
        .replace('data-cm-mobile-sidebar-open="false"', 'data-cm-mobile-sidebar-open="true"')
        .replace('aria-expanded="false"', 'aria-expanded="true"');
    case 'variant':
      return html.replace('cm-nav-menu--sidebar', 'cm-nav-menu--inline');
    case 'expandMode':
      return html.replace(
        'data-cm-controller="nav-menu"',
        'data-cm-controller="nav-menu" data-cm-nav-menu-expand-mode="single"',
      );
    case 'striped':
    case 'rounded':
    case 'dividers':
      return modifier(prop);
    case 'delay':
      return html.replace('cm-tooltip--delay-short', `cm-tooltip--delay-${value}`);
    case 'placement':
      if (slug === 'tooltip') return html.replace('cm-tooltip--top', `cm-tooltip--${value}`);
      return value === 'bottom-start' ? html : modifier(value);
    case 'disabled':
    case 'readonly':
    case 'invalid': {
      const target = ['popover', 'select', 'date-picker'].includes(slug)
        ? 'button'
        : slug === 'textarea'
          ? 'textarea'
          : 'input';
      const attribute =
        prop === 'invalid'
          ? 'aria-invalid="true"'
          : prop === 'readonly' && slug === 'date-picker'
            ? 'aria-readonly="true"'
            : prop;
      if (prop === 'invalid') {
        html = html.replace(
          new RegExp(`class="cm-${slug} cm-${slug}--`),
          `class="cm-${slug} cm-${slug}--invalid cm-${slug}--`,
        );
      }
      return html.replace(`<${target}`, `<${target} ${attribute}`);
    }
    default:
      throw new Error(`Unsupported showcase option: ${slug}.${prop}`);
  }
}

function expandedExamples(examples, icons) {
  return examples.flatMap((example) => [
    example,
    ...showcaseCaseVariants(example.componentSlug, example.basename).map(({ label, prop, value }) => {
      const prefix = 'cm-' + example.componentSlug;
      const defaultTone = { alert: 'info', 'progress-bar': 'primary' }[example.componentSlug] ?? 'neutral';
      let html = example.canonicalHtml;
      if (example.componentSlug === 'icon') {
        const family = prop === 'family' ? value : 'classic';
        const variant = prop === 'variant' ? value : 'regular';
        const icon = icons.resolveCmIcon(icons.arrowLeft, family, variant);
        if (!icon) throw new Error(`Missing icon form ${family}/${variant}`);
        html = `<svg class="cm-icon cm-icon--${variant} cm-icon--${family}" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">${icon.body}</svg>`;
      } else if (example.componentSlug === 'avatar') {
        if (prop === 'shape') {
          html = html
            .replace(' cm-avatar--circle', '')
            .replace('class="cm-avatar', `class="cm-avatar${value === 'circle' ? ' cm-avatar--circle' : ''}`);
        } else {
          html = html
            .replace(/ cm-avatar--(?:sm|lg)\b/u, '')
            .replace('class="cm-avatar', `class="cm-avatar${value === 'md' ? '' : ' cm-avatar--' + value}`);
        }
      } else if (prop === 'size') {
        html = html.replace(new RegExp(`${prefix}--(?:sm|md|lg|full)\\b`, 'g'), `${prefix}--${value}`);
      } else if (prop === 'tone') {
        html = html.replace(
          `class="${prefix}`,
          `class="${prefix}${value === defaultTone ? '' : ' ' + prefix + '--' + value}`,
        );
      } else html = applyShowcaseOption(html, example.componentSlug, prop, value);
      return {
        ...example,
        id: example.id + '--' + label.replaceAll(' ', '-'),
        basename: example.basename + ' · ' + label,
        canonicalHtml: html,
      };
    }),
  ]);
}

function renderMatrix(slug, groups, loadingMarkup, iconMarkup) {
  if (!groups) return '';
  return Object.entries(groups)
    .map(([label, examples]) => {
      const controls = examples.map((example) => {
        const text = escapeHtml(example.label);
        if (slug === 'link') {
          const underline =
            example.underline && example.underline !== 'none' ? ` cm-link--underline-${example.underline}` : '';
          const tone = example.tone === 'muted' ? ' cm-link--muted' : '';
          return `<a class="cm-link${underline}${tone}" ${example.external ? 'href="https://example.com" target="_blank" rel="noopener noreferrer"' : 'href="./core/#demo-link"'}>${text}</a>`;
        }
        if (slug === 'icon-button') {
          return iconMarkup
            .replace(
              'cm-icon-button--ghost cm-icon-button--md',
              `cm-icon-button--${example.variant ?? 'ghost'} cm-icon-button--${example.size}`,
            )
            .replace('aria-label="Search"', `aria-label="${text}"${example.disabled ? ' disabled' : ''}`);
        }
        if (example.loading)
          return loadingMarkup
            .replace('cm-button--primary cm-button--md', `cm-button--${example.variant} cm-button--${example.size}`)
            .replace('>Save</span>', `>${text}</span>`);
        return `<button class="cm-button cm-button--${example.variant ?? 'primary'} cm-button--${example.size ?? 'md'}" type="button"${example.disabled ? ' disabled' : ''}><span class="cm-button__label">${text}</span></button>`;
      });
      return `<div class="showcase-matrix"><p class="showcase-label">${escapeHtml(label)}</p>
      <div class="showcase-matrix-row">${controls.join('')}</div></div>`;
    })
    .join('');
}

export async function buildVanillaShowcase(contractsDirectory, output) {
  const { cases, errors } = collectComponentCases(contractsDirectory);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  const caseMarkup = new Map(cases.map(({ id, canonicalHtml }) => [id, canonicalHtml]));
  const components = collectComponentManifests(contractsDirectory);
  const casesByComponent = Map.groupBy(cases, ({ componentSlug }) => componentSlug);
  const groups = JSON.parse(
    await readFile(new URL('../../examples/shared/showcase-groups.json', import.meta.url), 'utf8'),
  );
  const typography = await readFile(new URL('../../examples/shared/showcase-typography.html', import.meta.url), 'utf8');
  const themeSamples = await readFile(
    new URL('../../examples/shared/showcase-theme-samples.html', import.meta.url),
    'utf8',
  );
  const colors = await readFile(new URL('../../examples/shared/showcase-colors.html', import.meta.url), 'utf8');
  const loadingMarkup = cases.find(({ id }) => id === 'button-loading').canonicalHtml;
  const icons = await import('../../packages/icons/dist/index.js');
  const icon = icons.resolveCmIcon(icons.gear, 'classic', 'regular');
  const iconMarkup = cases
    .find(({ id }) => id === 'icon-button-default')
    .canonicalHtml.replace(
      '<svg></svg>',
      `<svg class="cm-icon cm-icon--regular cm-icon--classic" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">${icon.body}</svg>`,
    );
  const bySlug = new Map(components.map(({ slug, manifest }) => [slug, manifest]));
  const assigned = groups.flatMap(({ components }) => components);
  if (
    new Set(assigned).size !== components.length ||
    assigned.length !== components.length ||
    assigned.some((slug) => !bySlug.has(slug))
  )
    throw new Error('Showcase groups must cover every component once.');

  const coreSamples = await readFile(
    new URL('../../examples/shared/showcase-core-recipes.html', import.meta.url),
    'utf8',
  );
  const themeSwitch = (
    id,
    controlled = false,
  ) => `<fieldset class="cm-theme-switch" id="${id}"${controlled ? ' data-cm-controller="theme-switch"' : ''}><legend class="cm-theme-switch__legend">Theme</legend>
    ${['light', 'system', 'dark'].map((mode) => `<label class="cm-theme-switch__option"><input class="cm-theme-switch__input" type="radio" name="${id}" value="${mode}"${mode === 'light' ? ' checked' : ''}><span class="cm-theme-switch__label">${mode.charAt(0).toUpperCase() + mode.slice(1)}</span></label>`).join('')}
  </fieldset>`;
  const sections = new Map(
    groups.map(({ id, title, description, components: slugs }) => {
      const isCore = id !== 'layouts' && id !== 'icons';
      const shellSlugs = panels.map(({ slug }) => slug);
      const ordered = id === 'layouts' ? [...Object.keys(layoutSamples), ...shellSlugs] : slugs;
      const cards = ordered.map((slug) => {
        const manifest = bySlug.get(slug);
        const variants = casesByComponent.get(slug);
        if (!variants?.length) throw new Error(`Missing Vanilla showcase cases for ${slug}.`);
        const wide =
          slug in layoutSamples ||
          [
            'admin-layout',
            'admin-shell',
            'app-shell',
            'document-layout',
            'setup-layout',
            'button',
            'table',
            'data-table',
          ].includes(slug);
        const panel = panels.find((panel) => panel.slug === slug);
        const composition = panel
          ? renderLayoutPreview(slug, variants.find(({ basename }) => basename === 'default')?.canonicalHtml)
          : '';
        const matrix = isCore ? renderCoreMatrix(slug, (caseId) => caseMarkup.get(caseId), './avatar.png') : '';
        return `<section ${panel ? `id="demo-${slug}" data-layout-preview="${slug}"` : isCore ? `id="demo-${slug}"` : ''} class="${isCore ? 'core-component' : 'showcase-card'} showcase-panel${wide ? ' showcase-panel--wide' : ''}" aria-labelledby="component-${slug}">
        <h3 id="component-${slug}">${escapeHtml(panel?.title ?? (isCore ? coreComponentTitle(slug) : manifest.name))}</h3>
        ${layoutSamples[slug] ?? composition}
        ${slug === 'theme-switch' ? themeSwitch('showcase-theme-example', true) : ''}
        ${slug === 'button' ? '<div class="core-button-matrix">' : ''}${renderMatrix(slug, actionMatrices[slug], loadingMarkup, iconMarkup)}${slug === 'button' ? '</div>' : ''}
        ${matrix ? `<div data-core-matrix>${matrix}</div>` : ''}
        <details class="showcase-contracts"><summary>Contract examples</summary><div class="showcase-variants">${expandedExamples(
          variants,
          icons,
        )
          .map((variant) => renderExample(variant, manifest.name))
          .join('\n')}</div></details>
      </section>`;
      });
      if (id === 'layouts')
        cards.splice(
          Object.keys(layoutSamples).length,
          0,
          renderLayoutRecipes().replace('/vueforge-logo-icon.svg', './vueforge-logo-icon.svg'),
        );
      const typeSamples =
        id === 'actions'
          ? `<section id="typography" class="showcase-group">
      <header><h2>Typography</h2><p>Review heading and body styles.</p></header>
      ${typography}
    </section>`
          : '';
      return [
        id,
        `${typeSamples}<section class="showcase-group" id="${id}">
      <header><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></header>
      <div class="showcase-grid">${coreRecipesFor(coreSamples, id)}${cards.join('\n')}${id === 'theme' ? themeSamples : ''}</div>
    </section>`,
      ];
    }),
  );

  const pages = {
    core: groups
      .filter(({ id }) => id !== 'layouts' && id !== 'icons')
      .map(({ id }) => sections.get(id))
      .join('\n'),
    colors: colors + renderColorScales(),
    layouts: sections.get('layouts'),
    icons: sections.get('icons') + renderIconCatalog() + renderOperations(),
  };
  const titles = { core: 'Core', colors: 'Colors', layouts: 'Layouts', icons: 'Icons' };
  function renderPage(current, base) {
    const navigation = Object.entries(titles)
      .map(
        ([id, label]) =>
          `<a class="cm-link" href="./${id}/"${id === current ? ' aria-current="page"' : ''}>${label}</a>`,
      )
      .join('\n');
    return page(
      `${titles[current]} · CodeMonster UI Vanilla`,
      `<header class="showcase-topbar">
    <span class="showcase-brand">CodeMonster UI · Vanilla</span>
    <nav class="showcase-navigation" aria-label="Showcase sections">${navigation}</nav>
    ${themeSwitch('showcase-theme')}
  </header>
  <main class="showcase-content">
    ${
      current === 'layouts'
        ? `<div class="showcase-filter">
      <label for="showcase-search">Filter components</label>
      <input class="cm-input" type="search" id="showcase-search" />
    </div>
    <p id="showcase-empty" role="status" hidden>No matching components.</p>`
        : ''
    }
    <div class="showcase-catalog">${pages[current]}</div>
  </main>`,
      'showcase.js',
      base,
    );
  }

  await Promise.all([
    writeFile(join(output, 'index.html'), renderPage('core', './')),
    ...Object.keys(pages).map(async (id) => {
      const directory = join(output, id);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'index.html'), renderPage(id, '../'));
    }),
  ]);
  console.log(
    `Vanilla showcase: ${components.length} components, ${expandedExamples(cases, icons).length} contract examples and variants.`,
  );
}
