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
  description?: string;
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
    description: 'Provide theme preferences to Vue descendants and apply the selected mode to the document root.',
    guide: 'recipes/theme-switch.md',
    target: './core/#theme',
  },
  {
    slug: 'confirm-dialog',
    name: 'ConfirmDialog',
    group: 'modals',
    description: 'Ask for confirmation before a consequential action and handle the confirm or cancel result.',
    guide: 'recipes/confirm-dialog.md',
    target: './core/#modals',
  },
] as const;

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
const tallPreviews = new Set([...modalComponents, ...layoutPackages]);
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
  'command-palette':
    'Name the palette, keep focus within it while open and return focus to the opener after dismissal.',
  dialog:
    'Give the dialog an accessible name and provide a visible way to dismiss it. Escape closes a dismissible dialog.',
  drawer: 'Give the drawer an accessible name and preserve a visible close action while its modal content is open.',
  field:
    'Associate the label and supporting text with the real form control. Keep invalid state and error text in sync.',
  icon: 'Hide decorative icons from assistive technology and give meaningful stand-alone icons an accessible name.',
  'icon-button': 'Supply a concise accessible label that describes the action the icon performs.',
  menu: 'Use a menu for actions with arrow-key navigation. Use ordinary links for a site navigation list.',
  'menu-bar':
    'Move across the bar with Left and Right and use Down to enter a submenu. Escape returns to the owning item.',
  radio: 'Give related radios the same name and use a fieldset and legend when the group needs its own label.',
  tabs: 'Use arrow keys to move between tabs. Keep each tab paired with the panel it names.',
  tooltip:
    'Expose the explanation from pointer hover and keyboard focus. Keep essential instructions visible in the page.',
};

export function escapeReference(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function publicName(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/gu, '$1 $2');
}

function guideLink(path: string) {
  return `<a class="cm-link cm-link--underline-hover" href="${docsPath}/docs/${path}">Developer guide</a>`;
}

export function referenceFrameClass(slug: string) {
  if (tallPreviews.has(slug)) return ' reference-frame--tall';
  return floatingComponents.has(slug) ? ' reference-frame--floating' : '';
}

export function primaryReferenceCase(slug: string, cases: ReferenceCase[]) {
  return cases.find(({ id }) => id === `${slug}-${preferredCases[slug] ?? 'default'}`) ?? cases[0];
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
    "import '@codemonster-ru/ui-css/styles.css';",
    ...runtime,
    '</script>',
  ].join('\n');
}

export function renderReferenceIndex(
  groups: ReferenceGroup[],
  components: Map<string, ReferenceComponent>,
  base = '.',
) {
  const count = components.size + referenceSupplements.length;
  return `<section class="component-reference" data-component-reference>
    <header class="reference-intro">
      <h1>Component reference</h1>
      <p>Explore live components, compare Vue and Vanilla usage, and find the API for each component.</p>
      <div class="reference-links">
        <a class="cm-link cm-link--underline-hover" href="${docsPath}/docs/getting-started.md">Installation and quick starts</a>
        <a class="cm-link cm-link--underline-hover" href="${docsPath}/docs/tokens/getting-started.md">Design tokens</a>
      </div>
    </header>
    <div class="reference-search" data-reference-search hidden>
      <label for="reference-query">Find a component</label>
      <input class="cm-input cm-input--md" id="reference-query" type="search" placeholder="Search button, tabs, date picker…" autocomplete="off" />
    </div>
    <p class="reference-count" role="status" data-reference-count>${count} components</p>
    <div class="reference-groups">
      ${groups
        .map(
          ({ id, title, components: slugs }) => `<section class="showcase-panel reference-group" data-reference-group>
        <h2>${escapeReference(title)}</h2>
        <ul>${[
          ...slugs.map((slug) => components.get(slug)).filter((item): item is ReferenceComponent => Boolean(item)),
          ...referenceSupplements.filter(({ group }) => id === group),
        ]
          .map(
            ({
              slug,
              name,
              description,
            }) => `<li data-reference-item data-reference-terms="${escapeReference([slug, 'Cm' + name, publicName(name), title, description ?? ''].join(' '))}">
          <a class="cm-link cm-link--underline-hover" href="${base}/components/${slug}/">${escapeReference(publicName(name))}</a>
        </li>`,
          )
          .join('')}</ul>
      </section>`,
        )
        .join('')}
    </div>
  </section>`;
}

function renderReferenceEntry(
  kind: 'props' | 'slots' | 'events',
  entries: Record<string, ReferenceProp | ReferenceEntry>,
) {
  const title = { props: 'Properties', slots: 'Content slots', events: 'Events' }[kind];
  return `<section>
    <h3>${title}</h3>
    <dl class="reference-api-list">${Object.entries(entries)
      .map(([name, entry]) => {
        const details: string[] = [];
        if ('type' in entry) {
          details.push(entry.values?.join(' / ') ?? entry.type);
          if (Object.hasOwn(entry, 'default')) details.push('Default ' + JSON.stringify(entry.default));
        }
        if (entry.required) details.push('Required');
        if ('native' in entry && entry.native) details.push('Native');
        return `<div><dt><code>${escapeReference(name)}</code></dt>
        <dd>${details.length ? `<span class="reference-api-meta">${escapeReference(details.join(' · '))}</span>` : ''}
        ${entry.description ? `<span>${escapeReference(entry.description)}</span>` : ''}</dd></div>`;
      })
      .join('')}</dl>
  </section>`;
}

