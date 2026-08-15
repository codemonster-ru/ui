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
            <VfSkeletonGate
              :ready="playgroundReady"
              :min-height="260"
              :preserve-last-height="true"
              :normalize-content-spacing="true"
              radius="var(--vf-layout-section-radius)"
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
              <template #skeleton>
                <VfSkeleton :min-height="260" style="border-radius: var(--vf-layout-section-radius)" />
              </template>
            </VfSkeletonGate>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>VfPlayground · multi-file runtime</h2>
            <p class="demo-text">Use this mode when JavaScript imports related source and stylesheet files.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <VfSkeletonGate
              :ready="playgroundReady"
              :min-height="260"
              :preserve-last-height="true"
              :normalize-content-spacing="true"
              radius="var(--vf-layout-section-radius)"
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
              <template #skeleton>
                <VfSkeleton :min-height="260" style="border-radius: var(--vf-layout-section-radius)" />
              </template>
            </VfSkeletonGate>
          </VfSection>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>VfPlayground · Vue component mode</h2>
            <p class="demo-text">Render a trusted Vue component directly when iframe isolation is unnecessary.</p>
          </div>
          <VfSection class="demo-surface" surface>
            <VfSkeletonGate
              :ready="playgroundReady"
              :min-height="260"
              :preserve-last-height="true"
              :normalize-content-spacing="true"
              radius="var(--vf-layout-section-radius)"
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
              <template #skeleton>
                <VfSkeleton :min-height="260" style="border-radius: var(--vf-layout-section-radius)" />
              </template>
            </VfSkeletonGate>
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
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { CmSection as VfSection, CmSkeleton as VfSkeleton, CmStack as VfStack } from '@codemonster-ru/ui-vue';
import { VfSkeletonGate } from '@codemonster-ru/vueforge-core/skeleton-gate';
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
const playgroundReady = ref(false);
let playgroundReadyTimer: ReturnType<typeof setTimeout> | null = null;
let ignoreReadyEventsUntil = 0;

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
