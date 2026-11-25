import showcasePages from '../../examples/shared/showcase-pages.json' with { type: 'json' };
import { coreShowcaseGroups, renderShowcaseNavigation } from '../../examples/shared/showcase-navigation.mts';
import { scopeShowcaseAttribute } from '../../examples/shared/showcase-inline.mjs';
import { showcaseComponentCases, showcasePanelExamples } from '../../examples/shared/showcase-cases.mts';
import { renderShowcasePanel } from '../../examples/shared/showcase-render.mts';
import { renderToString } from 'vue/server-renderer';
import { createSSRApp, createStaticVNode, h } from 'vue';
import {
  CmBadge,
  CmFieldset,
  CmGrid,
  CmIcon,
  CmIconButton,
  CmLink,
  CmRadio,
  CmSection,
  CmSkeleton,
} from '@codemonster-ru/ui-vue';
import { moon, sun } from '@codemonster-ru/ui-icons';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { renderShowcaseTypography } from '../../examples/shared/showcase-typography.mts';
import { parseFragment, serialize } from 'parse5';
import {
  initialShellLayout,
  layoutExamples,
  layoutPreviewChoices,
} from '../../examples/shared/showcase-layout-data.mts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';

function escapeHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const packageStylesheet = './css/preview.css';

function page(title, content, script, { base = '', styles = ['./css/showcase.css'], restoreScroll = true } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  ${restoreScroll ? '' : "<script>history.scrollRestoration = 'manual';</script>"}
  ${base ? `<base href="${base}" />` : ''}
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="data:," />
  ${styles.map((style) => `<link rel="stylesheet" href="${style}" />`).join('\n  ')}
  <script type="module" src="./${script}"></script>
</head>
<body>
  ${content}
</body>
</html>
`;
}

function scopeMarkup(node, prefix) {
  for (const attribute of node.attrs ?? []) {
    if (attribute.name === 'autofocus') attribute.name = 'data-autofocus';
    attribute.value = scopeShowcaseAttribute(attribute.name, attribute.value, prefix);
  }
  for (const child of node.childNodes ?? []) scopeMarkup(child, prefix);
  if (node.content) scopeMarkup(node.content, prefix);
}

const renderOptions = {
  avatar: './avatar.png',
  staticPreview: true,
  staticContent(html, prefix) {
    const fragment = parseFragment(html);
    scopeMarkup(fragment, prefix);
    return createStaticVNode(serialize(fragment), fragment.childNodes.length);
  },
};

function renderMarkup(render, idPrefix) {
  const app = createSSRApp({ render });
  if (idPrefix) app.config.idPrefix = idPrefix;
  return renderToString(app);
}

function findElement(node, matches) {
  if (matches(node)) return node;
  for (const child of node.childNodes ?? []) {
    const result = findElement(child, matches);
    if (result) return result;
  }
}

const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name);
const hasClass = (node, name) => attr(node, 'class')?.value.split(' ').includes(name);
const hide = (node) => node.attrs.push({ name: 'hidden', value: '' });

function hideOverflowTableRows(table) {
  const body = findElement(table, (node) => node.tagName === 'tbody');
  const pageSize = Number(attr(table, 'data-cm-data-table-page-size').value);
  body.childNodes
    .filter((node) => attr(node, 'data-cm-data-table-row'))
    .slice(pageSize)
    .forEach(hide);
  return pageSize;
}

function labelTableViewports(node) {
  const label = attr(node, 'data-showcase-scroll-label');
  if (label) {
    const viewport = findElement(
      node,
      (element) => hasClass(element, 'cm-table__scroll') || hasClass(element, 'cm-data-table__scroll'),
    );
    viewport.attrs.push(
      { name: 'role', value: 'region' },
      { name: 'tabindex', value: '0' },
      { name: 'aria-label', value: label.value },
    );
    node.attrs = node.attrs.filter((attribute) => attribute !== label);
  }
  for (const child of node.childNodes ?? []) labelTableViewports(child);
}

async function renderLayoutExample(slug, renderView) {
  const fragment = await renderView('LayoutExample', { slug });
  const shell = findElement(fragment, (node) => attr(node, 'data-preview-shell'));
  if (shell) {
    for (const key of ['subheader', 'content-subheader']) {
      hide(findElement(shell, (node) => hasClass(node, `cm-${slug}__${key}`)));
    }
    const initialLayout = attr(shell, 'data-preview-shell').value;
    if (initialLayout === 'content') {
      const classes = attr(shell, 'class');
      classes.value = classes.value.replace(`cm-${slug}--sidebar-content-aside`, `cm-${slug}--${initialLayout}`);
      for (const key of ['sidebar', 'aside']) {
        hide(findElement(shell, (node) => hasClass(node, `cm-${slug}__${key}`)));
      }
    }
  }

  if (slug === 'admin-shell') {
    const table = findElement(fragment, (node) => attr(node, 'id')?.value === 'showcase-warehouse');
    const pageSize = hideOverflowTableRows(table);
    const totalRows = Number(attr(table, 'data-cm-data-table-total-rows').value);
    const summary = findElement(table, (node) => hasClass(node, 'cm-data-table__pagination-summary'));
    summary.childNodes[0].value = `1-${Math.min(pageSize, totalRows)} of ${totalRows}`;
  }
  return serialize(fragment);
}

export async function buildVanillaShowcase(contractsDirectory, output) {
  const server = await createServer({
    root: resolve(import.meta.dirname, '../..'),
    configFile: false,
    plugins: [vue()],
    server: { middlewareMode: true, watch: null, ws: false },
  });
  try {
    await writeShowcase(contractsDirectory, output, async (view, props = {}) => {
      const { default: component } = await server.ssrLoadModule(`/examples/ui-showcase/src/${view}.vue`);
      const markup = await renderMarkup(() => h(component, { staticPreview: true, ...props }), `showcase-${view}`);
      const fragment = parseFragment(markup);
      labelTableViewports(fragment);
      return fragment;
    });
  } finally {
    await server.close();
  }
}

async function writeShowcase(contractsDirectory, output, renderView) {
  const { cases, errors } = collectComponentCases(contractsDirectory);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  const components = collectComponentManifests(contractsDirectory);
  const groups = JSON.parse(
    await readFile(new URL('../../examples/shared/showcase-groups.json', import.meta.url), 'utf8'),
  );
  const typography = await renderMarkup(() => renderShowcaseTypography('./core/'), 'showcase-typography');
  const bySlug = new Map(components.map(({ slug, manifest }) => [slug, manifest]));
  // ColumnChooser is rendered as an example inside the DataTable panel.
  const assigned = [...groups.flatMap(({ components }) => components), 'column-chooser'];
  if (
    new Set(assigned).size !== components.length ||
    assigned.length !== components.length ||
    assigned.some((slug) => !bySlug.has(slug))
  )
    throw new Error('Showcase groups must cover every component once.');

  const casesByComponent = Map.groupBy(cases, ({ componentSlug }) => componentSlug);
  const examples = new Map(
    assigned
      .filter((slug) => slug !== 'icon')
      .map((slug) => [
        slug,
        showcaseComponentCases(
          slug,
          casesByComponent.get(slug).map(({ data }) => data),
          bySlug.get(slug),
        ),
      ]),
  );
  const renderExamples = async (slug, heading = 'h3', before) => {
    const staticExamples = showcasePanelExamples(slug, (component) => examples.get(component)).map((example) => {
      if (example.id !== 'data-table-expansion') return example;
      // Vanilla needs the detail rows in the HTML even when they start collapsed.
      const defaultExpandedRowKeys = example.props.rows.map(({ id }) => id);
      return { ...example, props: { ...example.props, defaultExpandedRowKeys } };
    });
    const html = await renderMarkup(
      () => renderShowcasePanel(slug, heading, staticExamples, renderOptions, before),
      `showcase-${slug}`,
    );
    if (slug !== 'data-table') return html;
    const fragment = parseFragment(html);
    const table = findElement(fragment, (node) => attr(node, 'data-showcase-client-pagination'));
    hideOverflowTableRows(table);
    const expansion = findElement(
      fragment,
      (node) => attr(node, 'data-showcase-example')?.value === 'data-table-expansion',
    );
    const expansionBody = findElement(expansion, (node) => node.tagName === 'tbody');
    for (const row of expansionBody.childNodes) {
      if (hasClass(row, 'cm-data-table__expanded-row')) hide(row);
      const button = findElement(row, (node) => attr(node, 'data-cm-data-table-expand'));
      if (!button) continue;
      attr(button, 'aria-expanded').value = 'false';
      attr(button, 'aria-label').value = attr(button, 'data-cm-data-table-expand-label').value;
    }
    return serialize(fragment);
  };
  const renderGroup = (id, title, children) =>
    renderMarkup(() =>
      h(
        CmSection,
        { id, surface: true, class: 'showcase-group', 'aria-labelledby': `group-${id}`, tabindex: -1 },
        () => [
          h('h2', { id: `group-${id}`, class: 'showcase-group-label' }, title),
          h(CmGrid, { class: 'showcase-component-list' }, () =>
            createStaticVNode(children.join('\n'), children.length),
          ),
        ],
      ),
    );
  const sections = new Map(
    await Promise.all(
      groups.map(async ({ id, title, components: slugs }) => {
        if (id === 'layouts') {
          const shellSlugs = new Set(layoutExamples.map(({ slug }) => slug));
          const primitives = slugs.filter((slug) => !shellSlugs.has(slug) && !slug.endsWith('-area'));
          const regions = slugs.filter((slug) => slug.endsWith('-area'));
          const shellPreviews = await Promise.all(
            layoutExamples.map(async ({ slug, title }) => {
              const content = await renderLayoutExample(slug, renderView);
              const frame = page(title, `<div data-layout-example="${slug}">${content}</div>`, 'layout-example.js', {
                styles: [packageStylesheet, './showcase-layout-example.css'],
              });
              const controls =
                slug === 'app-shell' || slug === 'document-layout'
                  ? await renderView('LayoutRegionControls', { slug, layout: initialShellLayout, options: [] })
                  : null;
              return renderExamples(slug, 'h3', () => [
                h(CmFieldset, { id: `${slug}-preview-width`, label: 'Width', class: 'layout-preview__sizes' }, () =>
                  layoutPreviewChoices.map(({ value, label }) =>
                    h(CmRadio, {
                      name: `${slug}-width`,
                      value,
                      label,
                      size: 'sm',
                      modelValue: 'fit',
                      'data-preview-width': value,
                    }),
                  ),
                ),
                controls && createStaticVNode(serialize(controls), controls.childNodes.length),
                h(
                  'div',
                  {
                    class: 'layout-preview__viewport',
                    role: 'region',
                    'aria-label': `${title} preview viewport`,
                    tabindex: 0,
                  },
                  [
                    h('iframe', {
                      class: 'layout-preview__frame',
                      title: `${title} preview`,
                      loading: slug === 'admin-shell' ? 'eager' : 'lazy',
                      'data-fit': '',
                      'data-shell-preview-layout': controls ? initialShellLayout : undefined,
                      'data-shell-preview-options': controls ? '' : undefined,
                      srcdoc: frame,
                    }),
                    h(
                      'div',
                      { class: 'layout-preview__placeholder', role: 'status', 'aria-label': 'Loading preview' },
                      [h(CmSkeleton)],
                    ),
                  ],
                ),
              ]);
            }),
          );
          const [shellGroup, primitiveGroup, regionGroup] = await Promise.all([
            renderGroup('layout-shells', 'Application shells', shellPreviews),
            Promise.all(primitives.map((slug) => renderExamples(slug))).then((items) =>
              renderGroup('layout-primitives', 'Layout primitives', items),
            ),
            Promise.all(regions.map((slug) => renderExamples(slug))).then((items) =>
              renderGroup('layout-components', 'Layout regions', items),
            ),
          ]);
          return [id, `<div class="layout-guide">${shellGroup}${primitiveGroup}${regionGroup}</div>`];
        }
        if (id === 'icons') return [id, serialize(await renderView('IconsShowcase', { staticPreview: undefined }))];
        const typeSamples = id === 'actions' ? typography : '';
        const samples = await Promise.all(slugs.map((slug) => renderExamples(slug)));
        if (id === 'modals') samples.push(serialize(await renderView('ConfirmDialogExamples')));
        const componentGroup = await renderGroup(id, title, samples);
        return [id, `${typeSamples}${componentGroup}`];
      }),
    ),
  );

  const pages = {
    core: coreShowcaseGroups.map(({ id }) => sections.get(id)).join('\n'),
    colors: serialize(await renderView('ColorsShowcase')),
    layouts: sections.get('layouts'),
    icons: sections.get('icons'),
  };
  async function renderPage(current, base, path) {
    const { label } = showcasePages.find(({ id }) => id === current);
    const content = await renderMarkup(
      () => [
        h(CmLink, { class: 'showcase-skip', href: `${path}#showcase-main` }, () => 'Skip to content'),
        h('header', { class: 'showcase-topbar' }, [
          h('div', { class: 'showcase-header' }, [
            h(CmLink, { class: 'showcase-brand', href: './' }, () => ['CodeMonster UI ', h(CmBadge, () => 'Vanilla')]),
            h('div', { class: 'showcase-menu' }, [renderShowcaseNavigation(current, path.slice(1), '.')]),
            h(
              CmIconButton,
              {
                id: 'showcase-theme',
                class: 'showcase-theme',
                label: 'Switch to dark theme',
                variant: 'secondary',
                size: 'lg',
                hidden: true,
              },
              () => [
                h(CmIcon, { icon: sun, 'data-showcase-theme-icon': 'sun' }),
                h(CmIcon, { icon: moon, 'data-showcase-theme-icon': 'moon', hidden: true }),
              ],
            ),
          ]),
        ]),
        h('main', { id: 'showcase-main', class: 'showcase-content', tabindex: -1 }, [
          current === 'core' || current === 'layouts' ? h('h1', { class: 'showcase-page-heading' }, label) : null,
          h('div', { class: ['showcase-catalog', current === 'core' && 'showcase-core'] }, [
            createStaticVNode(pages[current], 1),
          ]),
        ]),
      ],
      'showcase-page',
    );
    return page(`${label} · CodeMonster UI Vanilla`, content, 'showcase.js', {
      base,
      restoreScroll: current !== 'layouts',
    });
  }

  await Promise.all([
    renderPage('core', './', './').then((html) => writeFile(join(output, 'index.html'), html)),
    ...Object.keys(pages).map(async (id) => {
      const directory = join(output, id);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'index.html'), await renderPage(id, '../', `./${id}/`));
    }),
  ]);
  console.log(
    `Vanilla showcase: ${components.length} components, ${[...examples.values()].flat().length} contract examples and variants.`,
  );
}
