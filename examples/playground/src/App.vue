<template>
  <VfThemeProvider>
    <main class="showcase">
      <VfStack gap="16" align="stretch">
        <div class="showcase-topbar">
          <h1 class="showcase-title">@codemonster-ru/vueforge-playground</h1>
          <VfThemeSwitch variant="button" button-variant="secondary" />
        </div>

        <section class="showcase-block">
          <h2 class="showcase-subtitle">Single File Example</h2>
          <VuePlayground
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

        <section class="showcase-block">
          <h2 class="showcase-subtitle">Multi File Example</h2>
          <VuePlayground
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

        <section class="showcase-block">
          <h2 class="showcase-subtitle">Headless Layout (VueForge Core)</h2>
          <VuePlayground
            class="headless-instance"
            :files="multiFileExample"
            entry="/main.js"
            framework="vanilla"
            :autorun="true"
            :show-code="true"
            theme="inherit"
            @run="onRun"
            @error="onError"
          >
            <template #layout="pg">
              <div class="headless-playground">
                <div class="cm-tabs">
                  <div class="headless-playground__tabs-control">
                    <VfTabs
                      class="headless-tabs"
                      :items="buildHeadlessTabs(pg.showCode)"
                      :model-value="pg.activeTab"
                      @update:model-value="handleHeadlessTabChange(pg.setActiveTab, $event)"
                    />
                  </div>
                </div>

                <div v-if="pg.activeTab === 'code' && pg.showCode" class="cm-panel cm-panel-code">
                  <div v-if="pg.fileNames.length > 1" class="cm-files">
                    <VfTabs
                      class="headless-playground__tabs-control headless-tabs"
                      size="sm"
                      :items="buildHeadlessFileTabs(pg.fileNames)"
                      :model-value="pg.activeFile"
                      @update:model-value="handleHeadlessFileChange(pg.setActiveFile, $event)"
                    />
                  </div>
                  <div class="cm-codeblock-host">
                    <CodeBlock
                      :code="pg.activeFileContent"
                      :language="pg.codeLanguage"
                      :show-line-numbers="true"
                      :theme="pg.codeTheme"
                    />
                  </div>
                </div>

                <div v-if="pg.activeTab === 'preview'" class="cm-panel preview">
                  <iframe :ref="pg.bindPreviewIframe" class="cm-iframe" title="Headless Playground Preview" />
                  <p v-if="!pg.isClient" class="headless-playground__hint">Preview is available on client side only.</p>
                </div>

                <div v-if="pg.activeTab === 'console'" class="cm-panel">
                  <pre class="cm-console">{{ pg.consoleOutput || 'No logs yet.' }}</pre>
                </div>
              </div>
            </template>
          </VuePlayground>
        </section>
      </VfStack>
    </main>
  </VfThemeProvider>
</template>

<script setup lang="ts">
import { VfTabs, VfThemeProvider, VfThemeSwitch, type VfTabItem } from '@codemonster-ru/vueforge-core';
import { VfStack } from '@codemonster-ru/vueforge-layouts';
import { CodeBlock } from '@codemonster-ru/vueforge-codeblock';
import { VuePlayground } from '@codemonster-ru/vueforge-playground';

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
        background: #ffffff;
        color: #1f232b;
      }
      .badge { color: #0e639c; font-weight: bold; }
      @media (prefers-color-scheme: dark) {
        body {
          background: #252526;
          color: #f2f3f5;
        }
        .badge {
          color: #61afef;
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
  background: #ffffff;
  color: #1f232b;
}

.accent {
  color: #0e639c;
  font-weight: 600;
}

@media (prefers-color-scheme: dark) {
  body {
    background: #252526;
    color: #f2f3f5;
  }

  .accent {
    color: #61afef;
  }
}`
};

function onRun(): void {
  console.log('playground run');
}

function onError(error: { message: string }): void {
  console.error('playground error', error.message);
}

function buildHeadlessTabs(showCode: boolean): VfTabItem[] {
  const tabs: VfTabItem[] = [
    { value: 'preview', label: 'Preview' },
    { value: 'console', label: 'Console' }
  ];
  if (showCode) {
    return [{ value: 'code', label: 'Code' }, ...tabs];
  }
  return tabs;
}

function handleHeadlessTabChange(
  setActiveTab: (tab: 'code' | 'preview' | 'console') => void,
  value: string
): void {
  if (value === 'code' || value === 'preview' || value === 'console') {
    setActiveTab(value);
  }
}

function buildHeadlessFileTabs(fileNames: string[]): VfTabItem[] {
  return fileNames.map((file) => ({ value: file, label: file }));
}

function handleHeadlessFileChange(
  setActiveFile: (file: string) => void,
  value: string
): void {
  setActiveFile(value);
}
</script>

<style scoped>
.showcase {
  max-width: 1040px;
  margin: 24px auto;
  padding: 0 12px;
}

.showcase-title {
  margin: 0;
}

.showcase-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.showcase-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.showcase-subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vf-color-muted);
}

.headless-playground {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--vf-color-surface);
}

.headless-playground__tabs-control {
  width: 100%;
}

.headless-playground__tabs-control :deep(.vf-tabs) {
  width: 100%;
}

.headless-playground__tabs-control :deep(.vf-tabs__list) {
  width: 100%;
  z-index: 2;
}

.headless-playground .cm-tabs,
.headless-playground .cm-files {
  padding: 0;
  border-bottom: 0;
}

.headless-tabs :deep(.vf-tabs__indicator) {
  inset-block-end: 0;
  z-index: 3;
}

.headless-playground__hint {
  margin: 8px 12px 0;
  color: var(--vf-color-muted);
}

.headless-instance {
  --cm-pg-border: var(--vf-color-border);
}

@media (width <= 768px) {
  .showcase-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .headless-playground__tabs-with-action {
    width: 100%;
  }
}
</style>
