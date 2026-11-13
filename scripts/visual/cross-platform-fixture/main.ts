import { initializeBehavior, recordEvent } from './behavior';
import * as UiIcons from '@codemonster-ru/ui-icons';
import * as UiLayouts from '@codemonster-ru/ui-layouts';

import * as UiVue from '@codemonster-ru/ui-vue';
import { createApp, createStaticVNode, h, nextTick, reactive, type Component, type VNodeChild } from 'vue';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
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
const components = { ...UiVue, ...UiLayouts } as Record<string, Component>;
const parameters = new URLSearchParams(location.search);
const caseId = parameters.get('case');
const platform = parameters.get('platform');
const theme = parameters.get('theme');
const root = document.querySelector<HTMLElement>('#visual-root');

if (
  !root ||
  !caseId ||
  (platform !== 'vanilla' && parameters.get('catalog') !== 'all' && !baselineManifest.caseIds.includes(caseId)) ||
  !['vue', 'vanilla'].includes(platform ?? '') ||
  !['light', 'dark'].includes(theme ?? '')
) {
  throw new Error(
    'Cross-platform fixture requires a registered case, platform=vue|vanilla, and theme=light|dark.',
  );
}

const resolvedCase = casesById.get(caseId);
if (!resolvedCase) throw new Error(`Cross-platform case ${caseId} is unavailable.`);
const { componentCase, componentSlug } = resolvedCase;
const componentName = `Cm${componentSlug
  .split('-')
  .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
  .join('')}`;
const component = components[componentName];
if (!component && platform === 'vue') throw new Error(`Vue adapter ${componentName} is unavailable for ${caseId}.`);

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
const behavior = parameters.get('behavior') === 'true';
if (behavior) initializeBehavior(root);

if (platform === 'vue') {
  const slots = Object.fromEntries(
    Object.entries(componentCase.slots).map(([name, contents]) => [name, staticSlot(contents)]),
  );
  const props = reactive(resolveVueProps());
  if (behavior) {
    const prefix = ['accordion', 'theme-switch', 'setup-layout'].includes(componentSlug) ? '' : componentSlug + '-';
    const names =
      componentSlug === 'setup-layout'
        ? ['next', 'back']
        : [
            'open-change',
            'value-change',
            'select',
            'query-change',
            'theme-change',
            'page-change',
            'page-size-change',
            'selection-change',
            'sort-change',
          ];
    for (const name of names) {
      const listener = 'on' + name.replace(/(^|-)([a-z])/gu, (_, _separator, char: string) => char.toUpperCase());
      props[listener] = () => recordEvent((componentSlug === 'setup-layout' ? 'setup-layout-' : prefix) + name);
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
  }
  createApp({ render: () => h(component!, props, slots) }).mount(root);
  await nextTick();
  root.dataset.visualRenderer = 'vue-mounted';
} else {
  const response = await fetch(`/__visual/vanilla/${encodeURIComponent(caseId)}`);
  if (!response.ok) throw new Error(`Vanilla fixture endpoint returned ${response.status} for ${caseId}.`);
  root.innerHTML = await response.text();
  const runtimeUrl = '/__visual/vanilla-runtime.js';
  const { createRuntime } = await import(/* @vite-ignore */ runtimeUrl);
  if (parameters.get('enhance') !== 'false') createRuntime().start(root);
  root.dataset.visualRenderer = 'vanilla-enhanced';
}

root.dataset.visualReady = 'true';
