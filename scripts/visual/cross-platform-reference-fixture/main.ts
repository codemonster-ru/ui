import * as VueForgeCore from '@codemonster-ru/vueforge-core';
import { createApp, createStaticVNode, h, nextTick, type Component, type VNodeChild } from 'vue';

import '@codemonster-ru/vueforge-core/styles.css';
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
const components = VueForgeCore as unknown as Record<string, Component>;
const parameters = new URLSearchParams(location.search);
const caseId = parameters.get('case');
const theme = parameters.get('theme');
const root = document.querySelector<HTMLElement>('#visual-root');

if (!root || !caseId || !baselineManifest.caseIds.includes(caseId) || !['light', 'dark'].includes(theme ?? '')) {
  throw new Error('Reference fixture requires a registered case and theme=light|dark.');
}

const resolvedCase = casesById.get(caseId);
if (!resolvedCase) throw new Error(`Cross-platform case ${caseId} is unavailable.`);
const { componentCase, componentSlug } = resolvedCase;
const componentName = `Vf${componentSlug
  .split('-')
  .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
  .join('')}`;
const component = components[componentName];
if (!component) throw new Error(`Reference component ${componentName} is unavailable for ${caseId}.`);

function resolveProps(): Record<string, unknown> {
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

document.documentElement.dataset.vfTheme = theme ?? 'light';
root.dataset.visualCase = caseId;

const slots = Object.fromEntries(
  Object.entries(componentCase.slots).map(([name, contents]) => [name, staticSlot(contents)]),
);
createApp({ render: () => h(component, resolveProps(), slots) }).mount(root);
await nextTick();
root.dataset.visualRenderer = 'vueforge-fd-mounted';
root.dataset.visualReady = 'true';
