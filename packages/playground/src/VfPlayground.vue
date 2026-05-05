<template>
  <div class="vf-playground" :style="containerStyle" :data-theme="theme">
    <slot name="layout" v-bind="layoutSlotProps">
      <div class="vf-playground__tabs">
        <component :is="tabsRenderer" v-if="tabsRenderer" v-bind="tabsRendererProps" />
        <template v-else>
          <VfTabs
            class="vf-playground__tabs-default"
            :items="defaultTabItems"
            :model-value="activeTab"
            @update:model-value="handleDefaultTabChange"
          />
        </template>
        <component :is="actionsRenderer" v-if="actionsRenderer" v-bind="actionsRendererProps" />
      </div>

      <div v-if="activeTab === 'code' && showCode" class="vf-playground__panel vf-playground__panel--code">
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
        <div class="vf-playground__codeblock-host">
          <VfCodeBlock
            :code="activeFileContent"
            :language="codeLanguage"
            :show-line-numbers="true"
            :theme="resolvedCodeTheme"
          />
        </div>
      </div>

      <div v-show="activeTab === 'preview'" class="vf-playground__panel preview">
        <iframe :ref="bindPreviewIframe" class="vf-playground__iframe" title="Codemonster Playground Preview" />
        <p v-if="!isClient" class="vf-playground__ssr-hint">Preview is available on client side only.</p>
      </div>

      <div v-if="activeTab === 'console'" class="vf-playground__panel">
        <pre class="vf-playground__console">{{ consoleOutput || 'No logs yet.' }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { VfTabs, type VfTabItem } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';
import { createPlaygroundSession, type ConsoleEvent, type PlaygroundError } from '@codemonster-ru/vueforge-playground-core';

import type { VfPlaygroundProps } from './props';

const props = withDefaults(defineProps<VfPlaygroundProps>(), {
  framework: 'vanilla',
  autorun: true,
  showCode: true,
  theme: 'inherit'
});

const emit = defineEmits<{
  run: [];
  error: [error: PlaygroundError];
}>();

const isClient = typeof window !== 'undefined';
const iframeRef = ref<HTMLIFrameElement | null>(null);
const activeTab = ref(props.showCode ? 'code' : 'preview');
const activeFile = ref(props.entry);
const logs = ref<string[]>([]);
const isRunning = ref(false);
const hostIsDark = ref(false);

const fileNames = computed(() => Object.keys(props.files));
const activeFileContent = computed(() => props.files[activeFile.value] ?? '');
const codeLanguage = computed(() => {
  const ext = activeFile.value.split('.').pop() ?? 'txt';
  return ext === 'ts' ? 'typescript' : ext === 'js' ? 'javascript' : ext;
});
const resolvedCodeTheme = computed(() => {
  if (props.theme === 'inherit') {
    return hostIsDark.value ? 'dark' : 'light';
  }
  return props.theme;
});
const containerStyle = computed(() => ({
  ...(props.height != null
    ? { height: typeof props.height === 'number' ? `${props.height}px` : props.height }
    : {})
}));
const consoleOutput = computed(() => logs.value.join('\n'));
const tabsRenderer = computed(() => props.tabsRenderer);
const actionsRenderer = computed(() => props.actionsRenderer);
const filesRenderer = computed(() => props.filesRenderer);
const tabsRendererProps = computed(() => ({
  activeTab: activeTab.value,
  showCode: props.showCode,
  setActiveTab
}));
const defaultTabItems = computed<VfTabItem[]>(() => {
  const tabs: VfTabItem[] = [
    { value: 'preview', label: 'Preview' },
    { value: 'console', label: 'Console' }
  ];
  if (props.showCode) {
    return [{ value: 'code', label: 'Code' }, ...tabs];
  }
  return tabs;
});
const defaultFileTabItems = computed<VfTabItem[]>(() =>
  fileNames.value.map((file) => ({
    value: file,
    label: file
  }))
);
const actionsRendererProps = computed(() => ({
  isRunning: isRunning.value,
  run: runSession
}));
const filesRendererProps = computed(() => ({
  files: fileNames.value,
  activeFile: activeFile.value,
  setActiveFile
}));
const layoutSlotProps = computed(() => ({
  activeTab: activeTab.value,
  showCode: props.showCode,
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
  isClient,
  bindPreviewIframe
}));

let session: ReturnType<typeof createPlaygroundSession> | null = null;
let unsubscribers: Array<() => void> = [];
let themeObserver: MutationObserver | null = null;
let mediaTheme: MediaQueryList | null = null;
let onMediaThemeChange: ((event: MediaQueryListEvent) => void) | null = null;
let sessionIframe: HTMLIFrameElement | null = null;

function readHostThemeIsDark(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const root = document.documentElement;
  const dataTheme = root.getAttribute('data-theme');
  const dataVfTheme = root.getAttribute('data-vf-theme');
  if (dataTheme === 'dark' || dataVfTheme === 'dark') {
    return true;
  }
  if (dataTheme === 'light' || dataVfTheme === 'light') {
    return false;
  }

  const colorScheme = getComputedStyle(root).colorScheme;
  if (colorScheme.includes('dark')) {
    return true;
  }
  if (colorScheme.includes('light')) {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncHostTheme(): void {
  hostIsDark.value = readHostThemeIsDark();
}

function setActiveTab(tab: 'code' | 'preview' | 'console'): void {
  if (tab === 'code' && !props.showCode) {
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
  const nextIframe = el instanceof HTMLIFrameElement ? el : null;
  iframeRef.value = nextIframe;
  if (nextIframe) {
    initSession();
  }
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

  logs.value.push(`[${event.level}] ${serialized.join(' ')}`);
}

function appendError(error: PlaygroundError): void {
  const chunks = [`[error] ${error.message}`];
  if (error.source) {
    chunks.push(`source: ${error.source}`);
  }
  if (error.stack) {
    chunks.push(error.stack);
  }
  logs.value.push(chunks.join('\n'));
  activeTab.value = 'console';
  emit('error', error);
}

function initSession(): void {
  if (!isClient || !iframeRef.value) {
    return;
  }

  if (session && sessionIframe === iframeRef.value) {
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
    framework: props.framework,
    iframe: iframeRef.value,
    files: props.files,
    entry: props.entry
  });

  unsubscribers = [
    session.onRun(() => emit('run')),
    session.onConsole((event) => appendConsole(event)),
    session.onError((error) => appendError(error))
  ];
  sessionIframe = iframeRef.value;
}

async function runSession(options?: { keepActiveTab?: boolean }): Promise<void> {
  if (isRunning.value) {
    return;
  }

  if (!iframeRef.value) {
    activeTab.value = 'preview';
    await nextTick();
    await nextTick();
  }

  initSession();
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
  } finally {
    isRunning.value = false;
  }
}

onMounted(async () => {
  syncHostTheme();
  if (typeof window !== 'undefined') {
    themeObserver = new MutationObserver(() => syncHostTheme());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-vf-theme', 'class', 'style']
    });
    mediaTheme = window.matchMedia('(prefers-color-scheme: dark)');
    onMediaThemeChange = () => syncHostTheme();
    mediaTheme.addEventListener('change', onMediaThemeChange);
  }

  initSession();
});

