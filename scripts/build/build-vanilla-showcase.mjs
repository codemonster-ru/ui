import showcasePages from '../../examples/shared/showcase-pages.json' with { type: 'json' };
import { renderShowcaseNavigation, showcaseActions } from '../../examples/shared/showcase-navigation.mts';
import { renderApplicationExamples } from '../../examples/vanilla/application-examples.mjs';
import { renderComponentReference } from './render-showcase-component-reference.mjs';
import { referenceCaseDescription, referenceFrameClass } from '../../examples/shared/showcase-component-reference.mts';
import { coreComponentTitle, coreRecipesFor, renderCoreMatrix } from '../../examples/shared/showcase-core-matrix.mts';
import {
  renderLayoutGuideEntry,
  renderLayoutPrimitives,
  renderLayoutRecipes,
} from '../../examples/shared/showcase-layout-samples.mts';
import { renderLayoutPreview } from './render-showcase-layout.mjs';
import { panels } from '../../examples/shared/showcase-layout-data.mts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  renderColorScales,
  renderIconCatalog,
  renderIconIntro,
  renderOperations,
} from '../../examples/shared/showcase-reference.mts';
import { actionMatrices, buttonMatrices, showcaseCaseVariants } from '../../examples/shared/showcase-matrices.mts';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';
import { buildDocumentation } from './showcase-documentation.mjs';
import { buildShowcaseSearchIndex } from './showcase-search-index.mjs';

function escapeHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function page(title, content, script, base = '') {
  return `<!doctype html>
<html lang="en">
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

function renderExample(
  { id, basename, componentSlug, data, canonicalHtml },
  name,
  { heading = 'h4', primary = false } = {},
) {
  const title = basename.replaceAll('-', ' ');
  const modal = ['dialog', 'drawer', 'command-palette'].includes(componentSlug);
  const layout = ['admin-layout', 'admin-shell', 'app-shell', 'document-layout', 'setup-layout'].includes(
    componentSlug,
  );
  const floating = ['date-picker', 'dropdown', 'menu-bar', 'popover', 'select', 'tooltip'].includes(componentSlug);
  const reference = heading === 'h3';
  const description = reference ? referenceCaseDescription(data) : data.description;
  const frameSize = reference
    ? referenceFrameClass(componentSlug)
    : modal || layout
      ? ' showcase-frame--tall'
      : floating
        ? ' showcase-frame--floating'
        : '';
  const demo = page(
    `${name} · ${title}`,
    `<main class="showcase-demo${reference ? ' showcase-reference-demo' : ''}"${reference && id === 'data-table-default' ? ' data-showcase-sort-rows' : ''} inert>
      ${modal ? `<button class="cm-button cm-button--primary cm-button--md" type="button" id="showcase-open">Open ${escapeHtml(name)}</button>` : ''}
      ${canonicalHtml.replaceAll('src="/avatar.png"', 'src="./avatar.png"')}
    </main>`,
    'showcase-demo.js',
  );
  return `<article class="showcase-example" id="${id}">
    ${primary ? '' : `<${heading}>${escapeHtml(title)}</${heading}>`}
    ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    <iframe title="${escapeHtml(reference ? `Vanilla ${name} · ${title} preview` : id)}"${primary ? '' : ' loading="lazy"'}
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
  const loadingMarkup = cases.find(({ id }) => id === 'button-loading').canonicalHtml;
  const icons = await import('../../packages/icons/dist/index.js');
  const icon = icons.resolveCmIcon(icons.gear, 'classic', 'regular');
  const iconMarkup = cases
    .find(({ id }) => id === 'icon-button-default')
    .canonicalHtml.replace(
      '<svg></svg>',
      `<svg class="cm-icon cm-icon--regular cm-icon--classic" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">${icon.body}</svg>`,
    );
  const themeIcons = ['sun', 'moon']
    .map((name) => {
      const icon = icons.resolveCmIcon(icons[name], 'classic', 'regular');
      return `<svg data-showcase-theme-icon="${name}" class="cm-icon cm-icon--regular cm-icon--classic" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false"${name === 'sun' ? '' : ' hidden'}>${icon.body}</svg>`;
    })
    .join('');
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
  const themeRadio = `<fieldset class="cm-theme-switch" id="showcase-theme-example" data-cm-controller="theme-switch"><legend class="cm-theme-switch__legend">Theme</legend>
    ${['light', 'system', 'dark'].map((mode) => `<label class="cm-theme-switch__option"><input class="cm-theme-switch__input" type="radio" name="showcase-theme-example" value="${mode}"${mode === 'light' ? ' checked' : ''}><span class="cm-theme-switch__label">${mode.charAt(0).toUpperCase() + mode.slice(1)}</span></label>`).join('')}
  </fieldset>`;
  const themeSwitches = ['', ' cm-switch--static', ' cm-switch--static cm-switch--thumb-contrast-inverse']
    .map(
      (modifiers) => `<label class="cm-switch cm-switch--md${modifiers}" data-cm-controller="switch">
      <input class="cm-switch__input" type="checkbox" role="switch" aria-label="Dark theme" aria-checked="false" data-showcase-theme-toggle disabled>
      <span class="cm-switch__control" aria-hidden="true"><span class="cm-switch__thumb">${themeIcons}</span></span>
    </label>`,
    )
    .join('');
  const themeToggle = (variant, size, withLabel = false) => {
    const component = withLabel ? 'cm-button' : 'cm-icon-button';
    return `<button class="${component} ${component}--${variant} ${component}--${size}" type="button" data-showcase-theme-toggle aria-label="Switch to dark theme" disabled>
      <span class="${component}__${withLabel ? 'leading' : 'icon'}" aria-hidden="true">${themeIcons}</span>
      ${withLabel ? '<span class="cm-button__label" data-showcase-theme-label>Light</span>' : ''}
    </button>`;
  };
  const themeCards = `<div class="showcase-grid">
    <article class="showcase-panel core-theme-card">
      <h3>Theme provider</h3>
      <div class="core-theme-controls">
        ${['light', 'dark', 'system', 'toggle'].map((mode) => `<button class="cm-button cm-button--${mode === 'toggle' ? 'primary' : 'secondary'} cm-button--sm" type="button" data-showcase-set-theme="${mode}" disabled><span class="cm-button__label">${mode.charAt(0).toUpperCase() + mode.slice(1)}</span></button>`).join('')}
      </div>
      <div class="core-theme-controls core-theme-status" aria-live="polite">
        <span class="cm-tag cm-tag--primary" data-showcase-theme-mode>mode: light</span>
        <span class="cm-tag cm-tag--contrast" data-showcase-theme-resolved>resolved: light</span>
      </div>
    </article>
    <article class="showcase-panel core-theme-card">
      <h3>Theme switch</h3>
      <div class="core-theme-controls">
        ${themeSwitches}
        ${themeToggle('secondary', 'md')}${themeToggle('ghost', 'md')}${themeToggle('secondary', 'sm')}
        ${themeToggle('secondary', 'md', true)}${themeToggle('ghost', 'md', true)}${themeToggle('secondary', 'lg', true)}
      </div>
      <p class="showcase-muted core-theme-switch-note">The switch reflects the resolved theme and turns system mode into an explicit light or dark choice after interaction.</p>
    </article>
    <article class="showcase-panel core-theme-card">
      <h3>Color roles</h3>
      <p class="showcase-muted">The same semantic roles map to different palettes in light and dark.</p>
      <p class="showcase-muted"><a class="cm-link" href="./colors/">Explore color and contrast</a></p>
    </article>
  </div>`;
  const renderCases = (slug, { only, except, heading } = {}) => {
    const manifest = bySlug.get(slug);
    const variants = casesByComponent.get(slug);
    if (!variants?.length) throw new Error(`Missing Vanilla showcase cases for ${slug}.`);
    return (only ? variants.filter(({ id }) => id === only) : expandedExamples(variants, icons))
      .filter(({ id }) => id !== except)
      .map((variant) => renderExample(variant, manifest.name, { heading, primary: Boolean(only) }))
      .join('\n');
  };
  const themeContracts = `<details id="theme-contracts" class="showcase-contracts"><summary>Theme contract examples and palette samples</summary>
    ${themeRadio}<div class="showcase-grid"><section id="demo-theme-switch" class="showcase-panel" aria-labelledby="component-theme-switch"><h3 id="component-theme-switch">ThemeSwitch</h3>
      <div class="showcase-variants">${renderCases('theme-switch')}</div></section>${themeSamples}</div>
  </details>`;
  const sections = new Map(
    groups.map(({ id, title, description, components: slugs, matrix: matrixTitle, recipeAfter }) => {
      if (id === 'theme') {
        return [
          id,
          `<section class="showcase-group" id="theme"><header><h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p></header>${themeCards}</section>`,
        ];
      }
      if (id === 'layouts') {
        const shellPreviews = panels.map(({ slug, title, description }) =>
          renderLayoutGuideEntry(
            slug,
            title,
            description,
            renderLayoutPreview(slug, caseMarkup.get(`${slug}-default`), caseMarkup.get('input-enhanced')),
            true,
          ),
        );
        const layoutContracts = slugs.map(
          (slug) => `<section class="showcase-card showcase-panel">
          <h3>${escapeHtml(bySlug.get(slug).name)}</h3><div class="showcase-variants">${renderCases(slug)}</div>
        </section>`,
        );
        return [
          id,
          `<div class="layout-guide">${renderLayoutPrimitives()}${renderLayoutRecipes()}${shellPreviews.join('\n')}</div>
        <details class="showcase-contracts" data-layout-contracts><summary>Layout contract examples</summary>
          <div class="showcase-filter">
            <label for="showcase-search">Filter components</label>
            <input class="cm-input" type="search" id="showcase-search" />
          </div>
          <p id="showcase-empty" role="status" hidden>No matching components.</p>
          <div class="showcase-grid">${layoutContracts.join('\n')}</div>
        </details>`,
        ];
      }
      if (id === 'icons') {
        return [
          id,
          `${renderIconCatalog()}
          <details class="showcase-contracts"><summary>Icon component and operations examples</summary>
            <section id="demo-icon" class="showcase-panel" aria-labelledby="component-icon">
              <h3 id="component-icon" class="showcase-icon-intro-heading">Icon</h3>
              ${renderIconIntro()}
              <details class="showcase-contracts"><summary>Contract examples</summary>
                <div class="showcase-variants">${renderCases('icon')}</div>
              </details>
            </section>
            ${renderOperations()}
          </details>`,
        ];
      }
      const cards = slugs.map((slug) => {
        const wide = ['button', 'table', 'data-table'].includes(slug);
        const matrix = renderCoreMatrix(slug, (caseId) => caseMarkup.get(caseId), './avatar.png');
        const actions =
          slug === 'button'
            ? Object.entries(buttonMatrices)
                .map(
                  ([title, sizes]) => `<section class="core-button-section">
          <h4>Button · ${title}</h4>
          <div class="core-button-matrix">${renderMatrix(slug, sizes, loadingMarkup, iconMarkup)}</div>
        </section>`,
                )
                .join('')
            : renderMatrix(slug, actionMatrices[slug], loadingMarkup, iconMarkup);
        const cardClass = matrixTitle
          ? 'core-component core-group-cell'
          : `core-component showcase-panel${wide ? ' showcase-panel--wide' : ''}`;
        const heading = matrixTitle ? 'h4' : 'h3';
        return `<section id="demo-${slug}" class="${cardClass}" aria-labelledby="component-${slug}">
        <${heading} id="component-${slug}"${matrixTitle ? ' class="showcase-label"' : ''}>${escapeHtml(coreComponentTitle(slug))}</${heading}>
        ${actions}
        ${matrix ? `<div data-core-matrix>${matrix}</div>` : ''}
        <details class="showcase-contracts"><summary>Contract examples</summary><div class="showcase-variants">${renderCases(slug)}</div></details>
      </section>`;
      });
      const recipes = coreRecipesFor(coreSamples, id);
      if (recipeAfter) cards.splice(slugs.indexOf(recipeAfter) + 1, 0, recipes);
      const grid = matrixTitle
        ? `<section class="showcase-panel core-group-matrix" aria-labelledby="${id}-matrix-title">
          <h3 id="${id}-matrix-title">${escapeHtml(matrixTitle)}</h3>${recipeAfter ? '' : recipes}${cards.join('\n')}
        </section>`
        : `<div class="showcase-grid">${recipes}${cards.join('\n')}</div>`;
      const typeSamples =
        id === 'actions'
          ? `<section id="typography" class="showcase-group">
      <header><h2>Typography</h2><p>Review the heading, body, content, and prose styles shared by CodeMonster UI interfaces.</p></header>
      ${typography.replaceAll('href="#', 'href="./core/#')}
    </section>${themeContracts}`
          : '';
      return [
        id,
        `${typeSamples}<section class="showcase-group" id="${id}">
      <header><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></header>
      ${grid}
    </section>`,
      ];
    }),
  );

  const coreGroups = groups.filter(({ id }) => id !== 'layouts' && id !== 'icons');
  const coreLinks = [...coreGroups.slice(0, 1), { id: 'typography', title: 'Typography' }, ...coreGroups.slice(1)];
  const [componentIndex, componentDetails] = renderComponentReference(groups, bySlug, casesByComponent, renderCases);
  const pages = {
    core: coreGroups.map(({ id }) => sections.get(id)).join('\n'),
    components: componentIndex,
    examples: renderApplicationExamples(),
    colors: renderColorScales(),
    layouts: sections.get('layouts'),
    icons: sections.get('icons'),
  };
  const navigationPages = showcasePages.filter(({ vueOnly }) => !vueOnly);
  const coreJump = (path) => `<nav class="showcase-jump" aria-label="On this page">
    <p>On this page</p><ul>${coreLinks.map(({ id, title }) => `<li><a href="${path}#${id}">${escapeHtml(title)}</a></li>`).join('')}</ul>
  </nav>`;
  function renderPage(current, base, path, content = pages[current], pageTitle) {
    const { label, title, description } = navigationPages.find(({ id }) => id === current);
    const navigation = renderShowcaseNavigation(current, path.slice(1), '.', false);
    const intro = title
      ? `<header class="showcase-intro${current === 'core' ? ' showcase-intro--core' : ''}">
    <p class="showcase-intro__eyebrow">${escapeHtml(label)}</p>
    <h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>
    ${
      current === 'core'
        ? `<div class="showcase-intro__actions">
      <a class="showcase-intro__primary" href="./docs/getting-started/">Get started</a>
      <a class="cm-link" href="./components/">Browse components</a>
    </div>`
        : ''
    }
  </header>`
      : '';
    return page(
      `${pageTitle ?? label} · CodeMonster UI Vanilla`,
      `<a class="showcase-skip" href="${path}#showcase-main">Skip to content</a>
  <header class="showcase-topbar">
    <div class="showcase-header">
      <a class="showcase-brand" href="./core/">CodeMonster UI <span>Vanilla</span></a>
      <div class="showcase-menu">${navigation}</div>
      <div class="showcase-header__actions">${showcaseActions}</div>
      <button class="cm-icon-button cm-icon-button--secondary cm-icon-button--md showcase-theme" id="showcase-theme" type="button" aria-label="Switch to dark theme" hidden><span class="cm-icon-button__icon">${themeIcons}</span></button>
    </div>
  </header>
  <main id="showcase-main" class="showcase-content" tabindex="-1">
    ${intro}
    ${current === 'core' ? coreJump(path) : ''}
    <div class="showcase-catalog${current === 'core' ? ' showcase-core' : ''}">${content}</div>
  </main>`,
      current === 'examples' ? 'application-examples.js' : 'showcase.js',
      base,
    );
  }

  const documentation = await buildDocumentation({ relativeLinks: true });
  await Promise.all([
    writeFile(join(output, 'index.html'), renderPage('core', './', './')),
    ...Object.keys(pages).map(async (id) => {
      const directory = join(output, id);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'index.html'), renderPage(id, '../', `./${id}/`));
    }),
    ...[...componentDetails].map(async ([slug, content]) => {
      const directory = join(output, 'components', slug);
      await mkdir(directory, { recursive: true });
      await writeFile(
        join(directory, 'index.html'),
        renderPage('components', '../../', `./components/${slug}/`, content),
      );
    }),
    ...[...documentation.pages].map(async ([path, { title, html }]) => {
      const directory = join(output, path);
      const base = '../'.repeat(path.split('/').length - 2);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'index.html'), renderPage('docs', base, `.${path}`, html, title));
    }),
    (async () => {
      const directory = join(output, 'docs-content');
      await mkdir(directory, { recursive: true });
      await writeFile(
        join(directory, 'search.json'),
        JSON.stringify(buildShowcaseSearchIndex(documentation.index, 'vanilla')),
      );
    })(),
  ]);
  console.log(
    `Vanilla showcase: ${components.length} components, ${expandedExamples(cases, icons).length} contract examples and variants.`,
  );
}