function renderSource(title: string, source: string) {
  return `<section class="reference-source">
    <div class="reference-source-heading">
      <h3>${title}</h3>
      <button type="button" class="cm-button cm-button--secondary cm-button--sm" hidden data-reference-copy aria-label="Copy ${title} example">
        <span class="cm-button__label">Copy code</span>
      </button>
      <span class="reference-copy-status" role="status"></span>
    </div>
    <pre tabindex="0" aria-label="${title} example code"><code>${escapeReference(source)}</code></pre>
  </section>`;
}

function overviewLink(base: string) {
  return `<a class="cm-link cm-link--underline-hover reference-back" href="${base}/components/">All components</a>`;
}

export function renderReferenceDetail(
  component: ReferenceComponent,
  example: ReferenceCase,
  preview: string,
  variants: string,
  base = '.',
) {
  const { slug, name, description, props, slots, events, states } = component;
  const guide =
    guidesBySlug[slug] ?? (layoutPrimitives.has(slug) ? 'components/layout-primitives.md' : 'components/layouts.md');
  const accessibility = accessibilityNotes[slug];
  const gallery =
    slug === 'icon' ? './icons/' : layoutPackages.has(slug) || layoutPrimitives.has(slug) ? './layouts/' : './core/';
  const apiSections = (
    [
      ['props', props],
      ['slots', slots],
      ['events', events],
    ] as const
  )
    .filter(([, entries]) => Object.keys(entries).length > 0)
    .map(([kind, entries]) => renderReferenceEntry(kind, entries))
    .join('');
  return `<article class="component-reference" data-component-reference>
    <header class="reference-intro">
      ${overviewLink(base)}
      <h1>${escapeReference(publicName(name))}</h1>
      ${description ? `<p>${escapeReference(description.replaceAll('`', ''))}</p>` : ''}
      <div class="reference-links">
        ${guideLink(guide)}
        <a class="cm-link cm-link--underline-hover" href="${docsPath}/contracts/${slug}/manifest.json">Contract source</a>
        <a class="cm-link cm-link--underline-hover" href="${base}${gallery.slice(1)}">More examples in the showcase</a>
      </div>
    </header>
    <section class="showcase-panel reference-preview" data-reference-preview="${slug}">
      <h2>Try it</h2>
      ${preview}
      ${accessibility ? `<p class="reference-accessibility"><strong>Accessibility</strong> ${escapeReference(accessibility)}</p>` : ''}
      ${
        variants
          ? `<details class="showcase-contracts"><summary>More examples and states</summary>
        <div class="showcase-variants">${variants}</div>
      </details>`
          : ''
      }
    </section>
    <section class="showcase-panel reference-usage">
      <h2>Usage</h2>
      <p>Use these imports with a build tool such as Vite. See the
        <a class="cm-link cm-link--underline-hover" href="${docsPath}/docs/getting-started.md">installation guide</a>
        to build and install the 2.0 workspace packages.</p>
      <div class="reference-snippets">
        ${renderSource('Vue', vueSource(component, example))}
        ${example.canonicalHtml ? renderSource('Vanilla HTML', vanillaReferenceSource(slug, example.canonicalHtml)) : ''}
      </div>
    </section>
    ${
      apiSections || states.length
        ? `<section class="showcase-panel reference-api">
      <h2>Component contract</h2>
      <p>See the developer guide for framework-specific options and integration details.</p>
      ${states.length ? `<ul class="reference-states" aria-label="Supported states">${states.map((state) => `<li><code>${escapeReference(state)}</code></li>`).join('')}</ul>` : ''}
      ${apiSections}
    </section>`
        : ''
    }
  </article>`;
}

export function renderReferenceSupplement(supplement: (typeof referenceSupplements)[number], base = '.') {
  const target =
    base === '.' && supplement.slug === 'confirm-dialog' ? '/confirm-dialog-example.html' : supplement.target.slice(1);

  return `<article class="component-reference" data-component-reference>
    <header class="reference-intro">
      ${overviewLink(base)}
      <h1>${publicName(supplement.name)}</h1>
      <p>${supplement.description}</p>
      <div class="reference-links">
        ${guideLink(supplement.guide)}
        <a class="cm-link cm-link--underline-hover" href="${base}${target}">Try the ${supplement.group === 'theme' ? 'theme controls' : 'confirmation flow'}</a>
      </div>
    </header>
  </article>`;
}

export function renderReferenceMissing(base = '.') {
  return `<section class="component-reference"><header class="reference-intro">
    ${overviewLink(base)}
    <h1>Component unavailable</h1>
    <p>Choose a component from the reference index.</p>
  </header></section>`;
}