watch(
  iframeRef,
  async (nextIframe) => {
    if (!nextIframe) {
      return;
    }

    initSession();

    if (props.autorun) {
      await runSession({ keepActiveTab: true });
    }
  },
  { immediate: true }
);

watch(
  () => [props.files, props.entry] as const,
  async ([files, entry]) => {
    activeFile.value = entry;
    if (!session) {
      return;
    }

    session.updateFiles(files, entry);
    if (props.autorun) {
      await runSession({ keepActiveTab: true });
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  for (const unsubscribe of unsubscribers) {
    unsubscribe();
  }

  session?.dispose();
  session = null;
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
  run: runSession
});
</script>

<style>
:root {
  --vf-playground-height: var(--vf-breakpoint-xs);
  --vf-playground-font-family: var(--vf-font-family-base);
  --vf-playground-surface: var(--vf-color-surface);
  --vf-playground-surface-muted: var(--vf-color-surface-muted);
  --vf-playground-border: var(--vf-color-border);
  --vf-playground-text: var(--vf-color-text);
  --vf-playground-text-muted: var(--vf-color-muted);
  --vf-playground-tab-bg: var(--vf-color-surface-muted);
  --vf-playground-tab-text: var(--vf-color-text);
  --vf-playground-tab-border: var(--vf-color-border);
  --vf-playground-tab-active-bg: transparent;
  --vf-playground-tab-active-text: var(--vf-color-primary);
  --vf-playground-tab-active-border: var(--vf-color-primary);
  --vf-playground-run-bg: transparent;
  --vf-playground-run-text: var(--vf-color-muted);
  --vf-playground-run-border: transparent;
  --vf-playground-console-bg: var(--vf-color-surface-muted);
  --vf-playground-console-text: var(--vf-color-text);
  --vf-playground-ssr-hint: var(--vf-color-muted);
  --vf-playground-iframe-bg: var(--vf-color-surface);
  --vf-playground-radius-md: var(--vf-radius-control);
  --vf-playground-radius-lg: var(--vf-radius-overlay);
  --vf-playground-control-height-md: var(--vf-control-height-md);
  --vf-playground-control-font-size-md: var(--vf-control-font-size-md);
  --vf-playground-control-font-weight: var(--vf-text-body-font-weight);
  --vf-playground-control-line-height: var(--vf-text-body-line-height);
  --vf-playground-control-padding-md: var(--vf-field-padding-md);
  --vf-playground-focus-ring-width: var(--vf-focus-ring-width);
  --vf-playground-focus-ring-color: var(--vf-color-focus-ring);
  --vf-playground-toolbar-gap: var(--vf-nav-menu-list-gap);
  --vf-playground-toolbar-padding: var(--vf-surface-padding-compact);
  --vf-playground-console-padding: var(--vf-surface-padding);
  --vf-playground-console-font-size: var(--vf-text-label-font-size);
  --vf-playground-console-line-height: var(--vf-text-body-line-height);
}

.vf-playground {
  display: flex;
  flex-direction: column;
  height: var(--vf-playground-height);
  border: 1px solid var(--vf-playground-border);
  border-radius: var(--vf-playground-radius-lg);
  overflow: hidden;
  background: var(--vf-playground-surface);
  color: var(--vf-playground-text);
  font-family: var(--vf-playground-font-family);
}

.vf-playground__tabs {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
  background: var(--vf-playground-surface);
}

.vf-playground__tabs-default {
  width: 100%;
}

.vf-playground__tabs-default :deep(.vf-tabs),
.vf-playground__tabs-default :deep(.vf-tabs__list) {
  width: 100%;
}

.vf-playground__tabs-default--files :deep(.vf-tabs__list) {
  justify-content: flex-start;
}

.vf-playground__panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.vf-playground__panel--code {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.vf-playground__codeblock-host {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  overflow: hidden;
}

.vf-playground__codeblock-host > * {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.vf-playground__codeblock-host .vf-codeblock {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  margin: 0;
  border: 0;
  border-radius: 0;

  --vf-codeblock-margin-block: 0;
  --vf-codeblock-margin-block-start: 0;
  --vf-codeblock-margin-block-end: 0;
  --vf-codeblock-border-radius: 0;
  --vf-codeblock-border-color: transparent;
  --vf-codeblock-background-color: var(--vf-playground-surface);
  --vf-codeblock-text-color: var(--vf-playground-text);
  --vf-codeblock-header-background-color: var(--vf-playground-surface);
  --vf-codeblock-meta-color: var(--vf-playground-text-muted);
  --vf-codeblock-filename-color: var(--vf-playground-text);
  --vf-codeblock-action-border-color: var(--vf-playground-tab-border);
  --vf-codeblock-action-background-color: var(--vf-playground-tab-bg);
  --vf-codeblock-action-text-color: var(--vf-playground-tab-text);
  --vf-codeblock-line-number-color: var(--vf-playground-text-muted);
  --vf-codeblock-max-height: 100%;
}

.vf-playground__codeblock-host .vf-codeblock__code-shell {
  min-height: 0;
}

.vf-playground__codeblock-host .vf-codeblock__pre {
  height: 100%;
  max-height: 100%;
  overflow: auto;
}

.vf-playground__codeblock-host .vf-codeblock__actions {
  display: none;
}

.vf-playground__codeblock-host .vf-codeblock__header {
  min-height: var(--vf-playground-control-height-md);
  box-sizing: border-box;
}

.vf-playground__files {
  display: flex;
  gap: 0;
  padding: 0;
  border-bottom: 0;
}

.vf-playground__iframe {
  border: 0;
  width: 100%;
  height: 100%;
  background: var(--vf-playground-iframe-bg);
}

.vf-playground__console {
  margin: 0;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: var(--vf-playground-console-padding);
  font-size: var(--vf-playground-console-font-size);
  line-height: var(--vf-playground-console-line-height);
  background: var(--vf-playground-console-bg);
  color: var(--vf-playground-console-text);
  white-space: pre-wrap;
}

.vf-playground__ssr-hint {
  margin: 0;
  padding: var(--vf-playground-console-padding);
  color: var(--vf-playground-ssr-hint);
}

@media (width <= 768px) {
  .vf-playground__tabs {
    flex-wrap: wrap;
  }

  .vf-playground__run {
    margin-left: 0;
  }
}
</style>
