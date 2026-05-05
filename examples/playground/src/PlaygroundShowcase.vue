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
      </VfStack>
    </VfContainer>
  </VfThemeProvider>
</template>

<script setup lang="ts">
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
import { VfContainer, VfStack } from '@codemonster-ru/vueforge-layouts';
import { VfPlayground } from '@codemonster-ru/vueforge-playground';

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

function onError(error: { message: string }): void {
  console.error('playground error', error.message);
}
</script>
