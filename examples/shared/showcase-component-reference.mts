export interface ReferenceGroup {
  id: string;
  title: string;
  components: string[];
}

interface ReferenceEntry {
  description?: string;
  required?: boolean;
}

interface ReferenceProp extends ReferenceEntry {
  type: string;
  values?: (string | number)[];
  default?: unknown;
}

export interface ReferenceComponent {
  slug: string;
  name: string;
  props: Record<string, ReferenceProp>;
  slots: Record<string, ReferenceEntry>;
  events: Record<string, ReferenceEntry & { native?: boolean }>;
  states: string[];
}

export interface ReferenceCase {
  id: string;
  description?: string;
  props: Record<string, unknown>;
  attributes?: Record<string, boolean | number | string | null>;
  slots: Record<string, string>;
  canonicalHtml?: string;
}

export const referenceSupplements = [
  {
    slug: 'theme-provider',
    name: 'ThemeProvider',
    group: 'theme',
    guide: 'recipes/theme-switch.md',
    target: './core/#theme',
  },
  {
    slug: 'confirm-dialog',
    name: 'ConfirmDialog',
    group: 'modals',
    guide: 'recipes/confirm-dialog.md',
    target: './core/#modals',
  },
] as const;

export function referenceCatalog(groups: ReferenceGroup[], components: Map<string, ReferenceComponent>) {
  return groups.flatMap(({ id, title, components: slugs }) =>
    [
      ...slugs.map((slug) => components.get(slug)).filter((item): item is ReferenceComponent => Boolean(item)),
      ...referenceSupplements.filter(({ group }) => id === group),
    ].map(({ slug, name }) => ({ slug, name, category: title, categoryId: id })),
  );
}

const guidesBySlug: Record<string, string> = {
  'theme-switch': 'recipes/theme-switch.md',
  button: 'components/button.md',
  'icon-button': 'components/icon-button.md',
  link: 'components/navigation.md#apis',
  tooltip: 'components/overlays.md#accessibility-and-ownership',
  dropdown: 'components/overlays.md#accessibility-and-ownership',
  popover: 'components/overlays.md#accessibility-and-ownership',
  card: 'components/card.md',
  panel: 'recipes/panel.md',
  divider: 'components/display.md',
  fieldset: 'components/fieldset.md',
  'group-box': 'recipes/group-box.md',
  table: 'components/data-tables.md#table',
  'data-table': 'components/data-tables.md#datatable-data-model',
  'column-chooser': 'components/data-tables.md#choosing-columns',
  alert: 'components/display.md',
  avatar: 'components/display.md',
  badge: 'components/display.md',
  tag: 'components/display.md',
  'progress-bar': 'components/progress.md#progress-bar',
  'progress-spinner': 'components/progress.md#progress-spinner',
  skeleton: 'components/display.md',
  'skeleton-gate': 'recipes/skeleton-gate.md',
  field: 'components/forms.md#field-api',
  'form-layout': 'recipes/form-layout.md',
  input: 'components/forms.md#input-api',
  textarea: 'components/forms.md#textarea-and-choice-apis',
  select: 'components/advanced-inputs.md#select',
  'date-picker': 'components/advanced-inputs.md#datepicker',
  checkbox: 'components/forms.md#textarea-and-choice-apis',
  radio: 'components/forms.md#textarea-and-choice-apis',
  switch: 'components/forms.md#textarea-and-choice-apis',
  breadcrumbs: 'components/navigation.md',
  'page-header': 'recipes/page-header.md',
  tabs: 'components/navigation.md#accessibility-and-ownership',
  stepper: 'components/navigation.md#stepper',
  accordion: 'components/accordion.md',
  'nav-menu': 'components/navigation.md#nested-navigation',
  'menu-bar': 'components/navigation.md#menu-bar',
  menu: 'components/compositions.md#composed-menu',
  'table-of-contents': 'components/navigation.md#table-of-contents',
  dialog: 'components/overlays.md#accessibility-and-ownership',
  drawer: 'components/overlays.md#accessibility-and-ownership',
  'command-palette': 'components/advanced-inputs.md#commandpalette',
  icon: 'components/display.md#icons',
};

