<template>
  <div
    ref="rootElement"
    class="vf-playground"
    :class="containerClassName"
    :style="containerStyle"
    :data-theme="themeAttribute"
    :data-vf-theme="themeAttribute"
    :data-vf-resolved-theme="resolvedTheme"
  >
    <slot name="layout" v-bind="layoutSlotProps">
      <div class="vf-playground__tabs">
        <component :is="tabsRenderer" v-if="tabsRenderer" v-bind="tabsRendererProps" />
        <template v-else>
          <VfTabs
            class="vf-playground__tabs-default"
            size="sm"
            :items="defaultTabItems"
            :model-value="activeTab"
            @update:model-value="handleDefaultTabChange"
          />
        </template>
        <component :is="actionsRenderer" v-if="actionsRenderer && isSandboxMode" v-bind="actionsRendererProps" />
      </div>

      <div
        v-if="isCodeVisible"
        v-show="activeTab === 'code'"
        :id="tabsRenderer ? undefined : mainPanelId('code')"
        class="vf-playground__panel vf-playground__panel--code"
        :aria-labelledby="tabsRenderer ? undefined : mainTabId('code')"
        :role="tabsRenderer ? undefined : 'tabpanel'"
        :tabindex="tabsRenderer ? undefined : 0"
      >
        <template v-if="activeTab === 'code'">
          <component :is="filesRenderer" v-if="filesRenderer && fileNames.length > 1" v-bind="filesRendererProps" />
          <div v-else-if="fileNames.length > 1" class="vf-playground__files">
            <VfTabs
              class="vf-playground__tabs-default vf-playground__tabs-default--files"
              size="sm"
              :items="defaultFileTabItems"
              :model-value="activeFile"
              @update:model-value="handleDefaultFileChange"
            />
          </div>

          <template v-if="!filesRenderer && fileNames.length > 1">
            <div
              v-for="(file, index) in fileNames"
              v-show="file === activeFile"
              :id="filePanelId(index)"
              :key="file"
              class="vf-playground__codeblock-host"
              :aria-labelledby="fileTabId(index)"
              role="tabpanel"
              tabindex="0"
            >
              <VfCodeBlock
                v-if="file === activeFile"
                :code="activeFileContent"
                :language="codeLanguage"
                :show-line-numbers="true"
                :theme="resolvedCodeTheme"
              />
            </div>
          </template>
          <div v-else class="vf-playground__codeblock-host">
            <VfCodeBlock
              :code="activeFileContent"
              :language="codeLanguage"
              :show-line-numbers="true"
              :theme="resolvedCodeTheme"
            />
          </div>
        </template>
      </div>

      <div
        v-show="activeTab === 'preview'"
        :id="tabsRenderer ? undefined : mainPanelId('preview')"
        class="vf-playground__panel preview"
        :aria-labelledby="tabsRenderer ? undefined : mainTabId('preview')"
        :role="tabsRenderer ? undefined : 'tabpanel'"
        :tabindex="tabsRenderer ? undefined : 0"
      >
        <iframe
          v-if="isSandboxMode"
          :ref="bindPreviewIframe"
          class="vf-playground__iframe"
          title="Codemonster Playground Preview"
        />
        <div v-else class="vf-playground__component-preview" :style="componentPreviewStyle">
          <component :is="componentToRender" v-if="componentToRender" />
        </div>
        <p v-if="isSandboxMode && !isClient" class="vf-playground__ssr-hint">
          Preview is available on client side only.
        </p>
      </div>

      <div
        v-if="isSandboxMode"
        v-show="activeTab === 'console'"
        :id="tabsRenderer ? undefined : mainPanelId('console')"
        class="vf-playground__panel"
        :aria-labelledby="tabsRenderer ? undefined : mainTabId('console')"
        :role="tabsRenderer ? undefined : 'tabpanel'"
        :tabindex="tabsRenderer ? undefined : 0"
      >
        <pre v-if="activeTab === 'console'" class="vf-playground__console">{{ consoleOutput || 'No logs yet.' }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { VfTabs, useId, type VfTabItem } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import type {
  ConsoleEvent,
  PlaygroundError,
  createPlaygroundSession as createPlaygroundSessionFactory,
} from '@codemonster-ru/vueforge-playground-core';

import type { VfPlaygroundComponentProps, VfPlaygroundProps, VfPlaygroundSandboxProps } from './props';

type VfPlaygroundRuntimeProps = {
  mode?: VfPlaygroundProps['mode'];
  height?: VfPlaygroundProps['height'];
  minHeight?: VfPlaygroundProps['minHeight'];
  heightMode?: VfPlaygroundProps['heightMode'];
  theme?: VfPlaygroundProps['theme'];
  initialTab?: VfPlaygroundProps['initialTab'];
  tabsRenderer?: VfPlaygroundProps['tabsRenderer'];
  actionsRenderer?: VfPlaygroundProps['actionsRenderer'];
  filesRenderer?: VfPlaygroundProps['filesRenderer'];
  files?: VfPlaygroundSandboxProps['files'];
  entry?: VfPlaygroundSandboxProps['entry'];
  framework?: VfPlaygroundSandboxProps['framework'];
  autorun?: VfPlaygroundSandboxProps['autorun'];
  showCode?: VfPlaygroundSandboxProps['showCode'];
  resolveImport?: VfPlaygroundSandboxProps['resolveImport'];
  bootstrapScript?: VfPlaygroundSandboxProps['bootstrapScript'];
  component?: VfPlaygroundComponentProps['component'];
  componentSource?: VfPlaygroundComponentProps['componentSource'];
  componentSourceLanguage?: VfPlaygroundComponentProps['componentSourceLanguage'];
  componentFiles?: VfPlaygroundComponentProps['componentFiles'];
  componentEntry?: VfPlaygroundComponentProps['componentEntry'];
  componentPadding?: VfPlaygroundComponentProps['componentPadding'];
  componentMinHeight?: VfPlaygroundComponentProps['componentMinHeight'];
};

const props = withDefaults(defineProps<VfPlaygroundRuntimeProps>(), {
  mode: 'sandbox',
  height: undefined,
  minHeight: undefined,
  heightMode: 'fixed',
  tabsRenderer: undefined,
  actionsRenderer: undefined,
  filesRenderer: undefined,
  framework: 'vanilla',
  autorun: true,
  showCode: true,
  resolveImport: undefined,
  bootstrapScript: undefined,
  theme: 'inherit',
  initialTab: undefined,
  files: () => ({}),
  entry: '',
  component: undefined,
  componentSource: '',
  componentSourceLanguage: 'vue',
  componentFiles: undefined,
  componentEntry: undefined,
  componentPadding: undefined,
  componentMinHeight: undefined,
});

const emit = defineEmits<{
  run: [];
  error: [error: PlaygroundError];
  ready: [];
  'preview-ready': [];
}>();

type PlaygroundTab = 'code' | 'preview' | 'console';
type CreatePlaygroundSession = typeof createPlaygroundSessionFactory;
type PlaygroundSession = ReturnType<CreatePlaygroundSession>;

const isClient = ref(false);
const rootElement = ref<HTMLElement | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const mainTabsId = useId({ prefix: 'vf-playground-tabs' });
const fileTabsId = useId({ prefix: 'vf-playground-files' });
const isSandboxMode = computed(() => props.mode !== 'component');
const sandboxProps = computed(() => (isSandboxMode.value ? (props as VfPlaygroundSandboxProps) : null));
const componentProps = computed(() => (isSandboxMode.value ? null : (props as VfPlaygroundComponentProps)));
const isCodeVisible = computed(() =>
  isSandboxMode.value
    ? (sandboxProps.value?.showCode ?? true)
    : Boolean(componentProps.value?.componentSource) ||
      Boolean(componentProps.value?.componentFiles && Object.keys(componentProps.value.componentFiles).length > 0),
);
const theme = computed(() => props.theme ?? 'inherit');
const hasInitialTab = props.initialTab !== undefined;
const activeTab = ref<PlaygroundTab>(resolveInitialTab());
const activeFile = ref(isSandboxMode.value ? (sandboxProps.value?.entry ?? '') : '');
const logs = ref<string[]>([]);
const isRunning = ref(false);
const hostIsDark = ref(false);
const MAX_CONSOLE_ENTRIES = 500;
const MAX_CONSOLE_ENTRY_LENGTH = 16_384;

if (import.meta.env.DEV && !isSandboxMode.value && !componentProps.value?.component) {
  throw new Error('[VfPlayground] `component` is required when `mode` is "component".');
}
if (import.meta.env.DEV && isSandboxMode.value && (!sandboxProps.value?.files || !sandboxProps.value?.entry)) {
  throw new Error('[VfPlayground] `files` and `entry` are required when `mode` is "sandbox".');
}

const componentCodeFiles = computed<Record<string, string>>(() => {
  if (isSandboxMode.value) {
    return {};
  }
  const files = componentProps.value?.componentFiles;
  if (files && Object.keys(files).length > 0) {
    return files;
  }
  if (componentProps.value?.componentSource) {
    return { 'Component.vue': componentProps.value.componentSource };
  }
  return {};
});
const fileNames = computed(() => {
  if (sandboxProps.value) {
    return Object.keys(sandboxProps.value.files);
  }
  return Object.keys(componentCodeFiles.value);
});
const activeFileContent = computed(() => {
  if (sandboxProps.value) {
    return sandboxProps.value.files[activeFile.value] ?? '';
  }
  return componentCodeFiles.value[activeFile.value] ?? '';
});

const resolveCodeLanguage = (filePath: string, fallback: string): string => {
  const fileName = filePath.split('/').pop() ?? '';
  const separatorIndex = fileName.lastIndexOf('.');
  const extension =
    separatorIndex === 0 && fileName.length > 1
      ? fileName.slice(1)
      : separatorIndex > 0 && separatorIndex < fileName.length - 1
        ? fileName.slice(separatorIndex + 1)
        : '';

  if (!extension) {
    return fallback;
  }
  return extension === 'ts' ? 'typescript' : extension === 'js' ? 'javascript' : extension;
};

const codeLanguage = computed(() => {
  if (!isSandboxMode.value) {
    const fallback = componentProps.value?.componentSourceLanguage ?? 'vue';
    const componentFiles = componentProps.value?.componentFiles;
    if (!componentFiles || Object.keys(componentFiles).length === 0) {
      return fallback;
    }
    return resolveCodeLanguage(activeFile.value, fallback);
  }
  const extension = activeFile.value.split('.').pop() ?? 'txt';
  return extension === 'ts' ? 'typescript' : extension === 'js' ? 'javascript' : extension;
});
const resolvedTheme = computed<'light' | 'dark'>(() =>
  theme.value === 'inherit' ? (hostIsDark.value ? 'dark' : 'light') : theme.value,
);
const themeAttribute = computed(() => (theme.value === 'inherit' ? 'inherit' : resolvedTheme.value));
const resolvedCodeTheme = computed(() => resolvedTheme.value);
const containerStyle = computed(() => ({
  ...(props.minHeight != null
    ? { minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight }
    : {}),
  ...(props.height != null ? { height: typeof props.height === 'number' ? `${props.height}px` : props.height } : {}),
}));
const isAutoHeightMode = computed(
  () => props.heightMode === 'auto' || (props.heightMode === 'auto-preview' && activeTab.value === 'preview'),
);
const containerClassName = computed(() => ({
  'vf-playground--auto-height': isAutoHeightMode.value,
}));
const consoleOutput = computed(() => logs.value.join('\n'));
const tabsRenderer = computed(() => props.tabsRenderer);
const actionsRenderer = computed(() => props.actionsRenderer);
const filesRenderer = computed(() => props.filesRenderer);
const componentToRender = computed(() => componentProps.value?.component ?? null);
const componentPreviewStyle = computed(() => ({
  ...(componentProps.value?.componentPadding != null
    ? { padding: toCssLength(componentProps.value.componentPadding) }
    : {}),
  ...(componentProps.value?.componentMinHeight != null
    ? { minHeight: toCssLength(componentProps.value.componentMinHeight) }
    : {}),
}));
const mainTabId = (tab: PlaygroundTab) => `${mainTabsId.value}-tab-${tab}`;
const mainPanelId = (tab: PlaygroundTab) => `${mainTabsId.value}-panel-${tab}`;
const fileTabId = (index: number) => `${fileTabsId.value}-tab-${index}`;
const filePanelId = (index: number) => `${fileTabsId.value}-panel-${index}`;
const tabsRendererProps = computed(() => ({
  activeTab: activeTab.value,
  showCode: isCodeVisible.value,
  setActiveTab,
}));
const defaultTabItems = computed<VfTabItem[]>(() => {
  if (!isSandboxMode.value) {
    const tabs: VfTabItem[] = [
      {
        value: 'preview',
        label: 'Preview',
        tabId: mainTabId('preview'),
        panelId: mainPanelId('preview'),
      },
    ];
    if (isCodeVisible.value) {
      return [{ value: 'code', label: 'Code', tabId: mainTabId('code'), panelId: mainPanelId('code') }, ...tabs];
    }
    return tabs;
  }

  const tabs: VfTabItem[] = [
    {
      value: 'preview',
      label: 'Preview',
      tabId: mainTabId('preview'),
      panelId: mainPanelId('preview'),
    },
    {
      value: 'console',
      label: 'Console',
      tabId: mainTabId('console'),
      panelId: mainPanelId('console'),
    },
  ];
  if (isCodeVisible.value) {
    return [{ value: 'code', label: 'Code', tabId: mainTabId('code'), panelId: mainPanelId('code') }, ...tabs];
  }
  return tabs;
});
const defaultFileTabItems = computed<VfTabItem[]>(() =>
  fileNames.value.map((file, index) => ({
    value: file,
    label: file,
    tabId: fileTabId(index),
    panelId: filePanelId(index),
  })),
);
const actionsRendererProps = computed(() => ({
  isRunning: isRunning.value,
  run: runSession,
}));
const filesRendererProps = computed(() => ({
  files: fileNames.value,
  activeFile: activeFile.value,
  setActiveFile,
}));
const layoutSlotProps = computed(() => ({
  activeTab: activeTab.value,
  showCode: isCodeVisible.value,
  setActiveTab,
  fileNames: fileNames.value,
  activeFile: activeFile.value,
  setActiveFile,
  activeFileContent: activeFileContent.value,
  codeLanguage: codeLanguage.value,
  codeTheme: resolvedCodeTheme.value,
  consoleOutput: consoleOutput.value,
  isRunning: isRunning.value,
  run: runSession,
  isClient: isClient.value,
  bindPreviewIframe,
}));

let session: PlaygroundSession | null = null;
let loadCreatePlaygroundSessionPromise: Promise<CreatePlaygroundSession> | null = null;
let initSessionPromise: Promise<void> | null = null;
let initSessionRequestId = 0;
let unsubscribers: Array<() => void> = [];
let themeObserver: MutationObserver | null = null;
let mediaTheme: MediaQueryList | null = null;
let onMediaThemeChange: ((event: MediaQueryListEvent) => void) | null = null;
let sessionIframe: HTMLIFrameElement | null = null;
let readyEmitted = false;
let mountedReadyFallbackRaf1: number | null = null;
let mountedReadyFallbackRaf2: number | null = null;
let sandboxThemeVariableNames = new Set<string>();
const SANDBOX_THEME_STYLE_ID = 'vf-playground-theme-sync';
const SANDBOX_CANVAS_COLOR = 'var(--vf-color-background-canvas, var(--vf-color-bg, Canvas))';
const SANDBOX_TEXT_COLOR = 'var(--vf-color-text-primary, var(--vf-color-text, CanvasText))';
const MAX_SANDBOX_THEME_VARIABLES = 8192;

function loadCreatePlaygroundSession(): Promise<CreatePlaygroundSession> {
  loadCreatePlaygroundSessionPromise ??= import('@codemonster-ru/vueforge-playground-core').then(
    (runtime) => runtime.createPlaygroundSession,
  );
  return loadCreatePlaygroundSessionPromise;
}

function toCssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function resolveInitialTab(): PlaygroundTab {
  if (props.initialTab === 'preview') {
    return 'preview';
  }
  if (props.initialTab === 'console') {
    return isSandboxMode.value ? 'console' : 'preview';
  }
  if (props.initialTab === 'code') {
    return isCodeVisible.value ? 'code' : 'preview';
  }
  return isCodeVisible.value ? 'code' : 'preview';
}

function readHostThemeIsDark(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const readBoundary = (element: HTMLElement): boolean | null => {
    const dataTheme = element.getAttribute('data-theme');
    if (dataTheme === 'dark' || dataTheme === 'light') {
      return dataTheme === 'dark';
    }

    const dataVfTheme = element.getAttribute('data-vf-theme');
    if (dataVfTheme === 'dark' || dataVfTheme === 'light') {
      return dataVfTheme === 'dark';
    }

    const classList = element.classList;
    if (classList.contains('dark') || classList.contains('vf-theme-dark')) {
      return true;
    }
    if (classList.contains('light') || classList.contains('vf-theme-light')) {
      return false;
    }

    return null;
  };

  let currentElement: HTMLElement | null = rootElement.value?.parentElement ?? document.documentElement;

  while (currentElement) {
    const boundary = readBoundary(currentElement);
    if (boundary !== null) {
      return boundary;
    }

    currentElement = currentElement.parentElement;
  }

  const documentBoundary = readBoundary(document.documentElement);
  if (documentBoundary !== null) {
    return documentBoundary;
  }

  const colorScheme = getComputedStyle(rootElement.value ?? document.documentElement).colorScheme;
  if (colorScheme.includes('dark')) {
    return true;
  }
  if (colorScheme.includes('light')) {
    return false;
  }

  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncHostTheme(): void {
  hostIsDark.value = readHostThemeIsDark();
}

function mutationAffectsHostTheme(record: MutationRecord): boolean {
  const host = rootElement.value;
  const target = record.target;

  if (!host) {
    return false;
  }

  if (record.type === 'childList') {
    return [...record.addedNodes, ...record.removedNodes].some(
      (node) => node === host || (node.nodeType === 1 && (node as Element).contains(host)),
    );
  }

  return Boolean(
    target.nodeType === 1 &&
    (target === document.documentElement || target === host || (target as Element).contains(host)),
  );
}

function readHostThemeVariables(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const hostStyles = getComputedStyle(rootElement.value ?? document.documentElement);
  const availableVariables = new Map<string, string>();
  const variables: Record<string, string> = {};

  for (let index = 0; index < hostStyles.length; index += 1) {
    const propertyName = hostStyles.item(index);
    if (propertyName.startsWith('--')) {
      availableVariables.set(propertyName, hostStyles.getPropertyValue(propertyName));
    }
  }

  const pendingNames = [...availableVariables.keys()].filter((propertyName) => propertyName.startsWith('--vf-'));
  const visitedNames = new Set<string>();

  while (pendingNames.length > 0 && visitedNames.size < MAX_SANDBOX_THEME_VARIABLES) {
    const propertyName = pendingNames.pop();
    if (!propertyName || visitedNames.has(propertyName)) {
      continue;
    }

    const value = availableVariables.get(propertyName) ?? hostStyles.getPropertyValue(propertyName);
    if (!value.trim()) {
      continue;
    }

    visitedNames.add(propertyName);
    variables[propertyName] = value;

    for (const match of value.matchAll(/var\(\s*(--[-_a-zA-Z0-9]+)/g)) {
      const dependencyName = match[1];
      if (!visitedNames.has(dependencyName)) {
        pendingNames.push(dependencyName);
      }
    }
  }

  return variables;
}

function syncSandboxThemeToIframe(): void {
  if (!isSandboxMode.value || !iframeRef.value) {
    return;
  }

  const iframe = iframeRef.value;
  const nextTheme = resolvedTheme.value;
  const variables = readHostThemeVariables();
  let iframeDocument: Document | null = null;

  try {
    iframeDocument = iframe.contentDocument;
  } catch {
    // Sandboxed srcdoc previews have an opaque origin; the message bridge below is authoritative.
  }

  if (iframeDocument) {
    const iframeRoot = iframeDocument.documentElement;
    iframeRoot.setAttribute('data-theme', nextTheme);
    iframeRoot.setAttribute('data-vf-theme', nextTheme);
    iframeRoot.classList.toggle('dark', nextTheme === 'dark');
    iframeRoot.classList.toggle('light', nextTheme === 'light');
    iframeRoot.classList.toggle('vf-theme-dark', nextTheme === 'dark');
    iframeRoot.classList.toggle('vf-theme-light', nextTheme === 'light');
    iframeRoot.style.colorScheme = nextTheme;

    for (const propertyName of sandboxThemeVariableNames) {
      iframeRoot.style.removeProperty(propertyName);
    }
    sandboxThemeVariableNames = new Set(Object.keys(variables));
    for (const [propertyName, value] of Object.entries(variables)) {
      iframeRoot.style.setProperty(propertyName, value);
    }

    if (iframeDocument.body) {
      iframeDocument.body.style.backgroundColor = SANDBOX_CANVAS_COLOR;
      iframeDocument.body.style.color = SANDBOX_TEXT_COLOR;
    }

    let themeStyle = iframeDocument.getElementById(SANDBOX_THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!themeStyle) {
      themeStyle = iframeDocument.createElement('style');
      themeStyle.id = SANDBOX_THEME_STYLE_ID;
      iframeDocument.head.append(themeStyle);
    }
    themeStyle.textContent = `
      :root { color-scheme: ${nextTheme}; }
      html, body {
        background: ${SANDBOX_CANVAS_COLOR};
        color: ${SANDBOX_TEXT_COLOR};
      }
    `;
  }

  try {
    iframe.contentWindow?.postMessage(
      {
        __cm_playground: true,
        type: 'theme',
        payload: { theme: nextTheme, variables },
      },
      '*',
    );
  } catch {
    // The direct path above remains useful in same-origin test and integration environments.
  }
}

function emitReadyOnce(): void {
  if (readyEmitted) {
    return;
  }
  readyEmitted = true;
  emit('ready');
}

function emitPreviewReady(): void {
  cancelMountedReadyFallback();
  emit('preview-ready');
  emitReadyOnce();
}

function scheduleMountedReadyFallback(): void {
  if (typeof window === 'undefined') {
    return;
  }
  // Preserve event semantics: in sandbox mode, ready should come from preview-ready.
  // Fallback is only for component mode in case preview-ready is never emitted.
  if (isSandboxMode.value) {
    return;
  }
  cancelMountedReadyFallback();
  mountedReadyFallbackRaf1 = window.requestAnimationFrame(() => {
    mountedReadyFallbackRaf1 = null;
    mountedReadyFallbackRaf2 = window.requestAnimationFrame(() => {
      mountedReadyFallbackRaf2 = null;
      emitReadyOnce();
    });
  });
}

function cancelMountedReadyFallback(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (mountedReadyFallbackRaf1 !== null) {
    window.cancelAnimationFrame(mountedReadyFallbackRaf1);
    mountedReadyFallbackRaf1 = null;
  }
  if (mountedReadyFallbackRaf2 !== null) {
    window.cancelAnimationFrame(mountedReadyFallbackRaf2);
    mountedReadyFallbackRaf2 = null;
  }
}

function setActiveTab(tab: 'code' | 'preview' | 'console'): void {
  if (!isSandboxMode.value && tab === 'console') {
    activeTab.value = 'preview';
    return;
  }

  if (tab === 'code' && !isCodeVisible.value) {
    activeTab.value = 'preview';
    return;
  }
  activeTab.value = tab;
}

function setActiveFile(file: string): void {
  if (!fileNames.value.includes(file)) {
    return;
  }
  activeFile.value = file;
}

function handleDefaultTabChange(value: string): void {
  if (value === 'code' || value === 'preview' || value === 'console') {
    setActiveTab(value);
  }
}

function handleDefaultFileChange(value: string): void {
  setActiveFile(value);
}

function bindPreviewIframe(el: Element | ComponentPublicInstance | null): void {
  if (!isSandboxMode.value) {
    iframeRef.value = null;
    return;
  }

  const nextIframe = el instanceof HTMLIFrameElement ? el : null;
  if (iframeRef.value) {
    iframeRef.value.removeEventListener('load', handleIframeLoad);
  }
  iframeRef.value = nextIframe;
  if (nextIframe) {
    nextIframe.addEventListener('load', handleIframeLoad);
    void initSession();
  }
}

function handleIframeLoad(): void {
  syncSandboxThemeToIframe();
  emitPreviewReady();
}

function appendConsole(event: ConsoleEvent): void {
  const serialized = event.args.map((arg) => {
    if (typeof arg === 'string') {
      return arg;
    }
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  });

  appendLog(`[${event.level}] ${serialized.join(' ')}`);
}

function appendError(error: PlaygroundError): void {
  const chunks = [`[error] ${error.message}`];
  if (error.source) {
    chunks.push(`source: ${error.source}`);
  }
  if (error.stack) {
    chunks.push(error.stack);
  }
  appendLog(chunks.join('\n'));
  activeTab.value = 'console';
  emit('error', error);
}

function appendLog(entry: string): void {
  const boundedEntry = entry.length > MAX_CONSOLE_ENTRY_LENGTH ? `${entry.slice(0, MAX_CONSOLE_ENTRY_LENGTH)}…` : entry;
  logs.value.push(boundedEntry);

  const overflow = logs.value.length - MAX_CONSOLE_ENTRIES;
  if (overflow > 0) {
    logs.value.splice(0, overflow);
  }
}

function initSession(forceRecreate = false): Promise<void> {
  if (!isSandboxMode.value || !isClient.value || !iframeRef.value) {
    return Promise.resolve();
  }

  if (initSessionPromise && !forceRecreate) {
    return initSessionPromise;
  }

  const requestId = ++initSessionRequestId;
  const promise = initSessionInternal(forceRecreate, requestId).finally(() => {
    if (initSessionPromise === promise) {
      initSessionPromise = null;
    }
  });
  initSessionPromise = promise;
  return promise;
}

async function initSessionInternal(forceRecreate: boolean, requestId: number): Promise<void> {
  if (!isSandboxMode.value || !isClient.value || !iframeRef.value) {
    return;
  }

  if (!forceRecreate && session && sessionIframe === iframeRef.value) {
    return;
  }

  const sessionIframeTarget = iframeRef.value;
  const createPlaygroundSession = await loadCreatePlaygroundSession();
  if (
    requestId !== initSessionRequestId ||
    !isSandboxMode.value ||
    !iframeRef.value ||
    iframeRef.value !== sessionIframeTarget
  ) {
    return;
  }

  if (session) {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
    unsubscribers = [];
    session.dispose();
    session = null;
  }

  session = createPlaygroundSession({
    runtime: 'browser',
    framework: sandboxProps.value?.framework ?? 'vanilla',
    iframe: sessionIframeTarget,
    files: sandboxProps.value?.files ?? {},
    entry: sandboxProps.value?.entry ?? '',
    resolveImport: sandboxProps.value?.resolveImport,
    bootstrapScript: sandboxProps.value?.bootstrapScript,
  });

  unsubscribers = [
    session.onRun(() => emit('run')),
    session.onConsole((event) => appendConsole(event)),
    session.onError((error) => appendError(error)),
  ];
  sessionIframe = sessionIframeTarget;
}

async function runSession(options?: { keepActiveTab?: boolean }): Promise<void> {
  if (!isSandboxMode.value) {
    return;
  }

  if (isRunning.value) {
    return;
  }

  if (!iframeRef.value) {
    activeTab.value = 'preview';
    await nextTick();
    await nextTick();
  }

  await initSession();
  if (!session) {
    return;
  }

  isRunning.value = true;
  if (!options?.keepActiveTab) {
    activeTab.value = 'preview';
  }
  logs.value = [];
  try {
    await session.run();
    syncSandboxThemeToIframe();
    emitPreviewReady();
  } finally {
    isRunning.value = false;
  }
}

onMounted(async () => {
  isClient.value = true;
  syncHostTheme();
  if (typeof window !== 'undefined') {
    themeObserver = new MutationObserver((records) => {
      if (!records.some(mutationAffectsHostTheme)) {
        return;
      }

      syncHostTheme();
      syncSandboxThemeToIframe();
    });
    themeObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-theme', 'data-vf-theme', 'class', 'style'],
    });
    mediaTheme = window.matchMedia('(prefers-color-scheme: dark)');
    onMediaThemeChange = () => syncHostTheme();
    mediaTheme.addEventListener('change', onMediaThemeChange);
  }

  if (isSandboxMode.value) {
    await initSession();
    syncSandboxThemeToIframe();
  } else {
    emitPreviewReady();
  }

  scheduleMountedReadyFallback();
});

watch(
  iframeRef,
  async (nextIframe) => {
    if (!isSandboxMode.value) {
      return;
    }

    if (!nextIframe) {
      return;
    }

    await initSession();
    syncSandboxThemeToIframe();

    if (sandboxProps.value?.autorun ?? true) {
      await runSession({ keepActiveTab: true });
    }
  },
  { immediate: true },
);

watch(
  [isSandboxMode, iframeRef, theme, hostIsDark],
  () => {
    syncSandboxThemeToIframe();
  },
  { immediate: true },
);

watch(
  () => (isSandboxMode.value ? ([sandboxProps.value?.files, sandboxProps.value?.entry] as const) : null),
  async (payload) => {
    if (!payload) {
      return;
    }
    const [files, entry] = payload;
    if (!files || !entry) {
      return;
    }
    activeFile.value = entry;
    if (!session) {
      return;
    }

    session.updateFiles(files, entry);
    if (sandboxProps.value?.autorun ?? true) {
      await runSession({ keepActiveTab: true });
    }
  },
  { deep: true },
);

watch(
  () =>
    isSandboxMode.value
      ? ([
          sandboxProps.value?.framework,
          sandboxProps.value?.resolveImport,
          sandboxProps.value?.bootstrapScript,
        ] as const)
      : null,
  async () => {
    if (!isSandboxMode.value) {
      return;
    }

    if (!iframeRef.value) {
      return;
    }

    await initSession(true);
    if (sandboxProps.value?.autorun ?? true) {
      await runSession({ keepActiveTab: true });
    }
  },
);

watch(
  [isSandboxMode, isCodeVisible],
  ([sandbox, nextShowCode]) => {
    if (!sandbox) {
      if (activeTab.value === 'console') {
        activeTab.value = 'preview';
      }
      if (!nextShowCode && activeTab.value === 'code') {
        activeTab.value = 'preview';
      }
      if (!hasInitialTab && nextShowCode && activeTab.value === 'preview') {
        activeTab.value = 'code';
      }
      return;
    }
    if (activeTab.value === 'code' && !nextShowCode) {
      activeTab.value = 'preview';
    }
  },
  { immediate: true },
);

watch(
  [isSandboxMode, fileNames, componentProps],
  ([sandbox, nextFileNames, nextComponentProps]) => {
    if (sandbox) {
      return;
    }
    if (!nextFileNames.length) {
      activeFile.value = '';
      return;
    }
    const componentEntry = nextComponentProps?.componentEntry;
    if (componentEntry && nextFileNames.includes(componentEntry)) {
      activeFile.value = componentEntry;
      return;
    }
    if (!nextFileNames.includes(activeFile.value)) {
      activeFile.value = nextFileNames[0];
    }
  },
  { immediate: true, deep: true },
);

onBeforeUnmount(() => {
  for (const unsubscribe of unsubscribers) {
    unsubscribe();
  }

  session?.dispose();
  session = null;
  cancelMountedReadyFallback();
  if (iframeRef.value) {
    iframeRef.value.removeEventListener('load', handleIframeLoad);
  }
  sessionIframe = null;
  themeObserver?.disconnect();
  themeObserver = null;
  if (mediaTheme && onMediaThemeChange) {
    mediaTheme.removeEventListener('change', onMediaThemeChange);
  }
  mediaTheme = null;
  onMediaThemeChange = null;
});

defineExpose({
  setActiveFile,
  setActiveTab,
  run: runSession,
});
</script>

<style src="./playground.css"></style>
