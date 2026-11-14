import { followShowcaseTheme, saveShowcaseTheme } from '../../shared/showcase-theme.js';
import { showcaseCaseVariants, showcaseVariantValue } from '../../shared/showcase-matrices.mts';
import * as UiIcons from '@codemonster-ru/ui-icons';
import * as UiLayouts from '@codemonster-ru/ui-layouts';

import * as UiVue from '@codemonster-ru/ui-vue';
import { createApp, createStaticVNode, h, reactive, type Component, type VNodeChild } from 'vue';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
import '../../shared/showcase-shell.css';
interface ComponentCase {
  attributes?: Record<string, boolean | number | string | null>;
  id: string;
  props: Record<string, unknown>;
  slots: Record<string, string>;
}

const caseModules = import.meta.glob<ComponentCase>('../../../contracts/*/cases/*.case.json', {
  eager: true,
  import: 'default',
});
const casesById = new Map(
  Object.entries(caseModules).map(([path, componentCase]) => {
    const componentSlug = path.match(/\/contracts\/([^/]+)\/cases\//u)?.[1];
    if (!componentSlug) throw new Error(`Unable to resolve component slug from ${path}.`);
    return [componentCase.id, { componentCase, componentSlug }];
  }),
);
const components = { ...UiVue, ...UiLayouts } as Record<string, Component>;
const caseId = new URLSearchParams(location.search).get('case');
const resolvedCase = casesById.get(caseId ?? '');
const root = document.querySelector<HTMLElement>('#visual-root');
if (!root || !resolvedCase) throw new Error('Unknown Vue showcase case.');

const { componentCase, componentSlug } = resolvedCase;
const componentName =
  'Cm' +
  componentSlug
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
const component = components[componentName];
if (!component) throw new Error(`Missing showcase component ${componentName}.`);

const parentRoot = window.parent.document.documentElement;
const updateTheme = () => {
  document.documentElement.dataset.cmTheme = parentRoot.dataset.cmTheme ?? 'system';
};
updateTheme();
new MutationObserver(updateTheme).observe(parentRoot, { attributes: true, attributeFilter: ['data-cm-theme'] });

function resolveVueProps(): Record<string, unknown> {
  const props = { ...componentCase.props };
  if (['input', 'select', 'date-picker', 'tabs', 'textarea'].includes(componentSlug) && Object.hasOwn(props, 'value')) {
    props.modelValue = props.value;
    delete props.value;
  }
  if (['checkbox', 'switch'].includes(componentSlug) && Object.hasOwn(props, 'checked')) {
    props.modelValue = props.checked;
    delete props.checked;
  }
  if (componentSlug === 'radio' && props.checked) props.modelValue = props.value;
  if (componentSlug === 'radio') delete props.checked;
  if (componentSlug === 'icon' && typeof props.icon === 'string') {
    const geometry = (UiIcons as Record<string, unknown>)[props.icon];
    if (!geometry) throw new Error(`Unknown icon geometry ${props.icon}.`);
    props.icon = geometry;
  }
  if (componentSlug === 'avatar' && props.image === '/avatar.png')
    props.image = new URL('../../vanilla/avatar.png', import.meta.url).href;
  return { ...props, ...componentCase.attributes };
}

function staticSlot(contents: string): () => VNodeChild {
  const template = document.createElement('template');
  template.innerHTML = contents;
  const nodeCount = template.content.childNodes.length;
  return () => createStaticVNode(contents, Math.max(1, nodeCount));
}

const slots = Object.fromEntries(
  Object.entries(componentCase.slots).map(([name, contents]) => [name, staticSlot(contents)]),
);
const props = reactive(resolveVueProps());
const parameters = new URLSearchParams(location.search);
const basename = componentCase.id.slice(componentSlug.length + 1);
for (const { prop, value } of showcaseCaseVariants(componentSlug, basename)) {
  if (parameters.get(prop) === value) props[prop] = showcaseVariantValue(value);
}
for (const key of [
  'modelValue',
  'open',
  'openItems',
  'query',
  'sort',
  'page',
  'pageSize',
  'selectedRowIds',
  'openPath',
]) {
  props['onUpdate:' + key] = (value: unknown) => {
    props[key] = value;
  };
}
followShowcaseTheme((mode) => {
  if (componentSlug === 'theme-switch') props.modelValue = mode;
});
if (componentSlug === 'theme-switch') props.onThemeChange = saveShowcaseTheme;
const modal = ['dialog', 'drawer', 'command-palette'].includes(componentSlug);
createApp({
  render: () => [
    ...(modal
      ? [
          h(
            'button',
            {
              type: 'button',
              class: 'cm-button cm-button--primary cm-button--md',
              onClick: () => {
                props.open = true;
              },
            },
            'Open ' +
              componentSlug
                .split('-')
                .map((part) => part[0].toUpperCase() + part.slice(1))
                .join(''),
          ),
        ]
      : []),
    h(component, props, slots),
  ],
}).mount(root);
root.inert = false;
root.addEventListener('submit', (event) => event.preventDefault());
root.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a[href^="/"]')) event.preventDefault();
});