const layoutPrimitives = new Set(['container', 'grid', 'inline', 'section', 'stack']);
const layoutPackages = new Set([
  'admin-layout',
  'admin-shell',
  'app-shell',
  'aside-area',
  'auth-layout',
  'content-area',
  'document-layout',
  'error-layout',
  'footer-area',
  'header-area',
  'setup-layout',
  'sidebar-area',
]);
const modalComponents = new Set(['dialog', 'drawer', 'command-palette']);
const floatingComponents = new Set(['date-picker', 'dropdown', 'menu-bar', 'popover', 'select', 'tooltip']);
const compactPreviews = new Set([
  'avatar',
  'badge',
  'button',
  'checkbox',
  'icon',
  'icon-button',
  'link',
  'progress-spinner',
  'radio',
  'switch',
  'tag',
  'theme-switch',
  'tooltip',
]);
const formPreviews = new Set(['date-picker', 'field', 'fieldset', 'form-layout', 'input', 'select', 'textarea']);
const contentPreviews = new Set(['table', 'data-table', 'form-layout', 'nav-menu']);
const docsPath = 'https://github.com/codemonster-ru/ui/blob/main';
const preferredCases: Record<string, string> = {
  avatar: 'label',
  divider: 'horizontal',
  'progress-bar': 'determinate',
};

const accessibilityNotes: Record<string, string> = {
  accordion:
    'Tab to a trigger. Use the arrow keys, Home or End to move between triggers, and Enter or Space to toggle.',
  alert: 'Use a status message for routine feedback. Reserve the alert role for errors that need immediate attention.',
  button:
    'Give the action a visible name and keep its label present while it is busy. Use a link with a destination for navigation.',
  'data-table':
    'Give the table a meaningful caption. Label selection, sorting and pagination controls so their purpose stays clear out of context.',
  'date-picker':
    'Label the trigger with the date being requested. Keep the displayed value, validation message and any range limits clear.',
  'command-palette':
    'Name the palette, keep focus within it while open and return focus to the opener after dismissal.',
  dialog:
    'Give the dialog an accessible name and provide a visible way to dismiss it. Escape closes a dismissible dialog.',
  drawer: 'Give the drawer an accessible name and preserve a visible close action while its modal content is open.',
  field:
    'Associate the label and supporting text with the real form control. Keep invalid state and error text in sync.',
  icon: 'Hide decorative icons from assistive technology and give meaningful stand-alone icons an accessible name.',
  'icon-button': 'Supply a concise accessible label that describes the action the icon performs.',
  input:
    'Provide a visible label, associate error text with the input, and keep the accessible name when adding a clear or reveal action.',
  menu: 'Use a menu for actions with arrow-key navigation. Use ordinary links for a site navigation list.',
  'menu-bar':
    'Move across the bar with Left and Right and use Down to enter a submenu. Escape returns to the owning item.',
  radio: 'Give related radios the same name and use a fieldset and legend when the group needs its own label.',
  select:
    'Name the trigger with its field label. Keep a clear label for each option and associate validation text with the control.',
  tabs: 'Use arrow keys to move between tabs. Keep each tab paired with the panel it names.',
  tooltip:
    'Expose the explanation from pointer hover and keyboard focus. Keep essential instructions visible in the page.',
};

const accessibilityGuides: Record<string, string> = {
  button: 'components/button.md#forms-and-accessibility',
  'data-table': 'components/data-tables.md#scope-accessibility-and-security',
  table: 'components/data-tables.md#scope-accessibility-and-security',
  'date-picker': 'components/advanced-inputs.md#accessibility-and-security',
  select: 'components/advanced-inputs.md#accessibility-and-security',
  'command-palette': 'components/advanced-inputs.md#accessibility-and-security',
};

export function escapeReference(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function publicName(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/gu, '$1 $2');
}

function guideLink(path: string, label = 'Developer guide') {
  return `<a class="cm-link cm-link--underline-hover" href="${docsPath}/docs/${escapeReference(path)}">${label}</a>`;
}

