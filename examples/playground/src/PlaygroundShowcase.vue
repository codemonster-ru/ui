<template>
  <main class="demo-page">
      <div class="demo-container">
        <VfStack>
        <section class="demo-block">
          <div class="demo-example">
            <p class="demo-label">Three cooperating packages</p>
            <h1 class="demo-heading">Interactive code and component previews</h1>
            <p class="demo-text">
              <code>@codemonster-ru/vueforge-playground</code> provides the Vue UI,
              <code>@codemonster-ru/vueforge-playground-core</code> runs browser sessions, and
              <code>@codemonster-ru/vueforge-playground-vite-plugin</code> builds repository demos as virtual modules.
            </p>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Skeleton Preview Control</h2>
            <button class="demo-replay-button" type="button" @click="replayPlaygroundSkeleton">Replay skeleton</button>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>VfPlayground · single-file HTML</h2>
            <p class="demo-text">Use this mode for a self-contained browser example with no build step.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <div
              class="playground-loading-gate"
              :style="{
                minHeight: playgroundGateMinHeight('single-file'),
                borderRadius: 'var(--cm-radius-surface)',
              }"
              :aria-busy="!playgroundReady || undefined"
            >
              <div
                :ref="(element) => setPlaygroundContentRef('single-file', element)"
                class="playground-loading-gate__content playground-loading-gate__content--normalize-spacing"
                :class="{ 'playground-loading-gate__content--ready': playgroundReady }"
                :data-showcase-loading-content="playgroundReady ? 'ready' : 'busy'"
                :aria-hidden="!playgroundReady || undefined"
                :inert="!playgroundReady ? true : undefined"
              >
                <VfPlaygroundAsync
                  :files="singleFileExample"
                  entry="/index.html"
                  framework="html"
                  :autorun="true"
                  :show-code="true"
                  theme="inherit"
                  @ready="onPlaygroundReady"
                  @preview-ready="onPlaygroundReady"
                  @run="onRun"
                  @error="onError"
                />
              </div>
              <div
                v-show="!playgroundReady"
                class="playground-loading-gate__overlay"
                style="border-radius: var(--cm-radius-surface)"
                aria-hidden="true"
              >
                <VfSkeleton :min-height="260" style="border-radius: var(--cm-radius-surface)" />
              </div>
            </div>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>VfPlayground · multi-file runtime</h2>
            <p class="demo-text">Use this mode when JavaScript imports related source and stylesheet files.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <div
              class="playground-loading-gate"
              :style="{
                minHeight: playgroundGateMinHeight('multi-file'),
                borderRadius: 'var(--cm-radius-surface)',
              }"
              :aria-busy="!playgroundReady || undefined"
            >
              <div
                :ref="(element) => setPlaygroundContentRef('multi-file', element)"
                class="playground-loading-gate__content playground-loading-gate__content--normalize-spacing"
                :class="{ 'playground-loading-gate__content--ready': playgroundReady }"
                :data-showcase-loading-content="playgroundReady ? 'ready' : 'busy'"
                :aria-hidden="!playgroundReady || undefined"
                :inert="!playgroundReady ? true : undefined"
              >
                <VfPlaygroundAsync
                  :files="multiFileExample"
                  entry="/main.js"
                  framework="vanilla"
                  :autorun="true"
                  :show-code="true"
                  theme="inherit"
                  @ready="onPlaygroundReady"
                  @preview-ready="onPlaygroundReady"
                  @run="onRun"
                  @error="onError"
                />
              </div>
              <div
                v-show="!playgroundReady"
                class="playground-loading-gate__overlay"
                style="border-radius: var(--cm-radius-surface)"
                aria-hidden="true"
              >
                <VfSkeleton :min-height="260" style="border-radius: var(--cm-radius-surface)" />
              </div>
            </div>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>VfPlayground · Vue component mode</h2>
            <p class="demo-text">Render a trusted Vue component directly when iframe isolation is unnecessary.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <div
              class="playground-loading-gate"
              :style="{
                minHeight: playgroundGateMinHeight('component'),
                borderRadius: 'var(--cm-radius-surface)',
              }"
              :aria-busy="!playgroundReady || undefined"
            >
              <div
                :ref="(element) => setPlaygroundContentRef('component', element)"
                class="playground-loading-gate__content playground-loading-gate__content--normalize-spacing"
                :class="{ 'playground-loading-gate__content--ready': playgroundReady }"
                :data-showcase-loading-content="playgroundReady ? 'ready' : 'busy'"
                :aria-hidden="!playgroundReady || undefined"
                :inert="!playgroundReady ? true : undefined"
              >
                <VfPlaygroundAsync
                  mode="component"
                  :component="componentModeDemo"
                  :component-files="componentModeFiles"
                  component-entry="DemoCard.vue"
                  theme="inherit"
                  :component-padding="24"
                  component-min-height="220px"
                  @ready="onPlaygroundReady"
                  @preview-ready="onPlaygroundReady"
                />
              </div>
              <div
                v-show="!playgroundReady"
                class="playground-loading-gate__overlay"
                style="border-radius: var(--cm-radius-surface)"
                aria-hidden="true"
              >
                <VfSkeleton :min-height="260" style="border-radius: var(--cm-radius-surface)" />
              </div>
            </div>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vite plugin · Vue runtime module</h2>
            <p class="demo-text">A production-built virtual module resolved by the Playground Vite plugin.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <ViteLikeDemoPreview demo-id="vue-runtime-smoke" :source="vueRuntimeSmokeSource" />
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vite plugin · custom resolver</h2>
            <p class="demo-text">A virtual-module example that verifies custom component resolution.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <ViteLikeDemoPreview demo-id="custom-resolver-smoke" :source="customResolverSmokeSource" />
          </VfSection>
        </section>
        </VfStack>
      </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue';
