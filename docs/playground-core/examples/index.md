---
title: "Examples"
description: "Interactive examples for the playground-core package"
slug: "/vueforge/playground-core/examples"
order: 4
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <button @click="runSession">
      Run Session
    </button>
    <iframe ref="frame" title="playground-core-demo" :style="frameStyle" />
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground-core';

const frame = ref(null);
let session = null;

const stageStyle = {
  height: '100%',
  minHeight: '260px',
  display: 'grid',
  gap: '10px',
  alignContent: 'start'
};
const frameStyle = {
  width: '100%',
  height: '220px',
  border: '1px solid var(--vf-color-border-default)',
  borderRadius: '10px'
};

const files = {
  '/main.js': `document.body.style.fontFamily = 'sans-serif';
document.body.innerHTML = '<h3>Hello from playground-core</h3>';`
};

const runSession = () => {
  session?.run();
};

onMounted(() => {
  if (!frame.value) {
    return;
  }
  session = createPlaygroundSession({
    framework: 'vanilla',
    runtime: 'browser',
    iframe: frame.value,
    files,
    entry: '/main.js'
  });
});

onBeforeUnmount(() => {
  session?.dispose();
});
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 430
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <div :style="actionsStyle">
      <button @click="runVue">Run Vue Entry</button>
      <button @click="runHtml">Run HTML Entry</button>
    </div>
    <iframe ref="frame" title="playground-core-advanced" :style="frameStyle" />
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground-core';

const frame = ref(null);
let session = null;

const files = {
  '/App.vue': `<template><h3 style="font-family:sans-serif">Vue file entry</h3></template>`,
  '/index.html': `<main style="font-family:sans-serif"><h3>HTML entry</h3></main>`
};

const runVue = () => {
  session?.updateFiles(files, '/App.vue');
  session?.run();
};
const runHtml = () => {
  session?.updateFiles(files, '/index.html');
  session?.run();
};

onMounted(() => {
  if (!frame.value) return;
  session = createPlaygroundSession({
    runtime: 'browser',
    framework: 'vue',
    iframe: frame.value,
    files,
    entry: '/App.vue'
  });
});
onBeforeUnmount(() => session?.dispose());

const stageStyle = { height: '100%', minHeight: '330px', display: 'grid', gap: '10px' };
const actionsStyle = { display: 'flex', gap: '8px' };
const frameStyle = { width: '100%', height: '270px', border: '1px solid #d1d5db', borderRadius: '8px' };
</script>
```
````