export function referenceFrameClass(slug: string) {
  if (layoutPackages.has(slug)) return ' reference-frame--tall';
  if (modalComponents.has(slug)) return ' reference-frame--modal';

  const modifiers = [];
  if (compactPreviews.has(slug)) modifiers.push('compact');
  if (formPreviews.has(slug)) modifiers.push('form');
  if (contentPreviews.has(slug)) modifiers.push('content');
  if (floatingComponents.has(slug)) modifiers.push('floating');
  if (slug === 'date-picker') modifiers.push('calendar');
  if (slug === 'select' || slug === 'tooltip') modifiers.push('short-popup');
  return modifiers.map((modifier) => ` reference-frame--${modifier}`).join('');
}

export function primaryReferenceCase(slug: string, cases: ReferenceCase[]) {
  return cases.find(({ id }) => id === `${slug}-${preferredCases[slug] ?? 'default'}`) ?? cases[0];
}

export function referenceCaseDescription({ id, description }: ReferenceCase) {
  if (id === 'dialog-default') return 'A confirmation dialog for deleting a project.';
  if (id === 'drawer-default') return 'A drawer for filter controls.';
  if (id === 'tooltip-default') return 'Hover over Save or focus it with the keyboard to show the tooltip.';
  return description;
}

export function resolveReferenceProps(slug: string, example: ReferenceCase): Record<string, unknown> {
  const props = { ...example.props };
  if (['input', 'select', 'date-picker', 'tabs', 'textarea'].includes(slug) && Object.hasOwn(props, 'value')) {
    props.modelValue = props.value;
    delete props.value;
  }
  if (['checkbox', 'switch'].includes(slug) && Object.hasOwn(props, 'checked')) {
    props.modelValue = props.checked;
    delete props.checked;
  }
  if (slug === 'radio') {
    if (props.checked) props.modelValue = props.value;
    delete props.checked;
  }
  return { ...props, ...example.attributes };
}

function vueSource(component: ReferenceComponent, example: ReferenceCase) {
  const { slug, name } = component;
  const componentName = 'Cm' + name;
  const packageName = layoutPackages.has(slug) ? 'ui-layouts' : 'ui-vue';
  const props = resolveReferenceProps(slug, example);
  const icon = slug === 'icon' ? props.icon : undefined;
  if (typeof icon === 'string') delete props.icon;
  const modelNames = ['modelValue', 'openItems', 'openPath'].filter((key) => Object.hasOwn(props, key));
  if (modalComponents.has(slug)) modelNames.push('open');
  const modelLines = modelNames.map((key) => {
    const defaultValue = Object.hasOwn(props, key) ? props[key] : false;
    delete props[key];
    return `const ${key} = ref(${JSON.stringify(defaultValue)});`;
  });
  const bindings = [
    ...(Object.keys(props).length ? ['v-bind="props"'] : []),
    ...(typeof icon === 'string' ? [`:icon="${icon}"`] : []),
    ...modelNames.map((key) => {
      const argument = key === 'modelValue' ? '' : ':' + key.replace(/[A-Z]/gu, (c) => '-' + c.toLowerCase());
      return `v-model${argument}="${key}"`;
    }),
  ];
  const slots = Object.entries(example.slots).map(([key, value]) => {
    const escaped = value.replaceAll('{{', '&#123;&#123;');
    return key === 'default' ? `    ${escaped}` : `    <template #${key}>${escaped}</template>`;
  });
  const importLines = [
    ...(modelLines.length ? ["import { ref } from 'vue';"] : []),
    `import { ${componentName} } from '@codemonster-ru/${packageName}';`,
    ...(typeof icon === 'string' ? [`import { ${icon} } from '@codemonster-ru/ui-icons';`] : []),
    "import '@codemonster-ru/ui-tokens/tokens.css';",
    "import '@codemonster-ru/ui-css/fonts.css';",
    "import '@codemonster-ru/ui-css/styles.css';",
  ];
  const setup = [
    ...modelLines,
    ...(Object.keys(props).length ? ['const props = ' + JSON.stringify(props, null, 2) + ';'] : []),
  ];
  const opening = '  <' + componentName + (bindings.length ? ' ' + bindings.join(' ') : '');
  const template = slots.length ? [opening + '>', ...slots, '  </' + componentName + '>'] : [opening + ' />'];
  if (modalComponents.has(slug)) template.unshift('  <button type="button" @click="open = true">Open preview</button>');
  return [
    '<script setup>',
    ...importLines,
    ...(setup.length ? ['', ...setup] : []),
    '</script>',
    '',
    '<template>',
    ...template,
    '</template>',
  ].join('\n');
}