import { CmSection as VfSection, CmSkeleton as VfSkeleton, CmStack as VfStack } from '@codemonster-ru/ui-vue';
import { VfPlaygroundAsync } from '@codemonster-ru/vueforge-playground/ui';
import ViteLikeDemoPreview from './components/ViteLikeDemoPreview.vue';
import vueRuntimeSmokeSource from './vitepress-demos/vue-runtime-smoke.ts?raw';
import customResolverSmokeSource from './vitepress-demos/custom-resolver-smoke.ts?raw';

const componentModeDemo = defineComponent({
  name: 'ComponentModeDemo',
  setup() {
    return () =>
      h('div', { style: 'display:grid;gap:12px;' }, [
        h('h3', { style: 'margin:0;' }, 'Vue Component Preview'),
        h(
          'p',
          { style: 'margin:0;color:var(--vf-color-text-muted);' },
          'This preview is rendered directly as a Vue component without iframe sandbox.'
        ),
        h('button', { class: 'vf-button vf-button--secondary', type: 'button' }, 'Action')
      ]);
  }
});

const componentModeFiles = {
  'Demo.vue': `<template>
  <DemoCard />
</template>

<script setup lang="ts">
import DemoCard from './DemoCard.vue';
</${'script'}>`,
  'DemoCard.vue': `<template>
  <div class="component-mode-demo">
    <h3>Vue Component Preview</h3>
    <p>This preview is rendered directly as a Vue component without iframe sandbox.</p>
    <button class="vf-button vf-button--secondary" type="button">Action</button>
  </div>
</template>`
};

const singleFileExample = {
  '/index.html': `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="color-scheme" content="light dark" />
    <style>
      body {
        margin: 0;
        font-size: 1rem;
        font-family: system-ui, sans-serif;
        padding: 20px;
        background: Canvas;
        color: CanvasText;
      }
      .badge { color: LinkText; font-weight: bold; }
      @media (prefers-color-scheme: dark) {
        body {
          color-scheme: dark;
        }
      }
    </style>
  </head>
  <body>
    <h2>Playground Preview</h2>
    <p class="badge">It works.</p>
    <script>
      console.log('hello from preview');
      const root = document.createElement('div');
      root.textContent = 'Runtime is alive';
      document.body.appendChild(root);
    </${'script'}>
  </body>
</html>`
};

