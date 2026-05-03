<template>
  <div class="cm-playground" :style="containerStyle" :data-theme="theme">
    <slot name="layout" v-bind="layoutSlotProps">
      <div class="cm-tabs">
        <component :is="tabsRenderer" v-if="tabsRenderer" v-bind="tabsRendererProps" />
        <template v-else>
          <button
            v-if="showCode"
            class="cm-tab"
            :class="{ active: activeTab === 'code' }"
            type="button"
            @click="setActiveTab('code')"
          >
            Code
          </button>
          <button class="cm-tab" :class="{ active: activeTab === 'preview' }" type="button" @click="setActiveTab('preview')">
            Preview
          </button>
          <button class="cm-tab" :class="{ active: activeTab === 'console' }" type="button" @click="setActiveTab('console')">
            Console
          </button>
        </template>
        <component :is="actionsRenderer" v-if="actionsRenderer" v-bind="actionsRendererProps" />
        <button v-else class="cm-run" type="button" :disabled="isRunning" @click="runSession">
          {{ isRunning ? 'Running...' : 'Run' }}
        </button>
      </div>

      <div v-if="activeTab === 'code' && showCode" class="cm-panel cm-panel-code">
        <component :is="filesRenderer" v-if="filesRenderer && fileNames.length > 1" v-bind="filesRendererProps" />
        <div v-else-if="fileNames.length > 1" class="cm-files">
          <button v-for="file in fileNames" :key="file" class="cm-file" :class="{ active: file === activeFile }" type="button" @click="setActiveFile(file)">
            {{ file }}
          </button>
        </div>
        <div class="cm-codeblock-host">
          <CodeBlock
            :code="activeFileContent"
            :language="codeLanguage"
            :show-line-numbers="true"
            :theme="resolvedCodeTheme"
          />
        </div>
      </div>

      <div v-show="activeTab === 'preview'" class="cm-panel preview">
        <iframe :ref="bindPreviewIframe" class="cm-iframe" title="Codemonster Playground Preview" />
        <p v-if="!isClient" class="cm-ssr-hint">Preview is available on client side only.</p>
      </div>

      <div v-if="activeTab === 'console'" class="cm-panel">
        <pre class="cm-console">{{ consoleOutput || 'No logs yet.' }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { CodeBlock } from '@codemonster-ru/vueforge-codeblock';
import { createPlaygroundSession, type ConsoleEvent, type PlaygroundError } from '@codemonster-ru/vueforge-playground-core';

import type { VuePlaygroundProps } from './props';

const props = withDefaults(defineProps<VuePlaygroundProps>(), {
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

async function runSession(): Promise<void> {
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
  activeTab.value = 'preview';
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
      await runSession();
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
      await runSession();
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
  --cm-pg-height: 420px;
  --cm-pg-default-light-font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
  --cm-pg-default-light-surface: #fff;
  --cm-pg-default-light-surface-muted: #f3f3f3;
  --cm-pg-default-light-border: #d9dde3;
  --cm-pg-default-light-text: #1f232b;
  --cm-pg-default-light-text-muted: #616773;
  --cm-pg-default-light-tab-bg: #f3f3f3;
  --cm-pg-default-light-tab-text: #1f232b;
  --cm-pg-default-light-tab-border: #d9dde3;
  --cm-pg-default-light-tab-active-bg: #0e639c;
  --cm-pg-default-light-tab-active-text: #fff;
  --cm-pg-default-light-run-bg: #0e639c;
  --cm-pg-default-light-run-text: #fff;
  --cm-pg-default-light-run-border: #0e639c;
  --cm-pg-default-light-console-bg: #f3f3f3;
  --cm-pg-default-light-console-text: #1f232b;
  --cm-pg-default-light-ssr-hint: #616773;
  --cm-pg-default-light-iframe-bg: #fff;
  --cm-pg-default-light-radius-md: 10px;
  --cm-pg-default-light-radius-lg: 14px;
  --cm-pg-default-dark-font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
  --cm-pg-default-dark-surface: #252526;
  --cm-pg-default-dark-surface-muted: #2d2f33;
  --cm-pg-default-dark-border: #3f434a;
  --cm-pg-default-dark-text: #f2f3f5;
  --cm-pg-default-dark-text-muted: #b0b6c0;
  --cm-pg-default-dark-tab-bg: #2d2f33;
  --cm-pg-default-dark-tab-text: #f2f3f5;
  --cm-pg-default-dark-tab-border: #3f434a;
  --cm-pg-default-dark-tab-active-bg: #0e639c;
  --cm-pg-default-dark-tab-active-text: #fff;
  --cm-pg-default-dark-run-bg: #0e639c;
  --cm-pg-default-dark-run-text: #fff;
  --cm-pg-default-dark-run-border: #0e639c;
  --cm-pg-default-dark-console-bg: #1f2023;
  --cm-pg-default-dark-console-text: #fff;
  --cm-pg-default-dark-ssr-hint: #b0b6c0;
  --cm-pg-default-dark-iframe-bg: #252526;
  --cm-pg-default-dark-radius-md: 10px;
  --cm-pg-default-dark-radius-lg: 14px;
  --cm-pg-light-font-family: var(--vf-font-family-base, var(--cm-pg-default-light-font-family));
  --cm-pg-light-surface: var(--vf-color-surface, var(--cm-pg-default-light-surface));
  --cm-pg-light-surface-muted: var(--vf-color-surface-muted, var(--cm-pg-default-light-surface-muted));
  --cm-pg-light-border: var(--vf-color-border, var(--cm-pg-default-light-border));
  --cm-pg-light-text: var(--vf-color-text, var(--cm-pg-default-light-text));
  --cm-pg-light-text-muted: var(--vf-color-muted, var(--cm-pg-default-light-text-muted));
  --cm-pg-light-tab-bg: var(--vf-color-surface-muted, var(--cm-pg-default-light-tab-bg));
  --cm-pg-light-tab-text: var(--vf-color-text, var(--cm-pg-default-light-tab-text));
  --cm-pg-light-tab-border: var(--vf-color-border, var(--cm-pg-default-light-tab-border));
  --cm-pg-light-tab-active-bg: var(--vf-color-primary, var(--cm-pg-default-light-tab-active-bg));
  --cm-pg-light-tab-active-text: var(--vf-color-primary-contrast, var(--cm-pg-default-light-tab-active-text));
  --cm-pg-light-run-bg: var(--vf-color-primary, var(--cm-pg-default-light-run-bg));
  --cm-pg-light-run-text: var(--vf-color-primary-contrast, var(--cm-pg-default-light-run-text));
  --cm-pg-light-run-border: var(--vf-color-primary, var(--cm-pg-default-light-run-border));
  --cm-pg-light-console-bg: var(--vf-color-surface-muted, var(--cm-pg-default-light-console-bg));
  --cm-pg-light-console-text: var(--vf-color-text, var(--cm-pg-default-light-console-text));
  --cm-pg-light-ssr-hint: var(--vf-color-muted, var(--cm-pg-default-light-ssr-hint));
  --cm-pg-light-iframe-bg: var(--vf-color-surface, var(--cm-pg-default-light-iframe-bg));
  --cm-pg-light-radius-md: var(--vf-radius-control, var(--cm-pg-default-light-radius-md));
  --cm-pg-light-radius-lg: var(--vf-radius-overlay, var(--cm-pg-default-light-radius-lg));
  --cm-pg-dark-font-family: var(--vf-font-family-base, var(--cm-pg-default-dark-font-family));
  --cm-pg-dark-surface: var(--vf-color-surface, var(--cm-pg-default-dark-surface));
  --cm-pg-dark-surface-muted: var(--vf-color-surface-muted, var(--cm-pg-default-dark-surface-muted));
  --cm-pg-dark-border: var(--vf-color-border, var(--cm-pg-default-dark-border));
  --cm-pg-dark-text: var(--vf-color-text, var(--cm-pg-default-dark-text));
  --cm-pg-dark-text-muted: var(--vf-color-muted, var(--cm-pg-default-dark-text-muted));
  --cm-pg-dark-tab-bg: var(--vf-color-surface-muted, var(--cm-pg-default-dark-tab-bg));
  --cm-pg-dark-tab-text: var(--vf-color-text, var(--cm-pg-default-dark-tab-text));
  --cm-pg-dark-tab-border: var(--vf-color-border, var(--cm-pg-default-dark-tab-border));
  --cm-pg-dark-tab-active-bg: var(--vf-color-primary, var(--cm-pg-default-dark-tab-active-bg));
  --cm-pg-dark-tab-active-text: var(--vf-color-primary-contrast, var(--cm-pg-default-dark-tab-active-text));
  --cm-pg-dark-run-bg: var(--vf-color-primary, var(--cm-pg-default-dark-run-bg));
  --cm-pg-dark-run-text: var(--vf-color-primary-contrast, var(--cm-pg-default-dark-run-text));
  --cm-pg-dark-run-border: var(--vf-color-primary, var(--cm-pg-default-dark-run-border));
  --cm-pg-dark-console-bg: var(--vf-color-surface-muted, var(--cm-pg-default-dark-console-bg));
  --cm-pg-dark-console-text: var(--vf-color-text, var(--cm-pg-default-dark-console-text));
  --cm-pg-dark-ssr-hint: var(--vf-color-muted, var(--cm-pg-default-dark-ssr-hint));
  --cm-pg-dark-iframe-bg: var(--vf-color-surface, var(--cm-pg-default-dark-iframe-bg));
  --cm-pg-dark-radius-md: var(--vf-radius-control, var(--cm-pg-default-dark-radius-md));
  --cm-pg-dark-radius-lg: var(--vf-radius-overlay, var(--cm-pg-default-dark-radius-lg));
  --cm-pg-control-height-md: var(--vf-control-height-md, 2.25rem);
  --cm-pg-control-font-size-md: var(--vf-control-font-size-md, 1rem);
  --cm-pg-control-font-weight: var(--vf-text-body-font-weight, 400);
  --cm-pg-control-line-height: var(--vf-text-body-line-height, 1.5);
  --cm-pg-control-padding-md: var(--vf-field-padding-md, 0.375rem 0.75rem);
  --cm-pg-focus-ring-width: var(--vf-focus-ring-width, 3px);
  --cm-pg-focus-ring-color: var(--vf-color-focus-ring, rgb(14 99 156 / 30%));
}

.cm-playground {
  --cm-pg-font-family: var(--cm-pg-light-font-family);
  --cm-pg-surface: var(--cm-pg-light-surface);
  --cm-pg-surface-muted: var(--cm-pg-light-surface-muted);
  --cm-pg-border: var(--cm-pg-light-border);
  --cm-pg-text: var(--cm-pg-light-text);
  --cm-pg-text-muted: var(--cm-pg-light-text-muted);
  --cm-pg-tab-bg: var(--cm-pg-light-tab-bg);
  --cm-pg-tab-text: var(--cm-pg-light-tab-text);
  --cm-pg-tab-border: var(--cm-pg-light-tab-border);
  --cm-pg-tab-active-bg: var(--cm-pg-light-tab-active-bg);
  --cm-pg-tab-active-text: var(--cm-pg-light-tab-active-text);
  --cm-pg-run-bg: var(--cm-pg-light-run-bg);
  --cm-pg-run-text: var(--cm-pg-light-run-text);
  --cm-pg-run-border: var(--cm-pg-light-run-border);
  --cm-pg-console-bg: var(--cm-pg-light-console-bg);
  --cm-pg-console-text: var(--cm-pg-light-console-text);
  --cm-pg-ssr-hint: var(--cm-pg-light-ssr-hint);
  --cm-pg-iframe-bg: var(--cm-pg-light-iframe-bg);
  --cm-pg-radius-md: var(--cm-pg-light-radius-md);
  --cm-pg-radius-lg: var(--cm-pg-light-radius-lg);

  display: flex;
  flex-direction: column;
  height: var(--cm-pg-height);
  border: 1px solid var(--cm-pg-border);
  border-radius: var(--cm-pg-radius-lg);
  overflow: hidden;
  background: var(--cm-pg-surface);
  color: var(--cm-pg-text);
  font-family: var(--cm-pg-font-family);
}

.cm-playground[data-theme='dark'] {
  --cm-pg-font-family: var(--cm-pg-dark-font-family);
  --cm-pg-surface: var(--cm-pg-dark-surface);
  --cm-pg-surface-muted: var(--cm-pg-dark-surface-muted);
  --cm-pg-border: var(--cm-pg-dark-border);
  --cm-pg-text: var(--cm-pg-dark-text);
  --cm-pg-text-muted: var(--cm-pg-dark-text-muted);
  --cm-pg-tab-bg: var(--cm-pg-dark-tab-bg);
  --cm-pg-tab-text: var(--cm-pg-dark-tab-text);
  --cm-pg-tab-border: var(--cm-pg-dark-tab-border);
  --cm-pg-tab-active-bg: var(--cm-pg-dark-tab-active-bg);
  --cm-pg-tab-active-text: var(--cm-pg-dark-tab-active-text);
  --cm-pg-run-bg: var(--cm-pg-dark-run-bg);
  --cm-pg-run-text: var(--cm-pg-dark-run-text);
  --cm-pg-run-border: var(--cm-pg-dark-run-border);
  --cm-pg-console-bg: var(--cm-pg-dark-console-bg);
  --cm-pg-console-text: var(--cm-pg-dark-console-text);
  --cm-pg-ssr-hint: var(--cm-pg-dark-ssr-hint);
  --cm-pg-iframe-bg: var(--cm-pg-dark-iframe-bg);
  --cm-pg-radius-md: var(--cm-pg-dark-radius-md);
  --cm-pg-radius-lg: var(--cm-pg-dark-radius-lg);
}

:root[data-theme='dark'] .cm-playground[data-theme='inherit'] {
  --cm-pg-font-family: var(--cm-pg-dark-font-family);
  --cm-pg-surface: var(--cm-pg-dark-surface);
  --cm-pg-surface-muted: var(--cm-pg-dark-surface-muted);
  --cm-pg-border: var(--cm-pg-dark-border);
  --cm-pg-text: var(--cm-pg-dark-text);
  --cm-pg-text-muted: var(--cm-pg-dark-text-muted);
  --cm-pg-tab-bg: var(--cm-pg-dark-tab-bg);
  --cm-pg-tab-text: var(--cm-pg-dark-tab-text);
  --cm-pg-tab-border: var(--cm-pg-dark-tab-border);
  --cm-pg-tab-active-bg: var(--cm-pg-dark-tab-active-bg);
  --cm-pg-tab-active-text: var(--cm-pg-dark-tab-active-text);
  --cm-pg-run-bg: var(--cm-pg-dark-run-bg);
  --cm-pg-run-text: var(--cm-pg-dark-run-text);
  --cm-pg-run-border: var(--cm-pg-dark-run-border);
  --cm-pg-console-bg: var(--cm-pg-dark-console-bg);
  --cm-pg-console-text: var(--cm-pg-dark-console-text);
  --cm-pg-ssr-hint: var(--cm-pg-dark-ssr-hint);
  --cm-pg-iframe-bg: var(--cm-pg-dark-iframe-bg);
  --cm-pg-radius-md: var(--cm-pg-dark-radius-md);
  --cm-pg-radius-lg: var(--cm-pg-dark-radius-lg);
}

:root[data-vf-theme='dark'] .cm-playground[data-theme='inherit'] {
  --cm-pg-font-family: var(--cm-pg-dark-font-family);
  --cm-pg-surface: var(--cm-pg-dark-surface);
  --cm-pg-surface-muted: var(--cm-pg-dark-surface-muted);
  --cm-pg-border: var(--cm-pg-dark-border);
  --cm-pg-text: var(--cm-pg-dark-text);
  --cm-pg-text-muted: var(--cm-pg-dark-text-muted);
  --cm-pg-tab-bg: var(--cm-pg-dark-tab-bg);
  --cm-pg-tab-text: var(--cm-pg-dark-tab-text);
  --cm-pg-tab-border: var(--cm-pg-dark-tab-border);
  --cm-pg-tab-active-bg: var(--cm-pg-dark-tab-active-bg);
  --cm-pg-tab-active-text: var(--cm-pg-dark-tab-active-text);
  --cm-pg-run-bg: var(--cm-pg-dark-run-bg);
  --cm-pg-run-text: var(--cm-pg-dark-run-text);
  --cm-pg-run-border: var(--cm-pg-dark-run-border);
  --cm-pg-console-bg: var(--cm-pg-dark-console-bg);
  --cm-pg-console-text: var(--cm-pg-dark-console-text);
  --cm-pg-ssr-hint: var(--cm-pg-dark-ssr-hint);
  --cm-pg-iframe-bg: var(--cm-pg-dark-iframe-bg);
  --cm-pg-radius-md: var(--cm-pg-dark-radius-md);
  --cm-pg-radius-lg: var(--cm-pg-dark-radius-lg);
}

.cm-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--cm-pg-border);
  background: var(--cm-pg-surface-muted);
}

.cm-tab,
.cm-run,
.cm-file {
  border: 1px solid var(--cm-pg-tab-border);
  background: var(--cm-pg-tab-bg);
  color: var(--cm-pg-tab-text);
  border-radius: var(--cm-pg-radius-md);
  min-height: var(--cm-pg-control-height-md);
  padding: var(--cm-pg-control-padding-md);
  font-size: var(--cm-pg-control-font-size-md);
  font-weight: var(--cm-pg-control-font-weight);
  line-height: var(--cm-pg-control-line-height);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.cm-tab:hover,
.cm-file:hover {
  border-color: var(--cm-pg-border);
  filter: brightness(0.98);
}

.cm-tab:focus-visible,
.cm-file:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--cm-pg-focus-ring-width) var(--cm-pg-focus-ring-color);
}