export function vanillaReferenceSource(slug: string, markup: string) {
  const controllers = new Set(
    [...markup.matchAll(/data-cm-controller="([^"]+)"/gu)].flatMap(([, keys]) => keys.trim().split(/\s+/u)),
  );
  const factories = [...controllers].map((key) => {
    const name = key
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
    return { key, name: `createCm${name}Controller` };
  });
  const modal = modalComponents.has(slug);
  const runtime = factories.length
    ? [
        'import {',
        '  CmRuntime,',
        ...factories.map(({ name }) => `  ${name},`),
        "} from '@codemonster-ru/ui-runtime';",
        '',
        "const example = document.querySelector('#demo');",
        'const runtime = new CmRuntime()',
        ...factories.map(
          ({ key, name }, index) => `  .register('${key}', ${name})${index === factories.length - 1 ? ';' : ''}`,
        ),
        'runtime.start(example);',
        ...(modal
          ? [
              "example.querySelector('button').addEventListener('click', () => {",
              `  example.querySelector('dialog').dispatchEvent(new CustomEvent('cm:${slug}-open-request'));`,
              '});',
            ]
          : []),
        '',
        "window.addEventListener('pagehide', (event) => {",
        '  if (!event.persisted) runtime.stop();',
        '});',
        '',
      ]
    : [];
  return [
    '<div id="demo">',
    ...(modal ? ['  <button type="button">Open preview</button>'] : []),
    ...markup
      .trim()
      .split('\n')
      .map((line) => '  ' + line),
    '</div>',
    '',
    '<script type="module">',
    "import '@codemonster-ru/ui-tokens/tokens.css';",
    "import '@codemonster-ru/ui-css/fonts.css';",
    "import '@codemonster-ru/ui-css/styles.css';",
    ...runtime,
    '</script>',
  ].join('\n');
}

function renderReferenceEntry(
  kind: 'props' | 'slots' | 'events',
  entries: Record<string, ReferenceProp | ReferenceEntry>,
) {
  const title = { props: 'Properties', slots: 'Content slots', events: 'Events' }[kind];
  return `<section class="reference-api-section">
    <h3 id="${kind}" tabindex="-1">${title}</h3>
    <dl class="reference-api-list">${Object.entries(entries)
      .map(([name, entry]) => {
        const prop = 'type' in entry ? entry : undefined;
        const type = prop?.values?.join(' | ') ?? prop?.type;
        const defaultValue = prop && Object.hasOwn(prop, 'default') && JSON.stringify(prop.default);
        return `<div>
          <dt>
            <code>${escapeReference(name)}</code>
            ${entry.required ? '<span class="cm-badge">Required</span>' : ''}
            ${'native' in entry && entry.native ? '<span class="cm-badge">Native</span>' : ''}
          </dt>
          <dd>
            ${type ? `<code class="reference-api-type">${escapeReference(type)}</code>` : ''}
            ${entry.description ? `<span>${escapeReference(entry.description)}</span>` : ''}
            ${defaultValue ? `<span class="reference-api-default">Default: <code>${escapeReference(defaultValue)}</code></span>` : ''}
          </dd>
        </div>`;
      })
      .join('')}</dl>
  </section>`;
}

function renderSource(id: 'vue' | 'vanilla', title: string, source: string) {
  return `<section class="reference-source" id="snippet-${id}" data-reference-source="${id}">
    <div class="reference-source-heading">
      <h3>${title} example</h3>
      <button type="button" class="cm-button cm-button--secondary cm-button--sm" hidden data-reference-copy aria-label="Copy ${title} example">
        <span class="cm-button__label">Copy code</span>
      </button>
      <span class="reference-copy-status" role="status"></span>
    </div>
    <pre tabindex="0" aria-label="${title} example code"><code>${escapeReference(source)}</code></pre>
  </section>`;
}