const multiFileExample = {
  '/main.js': `import './styles.css';

const title = document.createElement('h2');
title.textContent = 'Multi-file Playground';

const line = document.createElement('p');
line.textContent = 'JS + CSS files are wired together.';
line.className = 'accent';

console.info('multi-file run');
document.getElementById('app')?.append(title, line);`,
  '/styles.css': `body {
  margin: 0;
  font-size: 1rem;
  font-family: Inter, system-ui, sans-serif;
  padding: 20px;
  background: Canvas;
  color: CanvasText;
}

.accent {
  color: LinkText;
  font-weight: 600;
}

@media (prefers-color-scheme: dark) {
  body {
          color-scheme: dark;
  }
}`
};

const PLAYGROUND_SKELETON_DELAY_MS = 2500;
type PlaygroundGateId = 'single-file' | 'multi-file' | 'component';

const playgroundReady = ref(false);
const measuredPlaygroundHeights = ref<Partial<Record<PlaygroundGateId, number>>>({});
const playgroundResizeObservers = new Map<PlaygroundGateId, ResizeObserver>();
let playgroundReadyTimer: ReturnType<typeof setTimeout> | null = null;
let ignoreReadyEventsUntil = 0;

function playgroundGateMinHeight(gateId: PlaygroundGateId): string {
  const measuredHeight = measuredPlaygroundHeights.value[gateId];

  return !playgroundReady.value && measuredHeight ? `${measuredHeight}px` : '260px';
}

function setPlaygroundContentRef(
  gateId: PlaygroundGateId,
  element: Element | ComponentPublicInstance | null,
): void {
  playgroundResizeObservers.get(gateId)?.disconnect();
  playgroundResizeObservers.delete(gateId);

  if (!(element instanceof HTMLElement)) {
    return;
  }

  const syncHeight = () => {
    if (element.offsetHeight > 0) {
      measuredPlaygroundHeights.value[gateId] = element.offsetHeight;
    }
  };

  syncHeight();

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(syncHeight);
    observer.observe(element);
    playgroundResizeObservers.set(gateId, observer);
  }
}

function schedulePlaygroundReady(): void {
  if (playgroundReadyTimer) {
    clearTimeout(playgroundReadyTimer);
  }

  playgroundReadyTimer = setTimeout(() => {
    playgroundReady.value = true;
    playgroundReadyTimer = null;
  }, PLAYGROUND_SKELETON_DELAY_MS);
}

onMounted(() => {
  ignoreReadyEventsUntil = Date.now() + PLAYGROUND_SKELETON_DELAY_MS;
  playgroundReady.value = false;
  schedulePlaygroundReady();
});

onBeforeUnmount(() => {
  for (const observer of playgroundResizeObservers.values()) {
    observer.disconnect();
  }
  playgroundResizeObservers.clear();

  if (playgroundReadyTimer) {
    clearTimeout(playgroundReadyTimer);
    playgroundReadyTimer = null;
  }
});

function onPlaygroundReady(): void {
  if (Date.now() < ignoreReadyEventsUntil) {
    return;
  }
  playgroundReady.value = true;
}

function replayPlaygroundSkeleton(): void {
  ignoreReadyEventsUntil = Date.now() + PLAYGROUND_SKELETON_DELAY_MS;
  playgroundReady.value = false;
  schedulePlaygroundReady();
}

function onRun(): void {
  console.log('playground run');
}

function onError(error: {
  message: string;
  source?: string;
  code?: string;
  details?: { specifier?: string; fromFile?: string; reason?: string };
}): void {
  console.error('playground error', {
    message: error.message,
    source: error.source,
    code: error.code,
    details: error.details
  });
}
</script>

<style scoped>
.demo-surface {
  min-width: 0;
}

.playground-loading-gate {
  position: relative;
  overflow: hidden;
}

.playground-loading-gate__content {
  opacity: 0;
  transition: opacity 220ms ease;
}

.playground-loading-gate__content--normalize-spacing > :first-child {
  margin-block-start: 0;
}

.playground-loading-gate__content--normalize-spacing > :last-child {
  margin-block-end: 0;
}

.playground-loading-gate__content--ready {
  opacity: 1;
}

.playground-loading-gate__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 220ms ease;
}

.demo-replay-button {
  place-self: center start;
  inline-size: auto;
  width: auto;
  min-width: max-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vf-color-border-default);
  border-radius: var(--vf-radius-control);
  background: var(--vf-color-background-surface);
  color: var(--vf-color-text-primary);
  padding: 0.35rem 0.65rem;
  font: inherit;
  cursor: pointer;
}
</style>