.cm-tab.active,
.cm-file.active {
  background: var(--cm-pg-tab-active-bg);
  color: var(--cm-pg-tab-active-text);
}

.cm-run {
  margin-left: auto;
  background: var(--cm-pg-run-bg);
  color: var(--cm-pg-run-text);
  border-color: var(--cm-pg-run-border);
}

.cm-run:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--cm-pg-focus-ring-width) var(--cm-pg-focus-ring-color);
}

.cm-run:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.cm-run:hover:not(:disabled) {
  filter: brightness(1.06);
}

.cm-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.cm-panel-code {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.cm-codeblock-host {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  overflow: hidden;
}

.cm-codeblock-host > * {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.cm-codeblock-host .vcb {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  border: 0;
  border-radius: 0;

  --vcb-margin-block: 0;
  --vcb-margin-block-start: 0;
  --vcb-margin-block-end: 0;
  --vcb-border-radius: 0;
  --vcb-border-color: transparent;
  --vcb-background-color: var(--cm-pg-surface);
  --vcb-text-color: var(--cm-pg-text);
  --vcb-header-background-color: var(--cm-pg-surface);
  --vcb-meta-color: var(--cm-pg-text-muted);
  --vcb-filename-color: var(--cm-pg-text);
  --vcb-action-border-color: var(--cm-pg-tab-border);
  --vcb-action-background-color: var(--cm-pg-tab-bg);
  --vcb-action-text-color: var(--cm-pg-tab-text);
  --vcb-line-number-color: var(--cm-pg-text-muted);
  --vcb-max-height: 100%;
}

.cm-files {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--cm-pg-border);
}

.cm-iframe {
  border: 0;
  width: 100%;
  height: 100%;
  background: var(--cm-pg-iframe-bg);
}

.cm-console {
  margin: 0;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  background: var(--cm-pg-console-bg);
  color: var(--cm-pg-console-text);
  white-space: pre-wrap;
}

.cm-ssr-hint {
  margin: 0;
  padding: 12px;
  color: var(--cm-pg-ssr-hint);
}

@media (width <= 768px) {
  .cm-tabs {
    flex-wrap: wrap;
  }

  .cm-run {
    margin-left: 0;
  }
}
</style>