function categoryPath(categoryId?: string) {
  if (categoryId === 'layouts' || categoryId === 'icons') return `/${categoryId}/`;
  return categoryId ? `/core/#${categoryId}` : '/core/';
}

function breadcrumb(base: string, entry?: ReturnType<typeof referenceCatalog>[number]) {
  return `<nav class="reference-breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a class="cm-link cm-link--underline-hover" href="${base}/core/">Visual matrix</a></li>
      ${entry ? `<li><a class="cm-link cm-link--underline-hover" href="${base}${categoryPath(entry.categoryId)}">${escapeReference(entry.category)}</a></li>` : ''}
    </ol>
  </nav>`;
}

interface DetailOptions {
  component: ReferenceComponent;
  example: ReferenceCase;
  preview: string;
  variants: string;
  catalog: ReturnType<typeof referenceCatalog>;
  base?: string;
}

function renderRelated(
  slug: string,
  catalog: ReturnType<typeof referenceCatalog>,
  base: string,
  guide: string,
  galleryLink: string,
) {
  const category = catalog.find((entry) => entry.slug === slug)?.categoryId;
  const related = catalog.filter((entry) => entry.categoryId === category && entry.slug !== slug).slice(0, 4);
  return `<section class="reference-section">
    <h2 id="related" tabindex="-1">Related resources</h2>
    <div class="reference-links">
      ${guideLink(guide)}
      ${galleryLink}
      ${related.map(({ slug: sibling, name }) => `<a class="cm-link cm-link--underline-hover" href="${base}/components/${sibling}/">${escapeReference(publicName(name))}</a>`).join('')}
    </div>
  </section>`;
}

