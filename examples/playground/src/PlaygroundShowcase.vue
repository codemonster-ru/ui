<template>
  <VfThemeProvider>
    <VfContainer as="main" class="demo-page" size="2xl">
      <VfStack>
        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Single File Example</h2>
          </div>
          <VfPlayground
            :files="singleFileExample"
            entry="/index.html"
            framework="html"
            :autorun="true"
            :show-code="true"
            theme="inherit"
            @run="onRun"
            @error="onError"
          />
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Multi File Example</h2>
          </div>
          <VfPlayground
            :files="multiFileExample"
            entry="/main.js"
            framework="vanilla"
            :autorun="true"
            :show-code="true"
            theme="inherit"
            @run="onRun"
            @error="onError"
          />
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Component Mode Example</h2>
          </div>
          <VfPlayground
            mode="component"
            :component="componentModeDemo"
            :component-files="componentModeFiles"
            component-entry="DemoCard.vue"
            theme="inherit"
            :component-padding="24"
            component-min-height="220px"
          />
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Vue Runtime Smoke Test (Vite-built)</h2>
          </div>
          <ViteLikeDemoPreview demo-id="vue-runtime-smoke" :source="vueRuntimeSmokeSource" />
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2>Custom Resolver Smoke Test (Vite-built)</h2>
          </div>
          <ViteLikeDemoPreview demo-id="custom-resolver-smoke" :source="customResolverSmokeSource" />
        </section>
      </VfStack>
    </VfContainer>
  </VfThemeProvider>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue';
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
import { VfContainer, VfStack } from '@codemonster-ru/vueforge-layouts';
import { VfPlayground } from '@codemonster-ru/vueforge-playground';
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
          { style: 'margin:0;color:var(--vf-color-muted);' },
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
