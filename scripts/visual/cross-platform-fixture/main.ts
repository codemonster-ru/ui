import * as UiVue from '@codemonster-ru/ui-vue';
import { createApp, createStaticVNode, h, nextTick, type Component, type VNodeChild } from 'vue';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
import './fixture.css';
import baselineManifest from '../../../contracts/cross-platform-visual-baselines.json';

interface ComponentCase {
  attributes?: Record<string, boolean | number | string | null>;
  id: string;
  props: Record<string, unknown>;
  slots: Record<string, string>;
}

const caseModules = import.meta.glob('../../../contracts/*/cases/*.case.json', {
  eager: true,
  import: 'default',
}) as Record<string, ComponentCase>;
const casesById = new Map(
  Object.entries(caseModules).map(([path, componentCase]) => {
    const componentSlug = path.match(/\/contracts\/([^/]+)\/cases\//u)?.[1];
    if (!componentSlug) throw new Error(`Unable to resolve component slug from ${path}.`);
    return [componentCase.id, { componentCase, componentSlug }];
  }),
);
const components = UiVue as Record<string, Component>;
const parameters = new URLSearchParams(location.search);
const caseId = parameters.get('case');
const platform = parameters.get('platform');
const theme = parameters.get('theme');
const root = document.querySelector<HTMLElement>('#visual-root');

if (
  !root ||
  !caseId ||
  !baselineManifest.caseIds.includes(caseId) ||
  !['vue', 'razor'].includes(platform ?? '') ||
  !['light', 'dark'].includes(theme ?? '')
) {
  throw new Error('Cross-platform fixture requires a registered case, platform=vue|razor, and theme=light|dark.');
}

const resolvedCase = casesById.get(caseId);
if (!resolvedCase) throw new Error(`Cross-platform case ${caseId} is unavailable.`);
const { componentCase, componentSlug } = resolvedCase;
const componentName = `Cm${componentSlug
  .split('-')
  .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
  .join('')}`;
const component = components[componentName];
if (!component) throw new Error(`Vue adapter ${componentName} is unavailable for ${caseId}.`);

function resolveVueProps(): Record<string, unknown> {
  const props = { ...componentCase.props };
  if (['input', 'select', 'date-picker'].includes(componentSlug) && Object.hasOwn(props, 'value')) {
    props.modelValue = props.value;
    delete props.value;
  }
  if (componentSlug === 'checkbox' && Object.hasOwn(props, 'checked')) {
    props.modelValue = props.checked;
    delete props.checked;
  }
  return { ...props, ...componentCase.attributes };
}

function staticSlot(contents: string): () => VNodeChild {
  const template = document.createElement('template');
  template.innerHTML = contents;
  const nodeCount = template.content.childNodes.length;
  return () => createStaticVNode(contents, Math.max(1, nodeCount));
}

document.documentElement.dataset.cmTheme = theme ?? 'light';
root.dataset.visualCase = caseId;

if (platform === 'vue') {
  const slots = Object.fromEntries(
    Object.entries(componentCase.slots).map(([name, contents]) => [name, staticSlot(contents)]),
  );
  createApp({ render: () => h(component, resolveVueProps(), slots) }).mount(root);
  await nextTick();
  root.dataset.visualRenderer = 'vue-mounted';
} else {
  const response = await fetch(`/__visual/razor/${caseId}`);
  if (!response.ok) throw new Error(`Razor fixture endpoint returned ${response.status} for ${caseId}.`);
  root.innerHTML = await response.text();
  root.dataset.visualRenderer = 'razor-rendered';
}

root.dataset.visualReady = 'true';
