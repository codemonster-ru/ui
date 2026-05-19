---
title: "Examples"
description: "Interactive examples for the playground-vite-plugin package"
slug: "/vueforge/playground-vite-plugin/examples"
order: 4
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <h4 :style="{ margin: 0 }">vite.config.ts snippet</h4>
    <pre :style="codeStyle"><code>{{ configSnippet }}</code></pre>
  </section>
</template>

<script setup>
const stageStyle = {
  height: '100%',
  minHeight: '220px',
  padding: '10px'
};
const codeStyle = {
  margin: '8px 0 0',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid var(--vf-color-border-default)',
  background: 'var(--vf-color-surface-muted)',
  overflow: 'auto'
};
const configSnippet = `import { defineConfig } from 'vite';
import { vueforgePlaygroundVirtualPlugin } from '@codemonster-ru/vueforge-playground-vite-plugin';

export default defineConfig({
  plugins: [
    vueforgePlaygroundVirtualPlugin({
      entries: {
        button: './src/demo/ButtonDemo.vue'
      }
    })
  ]
});`;
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <h4 :style="{ margin: 0 }">Multiple virtual entries</h4>
    <pre :style="codeStyle"><code>{{ configSnippet }}</code></pre>
  </section>
</template>

<script setup>
const configSnippet = `vueforgePlaygroundVirtualPlugin({
  virtualPrefix: 'virtual:docs/',
  exportMode: 'default',
  entries: {
    'demo/button': './src/demos/ButtonDemo.vue',
    'demo/tokens': {
      file: './src/demos/theme.ts',
      export: { named: 'themeTokens' }
    },
    'demo/utils': {
      file: './src/demos/utils.ts',
      export: 'namespace'
    }
  }
})`;

const stageStyle = { height: '100%', minHeight: '250px' };
const codeStyle = {
  margin: '8px 0 0',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid var(--vf-color-border-default)',
  background: 'var(--vf-color-surface-muted)',
  overflow: 'auto'
};
</script>
```
````

