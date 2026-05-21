---
title: "Examples"
description: "Interactive examples for the theme package"
order: 4
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 340
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <div :style="panelStyle">
      <strong>Resolved mode: {{ resolvedTheme }}</strong>
      <p :style="{ margin: '8px 0 0' }">
        Toggle your docs theme to see mode-aware behavior.
      </p>
    </div>
  </section>
</template>

<script setup>
import { resolveTheme } from '@codemonster-ru/vueforge-theme';

const stageStyle = {
  height: '100%',
  minHeight: '240px',
  display: 'grid',
  placeItems: 'center'
};
const panelStyle = {
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid var(--vf-color-border-default)',
  background: 'var(--vf-color-surface-default)',
  color: 'var(--vf-color-text-default)'
};

const resolvedTheme = resolveTheme('system', 'light');
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
    <h4 :style="{ margin: 0 }">Theme Runtime Snippet</h4>
    <pre :style="codeStyle"><code>{{ snippet }}</code></pre>
  </section>
</template>

<script setup>
const snippet = `import { applyThemeConfig } from '@codemonster-ru/vueforge-theme';

applyThemeConfig({
  light: { colorPrimary: '#2563eb' },
  dark: { colorPrimary: '#60a5fa' }
});`;

const stageStyle = {
  height: '100%',
  minHeight: '260px'
};
const codeStyle = {
  margin: '8px 0 0',
  padding: '10px',
  fontSize: '12px',
  lineHeight: 1.5,
  borderRadius: '10px',
  border: '1px solid var(--vf-color-border-default)',
  background: 'var(--vf-color-surface-muted)',
  overflow: 'auto',
  whiteSpace: 'pre-wrap'
};
</script>
```
````