export function renderReferenceDetail({ component, example, preview, variants, catalog, base = '.' }: DetailOptions) {
  const { slug, name, props, slots, events, states } = component;
  const guide =
    guidesBySlug[slug] ?? (layoutPrimitives.has(slug) ? 'components/layout-primitives.md' : 'components/layouts.md');
  const accessibility = accessibilityNotes[slug];
  const catalogEntry = catalog.find((entry) => entry.slug === slug);
  const gallery = categoryPath(catalogEntry?.categoryId);
  const detailUrl = `${base}/components/${slug}/`;
  const apiEntries = (
    [
      ['props', 'Properties', props],
      ['events', 'Events', events],
      ['slots', 'Content slots', slots],
    ] as const
  ).filter(([, , entries]) => Object.keys(entries).length > 0);
  const displayName = escapeReference(publicName(name));
  const activeAdapter = base ? 'vanilla' : 'vue';
  const accessibilityGuide =
    accessibilityGuides[slug] ??
    (catalogEntry?.categoryId === 'forms' ? 'components/forms.md#native-form-and-accessibility-rules' : guide);
  const sectionLinks = [
    ['preview', 'Live preview'],
    ...(variants || states.length ? [['variants', 'Variants and states']] : []),
    ['usage', 'Basic usage'],
    ...(apiEntries.length ? [['api', 'API reference']] : []),
    ['accessibility', 'Accessibility'],
    ['related', 'Related resources'],
  ];
  return `<article class="component-reference" data-component-reference>
    <header class="reference-intro">
      ${breadcrumb(base, catalogEntry)}
      <h1>${displayName}</h1>
    </header>
    <div class="reference-content">
    <nav class="reference-contents" aria-label="Component reference sections">
      <p>On this page</p>
      <ul>${sectionLinks.map(([id, title]) => `<li><a class="cm-link cm-link--underline-hover" href="${detailUrl}#${id}">${title}</a></li>`).join('')}</ul>
    </nav>
    <div class="reference-sections">
    <section class="reference-section reference-preview" data-reference-preview="${slug}">
      <h2 id="preview" tabindex="-1">Live preview</h2>
      ${preview}
    </section>
    ${
      variants || states.length
        ? `<section class="reference-section reference-variants">
      <h2 id="variants" tabindex="-1">Variants and states</h2>
      ${states.length ? `<ul class="reference-states" aria-label="Supported states">${states.map((state) => `<li><code class="cm-badge">${escapeReference(state)}</code></li>`).join('')}</ul>` : ''}
      ${variants ? `<details><summary>More examples and states</summary><div class="reference-variant-grid">${variants}</div></details>` : ''}
    </section>`
        : ''
    }
    <section class="reference-section reference-usage">
      <h2 id="usage" tabindex="-1">Basic usage</h2>
      <p>${guideLink('getting-started.md', 'Installation guide')}</p>
      <div class="reference-snippets" data-reference-snippets="${activeAdapter}">
        ${
          example.canonicalHtml
            ? `<div class="cm-tabs__list reference-snippet-tabs" role="tablist" aria-label="Example language" hidden>
            <button type="button" class="cm-tabs__tab" role="tab" id="snippet-tab-vue" aria-controls="snippet-vue" aria-selected="false" data-cm-tab-value="vue">Vue</button>
            <button type="button" class="cm-tabs__tab" role="tab" id="snippet-tab-vanilla" aria-controls="snippet-vanilla" aria-selected="false" data-cm-tab-value="vanilla">Vanilla HTML</button>
          </div>`
            : ''
        }
        ${renderSource('vue', 'Vue', vueSource(component, example))}
        ${example.canonicalHtml ? renderSource('vanilla', 'Vanilla HTML', vanillaReferenceSource(slug, example.canonicalHtml)) : ''}
      </div>
    </section>
    ${
      apiEntries.length
        ? `<section class="reference-section reference-api">
      <h2 id="api" tabindex="-1">API reference</h2>
      <div class="reference-links">
        ${guideLink(guide)}
        <a class="cm-link cm-link--underline-hover" href="${docsPath}/contracts/${slug}/manifest.json">Contract source</a>
      </div>
      <ul class="reference-api-index" aria-label="API sections">
        ${apiEntries.map(([kind, title, entries]) => `<li><a class="cm-link cm-link--underline-hover" href="${detailUrl}#${kind}">${title} <span class="cm-badge">${Object.keys(entries).length}</span></a></li>`).join('')}
      </ul>
      ${apiEntries.map(([kind, , entries]) => renderReferenceEntry(kind, entries)).join('')}
    </section>`
        : ''
    }
    <section class="reference-section">
      <h2 id="accessibility" tabindex="-1">Accessibility</h2>
      ${accessibility ? `<p>${escapeReference(accessibility)}</p>` : ''}
      <p>${guideLink(accessibilityGuide, 'Integration and accessibility guidance')}</p>
    </section>
    ${renderRelated(slug, catalog, base, guide, `<a class="cm-link cm-link--underline-hover" href="${base}${gallery}">Showcase examples</a>`)}
    </div>
    </div>
  </article>`;
}

export function renderReferenceSupplement(
  supplement: (typeof referenceSupplements)[number],
  catalog: ReturnType<typeof referenceCatalog>,
  base = '.',
) {
  const target =
    base === '.' && supplement.slug === 'confirm-dialog' ? '/confirm-dialog-example.html' : supplement.target.slice(1);

  return `<article class="component-reference" data-component-reference>
    <header class="reference-intro">
      ${breadcrumb(
        base,
        catalog.find((entry) => entry.slug === supplement.slug),
      )}
      <h1>${publicName(supplement.name)}</h1>
      <div class="reference-links">
        ${guideLink(supplement.guide)}
        <a class="cm-link cm-link--underline-hover" href="${base}${target}">Try the ${supplement.group === 'theme' ? 'theme controls' : 'confirmation flow'}</a>
      </div>
    </header>
  </article>`;
}

export function renderReferenceMissing(base = '.') {
  return `<section class="component-reference"><header class="reference-intro">
    ${breadcrumb(base)}
    <h1>Component unavailable</h1>
    <p>Browse component examples in the visual matrix.</p>
  </header></section>`;
}
