<template>
  <div class="vf-playground" :class="containerClassName" :style="containerStyle" :data-theme="theme">
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

      <div v-if="activeTab === 'code' && isCodeVisible" class="vf-playground__panel vf-playground__panel--code">
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
        <iframe
          v-if="isSandboxMode"
          :ref="bindPreviewIframe"
          class="vf-playground__iframe"
          title="Codemonster Playground Preview"
        />
        <div v-else class="vf-playground__component-preview" :style="componentPreviewStyle">
          <component :is="componentToRender" v-if="componentToRender" />
        </div>
        <p v-if="isSandboxMode && !isClient" class="vf-playground__ssr-hint">Preview is available on client side only.</p>
      </div>

      <div v-if="isSandboxMode && activeTab === 'console'" class="vf-playground__panel">
        <pre class="vf-playground__console">{{ consoleOutput || 'No logs yet.' }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { VfTabs, type VfTabItem } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import type {
  ConsoleEvent,
  PlaygroundError,
  createPlaygroundSession as createPlaygroundSessionFactory
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
  componentMinHeight: undefined
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

const isClient = typeof window !== 'undefined';
const iframeRef = ref<HTMLIFrameElement | null>(null);
const isSandboxMode = computed(() => props.mode !== 'component');
const sandboxProps = computed(() => (isSandboxMode.value ? (props as VfPlaygroundSandboxProps) : null));
const componentProps = computed(() => (isSandboxMode.value ? null : (props as VfPlaygroundComponentProps)));
const isCodeVisible = computed(() =>
  isSandboxMode.value
    ? sandboxProps.value?.showCode ?? true
    : Boolean(componentProps.value?.componentSource) ||
      Boolean(componentProps.value?.componentFiles && Object.keys(componentProps.value.componentFiles).length > 0)
);
const theme = computed(() => props.theme ?? 'inherit');
const hasInitialTab = props.initialTab !== undefined;
const activeTab = ref<PlaygroundTab>(resolveInitialTab());
const activeFile = ref(isSandboxMode.value ? sandboxProps.value?.entry ?? '' : '');
const logs = ref<string[]>([]);
const isRunning = ref(false);
const hostIsDark = ref(false);

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
const codeLanguage = computed(() => {
  if (!isSandboxMode.value) {
    const ext = activeFile.value.split('.').pop() ?? '';
    if (ext) {
      return ext === 'ts' ? 'typescript' : ext === 'js' ? 'javascript' : ext;
    }
    return componentProps.value?.componentSourceLanguage ?? 'vue';
  }
  const ext = activeFile.value.split('.').pop() ?? 'txt';
  return ext === 'ts' ? 'typescript' : ext === 'js' ? 'javascript' : ext;
});
const resolvedCodeTheme = computed(() => {
  if (theme.value === 'inherit') {
    return hostIsDark.value ? 'dark' : 'light';
  }
  return theme.value;
});
const containerStyle = computed(() => ({
  ...(props.minHeight != null
    ? { minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight }
    : {}),
  ...(props.height != null
    ? { height: typeof props.height === 'number' ? `${props.height}px` : props.height }
    : {})
}));
const isAutoHeightMode = computed(
  () =>
    props.heightMode === 'auto' || (props.heightMode === 'auto-preview' && activeTab.value === 'preview')
);
const containerClassName = computed(() => ({
  'vf-playground--auto-height': isAutoHeightMode.value
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
    : {})
}));
const tabsRendererProps = computed(() => ({
  activeTab: activeTab.value,
  showCode: isCodeVisible.value,
  setActiveTab
}));
const defaultTabItems = computed<VfTabItem[]>(() => {
  if (!isSandboxMode.value) {
    const tabs: VfTabItem[] = [{ value: 'preview', label: 'Preview' }];
    if (isCodeVisible.value) {
      return [{ value: 'code', label: 'Code' }, ...tabs];
    }
    return tabs;
  }

  const tabs: VfTabItem[] = [
    { value: 'preview', label: 'Preview' },
    { value: 'console', label: 'Console' }
  ];
  if (isCodeVisible.value) {
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
  isClient,
  bindPreviewIframe
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
const SANDBOX_THEME_STYLE_ID = 'vf-playground-theme-sync';

function loadCreatePlaygroundSession(): Promise<CreatePlaygroundSession> {
  loadCreatePlaygroundSessionPromise ??= import('@codemonster-ru/vueforge-playground-core').then(
    (runtime) => runtime.createPlaygroundSession
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

  const root = document.documentElement;
  const dataTheme = root.getAttribute('data-theme');
  const dataVfTheme = root.getAttribute('data-vf-theme');
  const classList = root.classList;
  if (dataTheme === 'dark' || dataVfTheme === 'dark') {
    return true;
  }
  if (dataTheme === 'light' || dataVfTheme === 'light') {
    return false;
  }
  if (classList.contains('dark') || classList.contains('vf-theme-dark')) {
    return true;
  }
  if (classList.contains('light') || classList.contains('vf-theme-light')) {
    return false;
  }

  const colorScheme = getComputedStyle(root).colorScheme;
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

function getResolvedPreviewTheme(): 'light' | 'dark' {
  if (theme.value === 'inherit') {
    return hostIsDark.value ? 'dark' : 'light';
  }
  return theme.value;
}

function syncSandboxThemeToIframe(): void {
  if (!isSandboxMode.value || !iframeRef.value) {
    return;
  }

  const iframeDocument = iframeRef.value.contentDocument;
  if (!iframeDocument) {
    return;
  }
  const iframeRoot = iframeDocument.documentElement;
  const resolvedTheme = getResolvedPreviewTheme();
  iframeRoot.setAttribute('data-theme', resolvedTheme);
  iframeRoot.setAttribute('data-vf-theme', resolvedTheme);
  iframeRoot.classList.toggle('dark', resolvedTheme === 'dark');
  iframeRoot.classList.toggle('light', resolvedTheme === 'light');
  iframeRoot.classList.toggle('vf-theme-dark', resolvedTheme === 'dark');
  iframeRoot.classList.toggle('vf-theme-light', resolvedTheme === 'light');
  iframeRoot.style.colorScheme = resolvedTheme;

  const hostStyles = getComputedStyle(document.documentElement);
  for (let index = 0; index < hostStyles.length; index += 1) {
    const propertyName = hostStyles.item(index);
    if (!propertyName.startsWith('--vf-')) {
      continue;
    }
    iframeRoot.style.setProperty(propertyName, hostStyles.getPropertyValue(propertyName));
  }

  if (iframeDocument.body) {
    iframeDocument.body.style.backgroundColor = 'var(--vf-color-bg, Canvas)';
    iframeDocument.body.style.color = 'var(--vf-color-text, CanvasText)';
  }

  let themeStyle = iframeDocument.getElementById(SANDBOX_THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!themeStyle) {
    themeStyle = iframeDocument.createElement('style');
    themeStyle.id = SANDBOX_THEME_STYLE_ID;
    iframeDocument.head.append(themeStyle);
  }
  themeStyle.textContent = `
    :root { color-scheme: ${resolvedTheme}; }
    html, body {
      background: var(--vf-color-bg, Canvas);
      color: var(--vf-color-text, CanvasText);
    }
  `;
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

function initSession(forceRecreate = false): Promise<void> {
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
  if (!isSandboxMode.value || !isClient || !iframeRef.value) {
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
    bootstrapScript: sandboxProps.value?.bootstrapScript
  });

  unsubscribers = [
    session.onRun(() => emit('run')),
    session.onConsole((event) => appendConsole(event)),
    session.onError((error) => appendError(error))
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
  { immediate: true }
);

watch(
  [isSandboxMode, iframeRef, theme, hostIsDark],
  () => {
    syncSandboxThemeToIframe();
  },
  { immediate: true }
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
  { deep: true }
);

watch(
  () =>
    isSandboxMode.value
      ? ([sandboxProps.value?.framework, sandboxProps.value?.resolveImport, sandboxProps.value?.bootstrapScript] as const)
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
  }
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
  { immediate: true }
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
  { immediate: true, deep: true }
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
  run: runSession
});
</script>

<style src="./playground.css"></style>
